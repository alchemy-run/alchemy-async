import type esbuild from "esbuild";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "pathe";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { logger } from "../util/logger.ts";

/**
 * Properties for creating or updating an esbuild bundle
 */
export interface BundleProps extends Partial<esbuild.BuildOptions> {
  /**
   * Entry point for the bundle
   * Path to the source file to bundle (e.g., "src/handler.ts")
   */
  entryPoint: string;

  /**
   * Output directory for the bundle
   * Directory where the bundled file will be written
   */
  outdir?: string;

  /**
   * Output filename for the bundle
   * Full path to the output file, overrides outdir if specified
   */
  outfile?: string;

  /**
   * Bundle format
   * iife: Immediately Invoked Function Expression
   * cjs: CommonJS
   * esm: ECMAScript Modules
   */
  format?: "iife" | "cjs" | "esm";

  /**
   * Target environment
   * Examples: 'node16', 'node18', 'es2020'
   */
  target?: string | string[];

  /**
   * Whether to minify the output
   */
  minify?: boolean;

  /**
   * Whether to generate sourcemaps
   * inline: Include sourcemap in bundle
   * external: Generate separate .map file
   * both: Generate both inline and external
   */
  sourcemap?: boolean | "inline" | "external" | "both";

  /**
   * External packages to exclude from bundle
   * Array of package names to mark as external
   */
  external?: string[];

  /**
   * Platform to target
   * browser: Browser environment
   * node: Node.js environment
   * neutral: Platform-agnostic
   */
  platform?: "browser" | "node" | "neutral";
}

/**
 * Output returned after bundle creation/update
 */
export interface Bundle<P extends BundleProps = BundleProps>
  extends BundleProps {
  /**
   * Path to the bundled file
   * Absolute or relative path to the generated bundle
   */
  path: P extends { outdir: string } | { outfile: string } ? string : undefined;

  /**
   * SHA-256 hash of the bundle contents
   * Used for cache busting and content verification
   */
  hash: string;

  /**
   * The content of the bundle (the .js or .mjs file)
   */
  content: string;
}

/**
 * esbuild Bundle Resource
 *
 * Creates and manages bundled JavaScript/TypeScript files using esbuild.
 * Supports various output formats, sourcemaps, and platform targets.
 *
 * @example
 * // Bundle a TypeScript file for Node.js
 * const bundle = await Bundle("handler", {
 *   entryPoint: "src/handler.ts",
 *   outdir: ".alchemy/.out",
 *   format: "esm",
 *   platform: "node",
 *   target: "node18"
 * });
 */
export const Bundle = Resource(
  "esbuild::Bundle",
  {
    alwaysUpdate: true,
  },
  async function <Props extends BundleProps>(
    this: Context<Bundle<any>>,
    _id: string,
    props: Props,
  ): Promise<Bundle<Props>> {
    if (this.phase === "delete") {
      if (this.output.path) {
        try {
          await fs.rm(this.output.path, { force: true });
        } catch (error) {
          if (error instanceof Error && error.message.includes("ENOENT")) {
            // File doesn't exist, so we can ignore the error
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    const result = await bundle(props);

    const bundlePath = Object.entries(result.metafile!.outputs).find(
      ([_, output]) => {
        if (output.entryPoint === undefined) {
          return false;
        }
        // resolve to absolute and then relative to ensure consistent result (e.g. ./src/handler.ts instead of src/handler.ts)
        const relativeOutput = path.relative(
          process.cwd(),
          path.resolve(output.entryPoint),
        );
        return (
          relativeOutput ===
          path.relative(
            process.cwd(),
            path.resolve(process.cwd(), props.entryPoint),
          )
        );
      },
    )?.[0];

    const outputFile = result.outputFiles?.[0];
    if (outputFile === undefined && bundlePath === undefined) {
      throw new Error("Failed to create bundle");
    }
    type Path = Props extends { outdir: string } | { outfile: string }
      ? string
      : undefined;
    if (outputFile) {
      return {
        ...props,
        path: bundlePath as Path,
        hash: outputFile.hash,
        content: outputFile.text,
      };
    }
    const content = await fs.readFile(bundlePath!, "utf-8");
    return {
      ...props,
      path: bundlePath as Path,
      hash: crypto.createHash("sha256").update(content).digest("hex"),
      content,
    };
  },
);

export async function bundle(props: BundleProps) {
  const { entryPoint, ...rest } = props;
  const options = {
    ...rest,
    write: !(props.outdir === undefined && props.outfile === undefined),
    // write:
    //   props.outdir === undefined && props.outfile === undefined ? false : true,
    // write: false,
    entryPoints: [entryPoint],
    outdir: props.outdir ? props.outdir : props.outfile ? undefined : ".out",
    outfile: props.outfile,
    bundle: true,
    format: props.format,
    target: props.target,
    minify: props.minify,
    sourcemap: props.sourcemap,
    external: props.external,
    platform: props.platform,
    metafile: true,
  };
  if (process.env.DEBUG) {
    logger.log(options);
  }
  const esbuild = await import("esbuild");
  return await esbuild.build(options);
}
