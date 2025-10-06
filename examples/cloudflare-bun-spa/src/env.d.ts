/// <reference types="./env.d.ts" />

import type { website } from "../alchemy.run.ts";

export type CloudflareEnv = typeof website.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    export interface Env extends CloudflareEnv {}
  }
}
