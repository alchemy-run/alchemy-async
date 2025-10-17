import fs from "node:fs/promises";
import os from "node:os";
import { posix as path } from "node:path";
import { expect } from "vitest";
import { alchemy } from "../src/alchemy.ts";
import { Bundle } from "../src/esbuild/bundle.ts";
import { BRANCH_PREFIX, exists } from "./util.ts";

import { destroy } from "../src/destroy.ts";
import "../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const out = await fs.mkdtemp(path.join(os.tmpdir(), "alchemy-esbuild-test"));
const outputFile = path.join(out, "handler.js");

test("bundle and cleanup", async (scope) => {
  const bundle = await Bundle("bundle", {
    entryPoint: path.join(import.meta.dirname, "handler.ts"),
    outdir: out,
    format: "esm",
    platform: "node",
    target: "node18",
  });

  try {
    // Apply the bundle
    expect(path.resolve(bundle.path)).toBe(outputFile);
    expect(bundle.hash).toBeTruthy();

    // Verify the file exists and contains our code
    expect(await exists(outputFile)).toBe(true);
    const contents = await fs.readFile(outputFile, "utf-8");
    expect(contents).toContain("Hello from bundled handler");
  } finally {
    await destroy(scope);
    expect(await exists(outputFile)).toBe(false);
  }
});
