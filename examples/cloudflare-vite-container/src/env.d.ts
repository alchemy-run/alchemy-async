/// <reference types="./env.d.ts" />

import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
