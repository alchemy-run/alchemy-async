import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { extractCloudflareResult } from "../../src/cloudflare/api-response.ts";
import { createCloudflareApi, Worker } from "../../src/cloudflare/index.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { withExponentialBackoff } from "../../src/util/retry.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const apiPromise = createCloudflareApi();

describe("Worker tail consumers", () => {
  const testId = `${BRANCH_PREFIX}-tail-consumer`;

  test("worker with tail consumers configuration", async (scope) => {
    try {
      // Create a consumer worker first
      const consumerWorker = await Worker(`${testId}-named-consumer`, {
        name: `${testId}-named-consumer`,
        entrypoint: `${__dirname}/test-handlers/tail-handler.ts`,
        adopt: true,
      });

      // Create a producer worker and implement tail consumers
      const producerWorker = await Worker(`${testId}-named-producer`, {
        name: `${testId}-named-producer`,
        entrypoint: `${__dirname}/test-handlers/basic-fetch.ts`,
        tailConsumers: [{ service: consumerWorker.name }],
        adopt: true,
      });

      expect(producerWorker.tailConsumers).toEqual([
        { service: consumerWorker.name },
      ]);
      expect(producerWorker.name).toBeTruthy();

      const producerWorkerSettings = await getWorker(producerWorker.name);
      expect(producerWorkerSettings).toMatchObject({
        tail_consumers: [{ name: consumerWorker.name }],
      });
    } finally {
      await destroy(scope);
    }
  });

  test("worker directly referenced by tail consumers", async (scope) => {
    try {
      // Create a consumer worker first
      const consumerWorker = await Worker(`${testId}-workerref-consumer`, {
        name: `${testId}-workerref-consumer`,
        entrypoint: `${__dirname}/test-handlers/tail-handler.ts`,
        adopt: true,
      });

      // Create a producer worker and directly reference the consumer worker
      const producerWorker = await Worker(`${testId}-workerref-producer`, {
        name: `${testId}-workerref-producer`,
        entrypoint: `${__dirname}/test-handlers/basic-fetch.ts`,
        tailConsumers: [consumerWorker],
        adopt: true,
      });

      expect(producerWorker.tailConsumers).toMatchObject([consumerWorker]);
      expect(producerWorker.name).toBeTruthy();

      const producerWorkerSettings = await getWorker(producerWorker.name);
      expect(producerWorkerSettings).toMatchObject({
        tail_consumers: [{ name: consumerWorker.name }],
      });
    } finally {
      await destroy(scope);
    }
  });
});

async function getWorker(name: string) {
  const api = await apiPromise;
  return withExponentialBackoff(
    async () => {
      return await extractCloudflareResult<{
        id: string;
        created_on: string;
        logpush: boolean;
        name: string;
        observability: {
          enabled?: boolean;
          head_sampling_rate?: number;
          logs: {
            enabled?: boolean;
            head_sampling_rate?: number;
            invocation_logs?: boolean;
          };
        };
        subdomain: { enabled?: boolean; previews_enabled?: boolean };
        tags: string[];
        tail_consumers: {
          name: string;
        }[];
        updated_on: string;
      }>(
        `get worker "${name}"`,
        api.get(`/accounts/${api.accountId}/workers/workers/${name}`),
      );
    },
    () => true,
  );
}
