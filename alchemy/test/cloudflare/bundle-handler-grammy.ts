import { initLogger } from "braintrust";
import crypto from "crypto";
import * as grammy from "grammy";
import crypto2 from "node:crypto";

export default {
  async fetch(_request: Request, env: any): Promise<Response> {
    const logger = initLogger({
      projectName: "My Project",
      apiKey: env.BRAINTRUST_API_KEY,
      asyncFlush: false,
    });
    console.log(crypto.randomBytes(10));
    console.log(crypto2.randomBytes(10));
    console.log(logger);
    console.log(typeof grammy);
    require("ws");
    return new Response("Hello World!");
  },
};
