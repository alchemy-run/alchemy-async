import fs from "node:fs";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { ignore } from "../util/ignore.ts";

export interface FolderProps {
  /**
   * The path of the folder
   */
  path?: string;
  /**
   * Whether to delete the folder during the delete phase
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to clean the folder during the deletion phase (even if it contains existing files)
   * @default false
   */
  clean?: boolean;

  /**
   * Whether to create the folder recursively
   * @default true
   */
  recursive?: boolean;
}

/**
 * Base folder resource type
 */
export interface Folder {
  path: string;
}

/**
 * Folder Resource
 *
 * Creates and manages directories in the filesystem with automatic parent
 * directory creation and cleanup on deletion.
 *
 * @example
 * // Create a directory using id as path
 * const dir = await Folder("uploads");
 *
 * @example
 * // Create a directory with explicit path
 * const dir = await Folder("uploads", {
 *   path: "uploads"
 * });
 *
 * @example
 * // Create a nested directory structure
 * const logs = await Folder("var/log/app", {
 *   path: "var/log/app"
 * });
 */
export const Folder = Resource(
  "fs::Folder",
  async function (
    this: Context<Folder>,
    id: string,
    props?: FolderProps,
  ): Promise<Folder> {
    const dirPath = props?.path ?? id;
    if (this.phase === "delete") {
      if (props?.delete !== false) {
        // we just do a best effort attempt
        await ignore(["ENOENT", "ENOTEMPTY"], async () =>
          fs.promises.rm(dirPath, { recursive: props?.clean ?? false }),
        );
      }
      return this.destroy();
    }
    await ignore("EEXIST", async () =>
      fs.promises.mkdir(dirPath, { recursive: props?.recursive ?? true }),
    );
    return {
      path: dirPath,
    };
  },
);
