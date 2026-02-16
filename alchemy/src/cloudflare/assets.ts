import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "pathe";
import { Resource } from "../resource.ts";
import { getContentType } from "../util/content-type.ts";
import ignore from "../util/ignore-matcher.ts";

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
export async function Assets(props: AssetsProps): Promise<Assets> {
  return {
    type: "assets",
    ...props,
  };
}

export namespace Assets {
  export interface FileMetadata {
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
  export const read = async (root: string): Promise<FileMetadata[]> => {
    const matcher = ignore().add([".assetsignore", "_headers", "_redirects"]);
    const ignorePath = path.join(root, ".assetsignore");
    try {
      const content = await fs.readFile(ignorePath, "utf-8");
      matcher.add(content.split("\n"));
    } catch {
      // ignore
    }

    const readDirectory = async (
      directory: string,
    ): Promise<FileMetadata[]> => {
      const files = await fs.readdir(directory);
      const result: FileMetadata[] = [];
      await Promise.all(
        files.map(async (file) => {
          const absolutePath = path.join(directory, file);
          const relativePath = path.relative(root, absolutePath);
          if (matcher.ignores(relativePath)) {
            return;
          }
          const stat = await fs.stat(absolutePath);
          if (stat.isDirectory()) {
            result.push(...(await readDirectory(absolutePath)));
          } else {
            if (stat.size > 26214400) {
              throw new Error(
                `File "${absolutePath}" is too large to upload as an asset to Cloudflare (the file is ${(stat.size / 1024 / 1024).toFixed(2)} MB; the maximum size is 25MB).`,
              );
            }
            result.push({
              path: absolutePath,
              name: relativePath.startsWith("/")
                ? relativePath
                : `/${relativePath}`,
              hash: await computeHash(absolutePath),
              size: stat.size,
              type: getContentType(absolutePath) ?? "application/null",
            });
          }
        }),
      );
      return result;
    };

    return await readDirectory(root);
  };

  /**
   * Calculate the SHA-256 hash and size of a file
   *
   * @param filePath Path to the file
   * @returns Hash (first 32 chars of SHA-256) and size of the file
   */
  const computeHash = async (filePath: string): Promise<string> => {
    const contents = await fs.readFile(filePath);

    const hash = crypto.createHash("sha256");
    hash.update(contents);

    const extension = path.extname(filePath).substring(1);
    hash.update(extension);

    return hash.digest("hex").slice(0, 32);
  };
}

// we are deprecating the Assets resource (it is now just a function)
// but, a user may still have a resource that depends on it, so we register a no-op dummy resource so that it can be cleanly deleted
Resource("cloudflare::Asset", async function (this) {
  if (this.phase === "delete") {
    return this.destroy();
  }

  throw new Error("Not implemented");
});
