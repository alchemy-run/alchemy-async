import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.js";
import { Images } from "../../src/cloudflare/images.js";
import { Worker } from "../../src/cloudflare/worker.js";
import { destroy } from "../../src/destroy.js";
import { BRANCH_PREFIX } from "../util.js";

import path from "pathe";
import "../../src/test/vitest.js";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Images Binding", () => {
  test("create worker with images binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-images-worker`;

    let worker: Worker | undefined;

    try {
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        entrypoint: path.join(import.meta.dirname, "images-handler.ts"),
        format: "esm",
        bindings: {
          IMAGES: Images(),
        },
      });

      // Test passed if worker was created successfully with Images binding
      expect(worker).toBeDefined();
    } finally {
      await destroy(scope);
    }
  });
});
