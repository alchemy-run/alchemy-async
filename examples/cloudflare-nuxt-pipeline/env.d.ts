/// <reference types="@cloudflare/workers-types" />

import type * as h3 from "h3";
import type { website } from "./alchemy.run.ts";

// these are provided by generated types, but since typegen doesn't run in CI, we need to declare them here
declare global {
  const defineEventHandler: typeof h3.defineEventHandler;
  const readBody: typeof h3.readBody;
  const createError: typeof h3.createError;
  const send: typeof h3.send;
}

declare module "h3" {
  interface H3EventContext {
    cf: CfProperties;
    cloudflare: {
      request: Request;
      env: typeof website.Env;
      context: ExecutionContext;
    };
  }
}
