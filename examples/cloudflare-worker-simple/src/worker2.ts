import { WorkerEntrypoint } from "cloudflare:workers";
import type { worker2 } from "../alchemy.run.ts";

export default class Worker2 extends WorkerEntrypoint {
  declare env: typeof worker2.Env;

  async fetch(request: Request): Promise<Response> {
    const stub = this.env.DO.getByName("DO");
    return await stub.fetch(request);
  }
  rpcMethod() {
    return "hello world";
  }
}
