import { describe, expect, vi } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { RailwayApi, RailwayError } from "../../src/railway/api.ts";
import { Domain } from "../../src/railway/domain.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

function mockRailwayApi(
  overrides?: Partial<Record<string, (query: string) => any>>,
) {
  process.env.RAILWAY_API_TOKEN = "test-token";
  return vi
    .spyOn(RailwayApi.prototype, "query")
    .mockImplementation(async (query: string) => {
      if (query.includes("serviceDomainCreate")) {
        return {
          serviceDomainCreate: {
            id: "svc-domain-old",
            domain: "api-production-1234.up.railway.app",
          },
        } as never;
      }

      if (query.includes("customDomainCreate")) {
        return {
          customDomainCreate: {
            id: "custom-domain-new",
            domain: "api.example.com",
          },
        } as never;
      }

      for (const [key, handler] of Object.entries(overrides ?? {})) {
        if (query.includes(key)) {
          return handler(query) as never;
        }
      }

      if (
        query.includes("serviceDomainDelete") ||
        query.includes("customDomainDelete")
      ) {
        return {} as never;
      }

      if (query.includes("serviceInstanceUpdate")) {
        return { serviceInstanceUpdate: true } as never;
      }

      throw new Error(`Unexpected Railway API query in test: ${query}`);
    });
}

// Must be sequential — tests share process.env and RailwayApi.prototype mock
describe.sequential("Railway Domain Replace", () => {
  test("replacing a generated domain with a custom domain creates the custom domain", async (scope) => {
    const querySpy = mockRailwayApi();

    try {
      const domainResourceId = `${BRANCH_PREFIX}-domain-replace-${Date.now()}`;

      const generated = await Domain(domainResourceId, {
        service: "service-id",
        environment: "environment-id",
      });

      expect(generated.domain).toBe("api-production-1234.up.railway.app");

      const custom = await Domain(domainResourceId, {
        service: "service-id",
        environment: "environment-id",
        projectId: "project-id",
        domain: "api.example.com",
      });

      expect(custom.domain).toBe("api.example.com");
      expect(
        querySpy.mock.calls.some(([query]) =>
          query.includes("customDomainCreate"),
        ),
      ).toBe(true);
    } finally {
      // Finalize while mock is active so pending deletions and orphan cleanup use the mock
      await scope.finalize();
      vi.restoreAllMocks();
      delete process.env.RAILWAY_API_TOKEN;
    }
  });

  test("retries transient domain delete lock errors during replacement cleanup", async (scope) => {
    let deleteAttempts = 0;

    mockRailwayApi({
      serviceDomainDelete: () => {
        deleteAttempts += 1;
        if (deleteAttempts === 1) {
          throw new RailwayError(
            "Railway API error: Cannot delete service domain: an operation is already in progress",
            [
              {
                message:
                  "Cannot delete service domain: an operation is already in progress",
              },
            ],
          );
        }
        return {};
      },
    });

    try {
      const domainResourceId = `${BRANCH_PREFIX}-domain-retry-${Date.now()}`;

      await Domain(domainResourceId, {
        service: "service-id",
        environment: "environment-id",
      });

      const custom = await Domain(domainResourceId, {
        service: "service-id",
        environment: "environment-id",
        projectId: "project-id",
        domain: "api.example.com",
      });

      expect(custom.domain).toBe("api.example.com");

      // Finalize triggers pending deletions (the old domain cleanup with retries)
      await scope.finalize();
      expect(deleteAttempts).toBe(2);
    } finally {
      vi.restoreAllMocks();
      delete process.env.RAILWAY_API_TOKEN;
    }
  });
});
