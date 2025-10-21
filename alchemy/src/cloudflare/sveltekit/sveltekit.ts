import { join } from "pathe";
import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { Vite, type ViteProps } from "../vite/vite.ts";
import type { Worker } from "../worker.ts";

export interface SvelteKitProps<B extends Bindings> extends ViteProps<B> {}

// don't allow the ASSETS to be overriden
export type SvelteKit<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

/**
 * Deploy a SvelteKit application to Cloudflare Workers with automatically configured defaults.
 *
 * This resource handles the deployment of SvelteKit applications with optimized settings for
 * Cloudflare Workers, including proper build commands and compatibility flags. It expects
 * the SvelteKit app to be configured with the @sveltejs/adapter-cloudflare adapter.
 *
 * For local development, SvelteKit provides excellent built-in dev server support with
 * emulated platform.env bindings for Cloudflare-specific APIs.
 *
 * @see https://svelte.dev/docs/kit/adapter-cloudflare - Official SvelteKit Cloudflare adapter docs
 *
 * @example
 * // Deploy a basic SvelteKit application
 * const svelteApp = await SvelteKit("my-svelte-app");
 *
 * @example
 * // Deploy with Cloudflare bindings
 * import { D1Database, KVNamespace, R2Bucket } from "alchemy/cloudflare";
 *
 * const database = await D1Database("svelte-db");
 * const sessions = await KVNamespace("sessions");
 * const storage = await R2Bucket("app-storage");
 *
 * const svelteApp = await SvelteKit("svelte-with-bindings", {
 *   bindings: {
 *     DB: database,
 *     AUTH_STORE: sessions,
 *     STORAGE: storage
 *   }
 * });
 *
 * @param id - Unique identifier for the SvelteKit application
 * @param props - Configuration properties for the SvelteKit deployment
 * @returns A Cloudflare Worker resource representing the deployed SvelteKit application
 */
export async function SvelteKit<B extends Bindings>(
  id: string,
  props?: Partial<SvelteKitProps<B>>,
): Promise<SvelteKit<B>> {
  if (props?.compatibilityDate) {
    const providedDate = new Date(props.compatibilityDate);
    const minDate = new Date("2024-09-23");
    if (providedDate < minDate) {
      throw new Error(
        `SvelteKit compatibility date must be >= 2024-09-23 for nodejs_compat support, got ${props.compatibilityDate}`,
      );
    }
  }

  return await Vite(id, {
    ...props,
    entrypoint:
      props?.entrypoint ?? join(".svelte-kit", "cloudflare", "_worker.js"),
    assets: props?.assets ?? join(".svelte-kit", "cloudflare"),
    compatibilityFlags: ["nodejs_compat", ...(props?.compatibilityFlags ?? [])],
    compatibilityDate: props?.compatibilityDate,
    wrangler: { secrets: true },
  });
}
