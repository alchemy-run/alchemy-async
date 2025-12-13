import type { CloudflareApi } from "./api.ts";
import { Assets } from "./assets.ts";
import type { AssetsConfig, WorkerProps } from "./worker.ts";
export interface AssetUploadResult {
    completionToken: string;
    assetConfig?: AssetsConfig;
}
/**
 * Uploads assets to Cloudflare and returns a completion token
 *
 * @param api CloudflareApi instance
 * @param workerName Name of the worker
 * @param assets Assets resource containing files to upload
 * @param assetConfig Configuration for the assets
 * @returns Completion token for the assets upload
 */
export declare function uploadAssets(api: CloudflareApi, { workerName, assets, assetConfig, namespace }: {
    workerName: string;
    assets: Assets;
    assetConfig?: WorkerProps["assets"];
    namespace?: string;
}): Promise<AssetUploadResult>;
/**
 * Creates asset configuration object from provided config or defaults
 */
export declare function createAssetConfig(config?: AssetsConfig): AssetsConfig;
//# sourceMappingURL=worker-assets.d.ts.map