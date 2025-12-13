import type esbuild from "esbuild";
import type { WorkerBundle } from "../worker-bundle.ts";
export declare function createWasmPlugin(): {
    plugin: esbuild.Plugin;
    modules: Map<string, WorkerBundle.Module>;
};
//# sourceMappingURL=plugin-wasm.d.ts.map