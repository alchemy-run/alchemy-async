import type esbuild from "esbuild";
import assert from "node:assert";
import fs from "node:fs/promises";
import path from "pathe";
import type { WorkerBundle } from "../worker-bundle.ts";

export function createWasmPlugin() {
  const modules = new Map<string, WorkerBundle.Module>();
  const plugin: esbuild.Plugin = {
    name: "alchemy-wasm",
    setup(build) {
      build.onStart(() => {
        modules.clear();
      });

      // Handle imports like `import "./foo.wasm"` and `import "./foo.wasm?module"`
      // TODO(john): Figure out why this suddenly became necessary
      build.onResolve({ filter: /\.wasm(\?.*)?$/ }, async (args) => {
        const resolved = modules.get(args.path);
        if (resolved) {
          return { path: resolved.path, external: true };
        }

        // Resolve path to source file, excluding the `?module` suffix (uses path.resolve in case args.path is already absolute)
        const normalizedPath = path.normalize(args.path).replace(/\?.*$/, "");
        const copyFrom = path.resolve(args.resolveDir, normalizedPath);

        // Resolve path to outdir (required for monorepos if the workdir is not the same as process.cwd())
        assert(
          build.initialOptions.absWorkingDir && build.initialOptions.outdir,
          "Missing absWorkingDir or outdir from esbuild options",
        );
        const outdir = path.resolve(
          build.initialOptions.absWorkingDir,
          build.initialOptions.outdir,
        );

        // Use relative path as module specifier for portability (note: the `?module` suffix is not needed in workerd)
        const specifier = path.relative(
          build.initialOptions.absWorkingDir,
          copyFrom,
        );

        // Copy to outdir so it's included in the upload
        const copyTo = path.join(outdir, specifier);
        await fs.mkdir(path.dirname(copyTo), { recursive: true });
        await fs.copyFile(copyFrom, copyTo);
        modules.set(args.path, {
          type: "wasm",
          path: specifier,
        });

        return { path: specifier, external: true };
      });
    },
  };
  return { plugin, modules };
}
