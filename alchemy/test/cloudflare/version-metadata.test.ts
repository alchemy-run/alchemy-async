import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { VersionMetadata } from "../../src/cloudflare/version-metadata.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import path from "pathe";
import "../../src/test/vitest.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("VersionMetadata Binding", () => {
  test("create worker with version metadata binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-version-metadata-worker`;

    let worker: Worker | undefined;

    try {
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        entrypoint: path.join(
          import.meta.dirname,
          "version-metadata-handler.ts",
        ),
        format: "esm",
        url: true,
        bindings: {
          VERSION_METADATA: VersionMetadata(),
        },
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
      expect(worker.url).toBeTruthy();

      const response = await fetchAndExpectOK(worker.url!);
      const text = await response.text();
      expect(text).toContain("VersionMetadata binding available");
    } finally {
      await destroy(scope);
    }
  });
});
