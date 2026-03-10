import { env } from "cloudflare:workers";
import type { bucketEventsQueue, queue, worker } from "../alchemy.run.ts";
export * from "./do.js";
export * from "./workflow.js";

export default {
  async fetch(_request: Request) {
    await env.QUEUE.send({
      name: "John Doe",
      email: "john.doe@example.com",
    });

    const obj = env.DO.get(env.DO.idFromName("foo"));
    await obj.increment();
    async function _foo() {
      // @ts-expect-error - foo doesn't exist on the HelloWorldDO class
      await obj.foo();
    }
    await obj.fetch("https://example.com");

    await env.RPC.hello("John Doe");

    return new Response("Ok");
  },
  async queue(
    batch: typeof queue.Batch | typeof bucketEventsQueue.Batch,
    _env: typeof worker.Env,
  ) {
    for (const message of batch.messages) {
      if ("action" in message.body) {
        const event = message.body;
        console.log(`Bucket event: ${event.action} on ${event.object.key}`);
      } else {
        console.log(`Queue message: ${message.body.name}`);
      }
      message.ack();
    }
  },
};
