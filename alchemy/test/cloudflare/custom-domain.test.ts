import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
} from "../../src/cloudflare/api.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  quiet: false,
});

const testDomain = process.env.ALCHEMY_TEST_DOMAIN!;

const api = await createCloudflareApi();

describe("Custom Domain", () => {
  test("should create a custom domain", async (scope) => {
    try {
      const domain = `${BRANCH_PREFIX}.${testDomain}`;
      const worker = await Worker(`${BRANCH_PREFIX}-worker-1`, {
        name: `${BRANCH_PREFIX}-worker-1`,
        domains: [domain],
        script: `
          export default {
            fetch(request, env) {
              return new Response('Hello from ${BRANCH_PREFIX}-worker-1!');
            }
          }
        `,
        adopt: true,
      });

      expect(worker.domains?.[0]).toMatchObject({
        name: `${BRANCH_PREFIX}.${testDomain}`,
      });
      await assertCustomDomain(api, worker, domain);
    } finally {
      await destroy(scope);
    }
  });
});

export async function assertCustomDomain(
  api: CloudflareApi,
  worker: Worker,
  domain: string,
) {
  const domains = (await (
    await api.get(`/accounts/${api.accountId}/workers/domains`)
  ).json()) as {
    result: {
      hostname: string;
      zone_id: string;
      service: string;
      environment: string;
    }[];
  };
  expect(domains.result).toContainEqual(
    expect.objectContaining({
      hostname: domain,
      // zone_id: zone.id,
      service: worker.name,
      environment: "production",
    }),
  );
}
