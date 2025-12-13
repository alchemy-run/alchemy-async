import type esbuild from "esbuild";
export interface HotReloadPluginProps {
    onBuildStart?: () => void | Promise<void>;
}
export declare function createHotReloadPlugin(props?: HotReloadPluginProps): {
    plugin: esbuild.Plugin;
    iterator: AsyncIterable<esbuild.BuildResult>;
};
//# sourceMappingURL=plugin-hot-reload.d.ts.map