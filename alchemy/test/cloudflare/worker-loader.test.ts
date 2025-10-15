import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { WorkerLoader } from "../../src/cloudflare/worker-loader.ts";
import { destroy } from "../../src/destroy.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";
import { assertWorkerDoesNotExist } from "./test-helpers.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi();

describe("WorkerLoader", () => {
  test("create worker with WorkerLoader binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-loader`;

    let worker: Worker | undefined;
    try {
      worker = await Worker(workerName, {
        name: workerName,
        script: `
          import { env } from "cloudflare:workers";

          export default {
            async fetch(request) {
              const dynamicWorker = env.LOADER.get(
                'dynamic-worker',
                async () => ({
                  compatibilityDate: '2025-06-01',
                  mainModule: 'index.js',
                  modules: {
                    'index.js': \`
                      export default {
                        async fetch(request) {
                          return new Response('Hello from dynamic worker!');
                        }
                      }
                    \`,
                  },
                }),
              );

              const entrypoint = dynamicWorker.getEntrypoint();
              return entrypoint.fetch(new URL(request.url));
            }
          };
        `,
        format: "esm",
        bindings: {
          LOADER: WorkerLoader(),
        },
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings?.LOADER).toBeDefined();
      expect(worker.url).toBeTruthy();

      const response = await fetchAndExpectOK(worker.url!);
      const text = await response.text();
      expect(text).toEqual("Hello from dynamic worker!");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });
});
