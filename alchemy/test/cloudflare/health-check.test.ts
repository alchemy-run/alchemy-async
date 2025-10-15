import { beforeEach, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { CloudflareApiError } from "../../src/cloudflare/api-error.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import {
  HealthCheck,
  type HealthCheckProps,
} from "../../src/cloudflare/health-check.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { findZoneForHostname } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const ZONE_NAME = process.env.ALCHEMY_TEST_DOMAIN!;

const api = await createCloudflareApi();
const zoneId = (await findZoneForHostname(api, ZONE_NAME)).zoneId;

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

async function createHealthCheckTarget(workerName: string) {
  return await Worker(workerName, {
    name: workerName,
    adopt: true,
    script: `
      export default {
        async fetch(request) {
          const url = new URL(request.url);
          
          // Health check endpoint
          if (url.pathname === '/health') {
            return new Response('OK', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
          
          // Default response
          return new Response('Health Check Test Worker', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `,
    format: "esm",
    url: true,
  });
}

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

const createHealthCheckId = (suffix: string) =>
  `${BRANCH_PREFIX}-healthcheck-${suffix}`;

const createBasicHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: overrides.address || ZONE_NAME,
  name: `test-check-${BRANCH_PREFIX}-${suffix}`,
  description: "Test health check",
  interval: 60,
  timeout: 5,
  retries: 2,
  zone: zoneId,
  ...overrides,
});

const createHttpHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: overrides.address || ZONE_NAME,
  name: `test-http-check-${BRANCH_PREFIX}-${suffix}`,
  type: "HTTPS" as const,
  httpConfig: {
    path: "/health",
    expectedCodes: ["200"],
    expectedBody: "OK",
    method: "GET" as const,
    port: 443,
    header: {
      Host: [ZONE_NAME],
    },
    followRedirects: true,
    allowInsecure: false,
  },
  zone: zoneId,
  ...overrides,
});

const createTcpHealthCheckProps = (suffix: string, overrides: any = {}) => ({
  address: overrides.address || ZONE_NAME,
  name: `test-tcp-check-${BRANCH_PREFIX}-${suffix}`,
  type: "TCP" as const,
  tcpConfig: {
    port: 5432,
    method: "connection_established" as const,
  },
  zone: zoneId,
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
  props: HealthCheckProps,
): Promise<HealthCheck | undefined> => {
  try {
    return await HealthCheck(id, props);
  } catch (error) {
    if (skipIfUnavailable(error, `health check ${id}`)) {
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

describe.sequential("HealthCheck Resource", () => {
  let testHealthCheck: HealthCheck | undefined;

  beforeEach(async () => {
    testHealthCheck = undefined;
    await new Promise((resolve) => setTimeout(resolve, 100));
  });

  test("create, update, and delete health check", async (scope) => {
    const worker = await createHealthCheckTarget(
      `healthcheck-target-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    try {
      const healthCheckId = createHealthCheckId("basic");
      const basicProps = createBasicHealthCheckProps("basic", {
        zone: zoneId,
        address: workerHostname,
      });
      testHealthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        basicProps,
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
        zoneId,
        testHealthCheck.healthCheckId,
      );
      expectApiResponseToMatch(responseData, {
        name: basicProps.name,
        address: basicProps.address,
      });

      const updatedProps = createBasicHealthCheckProps("basic", {
        zone: zoneId,
        address: workerHostname,
        description: "Updated test health check",
        interval: 60,
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
        zoneId,
        testHealthCheck.healthCheckId,
      );
      expectApiResponseToMatch(updatedResponseData, {
        address: updatedProps.address,
        description: updatedProps.description,
        interval: updatedProps.interval,
      });
    } finally {
      await destroy(scope);
      if (testHealthCheck) {
        await verifyHealthCheckDeleted(zoneId, testHealthCheck.healthCheckId);
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
        expect(healthCheck.httpConfig?.expectedCodes).toEqual(["200"]);
        expect(healthCheck.httpConfig?.expectedBody).toEqual("OK");
        expect(healthCheck.httpConfig?.method).toEqual("GET");
        expect(healthCheck.httpConfig?.port).toEqual(443);
        expect(healthCheck.httpConfig?.followRedirects).toEqual(true);
        expect(healthCheck.httpConfig?.allowInsecure).toEqual(false);
      },
      apiAssertions: (responseData: any) => {
        expect(responseData.result.type).toEqual("HTTPS");
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
    const worker = await createHealthCheckTarget(
      `healthcheck-http-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    try {
      const config = healthCheckConfigs[0];

      const healthCheckId = createHealthCheckId(config.suffix);
      const props = config.propsFactory(config.suffix, {
        zone: zoneId,
        address: workerHostname,
      });
      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
      );

      if (!healthCheck) {
        return;
      }

      config.assertions(healthCheck);

      const responseData = await verifyHealthCheckExists(
        zoneId,
        healthCheck.healthCheckId,
      );
      config.apiAssertions(responseData);
    } finally {
      await destroy(scope);
    }
  });

  test("create health check with TCP configuration", async (scope) => {
    const worker = await createHealthCheckTarget(
      `healthcheck-tcp-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    const config = healthCheckConfigs[1];
    try {
      const healthCheckId = createHealthCheckId(config.suffix);
      const props = config.propsFactory(config.suffix, {
        zone: zoneId,
        address: workerHostname,
      });
      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
      );

      if (!healthCheck) {
        return;
      }

      config.assertions(healthCheck);

      const responseData = await verifyHealthCheckExists(
        zoneId,
        healthCheck.healthCheckId,
      );
      config.apiAssertions(responseData);
    } finally {
      await destroy(scope);
    }
  });

  test("create health check with specific regions", async (scope) => {
    const worker = await createHealthCheckTarget(
      `healthcheck-regions-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    try {
      const healthCheckId = createHealthCheckId("regions");
      const props = createBasicHealthCheckProps("regions", {
        zone: zoneId,
        address: workerHostname,
        checkRegions: ["WNAM", "ENAM", "WEU"],
        consecutiveFails: 2,
        consecutiveSuccesses: 2,
      });

      const healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        props,
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
        zoneId,
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
    const worker = await createHealthCheckTarget(
      `healthcheck-suspended-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    try {
      const healthCheckId = createHealthCheckId("suspended");
      const suspendedProps = createBasicHealthCheckProps("suspended", {
        zone: zoneId,
        address: workerHostname,
        suspended: true,
      });

      let healthCheck = await createHealthCheckWithErrorHandling(
        healthCheckId,
        suspendedProps,
      );

      if (!healthCheck) {
        return;
      }

      expect(healthCheck.suspended).toEqual(true);

      let responseData: any = await verifyHealthCheckExists(
        zoneId,
        healthCheck.healthCheckId,
      );
      expect(responseData.result.suspended).toEqual(true);

      const activeProps = createBasicHealthCheckProps("suspended", {
        zone: zoneId,
        address: workerHostname,
        suspended: false,
      });

      healthCheck = await HealthCheck(healthCheckId, activeProps);
      expect(healthCheck.suspended).toEqual(false);
    } finally {
      await destroy(scope);
    }
  });

  test("adopt existing health check by name when adopt is true", async (scope) => {
    const worker = await createHealthCheckTarget(
      `healthcheck-adopt-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;

    let created: Awaited<ReturnType<typeof HealthCheck>> | undefined;
    let adopted: Awaited<ReturnType<typeof HealthCheck>> | undefined;
    const sharedName = `adopt-check-${BRANCH_PREFIX}`;

    try {
      const firstId = `${BRANCH_PREFIX}-healthcheck-adopt-first`;
      created = await HealthCheck(firstId, {
        zone: zoneId,
        address: workerHostname,
        name: sharedName,
        interval: 60,
        timeout: 5,
        retries: 2,
      });

      expect(created).toBeDefined();

      const secondId = `${BRANCH_PREFIX}-healthcheck-adopt-second`;
      adopted = await HealthCheck(secondId, {
        zone: zoneId,
        address: workerHostname,
        name: sharedName,
        interval: 60,
        timeout: 5,
        retries: 2,
        adopt: true,
      });

      expect(adopted.id).toEqual(secondId);
      expect(adopted.healthCheckId).toEqual(created!.healthCheckId);

      const data: any = await verifyHealthCheckExists(
        zoneId,
        adopted.healthCheckId,
      );
      expect(data.result.name).toEqual(sharedName);
    } finally {
      await destroy(scope);
      if (created) {
        await verifyHealthCheckDeleted(zoneId, created.healthCheckId);
      }
    }
  });

  test("fail to create when name exists and adopt is false", async (scope) => {
    let created: Awaited<ReturnType<typeof HealthCheck>> | undefined;
    const worker = await createHealthCheckTarget(
      `healthcheck-conflict-${BRANCH_PREFIX}`,
    );
    const workerHostname = new URL(worker.url!).hostname;
    const sharedName = `conflict-check-${BRANCH_PREFIX}`;
    const firstId = `${BRANCH_PREFIX}-healthcheck-adopt-conflict-first`;
    const secondId = `${BRANCH_PREFIX}-healthcheck-adopt-conflict-second`;

    try {
      created = await HealthCheck(firstId, {
        zone: zoneId,
        address: workerHostname,
        name: sharedName,
        interval: 60,
        timeout: 5,
        retries: 2,
      });

      await expect(
        HealthCheck(secondId, {
          zone: zoneId,
          address: workerHostname,
          name: sharedName,
          interval: 60,
          timeout: 5,
          retries: 2,
          adopt: false,
        }),
      ).rejects.toThrow(
        `Health check "${sharedName}" already exists. Use adopt: true to adopt it.`,
      );
    } finally {
      await destroy(scope);
      if (created) {
        await verifyHealthCheckDeleted(zoneId, created.healthCheckId);
      }
    }
  });
});
