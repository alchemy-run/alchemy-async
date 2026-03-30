import path from "pathe";
import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { Vite, type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";

export interface RedwoodProps<
  B extends Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> extends ViteProps<B, RPC> {}

// don't allow the ASSETS to be overridden
export type Redwood<
  B extends Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> = B extends { ASSETS: any } ? never : Worker<B & { ASSETS: Assets }, RPC>;

/**
 * Deploy a RedwoodJS application to Cloudflare Workers with automatically configured defaults.
 *
 * This resource handles the deployment of RedwoodJS applications with optimized settings for
 * Cloudflare Workers, including proper build commands and compatibility flags.
 *
 * @example
 * // Deploy a basic RedwoodJS application with default settings
 * const redwoodApp = await Redwood("my-redwood-app");
 *
 * @example
 * // Deploy with a database binding
 * import { D1Database } from alchemy/cloudflare";
 *
 * const database = await D1Database("redwood-db");
 *
 * const redwoodApp = await Redwood("redwood-with-db", {
 *   bindings: {
 *     DB: database
 *   }
 * });
 *
 * @param id - Unique identifier for the RedwoodJS application
 * @param props - Configuration properties for the RedwoodJS deployment
 * @returns A Cloudflare Worker resource representing the deployed RedwoodJS application
 */
export async function Redwood<
  B extends Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
>(id: string, props?: Partial<RedwoodProps<B, RPC>>): Promise<Redwood<B, RPC>> {
  return await Vite(id, {
    ...props,
    build: props?.build ?? {
      command: "rm -rf ./node_modules/.vite && vite build",
      env: {
        RWSDK_DEPLOY: "1",
      },
    },
    noBundle: props?.noBundle ?? true,
    entrypoint: props?.entrypoint ?? path.join("dist", "worker", "index.js"),
    compatibilityFlags: ["nodejs_compat", ...(props?.compatibilityFlags ?? [])],
    compatibilityDate: props?.compatibilityDate ?? "2025-08-21",
    wrangler: {
      main: props?.wrangler?.main ?? "src/worker.tsx",
      transform: props?.wrangler?.transform,
    },
  });
}
