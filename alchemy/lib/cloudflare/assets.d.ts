/**
 * Properties for creating or updating Assets
 */
export interface AssetsProps {
    /**
     * Path to a directory containing static assets to be uploaded
     * These files will be served by Cloudflare's Workers runtime
     */
    path: string;
}
/**
 * Assets binding type
 */
export type Assets = AssetsProps & {
    type: "assets";
};
/**
 * Cloudflare Assets represent a collection of static files that can be uploaded and served
 * by Cloudflare Workers.
 *
 * @example
 * // Create a basic assets bundle from a local directory
 * const staticAssets = await Assets({
 *   path: "./src/assets"
 * });
 *
 * // Use these assets with a worker
 * const worker = await Worker("frontend", {
 *   name: "frontend-worker",
 *   entrypoint: "./src/worker.ts",
 *   bindings: {
 *     ASSETS: staticAssets
 *   }
 * });
 */
export declare function Assets(props: AssetsProps): Promise<Assets>;
export declare namespace Assets {
    interface FileMetadata {
        path: string;
        name: string;
        hash: string;
        size: number;
        type: string;
    }
    /**
     * Recursively read the metadata for all assets in a directory, skipping files that are ignored by the .assetsignore file
     *
     * @param root Path to the directory
     * @returns Metadata for all assets in the directory
     */
    const read: (root: string) => Promise<FileMetadata[]>;
}
//# sourceMappingURL=assets.d.ts.map