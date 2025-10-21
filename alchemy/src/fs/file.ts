import fs from "node:fs";
import path from "pathe";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { ignore } from "../util/ignore.ts";
import { logger } from "../util/logger.ts";

import { alchemy } from "../alchemy.ts";
import type { FileCollection } from "./file-collection.ts";
import type { FileRef } from "./file-ref.ts";

declare module "../alchemy.ts" {
  interface Alchemy {
    /**
     * Creates a reference to a file in the filesystem.
     * Used in template string interpolation to include file contents,
     * commonly for documentation generation.
     *
     * @param path Path to the file
     * @returns Promise resolving to a FileRef
     *
     * @example
     * // Include a file in documentation generation
     * await Document("api-docs", {
     *   prompt: await alchemy`
     *     Generate docs using the contents of:
     *     ${alchemy.file("./README.md")}
     *   `
     * });
     */
    file(path: string): Promise<FileRef>;

    /**
     * Creates a collection of files with their contents.
     * Used in template string interpolation to include multiple file contents,
     * commonly for bulk documentation generation.
     *
     * @param paths Array of file paths to include in collection
     * @returns Promise resolving to a FileCollection
     *
     * @example
     * // Include multiple source files in documentation generation
     * await Document("provider-docs", {
     *   prompt: await alchemy`
     *     Generate comprehensive docs for these files:
     *     ${alchemy.files([
     *       "src/types.ts",
     *       "src/resource.ts",
     *       "src/provider.ts"
     *     ])}
     *   `
     * });
     */
    files(paths: string[]): Promise<FileCollection>;
    files(path: string, ...paths: string[]): Promise<FileCollection>;

    /**
     * Gets all of the files in a directory.
     * @param path Path to the directory
     * @param props Optional properties
     * @returns Promise resolving to a FileCollection
     *
     * @example
     * // Get all files in a directory
     * const files = await alchemy.folder("./docs");
     *
     */
    folder(
      path: string,
      props?: {
        /**
         * Whether to recursively get all files in the directory
         * @default false
         */
        recursive?: boolean;
      },
    ): Promise<FileCollection>;
  }
}

alchemy.file = async (path: string) => ({
  kind: "fs::FileRef",
  path,
});

alchemy.files = async (
  ...args: [paths: string[]] | [...paths: string[]]
): Promise<FileCollection> => {
  const paths: string[] =
    typeof args[0] === "string" ? (args as string[]) : args[0];
  return {
    type: "fs::FileCollection",
    files: Object.fromEntries(
      await Promise.all(
        paths.map(async (path) => [
          path,
          await fs.promises.readFile(path, "utf-8"),
        ]),
      ),
    ),
  };
};

alchemy.folder = async (dir: string, props?: { recursive?: boolean }) => {
  const files = await fs.promises.readdir(dir, {
    recursive: props?.recursive ?? false,
  });
  return alchemy.files(files.map((file) => path.join(dir, file)));
};

/**
 * Base file resource type
 */
export interface File {
  /**
   * Path to the file
   */
  path: string;
  /**
   * Content of the file
   */
  content: string;
}

/**
 * File Resource
 *
 * Creates and manages files in the filesystem with automatic directory creation
 * and proper cleanup on deletion.
 *
 * @example
 * // Create a simple text file
 * const config = await File("config.txt", {
 *   path: "config.txt",
 *   content: "some configuration data"
 * });
 *
 * @example
 * // Create a file in a nested directory
 * const log = await File("logs/app.log", {
 *   path: "logs/app.log",
 *   content: "application log entry"
 * });
 *
 * @example
 * // Update file content and path
 * let file = await File("config.json", {
 *   path: "config.json",
 *   content: '{ "version": "1.0.0" }'
 * });
 *
 * // Later, update the path and content (old file will be removed)
 * file = await File("config.json", {
 *   path: "config/config.json",
 *   content: '{ "version": "1.0.1" }'
 * });
 */
export const File = Resource(
  "fs::File",
  async function (
    this: Context<File>,
    id: string,
    props: {
      path: string;
      content: string;
    },
  ): Promise<File> {
    const filePath = props?.path ?? id;

    if (this.phase === "delete") {
      await ignore("ENOENT", async () => fs.promises.unlink(filePath));
      return this.destroy();
    }
    if (
      this.phase === "update" &&
      this.output &&
      this.output.path !== filePath
    ) {
      // If path has changed, delete the old file
      logger.log(
        `File: Path changed from ${this.output.path} to ${filePath}, removing old file`,
      );
      await ignore("ENOENT", async () => fs.promises.unlink(this.output.path));
    }

    // Create directory and write file
    const dirName = path.dirname(filePath);
    if (dirName !== ".") {
      await fs.promises.mkdir(dirName, {
        recursive: true,
      });
    }

    await fs.promises.writeFile(filePath, props.content);

    return {
      path: filePath,
      content: props.content,
    };
  },
);
