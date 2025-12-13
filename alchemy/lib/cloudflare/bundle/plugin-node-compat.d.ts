import type { Plugin } from "esbuild";
import type { NodeJSCompatMode } from "miniflare";
/**
 * An esbuild plugin that will:
 * - mark any `node:...` imports as external
 * - warn if there are node imports (if not in v1 mode)
 *
 * Applies to: null, als, legacy and v1 modes.
 */
export declare const esbuildPluginNodeCompatImports: (mode: NodeJSCompatMode) => Plugin;
//# sourceMappingURL=plugin-node-compat.d.ts.map