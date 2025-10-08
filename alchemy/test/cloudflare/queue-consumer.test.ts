import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { CloudflareApiError } from "../../src/cloudflare/api-error.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import {
  listQueueConsumers,
  QueueConsumer,
} from "../../src/cloudflare/queue-consumer.ts";
import { Queue } from "../../src/cloudflare/queue.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi({});

describe("QueueConsumer Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-queue-consumer`;
  const queueName = `${testId}-queue`;
  const workerName = `${testId}-worker`;

  test("create, update, and delete queue consumer", async (scope) => {
    let queue: Queue | undefined;
    let worker: Worker | undefined;

    try {
      queue = await Queue(`${testId}-queue`, {
        name: queueName,
        adopt: true,
      });

      expect(queue.id).toBeTruthy();
      expect(queue.name).toEqual(queueName);

      worker = await Worker(`${testId}-worker`, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello World");
            },
            async queue(batch, env, ctx) {
              return batch.messages.map(() => ({ status: "ack" }));
            }
          }
        `,
        eventSources: [queue],
        adopt: true, // make test idempotent
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);

      let thisConsumer;
      for (let i = 0; i < 10; i++) {
        const consumers = await listQueueConsumers(api, queue.id);

        thisConsumer = consumers.find((c) => c.scriptName === workerName);
        if (thisConsumer) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      expect(thisConsumer).toBeTruthy();
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify consumers were deleted
      try {
        if (queue?.id) {
          await listQueueConsumers(api, queue.id);
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // expected
        } else {
          throw err;
        }
      }
    }
  });

  test("adopt existing queue consumer", async (scope) => {
    let queue: Queue | undefined;
    let worker: Worker | undefined;

    try {
      // Create a queue
      queue = await Queue(`${testId}-adopt-queue`, {
        name: `${testId}-adopt-queue`,
        adopt: true,
      });

      expect(queue.id).toBeTruthy();

      // Create a worker that consumes the queue (this creates a consumer)
      worker = await Worker(`${testId}-adopt-worker`, {
        name: `${testId}-adopt-worker`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello Adopt");
            },
            async queue(batch, env, ctx) {
              console.log("Processing", batch.messages.length, "messages");
              return batch.messages.map(() => ({ status: "ack" }));
            }
          }
        `,
        eventSources: [queue],
        adopt: true,
      });

      // Now try to adopt the existing consumer using QueueConsumer resource
      await QueueConsumer(`${testId}-adopted`, {
        queue: queue.id,
        scriptName: worker.name,
        adopt: true,
        settings: {
          batchSize: 20,
          maxRetries: 5,
          maxWaitTimeMs: 1000,
        },
      });
    } finally {
      // Clean up
      await destroy(scope);
    }
  });

  test("create queue consumer with dead letter queue (string)", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: any;

    try {
      queue = await Queue(`${testId}-dlq-main`, {
        name: `${testId}-dlq-main`,
        adopt: true,
      });

      dlq = await Queue(`${testId}-dlq-dead`, {
        name: `${testId}-dlq-dead`,
        adopt: true,
      });

      expect(queue.id).toBeTruthy();
      expect(dlq.id).toBeTruthy();

      worker = await Worker(`${testId}-dlq-worker`, {
        name: `${testId}-dlq-worker`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello DLQ");
            },
            async queue(batch, env, ctx) {
              // Simulate failures to test DLQ
              return batch.messages.map(() => ({ status: "retry" }));
            }
          }
        `,
        adopt: true,
      });

      consumer = await QueueConsumer(`${testId}-dlq-consumer`, {
        queue: queue.id,
        scriptName: worker.name,
        settings: {
          batchSize: 10,
          maxRetries: 3,
          maxWaitTimeMs: 500,
          retryDelay: 10,
          deadLetterQueue: dlq.name,
        },
        adopt: true,
      });

      expect(consumer.id).toBeTruthy();
      expect(consumer.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(worker).toBeTruthy();

      let foundConsumer;
      for (let i = 0; i < 10; i++) {
        const consumers = await listQueueConsumers(api, queue.id);
        foundConsumer = consumers.find((c) => c.scriptName === worker!.name);
        if (foundConsumer) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(foundConsumer).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("create queue consumer with dead letter queue (Queue object)", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: any;

    try {
      queue = await Queue(`${testId}-dlq-obj-main`, {
        name: `${testId}-dlq-obj-main`,
        adopt: true,
      });

      dlq = await Queue(`${testId}-dlq-obj-dead`, {
        name: `${testId}-dlq-obj-dead`,
        adopt: true,
      });

      expect(queue.id).toBeTruthy();
      expect(dlq.id).toBeTruthy();

      worker = await Worker(`${testId}-dlq-obj-worker`, {
        name: `${testId}-dlq-obj-worker`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello DLQ Object");
            },
            async queue(batch, env, ctx) {
              return batch.messages.map(() => ({ status: "retry" }));
            }
          }
        `,
        adopt: true,
      });

      consumer = await QueueConsumer(`${testId}-dlq-obj-consumer`, {
        queue: queue.id,
        scriptName: worker.name,
        settings: {
          batchSize: 10,
          maxRetries: 3,
          maxWaitTimeMs: 500,
          retryDelay: 10,
          deadLetterQueue: dlq,
        },
        adopt: true,
      });

      expect(consumer.id).toBeTruthy();
      expect(consumer.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(worker).toBeTruthy();

      let foundConsumer;
      for (let i = 0; i < 10; i++) {
        const consumers = await listQueueConsumers(api, queue.id);
        foundConsumer = consumers.find((c) => c.scriptName === worker!.name);
        if (foundConsumer) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(foundConsumer).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("update queue consumer to add dead letter queue", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: any;

    try {
      queue = await Queue(`${testId}-dlq-update-main`, {
        name: `${testId}-dlq-update-main`,
        adopt: true,
      });

      dlq = await Queue(`${testId}-dlq-update-dead`, {
        name: `${testId}-dlq-update-dead`,
        adopt: true,
      });

      worker = await Worker(`${testId}-dlq-update-worker`, {
        name: `${testId}-dlq-update-worker`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello DLQ Update");
            },
            async queue(batch, env, ctx) {
              return batch.messages.map(() => ({ status: "ack" }));
            }
          }
        `,
        adopt: true,
      });

      consumer = await QueueConsumer(`${testId}-dlq-update-consumer`, {
        queue: queue.id,
        scriptName: worker.name,
        settings: {
          batchSize: 10,
          maxRetries: 2,
        },
        adopt: true,
      });

      expect(consumer.id).toBeTruthy();
      expect(consumer.settings?.deadLetterQueue).toBeUndefined();

      consumer = await QueueConsumer(`${testId}-dlq-update-consumer`, {
        queue: queue.id,
        scriptName: worker.name,
        settings: {
          batchSize: 10,
          maxRetries: 3,
          deadLetterQueue: dlq.name,
        },
        adopt: true,
      });

      expect(consumer.settings?.deadLetterQueue).toEqual(dlq.name);

      expect(worker).toBeTruthy();
      let foundConsumer;
      for (let i = 0; i < 10; i++) {
        const consumers = await listQueueConsumers(api, queue.id);
        foundConsumer = consumers.find((c) => c.scriptName === worker!.name);
        if (foundConsumer) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(foundConsumer).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  });

  test("worker with queue event source including dead letter queue", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;

    try {
      queue = await Queue(`${testId}-worker-dlq-main`, {
        name: `${testId}-worker-dlq-main`,
        adopt: true,
      });

      dlq = await Queue(`${testId}-worker-dlq-dead`, {
        name: `${testId}-worker-dlq-dead`,
        adopt: true,
      });

      worker = await Worker(`${testId}-worker-dlq`, {
        name: `${testId}-worker-dlq`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello Worker DLQ");
            },
            async queue(batch, env, ctx) {
              return batch.messages.map(() => ({ status: "retry" }));
            }
          }
        `,
        eventSources: [
          {
            queue,
            settings: {
              batchSize: 25,
              maxRetries: 5,
              maxWaitTimeMs: 1000,
              retryDelay: 30,
              deadLetterQueue: dlq,
            },
          },
        ],
        adopt: true,
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toBeTruthy();

      let foundConsumer;
      for (let i = 0; i < 10; i++) {
        const consumers = await listQueueConsumers(api, queue.id);
        foundConsumer = consumers.find((c) => c.scriptName === worker!.name);
        if (foundConsumer) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      expect(foundConsumer).toBeTruthy();
      expect(foundConsumer?.settings?.maxRetries).toEqual(5);
      expect(foundConsumer?.settings?.batchSize).toEqual(25);
    } finally {
      await destroy(scope);
    }
  });
});
