import type { website } from "./alchemy.run.ts";

declare global {
  type CloudflareEnv = typeof website.Env;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
}
