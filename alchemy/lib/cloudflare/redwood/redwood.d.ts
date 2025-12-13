import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";
export interface RedwoodProps<B extends Bindings> extends ViteProps<B> {
}
export type Redwood<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
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
export declare function Redwood<B extends Bindings>(id: string, props?: Partial<RedwoodProps<B>>): Promise<Redwood<B>>;
//# sourceMappingURL=redwood.d.ts.map