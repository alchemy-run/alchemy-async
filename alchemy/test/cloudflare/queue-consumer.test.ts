import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { CloudflareApiError } from "../../src/cloudflare/api-error.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { KVNamespace } from "../../src/cloudflare/kv-namespace.ts";
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
              // Acknowledge all messages successfully
              for (const message of batch.messages) {
                message.ack();
              }
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
      await destroy(scope);

      try {
        if (queue?.id) {
          await listQueueConsumers(api, queue.id);
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // This is expected when queue is deleted
        } else {
          console.error(
            "Unexpected error checking queue consumer deletion:",
            err,
          );
        }
      }
    }
  });

  test("adopt existing queue consumer", async (scope) => {
    let queue: Queue | undefined;
    let worker: Worker | undefined;

    try {
      queue = await Queue(`${testId}-adopt-queue`, {
        name: `${testId}-adopt-queue`,
        adopt: true,
      });

      expect(queue.id).toBeTruthy();

      worker = await Worker(`${testId}-adopt-worker`, {
        name: `${testId}-adopt-worker`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("Hello Adopt");
            },
            async queue(batch, env, ctx) {
              console.log("Processing", batch.messages.length, "messages");
              // Acknowledge all messages successfully
              for (const message of batch.messages) {
                message.ack();
              }
            }
          }
        `,
        eventSources: [queue],
        adopt: true,
      });

      const consumer = await QueueConsumer(`${testId}-adopted`, {
        queue: queue.id,
        scriptName: worker.name,
        adopt: true,
        settings: {
          batchSize: 20,
          maxRetries: 5,
          maxWaitTimeMs: 1000,
        },
      });

      expect(consumer.id).toBeTruthy();
    } catch (err) {
      console.error("Adopt test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      try {
        if (queue?.id) {
          await listQueueConsumers(api, queue.id);
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // This is expected when queue is deleted
        } else {
          console.error(
            "Unexpected error checking queue consumer deletion:",
            err,
          );
        }
      }
    }
  });

  test("create queue consumer with dead letter queue (string)", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: QueueConsumer | undefined;

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
              // Simulate failures to test DLQ - retry all messages
              for (const message of batch.messages) {
                message.retry();
              }
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

      const consumers = await listQueueConsumers(api, queue.id);
      const foundConsumer = consumers.find(
        (c) => c.scriptName === worker!.name,
      );
      expect(foundConsumer).toBeTruthy();

      const consumerResponse = await api.get(
        `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
      );
      expect(consumerResponse.ok).toBe(true);
      const consumerData: any = await consumerResponse.json();

      expect(consumerData.result.dead_letter_queue).toEqual(dlq.name);
      expect(consumerData.result.script).toEqual(worker.name);
      expect(foundConsumer?.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(foundConsumer?.settings?.batchSize).toEqual(10);
      expect(foundConsumer?.settings?.maxRetries).toEqual(3);

      const queueResponse = await api.get(
        `/accounts/${api.accountId}/queues/${queue.id}`,
      );
      expect(queueResponse.ok).toBe(true);
      const queueData: any = await queueResponse.json();
      expect(queueData.result.consumers).toBeDefined();
      const queueConsumer = queueData.result.consumers?.find(
        (c: any) => c.script === worker!.name,
      );
      expect(queueConsumer).toBeDefined();
      expect(queueConsumer?.dead_letter_queue).toEqual(dlq.name);
    } catch (err) {
      console.error("DLQ test error:", err);
    } finally {
      await destroy(scope);

      try {
        if (queue?.id && consumer?.id) {
          const response = await api.get(
            `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
          );
          if (response.status !== 404) {
            throw new Error(
              `Queue consumer ${consumer.id} was not deleted as expected`,
            );
          }
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // This is expected for this test case but dont need to log or throw
        } else {
          console.error(
            "Unexpected error checking queue consumer deletion:",
            err,
          );
        }
      }
    }
  });

  test("create queue consumer with dead letter queue (Queue object)", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: QueueConsumer | undefined;

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
              // Simulate failures to test DLQ - retry all messages
              for (const message of batch.messages) {
                message.retry();
              }
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

      const consumers = await listQueueConsumers(api, queue.id);
      const foundConsumer = consumers.find(
        (c) => c.scriptName === worker!.name,
      );
      expect(foundConsumer).toBeTruthy();
      expect(foundConsumer?.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(foundConsumer?.settings?.batchSize).toEqual(10);
      expect(foundConsumer?.settings?.maxRetries).toEqual(3);

      const consumerResponse = await api.get(
        `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
      );
      expect(consumerResponse.ok).toBe(true);
      const consumerData: any = await consumerResponse.json();

      expect(consumerData.result.dead_letter_queue).toEqual(dlq.name);

      const dlqResponse = await api.get(
        `/accounts/${api.accountId}/queues/${dlq.id}`,
      );
      expect(dlqResponse.ok).toBe(true);
      const dlqData: any = await dlqResponse.json();
      expect(dlqData.result.queue_name).toEqual(dlq.name);
    } catch (err) {
      console.error("DLQ Queue object test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      try {
        if (queue?.id && consumer?.id) {
          const response = await api.get(
            `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
          );
          if (response.status !== 404) {
            throw new Error(
              `Queue consumer ${consumer.id} was not deleted as expected`,
            );
          }
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // expected for this test case but dont need to log or throw
        } else {
          throw err;
        }
      }
    }
  });

  test("update queue consumer to add dead letter queue", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let worker: Worker | undefined;
    let consumer: QueueConsumer | undefined;

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
              // Acknowledge all messages successfully
              for (const message of batch.messages) {
                message.ack();
              }
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

      let consumerResponse = await api.get(
        `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
      );
      expect(consumerResponse.ok).toBe(true);

      let consumerData: any = await consumerResponse.json();
      expect(consumerData.result.dead_letter_queue).toBeUndefined();

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

      consumerResponse = await api.get(
        `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
      );
      expect(consumerResponse.ok).toBe(true);
      consumerData = await consumerResponse.json();
      expect(consumerData.result.dead_letter_queue).toEqual(dlq.name);
      expect(consumerData.result.settings?.max_retries).toEqual(3);

      const consumers = await listQueueConsumers(api, queue.id);
      const foundConsumer = consumers.find(
        (c) => c.scriptName === worker!.name,
      );
      expect(foundConsumer).toBeTruthy();
      expect(foundConsumer?.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(foundConsumer?.settings?.maxRetries).toEqual(3);
    } catch (err) {
      console.error("DLQ update test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      try {
        if (queue?.id && consumer?.id) {
          const response = await api.get(
            `/accounts/${api.accountId}/queues/${queue.id}/consumers/${consumer.id}`,
          );
          if (response.status !== 404) {
            throw new Error(
              `Queue consumer ${consumer.id} was not deleted as expected`,
            );
          }
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
              // Simulate failures to test DLQ - retry all messages
              for (const message of batch.messages) {
                message.retry();
              }
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

      const consumers = await listQueueConsumers(api, queue.id);
      const foundConsumer = consumers.find(
        (c) => c.scriptName === worker!.name,
      );
      expect(foundConsumer).toBeTruthy();
      expect(foundConsumer?.settings?.maxRetries).toEqual(5);
      expect(foundConsumer?.settings?.batchSize).toEqual(25);
      expect(foundConsumer?.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(foundConsumer?.settings?.retryDelay).toEqual(30);
      expect(foundConsumer?.settings?.maxWaitTimeMs).toEqual(1000);

      if (foundConsumer) {
        const consumerResponse = await api.get(
          `/accounts/${api.accountId}/queues/${queue.id}/consumers/${foundConsumer.id}`,
        );
        expect(consumerResponse.ok).toBe(true);
        const consumerData: any = await consumerResponse.json();

        expect(consumerData.result.dead_letter_queue).toEqual(dlq.name);
        expect(consumerData.result.settings?.max_retries).toEqual(5);
        expect(consumerData.result.settings?.batch_size).toEqual(25);

        const queueResponse = await api.get(
          `/accounts/${api.accountId}/queues/${queue.id}`,
        );
        expect(queueResponse.ok).toBe(true);
        const queueData: any = await queueResponse.json();
        const queueConsumer = queueData.result.consumers?.find(
          (c: any) => c.script === worker!.name,
        );

        expect(queueConsumer?.dead_letter_queue).toEqual(dlq.name);
      }
    } catch (err) {
      console.error("Worker DLQ test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      try {
        if (queue?.id) {
          await listQueueConsumers(api, queue.id);
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // This is expected when queue is deleted
        } else {
          console.error(
            "Unexpected error checking queue consumer deletion:",
            err,
          );
        }
      }
    }
  });

  test("end-to-end DLQ message flow - verify messages reach DLQ after max retries", async (scope) => {
    let queue: Queue | undefined;
    let dlq: Queue | undefined;
    let producerWorker: Worker | undefined;
    let consumerWorker: Worker | undefined;
    let dlqConsumer: Worker | undefined;

    try {
      queue = await Queue(`${testId}-e2e-main`, {
        name: `${testId}-e2e-main`,
        adopt: true,
      });

      dlq = await Queue(`${testId}-e2e-dlq`, {
        name: `${testId}-e2e-dlq`,
        adopt: true,
      });

      consumerWorker = await Worker(`${testId}-e2e-consumer`, {
        name: `${testId}-e2e-consumer`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response("OK");
            },
            async queue(batch, env, ctx) {
              // Always retry to simulate persistent failures
              for (const message of batch.messages) {
                console.log("Main consumer retrying message:", message.id);
                message.retry();
              }
            }
          }
        `,
        eventSources: [
          {
            queue,
            settings: {
              batchSize: 1,
              maxRetries: 2,
              retryDelay: 1,
              maxWaitTimeMs: 100,
              deadLetterQueue: dlq,
            },
          },
        ],
        adopt: true,
      });

      dlqConsumer = await Worker(`${testId}-e2e-dlq-consumer`, {
        name: `${testId}-e2e-dlq-consumer`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const url = new URL(request.url);
              if (url.pathname === "/dlq-count") {
                const count = await env.DLQ_TRACKING.get("count") || "0";
                return new Response(count);
              }
              return new Response("DLQ Consumer OK");
            },
            async queue(batch, env, ctx) {
              // Track messages that reached the DLQ
              for (const message of batch.messages) {
                console.log("DLQ received message:", message.id, "attempts:", message.attempts);
                const currentCount = parseInt(await env.DLQ_TRACKING.get("count") || "0");
                await env.DLQ_TRACKING.put("count", String(currentCount + 1));
                await env.DLQ_TRACKING.put(\`msg-\${message.id}\`, JSON.stringify({
                  body: message.body,
                  attempts: message.attempts,
                  timestamp: message.timestamp
                }));
                message.ack();
              }
            }
          }
        `,
        eventSources: [dlq],
        bindings: {
          DLQ_TRACKING: await KVNamespace(`${testId}-e2e-dlq-kv`, {
            title: `${testId}-e2e-dlq-tracking`,
            adopt: true,
          }),
        },
        adopt: true,
        url: true,
      });

      producerWorker = await Worker(`${testId}-e2e-producer`, {
        name: `${testId}-e2e-producer`,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const messageId = crypto.randomUUID();
              await env.MAIN_QUEUE.send({
                test: "dlq-e2e-flow",
                timestamp: Date.now(),
                id: messageId
              });
              return new Response(JSON.stringify({ sent: messageId }), {
                headers: { "Content-Type": "application/json" }
              });
            }
          }
        `,
        bindings: {
          MAIN_QUEUE: queue,
        },
        adopt: true,
        url: true,
      });

      expect(consumerWorker.id).toBeTruthy();
      expect(dlqConsumer.id).toBeTruthy();
      expect(producerWorker.url).toBeTruthy();
      expect(dlqConsumer.url).toBeTruthy();

      const mainConsumers = await listQueueConsumers(api, queue.id);
      const mainConsumer = mainConsumers.find(
        (c) => c.scriptName === consumerWorker!.name,
      );
      expect(mainConsumer).toBeTruthy();
      expect(mainConsumer?.settings?.deadLetterQueue).toEqual(dlq.name);
      expect(mainConsumer?.settings?.maxRetries).toEqual(2);

      const dlqConsumers = await listQueueConsumers(api, dlq.id);
      expect(dlqConsumers.length).toBeGreaterThan(0);
      const dlqConsumerFound = dlqConsumers.find(
        (c) => c.scriptName === dlqConsumer!.name,
      );
      expect(dlqConsumerFound).toBeDefined();

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const sendResponse = await fetch(producerWorker.url!);
      if (!sendResponse.ok) {
        const errorText = await sendResponse.text();
        console.error("Send failed:", sendResponse.status, errorText);
      }
      expect(sendResponse.ok).toBe(true);
      const sendData = await sendResponse.json();
      console.log("Sent message:", sendData);

      console.log("Waiting 25 seconds for retries and DLQ delivery...");
      await new Promise((resolve) => setTimeout(resolve, 25000));

      const dlqCountResponse = await fetch(`${dlqConsumer.url}/dlq-count`);
      const dlqCount = await dlqCountResponse.text();
      console.log("DLQ message count:", dlqCount);
      expect(Number.parseInt(dlqCount, 10)).toBeGreaterThan(0);
    } catch (err) {
      console.error("End-to-end DLQ flow test error:", err);
      throw err;
    } finally {
      await destroy(scope);

      try {
        if (queue?.id) {
          await listQueueConsumers(api, queue.id);
        }
        if (dlq?.id) {
          await listQueueConsumers(api, dlq.id);
        }
      } catch (err) {
        if (err instanceof CloudflareApiError && err.status === 404) {
          // This is expected when queue is deleted
        } else {
          console.error(
            "Unexpected error checking queue consumer deletion:",
            err,
          );
        }
      }
    }
  }, 60000);
});
