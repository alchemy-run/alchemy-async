import fs from "node:fs/promises";
import { AsyncQueue } from "../util/async-queue.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { extractCloudflareResult } from "./api-response.ts";
import type { CloudflareApi } from "./api.ts";
import { Assets } from "./assets.ts";
import type { AssetsConfig, WorkerProps } from "./worker.ts";

export interface AssetUploadResult {
  completionToken: string;
  assetConfig?: AssetsConfig;
}

/**
 * Interface for a file's metadata to be uploaded
 */
interface FileMetadata {
  hash: string;
  size: number;
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
export async function uploadAssets(
  api: CloudflareApi,
  { workerName, assets, assetConfig, namespace }: {
    workerName: string;
    assets: Assets;
    assetConfig?: WorkerProps["assets"];
    namespace?: string;
  },
): Promise<AssetUploadResult> {
  // Process the assets configuration once at the beginning
  const processedConfig = createAssetConfig(assetConfig);

  const manifest: Record<string, FileMetadata> = {};
  const filesByHash = new Map<string, Assets.FileMetadata>();
  for (const file of await Assets.read(assets.path)) {
    manifest[file.name] = { hash: file.hash, size: file.size };
    filesByHash.set(file.hash, file);
  }

  // Start the upload session
  const uploadSession = await extractCloudflareResult<{
    jwt: string;
    buckets: string[][];
  }>(
    `create assets upload session for worker "${workerName}"`,
    api.post(
      namespace
        ? `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}/scripts/${workerName}/assets-upload-session`
        : `/accounts/${api.accountId}/workers/scripts/${workerName}/assets-upload-session`,
      { manifest },
    ),
  );
  // If there are no buckets, assets are already uploaded or empty
  if (!uploadSession.buckets || uploadSession.buckets.length === 0) {
    return {
      completionToken: uploadSession.jwt,
      assetConfig: processedConfig,
    };
  }

  // Upload the files in batches as specified by the API
  let completionToken = uploadSession.jwt;
  const buckets = uploadSession.buckets;

  const queue = new AsyncQueue(3);
  await Promise.all(
    buckets.map((bucket) =>
      queue.add(async () => {
        const jwt = await withExponentialBackoff(
          async () =>
            await uploadBucket(api, uploadSession.jwt, bucket, filesByHash),
          () => true,
        );
        if (jwt) {
          completionToken = jwt;
        }
      }),
    ),
  );

  // Return the final completion token with asset configuration
  return {
    completionToken,
    assetConfig: processedConfig,
  };
}

/**
 * Creates asset configuration object from provided config or defaults
 */
export function createAssetConfig(config?: AssetsConfig): AssetsConfig {
  const assetConfig: AssetsConfig = {
    html_handling: "auto-trailing-slash",
  };

  if (config) {
    if (config._headers !== undefined) {
      assetConfig._headers = config._headers;
    }

    if (config._redirects !== undefined) {
      assetConfig._redirects = config._redirects;
    }

    if (config.html_handling !== undefined) {
      assetConfig.html_handling = config.html_handling;
    }

    if (config.not_found_handling !== undefined) {
      assetConfig.not_found_handling = config.not_found_handling;
    }

    if (config.run_worker_first !== undefined) {
      assetConfig.run_worker_first = config.run_worker_first;
    }
  }

  return assetConfig;
}

async function uploadBucket(
  api: CloudflareApi,
  jwt: string,
  bucket: string[],
  filesByHash: Map<string, Assets.FileMetadata>,
) {
  const formData = new FormData();
  await Promise.all(
    bucket.map(async (fileHash) => {
      const file = filesByHash.get(fileHash);
      if (!file) {
        throw new Error(`Could not find file with hash ${fileHash}`);
      }
      const fileContent = await fs.readFile(file.path);
      const blob = new Blob([fileContent.toString("base64")], {
        type: file.type,
      });
      formData.append(fileHash, blob, fileHash);
    }),
  );
  const uploadResult = await extractCloudflareResult<{ jwt?: string }>(
    "upload asset files",
    api.post(
      `/accounts/${api.accountId}/workers/assets/upload?base64=true`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      },
    ),
  );
  return uploadResult.jwt;
}
