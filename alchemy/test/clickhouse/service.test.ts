import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createClickhouseApi } from "../../src/clickhouse/api.ts";
import { OrganizationRef, Service } from "../../src/clickhouse/index.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe
  .skipIf(!process.env.ALL_TESTS)
  .sequential("Clickhouse Service", async () => {
    const testId = "test-service";

    const api = await createClickhouseApi();
    const organization = await OrganizationRef(alchemy.env.CLICKHOUSE_ORG);

    test("create and delete service", async (scope) => {
      let service: Service | undefined;

      try {
        service = await Service(testId, {
          organization,
          provider: "aws",
          region: "us-east-1",
        });
      } finally {
        await alchemy.destroy(scope);

        if (service != null) {
          const status = await api
            .getServiceDetails({
              path: {
                organizationId: organization.id!,
                serviceId: service.clickhouseId!,
              },
            })
            .then((service) => service.response.status)
            .catch((error) => {
              return (error.status as number) ?? 500;
            });
          expect(status).toBe(404);
        }
      }
    }, 0);

    test("create and query service", async (scope) => {
      try {
        const service = await Service(`${testId}-query`, {
          organization,
          provider: "aws",
          region: "us-east-1",
        });

        const httpCheckResult = await fetch(
          `https://${service.httpsEndpoint?.host}:${service.httpsEndpoint?.port}/?query=SELECT%20count%28%29%20FROM%20system.databases%20WHERE%20name%20%3D%20%27default%27`,
          {
            headers: {
              Authorization: `Basic ${btoa(`default:${service.password.unencrypted}`)}`,
            },
          },
        );

        expect(httpCheckResult.status).toBe(200);
        expect((await httpCheckResult.text()).trim()).toBe("1");
      } finally {
        await alchemy.destroy(scope);
      }
    }, 0);
  });
