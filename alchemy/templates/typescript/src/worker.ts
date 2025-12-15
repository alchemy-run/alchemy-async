import type { worker } from "../alchemy.run.ts";

export default {
  async fetch(
    request: Request,
    env: typeof worker.Env,
    ctx: ExecutionContext,
  ): Promise<Response> {
    return new Response("Hello World from my-alchemy-app!");
  },
};
