import type { worker } from "../alchemy.run.ts";

declare global {
  export type CloudflareEnv = typeof worker.Env;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
