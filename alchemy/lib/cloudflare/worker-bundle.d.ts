import esbuild from "esbuild";
import { type Result } from "neverthrow";
export interface WorkerBundle {
    entrypoint: string;
    root?: string;
    modules: WorkerBundle.Module[];
}
export declare function normalizeWorkerBundle(props: {
    id: string;
    script: string | undefined;
    entrypoint: string | undefined;
    noBundle: boolean | undefined;
    format: "cjs" | "esm" | undefined;
    compatibilityDate: string;
    compatibilityFlags: string[];
    rules: {
        globs: string[];
    }[] | undefined;
    bundle?: Omit<esbuild.BuildOptions, "entryPoints" | "format" | "absWorkingDir">;
    cwd: string;
    outdir: string;
    sourceMap: boolean | undefined;
}): Result<WorkerBundleSource, string>;
export declare namespace WorkerBundle {
    interface Module {
        type: "esm" | "cjs" | "text" | "data" | "wasm" | "sourcemap";
        path: string;
        content?: string | Uint8Array<ArrayBuffer>;
    }
    const parseModules: (paths: string[], format: "esm" | "cjs") => WorkerBundle.Module[];
    const toFormData: (bundle: WorkerBundle) => Promise<FormData>;
}
export interface WorkerBundleSource {
    create(): Promise<WorkerBundle>;
    watch(signal: AbortSignal): AsyncIterable<WorkerBundle>;
    delete?(): Promise<void>;
}
export declare namespace WorkerBundleSource {
    interface BaseProps {
        format: "cjs" | "esm";
        nodeCompat: "als" | "v2" | null;
    }
    class Inline implements WorkerBundleSource {
        private props;
        constructor(props: WorkerBundleSource.BaseProps & {
            content: string;
        });
        create(): Promise<WorkerBundle>;
        watch(): AsyncIterable<WorkerBundle>;
    }
    class FS implements WorkerBundleSource {
        private root;
        private entrypoint;
        private globs;
        private format;
        constructor(props: WorkerBundleSource.BaseProps & {
            entrypoint: string;
            globs: string[] | undefined;
            cwd: string;
            sourcemaps: boolean;
        });
        create(): Promise<WorkerBundle>;
        watch(signal: AbortSignal): AsyncIterable<WorkerBundle>;
        private readFiles;
    }
    interface ESBuildProps extends WorkerBundleSource.BaseProps, Omit<esbuild.BuildOptions, "entryPoints" | "format" | "absWorkingDir" | "outdir"> {
        id: string;
        entrypoint: string;
        cwd: string;
        outdir: string;
        compatibilityDate: string;
        compatibilityFlags: string[];
    }
    class ESBuild implements WorkerBundleSource {
        private props;
        constructor(props: ESBuildProps);
        create(): Promise<WorkerBundle>;
        watch(signal: AbortSignal): AsyncIterable<WorkerBundle>;
        delete(): Promise<void>;
        private buildOptions;
        /**
         * Returns the list of ESBuild plugins to use for a given compat mode.
         */
        private getNodeJSCompatPlugins;
        private formatBuildOutput;
    }
}
//# sourceMappingURL=worker-bundle.d.ts.map