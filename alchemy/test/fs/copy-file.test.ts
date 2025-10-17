import fs from "node:fs";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { CopyFile } from "../../src/fs/copy-file.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("CopyFile Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-copy-file`;

  test("create, update, and delete copy file resource", async (scope) => {
    const sourceFilePath = path.join(
      process.cwd(),
      `test-source-${testId}-1.txt`,
    );
    const destinationFilePath = path.join(
      process.cwd(),
      `test-destination-${testId}-1.txt`,
    );

    // Create a test source file
    await fs.promises.writeFile(
      sourceFilePath,
      "This is a test file for copying",
    );

    let resource;
    try {
      // Create a test copy file resource
      resource = await CopyFile(testId, {
        src: sourceFilePath,
        dest: destinationFilePath,
        overwrite: true,
      });

      // Verify resource properties
      expect(resource.src).toBe(sourceFilePath);
      expect(resource.dest).toBe(destinationFilePath);
      expect(resource.overwrite).toBe(true);
      expect(resource.copied).toBe(true);

      // Verify file was actually copied
      const fileExists = await fs.promises
        .access(destinationFilePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(true);

      // Verify file content
      const content = await fs.promises.readFile(destinationFilePath, "utf-8");
      expect(content).toBe("This is a test file for copying");

      // Update the resource with a different destination
      const newDestinationPath = path.join(
        process.cwd(),
        `test-destination-updated-${testId}-1.txt`,
      );
      resource = await CopyFile(testId, {
        src: sourceFilePath,
        dest: newDestinationPath,
        overwrite: true,
      });

      // Verify resource was updated
      expect(resource.dest).toBe(newDestinationPath);

      // Verify file was copied to new location
      const newFileExists = await fs.promises
        .access(newDestinationPath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      expect(newFileExists).toBe(true);

      // Clean up the new destination file
      await fs.promises.unlink(newDestinationPath);
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Clean up test files
      try {
        await fs.promises.unlink(sourceFilePath);
        await fs.promises.unlink(destinationFilePath);
      } catch (_error) {
        // Ignore errors if files don't exist
      }

      // Verify destination file was deleted
      const fileExists = await fs.promises
        .access(destinationFilePath, fs.constants.F_OK)
        .then(() => true)
        .catch(() => false);
      expect(fileExists).toBe(false);
    }
  });

  test("copy file with overwrite false", async (scope) => {
    const sourceFilePath = path.join(
      process.cwd(),
      `test-source-${testId}-2.txt`,
    );
    const destinationFilePath = path.join(
      process.cwd(),
      `test-destination-${testId}-2.txt`,
    );

    // Create a test source file
    await fs.promises.writeFile(
      sourceFilePath,
      "This is a test file for copying",
    );

    try {
      // Create a file at the destination first
      await fs.promises.writeFile(
        destinationFilePath,
        "This is the original file",
      );

      // Create a copy file resource with overwrite false
      const resource = await CopyFile(`${testId}-no-overwrite`, {
        src: sourceFilePath,
        dest: destinationFilePath,
        overwrite: false,
      });

      // Verify resource properties
      expect(resource.overwrite).toBe(false);
      expect(resource.copied).toBe(true);

      // Verify original file content was preserved
      const content = await fs.promises.readFile(destinationFilePath, "utf-8");
      expect(content).toBe("This is the original file");
    } finally {
      await destroy(scope);

      // Clean up test files
      try {
        await fs.promises.unlink(sourceFilePath);
        await fs.promises.unlink(destinationFilePath);
      } catch (_error) {
        // Ignore errors if files don't exist
      }
    }
  });
});
