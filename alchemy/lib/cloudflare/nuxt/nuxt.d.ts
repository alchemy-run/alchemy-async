import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { type WebsiteProps } from "../website.ts";
import type { Worker } from "../worker.ts";
/**
 * Properties for creating a Nuxt resource.
 * Extends WebsiteProps, allowing customization of the underlying Website.
 */
export interface NuxtProps<B extends Bindings> extends WebsiteProps<B> {
}
/**
 * Represents the output of a Nuxt resource deployment.
 * It resolves to the underlying Cloudflare Worker type, ensuring type safety.
 * Prevents overriding the internal ASSETS binding.
 */
export type Nuxt<B extends Bindings> = B extends {
    ASSETS: any;
} ? never : Worker<B & {
    ASSETS: Assets;
}>;
/**
 * Creates and deploys a Nuxt application using the Cloudflare Workers preset.
 *
 * This resource simplifies deploying Nuxt applications by providing sensible
 * defaults for the build command, main entrypoint, and assets directory
 * based on the `cloudflare-module` preset output.
 *
 * It wraps the underlying `Website` resource.
 *
 * @param id A unique identifier for the resource.
 * @param props Configuration options for the Nuxt deployment, overriding defaults.
 * @returns A promise that resolves to the deployed Cloudflare Worker details.
 *
 * @example
 * // Deploy a basic Nuxt site with default settings
 * const nuxtSite = await Nuxt("my-nuxt-app");
 *
 * @example
 * // Deploy with custom bindings and build command
 * const db = await D1Database("my-db");
 * const nuxtSiteWithDb = await Nuxt("my-nuxt-app-with-db", {
 *   command: "npm run build:cloudflare", // Specify a custom build command
 *   bindings: {
 *     DB: db, // Add custom bindings
 *   },
 * });
 */
export declare function Nuxt<B extends Bindings>(id: string, props?: Partial<NuxtProps<B>>): Promise<Nuxt<B>>;
//# sourceMappingURL=nuxt.d.ts.map