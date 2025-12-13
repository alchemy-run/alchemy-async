/**
 * Copied from https://github.com/cloudflare/workers-sdk/blob/main/packages/wrangler/src/deployment-bundle/esbuild-plugins/hybrid-nodejs-compat.ts#L17
 */
import type { Plugin } from "esbuild";
/**
 * ESBuild plugin to apply the unenv preset.
 *
 * @returns ESBuild plugin
 */
export declare function esbuildPluginHybridNodeCompat({ compatibilityDate, compatibilityFlags, }: {
    compatibilityDate?: string;
    compatibilityFlags?: string[];
}): Plugin;
//# sourceMappingURL=plugin-hybrid-node-compat.d.ts.map