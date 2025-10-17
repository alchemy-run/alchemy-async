import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Worker Unenv Tests", () => {
  test("create worker with import.meta.dirname and unenv-handler", async (scope) => {
    try {
      // Create a temporary directory for the files
      // Create the worker using the entrypoint file
      const worker = await Worker(`${BRANCH_PREFIX}-test-worker-unenv`, {
        name: `${BRANCH_PREFIX}-test-worker-unenv`,
        adopt: true,
        entrypoint: path.join(import.meta.dirname, "unenv-handler.ts"),
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
        compatibilityFlags: ["nodejs_compat"],
      });

      const response = await fetchAndExpectOK(worker.url!);
      expect(await response.text()).toEqual("function");
    } finally {
      // Clean up the worker
      await destroy(scope);
    }
  }, 120000); // Increased timeout for bundling operations
});
