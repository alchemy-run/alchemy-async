import { join, resolve } from "pathe";
import { getPackageManagerRunner } from "../../util/detect-package-manager.ts";
import type { Assets } from "../assets.ts";
import type { Bindings } from "../bindings.ts";
import { withSkipPathValidation } from "../miniflare/paths.ts";
import {
  spreadBuildProps,
  spreadDevProps,
  Website,
  type WebsiteProps,
} from "../website.ts";
import type { Worker } from "../worker.ts";

/**
 * Properties for creating an Astro resource.
 * Extends WebsiteProps, allowing customization of the underlying Website.
 */
export interface AstroProps<B extends Bindings>
  extends Omit<WebsiteProps<B>, "spa"> {
  output?: "server" | "static";
}

/**
 * Represents the output of an Astro resource deployment.
 * It resolves to the underlying Cloudflare Worker type, ensuring type safety.
 * Prevents overriding the internal ASSETS binding.
 */
export type Astro<B extends Bindings> = B extends { ASSETS: any }
  ? never
  : Worker<B & { ASSETS: Assets }>;

/**
 * Creates and deploys an Astro application using the Cloudflare adapter.
 *
 * This resource simplifies deploying Astro applications by providing sensible
 * defaults for the build command, main entrypoint, and assets directory
 * based on the `@astrojs/cloudflare` adapter output.
 *
 * It wraps the underlying `Website` resource.
 *
 * @param id A unique identifier for the resource.
 * @param props Configuration options for the Astro deployment, overriding defaults.
 * @returns A promise that resolves to the deployed Cloudflare Worker details.
 *
 * @example
 * ## Deploy a basic Astro site with default settings
 *
 * Deploy an Astro application with minimal configuration using default build settings.
 *
 * ```ts
 * import { Astro } from "alchemy/cloudflare";
 *
 * const astroSite = await Astro("my-astro-app");
 * ```
 *
 * @example
 * ## Deploy with custom bindings and build command
 *
 * Deploy an Astro application with custom Cloudflare bindings and build configuration.
 *
 * ```ts
 * import { Astro, D1Database } from "alchemy/cloudflare";
 *
 * const db = await D1Database("my-db");
 * const astroSiteWithDb = await Astro("my-astro-app-with-db", {
 *   command: "npm run build", // Specify a custom build command
 *   bindings: {
 *     DB: db, // Add custom bindings
 *   },
 * });
 * ```
 */
export async function Astro<B extends Bindings>(
  id: string,
  props: AstroProps<B> = {},
): Promise<Astro<B>> {
  const cwd = resolve(props.cwd ?? process.cwd());
  const output = props.output ?? (await resolveOutputType(cwd));
  const runner = await getPackageManagerRunner();
  return await Website(id, {
    ...props,
    noBundle: props.noBundle ?? true,
    build: spreadBuildProps(props, `${runner} astro build`),
    dev: spreadDevProps(props, `${runner} astro dev`),
    entrypoint:
      props.entrypoint ??
      (output === "server" ? "dist/_worker.js/index.js" : undefined),
    assets: props.assets ?? "dist",
    spa: false,
  });
}

async function resolveOutputType(cwd: string): Promise<"server" | "static"> {
  const candidates = [
    "astro.config.mjs",
    "astro.config.js",
    "astro.config.ts",
    "astro.config.mts",
  ];
  for (const candidate of candidates) {
    try {
      const config = await withSkipPathValidation(
        () => import(join(cwd, candidate)),
      );
      if (
        typeof config.default === "object" &&
        config.default &&
        "output" in config.default &&
        typeof config.default.output === "string"
      ) {
        return config.default.output;
      }
      return "static";
    } catch {
      // ignore
    }
  }
  return "static";
}
