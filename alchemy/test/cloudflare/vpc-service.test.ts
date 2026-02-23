import "../../src/test/vitest.ts";

import assert from "node:assert";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { isCloudflareApiError } from "../../src/cloudflare/api-error.ts";
import {
  type CloudflareApi,
  createCloudflareApi,
} from "../../src/cloudflare/api.ts";
import { Tunnel } from "../../src/cloudflare/tunnel.ts";
import { VpcServiceRef } from "../../src/cloudflare/vpc-service-ref.ts";
import { VpcService, getService } from "../../src/cloudflare/vpc-service.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("VpcService Resource", () => {
  const testId = `${BRANCH_PREFIX}-vpc-svc`;

  test("create, update, and delete vpc service", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: Tunnel | undefined;
    let vpcService: VpcService | undefined;

    try {
      // Create a minimal tunnel for the VPC service
      tunnel = await Tunnel(`${testId}-tunnel`, {
        name: `${testId}-tunnel`,
        ingress: [{ service: "http://localhost:8080" }],
        adopt: true,
      });

      // Create VPC service with hostname host
      vpcService = await VpcService(testId, {
        name: `${testId}-initial`,
        httpPort: 8080,
        host: {
          hostname: "localhost",
          resolverNetwork: {
            tunnel,
          },
        },
        adopt: true,
      });

      // Verify VPC service was created
      expect(vpcService).toMatchObject({
        name: `${testId}-initial`,
        serviceId: expect.any(String),
        serviceType: "http",
        httpPort: 8080,
        host: {
          hostname: "localhost",
          resolverNetwork: {
            tunnelId: tunnel.tunnelId,
          },
        },
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
        type: "vpc_service",
      });

      // Verify service exists via API
      const fetchedService = await getService(api, vpcService.serviceId);
      expect(fetchedService).toMatchObject({
        name: `${testId}-initial`,
        serviceId: vpcService.serviceId,
        serviceType: "http",
        httpPort: 8080,
      });

      // Update the VPC service with new port
      vpcService = await VpcService(testId, {
        name: `${testId}-updated`,
        httpPort: 3000,
        httpsPort: 3001,
        host: {
          hostname: "localhost",
          resolverNetwork: {
            tunnel,
          },
        },
      });

      // Verify VPC service was updated
      expect(vpcService).toMatchObject({
        name: `${testId}-updated`,
        serviceId: expect.any(String),
        httpPort: 3000,
        httpsPort: 3001,
      });

      // Verify update via API
      const updatedService = await getService(api, vpcService.serviceId);
      expect(updatedService).toMatchObject({
        name: `${testId}-updated`,
        httpPort: 3000,
        httpsPort: 3001,
      });
    } catch (err) {
      console.error("Test error:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertVpcServiceDeleted(api, vpcService?.serviceId);
    }
  });
});

describe("VpcServiceRef", async () => {
  const testId = `${BRANCH_PREFIX}-vpc-ref`;

  test("reference vpc service by name and id", async (scope) => {
    const api = await createCloudflareApi();
    let tunnel: Tunnel | undefined;
    let vpcService: VpcService | undefined;

    try {
      // Create a minimal tunnel for the VPC service
      tunnel = await Tunnel(`${testId}-tunnel`, {
        name: `${testId}-tunnel`,
        ingress: [{ service: "http://localhost:8080" }],
        adopt: true,
      });

      // Create VPC service with hostname host
      vpcService = await VpcService(testId, {
        name: testId,
        httpPort: 8080,
        host: {
          hostname: "localhost",
          resolverNetwork: {
            tunnel,
          },
        },
        adopt: true,
      });

      const refByName = await VpcServiceRef({
        name: testId,
      });
      expect(refByName).toMatchObject(vpcService);

      const refById = await VpcServiceRef({
        serviceId: vpcService.serviceId,
      });
      expect(refById).toMatchObject(vpcService);
    } finally {
      await destroy(scope);
      await assertVpcServiceDeleted(api, vpcService?.serviceId);
    }
  });
});

async function assertVpcServiceDeleted(api: CloudflareApi, serviceId?: string) {
  assert(serviceId, "Service ID is required");
  try {
    await getService(api, serviceId);
    throw new Error(`VPC service "${serviceId}" was not deleted`);
  } catch (err) {
    if (isCloudflareApiError(err, { status: 404 })) {
      return;
    }
    throw err;
  }
}
