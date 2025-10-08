import { beforeEach, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { CloudflareApiError } from "../../src/cloudflare/api-error.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { HealthCheck } from "../../src/cloudflare/health-check.ts";
import { Zone } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const api = await createCloudflareApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const isHealthCheckUnavailableError = (error: unknown): boolean =>
  error instanceof CloudflareApiError &&
  error.errorData?.some(
    (e: any) =>
      e.code === 1002 && e.message?.includes("health checks disabled for zone"),
  );

const skipIfUnavailable = (error: unknown, testName: string): boolean => {
  if (isHealthCheckUnavailableError(error)) {
    console.log(`Health checks are not available. Skipping ${testName}.`);
    return true;
  }
  return false;
};

const createTestZone = async (suffix: string) => {
  const id = `${BRANCH_PREFIX}-zone-${suffix}`;
  const name = `${BRANCH_PREFIX.replace(/_/g, "-")}-healthcheck-${suffix}.com`;
  return await Zone(id, { name });
};

const createHealthCheckId = (suffix: string) =>
  `${BRANCH_PREFIX}-healthcheck-${suffix}`;

const createBasicHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: "www.example.com",
  name: `test-check-${BRANCH_PREFIX}-${suffix}`,
  description: "Test health check",
  interval: 60,
  timeout: 5,
  retries: 2,
  ...overrides,
});

const createHttpHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: "api.example.com",
  name: `test-http-check-${BRANCH_PREFIX}-${suffix}`,
  type: "HTTPS" as const,
  httpConfig: {
    path: "/health",
    expectedCodes: ["200", "201"],
    expectedBody: "OK",
    method: "GET" as const,
    port: 443,
    header: {
      Host: ["api.example.com"],
      "X-Health-Check": ["true"],
    },
    followRedirects: true,
    allowInsecure: false,
  },
  ...overrides,
});

const createTcpHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: "database.example.com",
  name: `test-tcp-check-${BRANCH_PREFIX}-${suffix}`,
  type: "TCP" as const,
  tcpConfig: {
    port: 5432,
    method: "connection_established" as const,
  },
  ...overrides,
});

const expectHealthCheckToMatch = (
  healthCheck: HealthCheck,
  expected: Partial<HealthCheck>,
) => {
  Object.entries(expected).forEach(([key, value]) => {
    expect(healthCheck[key as keyof HealthCheck]).toEqual(value);
  });
};

const expectApiResponseToMatch = (
  responseData: any,
  expected: Record<string, any>,
) => {
  Object.entries(expected).forEach(([key, value]) => {
    expect(responseData.result[key]).toEqual(value);
  });
};

const createHealthCheckWithErrorHandling = async (
  id: string,
  props: any,
  testName: string,
): Promise<HealthCheck | undefined> => {
  try {
    return await HealthCheck(id, props);
  } catch (error) {
    if (skipIfUnavailable(error, testName)) {
      return undefined;
    }
    throw error;
  }
};

const verifyHealthCheckExists = async (
  zoneId: string,
  healthCheckId: string,
) => {
  const response = await api.get(
    `/zones/${zoneId}/healthchecks/${healthCheckId}`,
  );
  expect(response.status).toBe(200);
  return response.json();
};

const verifyHealthCheckDeleted = async (
  zoneId: string,
  healthCheckId: string,
) => {
  const response = await api.get(
    `/zones/${zoneId}/healthchecks/${healthCheckId}`,
  );
  expect(response.status).toBe(404);
};

describe("HealthCheck Resource", () => {
  let testZone: Zone | undefined;
  let testHealthCheck: HealthCheck | undefined;

  beforeEach(async () => {
    testZone = undefined;
    testHealthCheck = undefined;
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test("create, update, and delete health check", async (scope) => {
    try {
      testZone = await createTestZone("basic");

      expect(testZone.id).toBeTruthy();
      expect(testZone.name).toContain("healthcheck-basic.com");

      const healthCheckId = createHealthCheckId("basic");
      const basicProps = createBasicHealthCheckProps("basic", {
        zone: testZone.id,
      });
      testHealthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        basicProps,
        "basic health check",
      );

      if (!testHealthCheck) {
        return;
      }

      expectHealthCheckToMatch(testHealthCheck, {
        id: healthCheckId,
        name: basicProps.name,
        address: basicProps.address,
        description: basicProps.description,
        interval: basicProps.interval,
        timeout: basicProps.timeout,
        retries: basicProps.retries,
      });

      const responseData = await verifyHealthCheckExists(
        testZone.id,
        testHealthCheck.healthCheckId,
      );
      expectApiResponseToMatch(responseData, {
        name: basicProps.name,
        address: basicProps.address,
      });
      const updatedProps = createBasicHealthCheckProps("basic", {
        zone: testZone.id,
        address: "api.example.com",
        description: "Updated test health check",
        interval: 30,
        timeout: 10,
        retries: 3,
      });

      testHealthCheck = await HealthCheck(healthCheckId, updatedProps);
      expectHealthCheckToMatch(testHealthCheck, {
        id: healthCheckId,
        address: updatedProps.address,
        description: updatedProps.description,
        interval: updatedProps.interval,
        timeout: updatedProps.timeout,
        retries: updatedProps.retries,
      });

      const updatedResponseData = await verifyHealthCheckExists(
        testZone.id,
        testHealthCheck.healthCheckId,
      );
      expectApiResponseToMatch(updatedResponseData, {
        address: updatedProps.address,
        description: updatedProps.description,
        interval: updatedProps.interval,
      });
    } finally {
      await destroy(scope);
      if (testZone && testHealthCheck) {
        await verifyHealthCheckDeleted(
          testZone?.id,
          testHealthCheck?.healthCheckId,
        );
      }
    }
  });

  const healthCheckConfigs = [
    {
      name: "HTTP configuration",
      suffix: "http",
      zoneSuffix: "http",
      propsFactory: createHttpHealthCheckProps,
      assertions: (healthCheck: HealthCheck) => {
        expect(healthCheck.httpConfig).toBeDefined();
        expect(healthCheck.httpConfig?.path).toEqual("/health");
        expect(healthCheck.httpConfig?.expectedCodes).toEqual(["200", "201"]);
        expect(healthCheck.httpConfig?.expectedBody).toEqual("OK");
        expect(healthCheck.httpConfig?.method).toEqual("GET");
        expect(healthCheck.httpConfig?.port).toEqual(443);
        expect(healthCheck.httpConfig?.followRedirects).toEqual(true);
        expect(healthCheck.httpConfig?.allowInsecure).toEqual(false);
      },
      apiAssertions: (responseData: any) => {
        expect(responseData.result.http_config.path).toEqual("/health");
        expect(responseData.result.http_config.expected_codes).toContain("200");
      },
    },
    {
      name: "TCP configuration",
      suffix: "tcp",
      zoneSuffix: "tcp",
      propsFactory: createTcpHealthCheckProps,
      assertions: (healthCheck: HealthCheck) => {
        expect(healthCheck.tcpConfig).toBeDefined();
        expect(healthCheck.tcpConfig?.port).toEqual(5432);
        expect(healthCheck.tcpConfig?.method).toEqual("connection_established");
      },
      apiAssertions: (responseData: any) => {
        expect(responseData.result.tcp_config.port).toEqual(5432);
      },
    },
  ];

  test("create health check with HTTP configuration", async (scope) => {
    try {
      const config = healthCheckConfigs[0];
      const zone = await createTestZone(config.zoneSuffix);

      const healthCheckId = createHealthCheckId(config.suffix);
      const props = config.propsFactory(config.suffix, { zone: zone.id });
      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
        `${config.name} test`,
      );

      if (!healthCheck) {
        return;
      }

      config.assertions(healthCheck);

      const responseData = await verifyHealthCheckExists(
        zone.id,
        healthCheck.healthCheckId,
      );
      config.apiAssertions(responseData);
    } finally {
      await destroy(scope);
    }
  });

  test("create health check with TCP configuration", async (scope) => {
    const config = healthCheckConfigs[1];
    try {
      const zone = await createTestZone(config.zoneSuffix);

      const healthCheckId = createHealthCheckId(config.suffix);
      const props = config.propsFactory(config.suffix, { zone: zone.id });
      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
        `${config.name} test`,
      );

      if (!healthCheck) {
        return;
      }

      config.assertions(healthCheck);

      const responseData = await verifyHealthCheckExists(
        zone.id,
        healthCheck.healthCheckId,
      );
      config.apiAssertions(responseData);
    } finally {
      await destroy(scope);
    }
  });

  test("create health check with specific regions", async (scope) => {
    try {
      const zone = await createTestZone("regions");

      const healthCheckId = createHealthCheckId("regions");
      const props = createBasicHealthCheckProps("regions", {
        zone: zone.id,
        address: "api.example.com",
        checkRegions: ["WNAM", "ENAM", "WEU"],
        consecutiveFails: 2,
        consecutiveSuccesses: 2,
      });

      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
        "regional test",
      );

      if (!healthCheck) {
        return;
      }

      expect(healthCheck.checkRegions).toContain("WNAM");
      expect(healthCheck.checkRegions).toContain("ENAM");
      expect(healthCheck.checkRegions).toContain("WEU");
      expect(healthCheck.consecutiveFails).toEqual(2);
      expect(healthCheck.consecutiveSuccesses).toEqual(2);

      const responseData: any = await verifyHealthCheckExists(
        zone.id,
        healthCheck.healthCheckId,
      );
      expect(responseData.result.check_regions).toContain("WNAM");
      expect(responseData.result.consecutive_fails).toEqual(2);
      expect(responseData.result.consecutive_successes).toEqual(2);
    } finally {
      await destroy(scope);
    }
  });

  test("create and update suspended health check", async (scope) => {
    try {
      const zone = await createTestZone("suspended");

      const healthCheckId = createHealthCheckId("suspended");
      const suspendedProps = createBasicHealthCheckProps("suspended", {
        zone: zone.id,
        address: "suspended.example.com",
        suspended: true,
      });

      let healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        suspendedProps,
        "suspended test",
      );

      if (!healthCheck) {
        return;
      }

      expect(healthCheck.suspended).toEqual(true);

      let responseData: any = await verifyHealthCheckExists(
        zone.id,
        healthCheck.healthCheckId,
      );
      expect(responseData.result.suspended).toEqual(true);

      const activeProps = createBasicHealthCheckProps("suspended", {
        zone: zone.id,
        address: "suspended.example.com",
        suspended: false,
      });

      healthCheck = await HealthCheck(healthCheckId, activeProps);
      expect(healthCheck.suspended).toEqual(false);
    } finally {
      await destroy(scope);
    }
  });
});
