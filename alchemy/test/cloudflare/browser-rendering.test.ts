import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { BrowserRendering } from "../../src/cloudflare/browser-rendering.ts";
import { KVNamespace } from "../../src/cloudflare/kv-namespace.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";

import path from "node:path";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Browser Rendering Resource", () => {
  for (const mode of ["local", "remote"]) {
    test(`create worker with browser rendering binding and take screenshot (${mode})`, async (scope) => {
      // cannot set scope.local directly because it's a readonly property
      Object.assign(scope, {
        local: mode === "local",
      });

      const workerName = `${BRANCH_PREFIX}-browser-renderer-${mode}`;
      const kvNamespaceName = `${BRANCH_PREFIX}-browser-kv-demo-${mode}`;

      let worker: Worker | undefined;
      let kvNamespace: KVNamespace | undefined;

      try {
        // Create a KV namespace for caching screenshots
        kvNamespace = await KVNamespace(kvNamespaceName, {
          title: `${BRANCH_PREFIX} Browser KV Demo ${mode}`,
          adopt: true,
        });

        expect(kvNamespace.title).toEqual(
          `${BRANCH_PREFIX} Browser KV Demo ${mode}`,
        );

        // Create a worker with browser rendering binding
        worker = await Worker(workerName, {
          name: workerName,
          adopt: true,
          entrypoint: path.join(import.meta.dirname, "browser-handler.ts"),
          format: "esm",
          compatibilityFlags: ["nodejs_compat"], // Required for puppeteer
          url: true, // Enable workers.dev URL to test the worker
          bindings: {
            MYBROWSER: BrowserRendering(),
            BROWSER_KV_DEMO: kvNamespace,
          },
          bundle: {
            platform: "node",
          },
        });

        expect(worker.id).toBeTruthy();
        expect(worker.name).toEqual(workerName);
        expect(worker.bindings).toBeDefined();
        expect(worker.url).toBeTruthy();

        // Test taking a screenshot of Google
        const response = await fetchAndExpectOK(
          `${worker.url}?url=https://google.com`,
        );
        expect(response.headers.get("content-type")).toEqual("image/jpeg");

        // Verify we got an actual image by checking content length
        const imageBuffer = await response.arrayBuffer();
        expect(imageBuffer.byteLength).toBeGreaterThan(1000); // A valid screenshot should be at least 1KB

        // Test fetching from cache
        console.log("Testing cached screenshot...");
        await fetchAndExpectOK(`${worker.url}?url=https://google.com`);

        // Take a screenshot of a different URL
        console.log("Testing screenshot of a different URL...");
        await fetchAndExpectOK(`${worker.url}?url=https://example.com`);

        // Test error case - missing URL parameter
        console.log("Testing error case - missing URL parameter...");
        const errorResponse = await fetchAndExpectOK(worker.url!);
        const errorText = await errorResponse.text();
        expect(errorText).toEqual(
          "Please add an ?url=https://example.com/ parameter",
        );
      } finally {
        // reset scope.local so destroy works normally
        Object.assign(scope, {
          local: false,
        });
        await destroy(scope);
      }
    }, 120000); // Longer timeout for browser rendering operations
  }
});
