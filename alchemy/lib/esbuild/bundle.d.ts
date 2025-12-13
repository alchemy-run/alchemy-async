import type esbuild from "esbuild";
import type { Context } from "../context.ts";
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
export interface Bundle<P extends BundleProps = BundleProps> extends BundleProps {
    /**
     * Path to the bundled file
     * Absolute or relative path to the generated bundle
     */
    path: P extends {
        outdir: string;
    } | {
        outfile: string;
    } ? string : undefined;
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
export declare const Bundle: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | (<Props extends BundleProps>(this: Context<Bundle<any>>, _id: string, props: Props) => Promise<Bundle<Props>>);
export declare function bundle(props: BundleProps): Promise<esbuild.BuildResult<{
    write: boolean;
    entryPoints: string[];
    outdir: string | undefined;
    outfile: string | undefined;
    bundle: boolean;
    format: "iife" | "cjs" | "esm" | undefined;
    target: string | string[] | undefined;
    minify: boolean | undefined;
    sourcemap: boolean | "external" | "inline" | "both" | undefined;
    external: string[] | undefined;
    platform: "node" | "browser" | "neutral" | undefined;
    metafile: boolean;
    splitting?: boolean | undefined;
    preserveSymlinks?: boolean | undefined;
    outbase?: string | undefined;
    packages?: "bundle" | "external" | undefined;
    alias?: Record<string, string> | undefined;
    loader?: {
        [ext: string]: esbuild.Loader;
    } | undefined;
    resolveExtensions?: string[] | undefined;
    mainFields?: string[] | undefined;
    conditions?: string[] | undefined;
    allowOverwrite?: boolean | undefined;
    tsconfig?: string | undefined;
    outExtension?: {
        [ext: string]: string;
    } | undefined;
    publicPath?: string | undefined;
    entryNames?: string | undefined;
    chunkNames?: string | undefined;
    assetNames?: string | undefined;
    inject?: string[] | undefined;
    banner?: {
        [type: string]: string;
    } | undefined;
    footer?: {
        [type: string]: string;
    } | undefined;
    stdin?: esbuild.StdinOptions | undefined;
    plugins?: esbuild.Plugin[] | undefined;
    absWorkingDir?: string | undefined;
    nodePaths?: string[] | undefined;
    legalComments?: "none" | "inline" | "eof" | "linked" | "external" | undefined;
    sourceRoot?: string | undefined;
    sourcesContent?: boolean | undefined;
    globalName?: string | undefined;
    supported?: Record<string, boolean> | undefined;
    mangleProps?: RegExp | undefined;
    reserveProps?: RegExp | undefined;
    mangleQuoted?: boolean | undefined;
    mangleCache?: Record<string, string | false> | undefined;
    drop?: esbuild.Drop[] | undefined;
    dropLabels?: string[] | undefined;
    minifyWhitespace?: boolean | undefined;
    minifyIdentifiers?: boolean | undefined;
    minifySyntax?: boolean | undefined;
    lineLimit?: number | undefined;
    charset?: esbuild.Charset | undefined;
    treeShaking?: boolean | undefined;
    ignoreAnnotations?: boolean | undefined;
    jsx?: "transform" | "preserve" | "automatic" | undefined;
    jsxFactory?: string | undefined;
    jsxFragment?: string | undefined;
    jsxImportSource?: string | undefined;
    jsxDev?: boolean | undefined;
    jsxSideEffects?: boolean | undefined;
    define?: {
        [key: string]: string;
    } | undefined;
    pure?: string[] | undefined;
    keepNames?: boolean | undefined;
    absPaths?: esbuild.AbsPaths[] | undefined;
    color?: boolean | undefined;
    logLevel?: esbuild.LogLevel | undefined;
    logLimit?: number | undefined;
    logOverride?: Record<string, esbuild.LogLevel> | undefined;
    tsconfigRaw?: (string | esbuild.TsconfigRaw) | undefined;
}>>;
//# sourceMappingURL=bundle.d.ts.map