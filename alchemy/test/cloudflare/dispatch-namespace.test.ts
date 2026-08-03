import * as fs from "node:fs/promises";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { Assets } from "../../src/cloudflare/assets.ts";
import { DispatchNamespace } from "../../src/cloudflare/dispatch-namespace.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Dispatch Namespace Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-dispatch`;

  test("create, update, and delete dispatch namespace", async (scope) => {
    let dispatchNamespace: DispatchNamespace | undefined;
    const namespaceName = `${BRANCH_PREFIX}-test-dispatch`;
    try {
      dispatchNamespace = await DispatchNamespace(testId, {
        adopt: true,
        namespace: namespaceName,
      });

      expect(dispatchNamespace.namespace).toEqual(namespaceName);
      expect(dispatchNamespace.type).toEqual("dispatch_namespace");

      // Verify namespace was created
      await assertDispatchNamespaceExists(dispatchNamespace.namespace);

      // Update the dispatch namespace (should be a no-op for namespaces)
      dispatchNamespace = await DispatchNamespace(testId, {
        namespace: namespaceName,
      });

      expect(dispatchNamespace.namespace).toEqual(namespaceName);
    } finally {
      await alchemy.destroy(scope);
      if (dispatchNamespace) {
        // Verify namespace was deleted
        await assertDispatchNamespaceNotExists(dispatchNamespace.namespace);
      }
    }
  });

  test("adopt existing namespace", async (scope) => {
    let dispatchNamespace: DispatchNamespace | undefined;
    const namespaceName = `${testId}-adopt`;
    try {
      dispatchNamespace = await DispatchNamespace("dispatch-ns", {
        namespace: namespaceName,
        adopt: true,
      });

      await alchemy.run("nested", async () => {
        const adoptedNamespace = await DispatchNamespace("dispatch-ns", {
          namespace: namespaceName,
          adopt: true,
        });

        expect(adoptedNamespace.namespace).toEqual(
          dispatchNamespace!.namespace,
        );
      });
    } finally {
      await alchemy.destroy(scope);
      if (dispatchNamespace) {
        await assertDispatchNamespaceNotExists(dispatchNamespace.namespace);
      }
    }
  });

  test("comprehensive dispatch namespace and worker integration", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-dispatch-namespace-target-worker`;
    const dispatcherWorkerName = `${BRANCH_PREFIX}-dispatcher-worker`;
    const namespaceName = `${BRANCH_PREFIX}-comprehensive-test`;

    let targetWorker: Worker | undefined;
    let dispatcherWorker: Worker | undefined;
    let dispatchNamespace: DispatchNamespace | undefined;

    try {
      // 1. Create a dispatch namespace
      dispatchNamespace = await DispatchNamespace("test-dispatch-namespace", {
        namespace: namespaceName,
        adopt: true,
      });

      // 2. Create a worker in the dispatch namespace
      targetWorker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from dispatch namespace!', { status: 200 });
            }
          }
        `,
        namespace: dispatchNamespace,
      });

      // 3. Create a worker bound to the namespace (dispatcher)
      dispatcherWorker = await Worker(dispatcherWorkerName, {
        name: dispatcherWorkerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              // Call the worker through the dispatch namespace
              const targetResponse = await env.NAMESPACE.get('${workerName}').fetch(request);
              
              const text = await targetResponse.text();
              return new Response(\`Dispatch response: \${text}\`, { status: 200 });
            }
          }
        `,
        bindings: {
          NAMESPACE: dispatchNamespace,
        },
        url: true,
      });

      // 4. Execute fetchAndExpectOK against the dispatcher and ensure it works at runtime
      const response = await fetchAndExpectOK(dispatcherWorker.url!);
      const text = await response.text();
      expect(text).toEqual("Dispatch response: Hello from dispatch namespace!");
    } finally {
      await alchemy.destroy(scope);
      if (targetWorker && dispatchNamespace) {
        await assertWorkerInNamespaceDoesNotExist(
          targetWorker.name,
          dispatchNamespace.namespace,
        );
      }
      if (dispatcherWorker) {
        await assertWorkerDoesNotExist(dispatcherWorker.name);
      }
      if (dispatchNamespace) {
        await assertDispatchNamespaceNotExists(dispatchNamespace.namespace);
      }
    }
  });

  test("dispatch namespace binding with outbound worker", async (scope) => {
    const outboundWorkerName = `${BRANCH_PREFIX}-outbound-worker`;
    const targetWorkerName = `${BRANCH_PREFIX}-outbound-target-worker`;
    const dispatcherWorkerName = `${BRANCH_PREFIX}-outbound-dispatcher`;
    const namespaceName = `${BRANCH_PREFIX}-outbound-namespace`;

    let outboundWorker: Worker | undefined;
    let targetWorker: Worker | undefined;
    let dispatcherWorker: Worker | undefined;
    let dispatchNamespace: DispatchNamespace | undefined;

    try {
      // 1. The outbound worker intercepts every subrequest a dispatched user worker makes.
      // It answers directly with the per-dispatch parameter it received on its env, which
      // proves both the attachment AND the parameter plumbing end-to-end.
      outboundWorker = await Worker(outboundWorkerName, {
        name: outboundWorkerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('outbound saw customer: ' + (env.CUSTOMER ?? 'none'), { status: 200 });
            }
          }
        `,
      });

      dispatchNamespace = await DispatchNamespace(
        "outbound-dispatch-namespace",
        {
          namespace: namespaceName,
          adopt: true,
        },
      );

      // 2. The user worker makes an arbitrary subrequest — it never reaches the real
      // origin because the outbound worker intercepts it.
      targetWorker = await Worker(targetWorkerName, {
        name: targetWorkerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const intercepted = await fetch('https://example.com/');
              return new Response(await intercepted.text(), { status: 200 });
            }
          }
        `,
        namespace: dispatchNamespace,
      });

      // 3. The dispatcher attaches the outbound worker on the BINDING and supplies the
      // declared parameter per dispatch.
      dispatcherWorker = await Worker(dispatcherWorkerName, {
        name: dispatcherWorkerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const worker = env.NAMESPACE.get('${targetWorkerName}', {}, {
                outbound: { CUSTOMER: 'tenant-42' },
              });
              return worker.fetch(request);
            }
          }
        `,
        bindings: {
          NAMESPACE: {
            ...dispatchNamespace,
            outbound: {
              service: outboundWorkerName,
              parameters: ["CUSTOMER"],
            },
          },
        },
        url: true,
      });

      // 4. The user worker's subrequest is answered by the outbound worker, carrying the
      // per-dispatch parameter value.
      const response = await fetchAndExpectOK(dispatcherWorker.url!);
      const text = await response.text();
      expect(text).toEqual("outbound saw customer: tenant-42");
    } finally {
      await alchemy.destroy(scope);
      if (targetWorker && dispatchNamespace) {
        await assertWorkerInNamespaceDoesNotExist(
          targetWorker.name,
          dispatchNamespace.namespace,
        );
      }
      if (dispatcherWorker) {
        await assertWorkerDoesNotExist(dispatcherWorker.name);
      }
      if (outboundWorker) {
        await assertWorkerDoesNotExist(outboundWorker.name);
      }
      if (dispatchNamespace) {
        await assertDispatchNamespaceNotExists(dispatchNamespace.namespace);
      }
    }
  });

  test("dispatch namespace with asset bindings", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-asset-worker`;
    const dispatcherWorkerName = `${BRANCH_PREFIX}-asset-dispatcher`;
    const namespaceName = `${BRANCH_PREFIX}-asset-namespace`;
    let tempDir: string | undefined;

    let assetWorker: Worker | undefined;
    let dispatcherWorker: Worker | undefined;
    let dispatchNamespace: DispatchNamespace | undefined;

    try {
      // 1. Create a temporary directory with test assets
      tempDir = path.join(".out", "alchemy-dispatch-assets-test");
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(tempDir, { recursive: true });

      // Create test files
      const htmlContent = "Hello from dispatch namespace assets!";
      const cssContent = "body { color: blue; }";

      await Promise.all([
        fs.writeFile(path.join(tempDir, "index.html"), htmlContent),
        fs.writeFile(path.join(tempDir, "styles.css"), cssContent),
      ]);

      // 2. Create assets resource
      const assets = await Assets({
        path: tempDir,
      });

      // 3. Create a dispatch namespace
      dispatchNamespace = await DispatchNamespace("asset-dispatch-namespace", {
        namespace: namespaceName,
        adopt: true,
      });

      // 4. Create a worker in the dispatch namespace with asset bindings
      assetWorker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return env.ASSETS.fetch(request);
            }
          }
        `,
        namespace: dispatchNamespace,
        url: false,
        bindings: {
          ASSETS: assets,
        },
      });

      // 5. Create a dispatcher worker that routes to the asset worker
      dispatcherWorker = await Worker(dispatcherWorkerName, {
        name: dispatcherWorkerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return await env.NAMESPACE.get('${workerName}').fetch(request);
            }
          }
        `,
        bindings: {
          NAMESPACE: dispatchNamespace,
        },
        url: true,
      });

      // 6. Test static asset serving through dispatch namespace
      const htmlResponse = await fetchAndExpectOK(
        `${dispatcherWorker.url}/index.html`,
      );
      const htmlText = await htmlResponse.text();
      expect(htmlText).toEqual(htmlContent);

      // Test CSS file
      const cssResponse = await fetchAndExpectOK(
        `${dispatcherWorker.url}/styles.css`,
      );
      const cssText = await cssResponse.text();
      expect(cssText).toEqual(cssContent);
    } finally {
      // Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      await alchemy.destroy(scope);
      if (assetWorker && dispatchNamespace) {
        await assertWorkerInNamespaceDoesNotExist(
          assetWorker.name,
          dispatchNamespace.namespace,
        );
      }
      if (dispatcherWorker) {
        await assertWorkerDoesNotExist(dispatcherWorker.name);
      }
      if (dispatchNamespace) {
        await assertDispatchNamespaceNotExists(dispatchNamespace.namespace);
      }
    }
  });

  async function assertDispatchNamespaceExists(
    namespace: string,
  ): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}`,
    );

    expect(response.status).toEqual(200);
  }

  async function assertDispatchNamespaceNotExists(
    namespace: string,
  ): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}`,
    );

    expect(response.status).toEqual(404);
  }

  async function assertWorkerDoesNotExist(workerName: string): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/workers/scripts/${workerName}`,
    );

    expect(response.status).toEqual(404);
  }

  async function assertWorkerInNamespaceDoesNotExist(
    workerName: string,
    namespace: string,
  ): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}/scripts/${workerName}`,
    );

    expect(response.status).toEqual(404);
  }
});
