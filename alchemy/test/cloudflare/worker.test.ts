import * as fs from "node:fs/promises";
import * as path from "node:path";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { AnalyticsEngineDataset } from "../../src/cloudflare/analytics-engine.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { Assets } from "../../src/cloudflare/assets.ts";
import { Self } from "../../src/cloudflare/bindings.ts";
import { DurableObjectNamespace } from "../../src/cloudflare/durable-object-namespace.ts";
import { KVNamespace } from "../../src/cloudflare/kv-namespace.ts";
import type { SingleStepMigration } from "../../src/cloudflare/worker-migration.ts";
import { WorkerRef } from "../../src/cloudflare/worker-ref.ts";
import {
  deleteWorker,
  getScriptMetadata,
  Worker,
  type WorkerObservability,
} from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import {
  fetchAndExpectOK,
  fetchAndExpectStatus,
} from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX, waitFor } from "../util.ts";
import { fetchAndExpect } from "./fetch-utils.ts";
import { assertWorkerDoesNotExist } from "./test-helpers.ts";

import { Container } from "../../src/cloudflare/container.ts";
import { listWorkersInNamespace } from "../../src/cloudflare/dispatch-namespace.ts";
import { DispatchNamespace, Queue } from "../../src/cloudflare/index.ts";
import "../../src/test/vitest.ts";

const ENABLE_WFP_TESTS = process.env.CLOUDFLARE_ACCOUNT_ENABLE_WFP !== "false";
const ENABLE_PAID_TESTS =
  process.env.CLOUDFLARE_ACCOUNT_ENABLE_PAID !== "false";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

// Create a Cloudflare API client for verification
const api = await createCloudflareApi();

describe("Worker Resource", () => {
  test("create, update, and delete worker (CJS format)", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-cjs-1`;

    let worker: Worker | undefined;
    try {
      // Create a worker with an explicit name
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          addEventListener('fetch', event => {
            event.respondWith(new Response('Hello world!', { status: 200 }));
          });
        `,
        format: "cjs",
      });

      // Apply to create the worker
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.format).toEqual("cjs");

      // Update the worker with a new script
      const updatedScript = `
        addEventListener('fetch', event => {
          event.respondWith(new Response('Hello updated world!', { status: 200 }));
        });
      `;

      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: updatedScript,
        format: "cjs",
      });

      expect(worker.id).toEqual(worker.id);
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("create, update, and delete worker (ESM format)", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-esm-1`;

    let worker: Worker | undefined;
    try {
      // Create a worker with ESM format
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello ESM world!', { status: 200 });
            }
          };
        `,
        format: "esm", // Explicitly using ESM
      });

      // Apply to create the worker
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.format).toEqual("esm");

      // Update the worker with a new ESM script
      const updatedEsmScript = `
        export default {
          async fetch(request, env, ctx) {
            return new Response('Hello updated ESM world!', { status: 200 });
          }
        };
      `;

      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: updatedEsmScript,
        format: "esm",
      });

      expect(worker.id).toEqual(worker.id);
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("convert between ESM and CJS formats", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-format-conversion-convert-1`;

    let worker: Worker | undefined;
    try {
      // First create with ESM format
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello ESM world!', { status: 200 });
            }
          };
        `,
        format: "esm",
      });

      expect(worker.format).toEqual("esm");

      // Update to CJS format
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          addEventListener('fetch', event => {
            event.respondWith(new Response('Hello world!', { status: 200 }));
          });
        `,
        format: "cjs",
      });
      expect(worker.format).toEqual("cjs");

      // Update back to ESM format
      worker = await Worker(workerName, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello ESM world!', { status: 200 });
            }
          };
        `,
        format: "esm",
      });

      expect(worker.format).toEqual("esm");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("fails when creating a worker with a duplicate name", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-duplicate`;

    try {
      // First, create a worker successfully
      await Worker(workerName, {
        name: workerName,
        script: `
          addEventListener('fetch', event => {
            event.respondWith(new Response('Hello world!', { status: 200 }));
          });
        `,
        format: "cjs",
      });

      // Try to create another worker with the same name, which should fail
      const duplicateWorker = Worker(`${workerName}-dup`, {
        name: workerName, // Same name as firstWorker
        script: `
          addEventListener('fetch', event => {
            event.respondWith(new Response('Hello world!', { status: 200 }));
          });
        `,
        format: "cjs",
      });
      await expect(duplicateWorker).rejects.toThrow(
        `Worker with name '${workerName}' already exists. Please use a unique name.`,
      );
    } finally {
      await destroy(scope);
    }
  });

  test.skipIf(!ENABLE_PAID_TESTS)(
    "fails when creating worker with duplicate binding IDs",
    async (scope) => {
      const workerName = `${BRANCH_PREFIX}-test-worker-duplicate-binding-ids`;

      try {
        // Test 1: Duplicate DurableObjectNamespace IDs
        const namespace1 = DurableObjectNamespace("duplicate-id", {
          className: "Counter1",
          scriptName: workerName,
        });

        const namespace2 = DurableObjectNamespace("duplicate-id", {
          className: "Counter2",
          scriptName: workerName,
        });

        // Try to create a worker with duplicate binding IDs
        const duplicateBindingsWorker = Worker(workerName, {
          name: workerName,
          script: `
          export class Counter1 {}
          export class Counter2 {}
          export default {
            async fetch(request, env, ctx) {
              return new Response('Should not work!', { status: 200 });
            }
          };
        `,
          format: "esm",
          bindings: {
            NAMESPACE1: namespace1,
            NAMESPACE2: namespace2, // Same ID as namespace1
          },
        });

        await expect(duplicateBindingsWorker).rejects.toThrow(
          "Duplicate binding ID 'duplicate-id' found for bindings 'NAMESPACE1' and 'NAMESPACE2'. Container and DurableObjectNamespace bindings must have unique IDs.",
        );

        const container = await Container("duplicate-id", {
          className: "ContainerClass",
          scriptName: workerName,
          build: {
            dockerfile: "Dockerfile",
            context: path.join(import.meta.dirname, "container"),
          },
        });

        const mixedDuplicateWorker = Worker(workerName, {
          name: workerName,
          script: `
          export class Counter1 {}
          export class ContainerClass {}
          export default {
            async fetch(request, env, ctx) {
              return new Response('Should not work!', { status: 200 });
            }
          };
        `,
          format: "esm",
          bindings: {
            NAMESPACE1: namespace1,
            CONTAINER: container, // Same ID as namespace1
          },
        });

        await expect(mixedDuplicateWorker).rejects.toThrow(
          "Duplicate binding ID 'duplicate-id' found for bindings 'NAMESPACE1' and 'CONTAINER'. Container and DurableObjectNamespace bindings must have unique IDs.",
        );
      } finally {
        await destroy(scope);
      }
    },
  );

  test.skipIf(!ENABLE_PAID_TESTS)(
    "create and delete worker with multiple bindings",
    async (scope) => {
      const workerName = `${BRANCH_PREFIX}-test-worker-multi-bindings-multi-1`;

      // Sample ESM worker script with multiple bindings
      const multiBindingsWorkerScript = `
  export class Counter {
    constructor(state, env) {
      this.state = state;
      this.env = env;
      this.counter = 0;
    }

    async fetch(request) {
      this.counter++;
      return new Response('Counter: ' + this.counter, { status: 200 });
    }
  }

  export default {
    async fetch(request, env, ctx) {
      // Path-based routing to demonstrate different bindings
      const url = new URL(request.url);

      if (url.pathname.includes('/counter')) {
        const id = env.COUNTER.idFromName('default');
        const stub = env.COUNTER.get(id);
        return stub.fetch(request);
      }

      if (url.pathname.includes('/kv')) {
        const value = await env.TEST_KV.get('testKey');
        return new Response('KV Value: ' + (value || 'not found'), { status: 200 });
      }

      if (url.pathname.includes('/secret')) {
        return new Response('Secret: ' + env.API_KEY, { status: 200 });
      }

      return new Response('Hello worker with multiple bindings!', { status: 200 });
    }
  };
`;

      // Create a Durable Object namespace
      const counterNamespace = DurableObjectNamespace(
        "test-counter-namespace",
        {
          className: "Counter",
          scriptName: workerName,
        },
      );

      // Create a KV namespace
      const testKv = await KVNamespace("test-kv-namespace", {
        title: `${BRANCH_PREFIX} Test KV Namespace 1`,
        adopt: true,
        values: [
          {
            key: "testKey",
            value: "initial-value",
          },
        ],
      });

      let worker: Worker | undefined;

      try {
        // First create the worker without bindings
        worker = await Worker(workerName, {
          name: workerName,
          script: multiBindingsWorkerScript,
          format: "esm",
          adopt: true,
        });

        expect(worker.id).toBeTruthy();
        expect(worker.name).toEqual(workerName);

        // Update the worker with all bindings
        worker = await Worker(workerName, {
          name: workerName,
          script: multiBindingsWorkerScript,
          format: "esm",
          bindings: {
            COUNTER: counterNamespace,
            TEST_KV: testKv,
            API_KEY: "test-api-key-value",
          },
          adopt: true,
        });

        expect(worker.id).toBeTruthy();
        expect(worker.name).toEqual(workerName);
        expect(worker.bindings).toBeDefined();
      } finally {
        await destroy(scope);
        await assertWorkerDoesNotExist(api, workerName);
      }
    },
  );

  // Add a new test for environment variables
  test("create and test worker with environment variables", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-env-vars-env-1`;
    // Sample ESM worker script with environment variables
    const envVarsWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          return Response.json(env);
        }
      };
    `;
    try {
      // Create a worker with environment variables
      const worker1 = await Worker(workerName, {
        name: workerName,
        script: envVarsWorkerScript,
        format: "esm",
        env: {
          TEST_API_KEY: "test-api-key-123",
          NODE_ENV: "testing",
          APP_DEBUG: "true",
        },
        url: true, // Enable workers.dev URL to test the worker
        adopt: true,
      });

      expect(worker1.id).toBeTruthy();
      expect(worker1.name).toEqual(workerName);
      expect(worker1.env).toBeDefined();
      expect(worker1.env?.TEST_API_KEY).toEqual("test-api-key-123");
      expect(worker1.env?.NODE_ENV).toEqual("testing");
      expect(worker1.env?.APP_DEBUG).toEqual("true");
      expect(worker1.url).toBeTruthy();

      if (worker1.url) {
        // Test that the environment variables are accessible in the worker
        const response = await fetchAndExpectOK(worker1.url);
        const text = await response.json();
        expect(text).toEqual({
          TEST_API_KEY: "test-api-key-123",
          NODE_ENV: "testing",
          APP_DEBUG: "true",
        });
      } else {
        throw new Error("Worker URL is undefined");
      }

      // Update the worker with different environment variables
      const worker2 = await Worker(`${workerName}-2`, {
        name: workerName,
        script: envVarsWorkerScript,
        format: "esm",
        env: {
          TEST_API_KEY: "updated-key-456",
          NODE_ENV: "production",
          NEW_VAR: "new-value",
        },
        url: true,
        adopt: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(worker2.id).toEqual(worker2.id);
      expect(worker2.env?.TEST_API_KEY).toEqual("updated-key-456");
      expect(worker2.env?.NODE_ENV).toEqual("production");
      expect(worker2.env?.NEW_VAR).toEqual("new-value");
      // APP_DEBUG should no longer be present
      expect(worker2.env?.APP_DEBUG).toBeUndefined();
      expect(worker2.url).toEqual(worker1.url);

      if (worker2.url) {
        // Poll for up to 10s to allow eventual consistency of env propagation
        const expectedEnv = {
          TEST_API_KEY: "updated-key-456",
          NODE_ENV: "production",
          NEW_VAR: "new-value",
        } as const;

        const lastText: any = await waitFor(
          async () => {
            const response = await fetchAndExpectOK(worker2.url!);
            return response.json();
          },
          (data: any) => JSON.stringify(data) === JSON.stringify(expectedEnv),
          { timeoutMs: 10_000, intervalMs: 250 },
        );

        expect(lastText).toEqual(expectedEnv);
      } else {
        throw new Error("Worker URL is undefined");
      }
    } finally {
      await destroy(scope);
      // Verify the worker was deleted
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  // Test for static assets
  test("create and test worker with static assets", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-assets`;
    let tempDir: string | undefined;

    try {
      // Create a temporary directory to store test assets
      tempDir = path.join(".out", "alchemy-assets-test");

      await fs.rm(tempDir, { recursive: true, force: true });

      // Ensure directory exists with proper permissions
      await fs.mkdir(tempDir, { recursive: true });

      // Create test files in the temporary directory
      const testContent = "Hello from static assets!";
      const cssContent = "body { color: blue; }";
      const jsonContent = JSON.stringify({
        message: "Hello from JSON",
        timestamp: Date.now(),
      });

      // Create a subdirectory with additional files
      const subDir = path.join(tempDir, "data");
      await Promise.all([
        fs.writeFile(path.join(tempDir, "index.html"), testContent),
        fs.writeFile(path.join(tempDir, "styles.css"), cssContent),
        fs.mkdir(subDir, { recursive: true }),
      ]);
      await fs.writeFile(path.join(subDir, "config.json"), jsonContent);

      // Create assets resource
      const assets = await Assets({
        path: tempDir,
      });

      // Create a worker that uses ESM format and serves static assets
      const workerWithAssetsScript = `
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);

            if (url.pathname.startsWith("/api/")) {
              return new Response("Worker with assets is running!", {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            return new Response("Not Found", { status: 404 });
          }
        };
      `;

      // Create the worker with assets binding
      const worker = await Worker(workerName, {
        name: workerName,
        script: workerWithAssetsScript,
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
        bindings: {
          ASSETS: assets,
        },
        adopt: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.url).toBeTruthy();
      expect(worker.bindings?.ASSETS).toBeTruthy();

      async function get(url: string) {
        const response = await fetchAndExpectOK(url);
        const text = await response.text();
        return text;
      }

      // Test that the static assets are accessible
      const indexText = await get(`${worker.url}/index.html`);
      expect(indexText).toEqual(testContent);

      // Test the worker's main handler
      // should route to index.html
      const mainText = await get(worker.url!);
      expect(mainText).toEqual(testContent);

      // Test CSS file
      const cssText = await get(`${worker.url}/styles.css`);
      expect(cssText).toEqual(cssContent);

      // Test file in subdirectory
      const jsonData = JSON.parse(await get(`${worker.url}/data/config.json`));
      expect(jsonData.message).toEqual("Hello from JSON");

      const apiCall = await get(`${worker.url}/api/data`);
      expect(apiCall).toEqual("Worker with assets is running!");
    } finally {
      // Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      await destroy(scope);
      // Verify the worker was deleted
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  // Test for worker with assets configuration
  test("create worker with assets configuration options", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-assets-config`;
    let tempDir: string | undefined;

    try {
      // Create a temporary directory to store test assets
      tempDir = path.join(".out", "alchemy-assets-config-test");
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(tempDir, { recursive: true });

      // Create test files in the temporary directory
      const indexContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Assets Config Test</title>
            <link rel="stylesheet" href="styles.css">
          </head>
          <body>
            <h1>Assets Config Test</h1>
            <p>Testing assets configuration options</p>
          </body>
        </html>
      `;

      const cssContent =
        "body { font-family: Arial; color: #333; padding: 20px; }";
      const spaContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>SPA Page</title>
          </head>
          <body>
            <h1>Single Page App</h1>
            <div id="app">This is a single page application</div>
          </body>
        </html>
      `;

      // Create files
      await Promise.all([
        fs.writeFile(path.join(tempDir, "index.html"), indexContent),
        fs.writeFile(path.join(tempDir, "styles.css"), cssContent),
        fs.writeFile(path.join(tempDir, "app.html"), spaContent),
      ]);

      // Create assets resource
      const assets = await Assets({
        path: tempDir,
      });

      // Create custom headers configuration
      const headersConfig = `#
/styles.css
  Cache-Control: public, max-age=86400
  Content-Type: text/css
  XYZ: 123

/*.html
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  ABC: 456

/
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  ABC: 456
`;

      // Create custom redirects configuration
      const redirectsConfig = `# Redirect old path to new path
/old-path /index.html 301

# Redirect with wildcard
/legacy/* /app.html 302
`;

      // Create a worker script that serves assets
      const workerScript = `
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);

            // API endpoint to check worker is running
            if (url.pathname === "/api/status") {
              return new Response(JSON.stringify({
                status: "ok",
                worker: "${workerName}",
                timestamp: Date.now()
              }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
              });
            }

            return new Response("Not Found", { status: 404 });
          }
        };
      `;

      // Create the worker with assets binding and configuration
      const worker = await Worker(workerName, {
        name: workerName,
        script: workerScript,
        format: "esm",
        url: true,
        adopt: true,
        bindings: {
          ASSETS: assets,
        },
        assets: {
          _headers: headersConfig,
          _redirects: redirectsConfig,
          html_handling: "auto-trailing-slash",
          not_found_handling: "single-page-application",
          run_worker_first: false,
        },
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.url).toBeTruthy();
      expect(worker.bindings?.ASSETS).toBeTruthy();

      // Verify assets configuration was saved
      expect(worker.assets).toBeDefined();
      // expect(worker.assets?._headers).toEqual(headersConfig);
      // expect(worker.assets?._redirects).toEqual(redirectsConfig);
      expect(worker.assets?.html_handling).toEqual("auto-trailing-slash");
      expect(worker.assets?.not_found_handling).toEqual(
        "single-page-application",
      );
      expect(worker.assets?.run_worker_first).toEqual(false);

      // Test that the static assets are accessible
      const indexResponse = await fetchAndExpectOK(`${worker.url}/index.html`);
      expect(await indexResponse.text()).toContain("Assets Config Test");

      // Test HTML headers
      expect(indexResponse.headers.get("ABC")).toEqual("456");
      expect(indexResponse.headers.get("X-Frame-Options")).toEqual("DENY");
      expect(indexResponse.headers.get("X-Content-Type-Options")).toEqual(
        "nosniff",
      );

      // Test that custom headers are applied
      const cssResponse = await fetchAndExpectOK(`${worker.url}/styles.css`);
      expect(cssResponse.headers.get("Cache-Control")).toEqual(
        "public, max-age=86400",
      );
      expect(cssResponse.headers.get("XYZ")).toEqual("123");

      // Test auto-trailing-slash behavior
      // With auto-trailing-slash, /index should redirect to /index.html
      await fetchAndExpectStatus(
        `${worker.url}/index`,
        {
          redirect: "manual",
        },
        307,
      );

      // Test redirects
      await fetchAndExpectStatus(
        `${worker.url}/old-path`,
        {
          redirect: "manual",
        },
        301,
      );

      // Test wildcard redirects
      await fetchAndExpectStatus(
        `${worker.url}/legacy/something`,
        {
          redirect: "manual",
        },
        302,
      );

      // Test the worker's API endpoint
      const apiResponse = await fetchAndExpectOK(`${worker.url}/api/status`);
      const apiData: any = await apiResponse.json();
      expect(apiData.status).toEqual("ok");
      expect(apiData.worker).toEqual(workerName);
    } finally {
      // Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("create and test worker with Self binding", async (scope) => {
    // Sample ESM worker script with Self binding functionality

    const workerName = `${BRANCH_PREFIX}-test-worker-self`;

    let worker: Worker | undefined;

    try {
      // Create a worker with the Self binding
      worker = await Worker(workerName, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const url = new URL(request.url);
              
              // Echo endpoint
              if (url.pathname.startsWith('/echo/')) {
                const message = url.pathname.split('/echo/')[1];
                return new Response('Echo: ' + message, {
                  status: 200,
                  headers: { 'Content-Type': 'text/plain' }
                });
              }
              
              // Recursive endpoint that calls itself
              if (url.pathname.startsWith('/recursive/')) {
                const parts = url.pathname.split('/recursive/')[1].split('/');
                const message = parts[0] || '';
                const count = parseInt(parts[1] || '0', 10);
                
                if (count <= 0) {
                  return new Response('Final result: ' + message, {
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                }
                
                // Call self using the SELF binding
                try {
                  const response = await env.SELF.fetch(
                    new URL(\`/recursive/\${message}-\${count}/\${count - 1}\`, request.url)
                  );
                  return response;
                } catch (error) {
                  return new Response('Error calling self: ' + error.message, {
                    status: 500,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                }
              }
              
              return new Response('Self-binding Worker is running!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
        bindings: {
          SELF: Self, // Bind the worker to itself
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
      expect(worker.url).toBeTruthy();

      // Test the echo endpoint
      const echoResponse = await fetchAndExpectOK(
        `${worker.url}/echo/hello-world`,
      );
      const echoText = await echoResponse.text();
      expect(echoText).toEqual("Echo: hello-world");

      // Test the recursive endpoint with a count of 3
      const recursiveResponse = await fetchAndExpectOK(
        `${worker.url}/recursive/start/3`,
      );
      const recursiveText = await recursiveResponse.text();
      expect(recursiveText).toEqual("Final result: start-3-2-1");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  }, 60000); // Increased timeout for Self binding operations

  // Test for worker creation using an entrypoint file instead of an inline script
  test("create, update, and delete worker using entrypoint file", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-entrypoint`;
    const tempDir = path.join(".out", "alchemy-entrypoint-test");
    const entrypointPath = path.join(tempDir, "worker.ts");

    try {
      // Create a temporary directory for the entrypoint file
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(tempDir, { recursive: true });

      // Create a worker script file
      const workerScript = `
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);

            // Return different responses based on the path
            if (url.pathname === '/data') {
              return Response.json({
                message: "Hello from bundled worker!",
                timestamp: Date.now(),
                version: "1.0.0"
              });
            }

            return new Response('Hello from entrypoint file!', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        };
      `;

      await fs.writeFile(entrypointPath, workerScript);

      // Create a worker using the entrypoint file
      let worker = await Worker(workerName, {
        name: workerName,
        entrypoint: entrypointPath,
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
      });

      // Verify the worker was created correctly
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.format).toEqual("esm");
      expect(worker.url).toBeTruthy();

      // Test that the worker is running correctly
      await waitFor(
        async () => {
          const response = await fetchAndExpectOK(worker.url!);
          return await response.text();
        },
        (text) => text === "Hello from entrypoint file!",
      );

      // Test the JSON endpoint
      const jsonResponse = await fetchAndExpectOK(`${worker.url}/data`);
      const data: any = await jsonResponse.json();
      expect(data.message).toEqual("Hello from bundled worker!");
      expect(data.version).toEqual("1.0.0");

      // Update the worker script file
      const updatedWorkerScript = `
        export default {
          async fetch(request, env, ctx) {
            const url = new URL(request.url);

            // Return different responses based on the path
            if (url.pathname === '/data') {
              return Response.json({
                message: "Hello from updated bundled worker!",
                timestamp: Date.now(),
                version: "2.0.0"
              });
            }

            return new Response('Hello from updated entrypoint file!', {
              status: 200,
              headers: { 'Content-Type': 'text/plain' }
            });
          }
        };
      `;

      await fs.writeFile(entrypointPath, updatedWorkerScript);

      // Update the worker with the new entrypoint file content
      worker = await Worker(workerName, {
        name: workerName,
        entrypoint: entrypointPath,
        format: "esm",
        url: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      if (worker.url) {
        // Test that the worker was updated correctly
        const response = await fetchAndExpectOK(worker.url);
        const text = await response.text();
        expect(text).toEqual("Hello from updated entrypoint file!");

        // Test the updated JSON endpoint
        const data = await waitFor(
          async () => {
            return (await fetchAndExpectOK(`${worker.url}/data`)).json() as any;
          },
          (response) =>
            response.message === "Hello from updated bundled worker!",
        );

        expect(data.message).toEqual("Hello from updated bundled worker!");
        expect(data.version).toEqual("2.0.0");
      }
    } finally {
      // Clean up the temporary directory
      await fs.rm(tempDir, { recursive: true, force: true });

      // Clean up the worker
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  }, 120000); // Increased timeout for bundling operations

  test("create and test worker with cron triggers", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-cron`;

    // Sample worker script with a scheduled handler
    const cronWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          return new Response('Worker with cron is running!', { status: 200 });
        },
        async scheduled(event, env, ctx) {
          // Log the scheduled event details
          console.log('Scheduled event received:', event.scheduledTime, event.cron);
          // In a real worker, you would perform tasks here
        },
      };
    `;

    let worker: Worker | undefined;
    try {
      // Create a worker with cron triggers
      worker = await Worker(workerName, {
        name: workerName,
        script: cronWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL for manual trigger checking
        crons: [
          "*/5 * * * *", // Every 5 minutes
          "0 0 * * *", // Daily at midnight (suspended)
        ],
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.url).toBeTruthy();
      expect(worker.crons).toBeDefined();
      expect(worker.crons?.length).toEqual(2);

      // Verify the worker exists via API
      const getResponse = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${workerName}`,
      );
      expect(getResponse.status).toEqual(200);

      // Verify cron triggers were created correctly
      // Since we can't directly query for cron triggers via API, we'll verify using our resource

      const trigger1 = worker.crons?.find((t) => t === "*/5 * * * *");
      expect(trigger1).toBeDefined();

      const trigger2 = worker.crons?.find((t) => t === "0 0 * * *");
      expect(trigger2).toBeDefined();

      // Update the worker - change one trigger, remove one
      worker = await Worker(workerName, {
        name: workerName,
        script: cronWorkerScript, // Same script
        format: "esm",
        url: true,
        crons: [
          "*/10 * * * *", // Changed from */5 to */10
          // Removed the daily trigger
        ],
      });

      expect(worker.id).toBeTruthy(); // Should be the same worker
      expect(worker.crons).toBeDefined();
      expect(worker.crons?.length).toEqual(1); // Only one trigger now

      const updatedTrigger = worker.crons?.find((t) => t === "*/10 * * * *");
      expect(updatedTrigger).toBeDefined();
      // Verify the removed trigger is gone
      const removedTrigger = worker.crons?.find((t) => t === "0 0 * * *");
      expect(removedTrigger).toBeUndefined();
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  }, 60000); // Increase timeout for Worker operations

  test("create and test worker with worker-to-worker binding", async (scope) => {
    // Create names for both workers
    const targetWorkerName = `${BRANCH_PREFIX}-target-worker`;
    const callerWorkerName = `${BRANCH_PREFIX}-caller-worker`;

    // Script for the target worker
    const targetWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          const url = new URL(request.url);
          
          if (url.pathname === '/api/data') {
            return Response.json({
              workerName: "${targetWorkerName}",
              message: "Hello from target worker!",
              timestamp: Date.now()
            });
          }

          if (url.pathname === '/api/echo') {
            const body = await request.json();
            return Response.json({
              workerName: "${targetWorkerName}",
              echo: body,
              received: true
            });
          }

          return new Response('Target Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    // Script for the caller worker that will use the worker binding
    const callerWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          const url = new URL(request.url);
          
          // Call the target worker via binding
          if (url.pathname === '/call-target') {
            try {
              const targetResponse = await env.TARGET_WORKER.fetch(
                new Request('https://example.com/api/data')
              );
              
              const targetData = await targetResponse.json();
              
              return Response.json({
                success: true,
                callerName: "${callerWorkerName}",
                targetResponse: targetData
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message
              }, { status: 500 });
            }
          }

          // Echo test with payload to verify data passing works
          if (url.pathname === '/echo-test') {
            try {
              const testPayload = {
                message: "Test message from caller",
                timestamp: Date.now()
              };
              
              const targetResponse = await env.TARGET_WORKER.fetch(
                new Request('https://example.com/api/echo', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(testPayload)
                })
              );
              
              const echoResponse = await targetResponse.json();
              
              return Response.json({
                success: true,
                callerName: "${callerWorkerName}",
                echoResponse
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message
              }, { status: 500 });
            }
          }

          return new Response('Caller Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    let targetWorker: Worker | undefined;
    let callerWorker: Worker | undefined;

    try {
      // First create the target worker
      targetWorker = await Worker(targetWorkerName, {
        name: targetWorkerName,
        script: targetWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(targetWorker.id).toBeTruthy();
      expect(targetWorker.name).toEqual(targetWorkerName);
      expect(targetWorker.url).toBeTruthy();

      // Create the caller worker with a binding to the target worker
      callerWorker = await Worker(callerWorkerName, {
        name: callerWorkerName,
        script: callerWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          TARGET_WORKER: targetWorker, // Bind to the target worker
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(callerWorker.id).toBeTruthy();
      expect(callerWorker.name).toEqual(callerWorkerName);
      expect(callerWorker.url).toBeTruthy();
      expect(callerWorker.bindings?.TARGET_WORKER).toBeDefined();

      // Test direct access to target worker works
      const targetResponse = await fetchAndExpectOK(targetWorker.url!);
      const targetText = await targetResponse.text();
      expect(targetText).toEqual("Target Worker is running!");

      // Test caller worker can access the target worker through binding
      const callerResponse = await fetchAndExpectOK(
        `${callerWorker.url}/call-target`,
      );
      const callerData: any = await callerResponse.json();

      expect(callerData.success).toEqual(true);
      expect(callerData.callerName).toEqual(callerWorkerName);
      expect(callerData.targetResponse).toBeDefined();
      expect(callerData.targetResponse.workerName).toEqual(targetWorkerName);
      expect(callerData.targetResponse.message).toEqual(
        "Hello from target worker!",
      );

      // Test echo functionality to verify data passing works
      const echoResponse = await fetchAndExpectOK(
        `${callerWorker.url}/echo-test`,
      );
      const echoData: any = await echoResponse.json();

      expect(echoData.success).toEqual(true);
      expect(echoData.echoResponse).toBeDefined();
      expect(echoData.echoResponse.workerName).toEqual(targetWorkerName);
      expect(echoData.echoResponse.received).toEqual(true);
      expect(echoData.echoResponse.echo.message).toEqual(
        "Test message from caller",
      );
    } finally {
      await destroy(scope);
      // Verify both workers were deleted
      await assertWorkerDoesNotExist(api, targetWorkerName);
      await assertWorkerDoesNotExist(api, callerWorkerName);
    }
  }, 60000); // Increase timeout for Worker operations

  test("create and delete worker with Analytics Engine binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-analytics-engine`;

    let worker: Worker | undefined;
    let dataset: AnalyticsEngineDataset | undefined;

    try {
      // Create an Analytics Engine dataset
      dataset = AnalyticsEngineDataset("test-analytics-dataset", {
        dataset: `${BRANCH_PREFIX}-test-analytics-dataset`,
      });

      expect(dataset.id).toBeTruthy();
      expect(dataset.dataset).toEqual(
        `${BRANCH_PREFIX}-test-analytics-dataset`,
      );

      // Create a worker with the analytics engine binding
      worker = await Worker(workerName, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              const url = new URL(request.url);
              
              // Log an event to the analytics engine
              if (url.pathname === '/log-event') {
                try {
                  const body = await request.json();
                  
                  // Write an event to the analytics dataset
                  env.ANALYTICS.writeDataPoint({
                    blobs: [body.action, body.category, body.details || ""],
                    doubles: [body.value || 1.0],
                    indexes: [body.userId || "anonymous"]
                  });
                  
                  return Response.json({
                    success: true,
                    message: "Event logged successfully"
                  });
                } catch (error) {
                  return Response.json({
                    success: false,
                    error: error.message || "Unknown error"
                  }, { status: 500 });
                }
              }
              
              // Confirm binding exists
              if (url.pathname === '/check-binding') {
                return Response.json({
                  hasBinding: !!env.ANALYTICS,
                  bindingType: typeof env.ANALYTICS,
                  success: true
                });
              }
              
              return new Response('Analytics Engine Worker is running!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true, // Enable workers.dev URL to test the worker
        bindings: {
          ANALYTICS: dataset,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
      expect(worker.bindings!.ANALYTICS).toBeDefined();
      expect(worker.url).toBeTruthy();

      // Test that the binding exists in the worker
      const response = await fetchAndExpectOK(`${worker.url}/check-binding`);
      const data: any = await response.json();
      expect(data.success).toEqual(true);
      expect(data.hasBinding).toEqual(true);

      // Test logging an event
      const logResponse = await fetchAndExpectOK(`${worker.url}/log-event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "page_view",
          category: "documentation",
          details: "analytics_engine_page",
          value: 1.0,
          userId: "test-user-123",
        }),
      });

      const logData: any = await logResponse.json();
      expect(logData.success).toEqual(true);
      expect(logData.message).toEqual("Event logged successfully");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  }, 60000); // Increase timeout for Worker operations

  test("can bind to a worker referenced by name", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-bind-by-name`;
    const workerName2 = `${BRANCH_PREFIX}-test-worker-bind-by-name-2`;
    try {
      await Worker("worker1", {
        name: workerName,
        script: `export default { async fetch(request, env, ctx) { return new Response('Hello, world!'); } };`,
        adopt: true,
      });

      const worker2 = await Worker("worker2", {
        name: workerName2,
        bindings: {
          TARGET_WORKER: WorkerRef<{
            foo(): Promise<string>;
            __WORKER_ENTRYPOINT_BRAND: never;
          }>({
            service: workerName,
          }),
        },
        script: `
          export default {
            async fetch(request, env, ctx) {
              // Call the target worker via the binding
              const response = await env.TARGET_WORKER.fetch(request);
              // Return the response from the target worker
              return response;
            }
          };
        `,
      });

      function _foo() {
        // should type check
        worker2.Env.TARGET_WORKER.foo();
        // @ts-expect-error
        worker2.Env.TARGET_WORKER.bar();
      }

      const response = await fetchAndExpectOK(worker2.url!);
      const text = await response.text();
      expect(text).toEqual("Hello, world!");
    } finally {
      await destroy(scope);
    }
  });

  test("create unversioned and versioned workers independently", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-versions`;
    const versionLabel = "pr-123";
    let tempDir: string | undefined;

    try {
      // Create a temporary directory to store test assets
      tempDir = path.join(".out", "alchemy-versioned-assets-test");
      await fs.rm(tempDir, { recursive: true, force: true });
      await fs.mkdir(tempDir, { recursive: true });

      // Create a simple test file
      const testContent = "Hello from versioned static assets!";
      await fs.writeFile(path.join(tempDir, "test.txt"), testContent);

      // Create assets resource
      const assets = await Assets({
        path: tempDir,
      });

      // First create a base worker without version
      const baseWorker = await Worker(`${workerName}-base`, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from base worker!', { 
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true,
      });

      // Verify base worker properties
      expect(baseWorker.id).toBeTruthy();
      expect(baseWorker.name).toEqual(workerName);
      expect(baseWorker.version).toBeUndefined();
      expect(baseWorker.url).toBeTruthy();

      // Test that the base worker URL works
      const baseResponse = await fetchAndExpectOK(baseWorker.url!);
      const baseText = await baseResponse.text();
      expect(baseText).toEqual("Hello from base worker!");

      // Now create a version of the same worker with assets binding
      const versionWorker = await Worker(`${workerName}-version`, {
        name: workerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              try {
                // Use env.ASSETS.get() to retrieve the test file
                const asset = await env.ASSETS.fetch(request);
                if (asset) {
                  const content = await asset.text();
                  return new Response(content, { 
                    status: 200,
                    headers: { 'Content-Type': 'text/plain' }
                  });
                }
                return new Response('Asset not found', { status: 200 });
              } catch (error) {
                console.error(error);
                return new Response(error.message, { status: 500 });
              }
            }
          };
        `,
        format: "esm",
        version: versionLabel,
        bindings: {
          ASSETS: assets,
        },
        assets: {
          run_worker_first: true,
          not_found_handling: "single-page-application",
        },
        compatibilityFlags: ["nodejs_compat"],
      });

      // Verify the version worker properties
      expect(versionWorker).toMatchObject({
        name: workerName,
        version: versionLabel,
      });
      expect(versionWorker.id).toBeTruthy();
      expect(versionWorker.url).toBeTruthy();
      expect(versionWorker.bindings?.ASSETS).toBeDefined();

      // the live worker should not have the new content
      await fetchAndExpect(
        `${baseWorker.url!}/test.txt`,
        "Hello from base worker!",
      );

      // the versioned worker should have the new content
      await fetchAndExpect(`${versionWorker.url!}/test.txt`, testContent);
    } finally {
      // Clean up temporary directory
      if (tempDir) {
        await fs.rm(tempDir, { recursive: true, force: true });
      }

      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test.skipIf(!ENABLE_PAID_TESTS)(
    "adopt worker with existing migration tag",
    async (scope) => {
      const scriptName = `${BRANCH_PREFIX}-test-worker-adopt-migration`;

      try {
        await deleteWorker(api, {
          scriptName,
        });

        const formData = new FormData();
        formData.append(
          "worker.js",
          `
          export class MyDO {}
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from migrated worker!', { status: 200 });
            }
          };
        `,
        );
        formData.append(
          "metadata",
          new Blob([
            JSON.stringify({
              compatibility_date: "2025-05-18",
              bindings: [
                {
                  type: "durable_object_namespace",
                  class_name: "MyDO",
                  name: "MY_DO",
                },
              ],
              observability: {
                enabled: true,
              },
              main_module: "worker.js",
              migrations: {
                new_tag: "v1",
                old_tag: undefined,
                new_classes: ["MyDO"],
                deleted_classes: [],
                renamed_classes: [],
                transferred_classes: [],
                new_sqlite_classes: [],
              } satisfies SingleStepMigration,
            }),
          ]),
        );

        // Put the worker with migration tag v1
        await api.post(
          `/accounts/${api.accountId}/workers/scripts/${scriptName}/versions`,
          formData,
        );

        // Now adopt the worker using the Worker resource
        await Worker(scriptName, {
          name: scriptName,
          adopt: true,
          script: `
          export class MyDO2 {}
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from adopted worker with migration!', { status: 200 });
            }
          };
        `,
          format: "esm",
          bindings: {
            MY_DO: DurableObjectNamespace("test-counter-migration", {
              className: "MyDO2",
              scriptName: scriptName,
            }),
          },
        });

        await Worker(scriptName, {
          name: scriptName,
          adopt: true,
          script: `
          export class MyDO3 {}
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from adopted worker with migration!', { status: 200 });
            }
          };
        `,
          format: "esm",
          bindings: {
            MY_DO: DurableObjectNamespace("test-counter-migration", {
              className: "MyDO3",
              scriptName: scriptName,
            }),
          },
        });
      } finally {
        await destroy(scope);
        await assertWorkerDoesNotExist(api, scriptName);
      }
    },
  );

  test("create worker with url false and verify no workers.dev subdomain", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-no-url`;

    let worker: Worker | undefined;
    try {
      // Create a worker with url: false (disable workers.dev subdomain)
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from worker without subdomain!', { status: 200 });
            }
          };
        `,
        format: "esm",
        url: false, // Explicitly disable workers.dev URL
      });

      expect(worker.url).toBeUndefined(); // No URL should be provided

      // Query Cloudflare API to verify subdomain is not enabled
      await assertWorkersDevDisabled(workerName);
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("switch worker from url true to url false and verify subdomain is disabled", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-url-switch`;

    let worker: Worker | undefined;
    try {
      // First create a worker with url: true (enable workers.dev subdomain)
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from worker with subdomain!', { status: 200 });
            }
          };
        `,
        format: "esm",
        url: true, // Enable workers.dev URL
      });

      expect(worker.url).toBeTruthy(); // URL should be provided

      await assertWorkersDevEnabled(workerName);

      // Test that the worker is accessible via the workers.dev subdomain
      const enabledResponse = await fetchAndExpectOK(worker.url!);
      const enabledText = await enabledResponse.text();
      expect(enabledText).toEqual("Hello from worker with subdomain!");

      // Now update the worker with url: false (disable workers.dev subdomain)
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from worker without subdomain!', { status: 200 });
            }
          };
        `,
        format: "esm",
        url: false, // Explicitly disable workers.dev URL
      });

      expect(worker.url).toBeUndefined(); // No URL should be provided after disabling

      // Query Cloudflare API to verify subdomain is now disabled
      await assertWorkersDevDisabled(workerName);
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("adopt worker without subdomain and enable url true", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-adopt-enable-url`;

    const script = `
      export default {
        async fetch(request, env, ctx) {
          return new Response('Hello from adopted worker with subdomain!', { status: 200 });
        }
      };
    `;

    try {
      // First create a worker with url: false (no subdomain)
      await Worker("initial-worker", {
        name: workerName,
        adopt: true,
        script,
        url: false, // Explicitly disable workers.dev URL
      });

      // Verify no subdomain is initially configured
      await assertWorkersDevDisabled(workerName);

      // Now adopt the worker with url: true to enable workers.dev subdomain
      const worker = await Worker("adopted-worker", {
        name: workerName,
        adopt: true,
        script,
        url: true, // Enable workers.dev URL during adoption
      });

      expect(worker.url).toBeTruthy(); // URL should now be provided

      await assertWorkersDevEnabled(workerName);

      // Test that the worker is accessible via the workers.dev subdomain
      const response = await fetchAndExpectOK(worker.url!);
      const text = await response.text();
      expect(text).toEqual("Hello from adopted worker with subdomain!");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  async function assertWorkersDevEnabled(workerName: string) {
    // Verify that the subdomain is now enabled via API
    const subdomainResponse = await api.get(
      `/accounts/${api.accountId}/workers/scripts/${workerName}/subdomain`,
    );
    expect(subdomainResponse.status).toEqual(200);

    const subdomainData: any = await subdomainResponse.json();
    expect(subdomainData.result?.enabled).toBeTruthy();
  }

  /**
   * Helper function to assert that a worker's workers.dev subdomain is disabled
   */
  async function assertWorkersDevDisabled(workerName: string) {
    // Query Cloudflare API to verify subdomain is disabled
    const subdomainResponse = await api.get(
      `/accounts/${api.accountId}/workers/scripts/${workerName}/subdomain`,
    );

    const subdomainData: any = await subdomainResponse.json();

    if (subdomainResponse.status === 200) {
      expect(subdomainData.result?.enabled).toBeFalsy();
    } else {
      // If 404, that also indicates no subdomain is configured
      expect(subdomainResponse.status).toEqual(404);
    }

    // Also check if we can construct the workers.dev URL and verify it's inaccessible
    try {
      const workerSubdomainUrl = `https://${workerName}.${api.accountId.substring(0, 32)}.workers.dev`;

      const subdomainTestResponse = await fetch(workerSubdomainUrl);

      // If the fetch succeeds, the subdomain shouldn't be working
      // Workers.dev subdomains that are disabled typically return 404 or 503
      expect(subdomainTestResponse.status).toBeGreaterThanOrEqual(400);
    } catch (error) {
      // Network errors are also expected when subdomain is disabled
      expect(error).toBeDefined();
    }
  }

  test("destroy versioned worker does not delete base worker", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-version-preserve-base`;
    const versionLabel = "test-version";

    let baseWorker: Worker | undefined;
    let versionedWorker: Worker | undefined;

    try {
      // First create a base worker
      baseWorker = await Worker(`${workerName}-base`, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from base worker!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true,
      });

      expect(baseWorker.id).toBeTruthy();
      expect(baseWorker.name).toEqual(workerName);
      expect(baseWorker.version).toBeUndefined();
      expect(baseWorker.url).toBeTruthy();

      // Verify base worker exists and works
      const baseResponse = await fetchAndExpectOK(baseWorker.url!);
      const baseText = await baseResponse.text();
      expect(baseText).toEqual("Hello from base worker!");

      // Create a versioned worker with the same name
      versionedWorker = await Worker(`${workerName}-version`, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from versioned worker!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        version: versionLabel,
      });

      expect(versionedWorker.id).toBeTruthy();
      expect(versionedWorker.name).toEqual(workerName);
      expect(versionedWorker.version).toEqual(versionLabel);
      expect(versionedWorker.url).toBeTruthy();

      // Verify versioned worker exists and works
      const versionResponse = await fetchAndExpectOK(versionedWorker.url!);
      const versionText = await versionResponse.text();
      expect(versionText).toEqual("Hello from versioned worker!");

      // Now destroy ONLY the versioned worker
      await destroy(versionedWorker);

      // Verify the base worker still exists via API
      const baseWorkerCheckResponse = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${workerName}`,
      );
      expect(baseWorkerCheckResponse.status).toEqual(200);

      // Verify the base worker still works
      const baseStillWorksResponse = await fetchAndExpectOK(baseWorker.url!);
      const baseStillWorksText = await baseStillWorksResponse.text();
      expect(baseStillWorksText).toEqual("Hello from base worker!");

      // The versioned worker should no longer be accessible
      // (Note: The version URL may still respond but it's effectively "deleted" from a management perspective)
    } finally {
      // Clean up the remaining base worker
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("create worker with compatibility preset", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-compatibility-preset`;

    let worker: Worker | undefined;
    try {
      // Create a worker with the "node" compatibility preset
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from Node.js compatible worker!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true,
        compatibility: "node", // Use the "node" preset
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.url).toBeTruthy();

      // Verify that the "node" preset automatically includes nodejs_compat flag
      expect(worker.compatibilityFlags).toContain("nodejs_compat");

      // Test that preset flags are combined with user-provided flags
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          import crypto from 'node:crypto';

          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello from Node.js compatible worker with additional flags!', {
                status: 200,
                headers: { 'Content-Type': 'text/plain' }
              });
            }
          };
        `,
        format: "esm",
        url: true,
        compatibility: "node",
        compatibilityFlags: ["nodejs_als"], // Add valid compatibility flag in addition to preset
      });

      // Verify that both preset flags and user-provided flags are present
      expect(worker.compatibilityFlags).toContain("nodejs_compat"); // From preset
      expect(worker.compatibilityFlags).toContain("nodejs_als"); // From user
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("rename worker", async (scope) => {
    const originalWorkerName = `${BRANCH_PREFIX}-test-worker-rename-1`;
    const newWorkerName = `${BRANCH_PREFIX}-test-worker-rename-2`;
    try {
      await Worker("rename-worker", {
        name: originalWorkerName,
        script: `
				export default {
					async fetch(request, env, ctx) {
						return new Response('Hello ESM world!', { status: 200 });
					}
				};
			`,
      });

      await scope.finalize();

      // Verify the worker exists via API
      const originalWorkerExists = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${originalWorkerName}`,
      );
      expect(originalWorkerExists.status).toEqual(200);

      await Worker("rename-worker", {
        name: newWorkerName,
        script: `
				export default {
					async fetch(request, env, ctx) {
						return new Response('Hello ESM world!', { status: 200 });
					}
				};
			`,
      });

      await scope.finalize();

      // Verify the worker exists via API
      const newWorkerExists = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${newWorkerName}`,
      );
      expect(newWorkerExists.status).toEqual(200);

      // Verify the worker exists via API
      const oldWorker = await api.get(
        `/accounts/${api.accountId}/workers/scripts/${originalWorkerName}`,
      );
      expect(oldWorker.status).toEqual(404);
    } finally {
      await destroy(scope);
    }
  });

  /**
   * Helper function to assert that a WFP worker exists
   */
  async function assertWorkerExistsInNamespace(
    api: any,
    namespaceName: string,
    workerName: string,
  ) {
    const response = await api.get(
      `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespaceName}/scripts/${workerName}`,
    );
    expect(response.status).toEqual(200);

    const worker = (await listWorkersInNamespace(api, namespaceName)).find(
      (worker) => worker.id === workerName,
    );
    expect(worker).toBeDefined();
  }

  /**
   * Helper function to assert that a WFP worker does not exist
   */
  async function assertWorkerNotExistsInNamespace(
    api: any,
    namespaceName: string,
    workerName: string,
  ) {
    // If we've exhausted retries and worker still exists, fail the test
    expect(
      (await listWorkersInNamespace(api, namespaceName)).some(
        (worker) => worker.id === workerName,
      ),
    ).toBeFalsy();
  }

  test.skipIf(!ENABLE_WFP_TESTS)("rename wfp worker", async (scope) => {
    const originalWorkerName = `${BRANCH_PREFIX}-test-wfp-worker-rename-1`;
    const newWorkerName = `${BRANCH_PREFIX}-test-wfp-worker-rename-2`;
    const namespaceName = `${BRANCH_PREFIX}-rename-wfp-worker`;

    try {
      const dispatchNamespace = await DispatchNamespace(
        "test-dispatch-namespace",
        {
          namespace: namespaceName,
          adopt: true,
        },
      );

      await Worker("rename-worker", {
        name: originalWorkerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello ESM world!', { status: 200 });
            }
          };
        `,
        namespace: dispatchNamespace,
      });

      // Verify the worker exists via API
      await assertWorkerExistsInNamespace(
        api,
        namespaceName,
        originalWorkerName,
      );

      await Worker("rename-worker", {
        name: newWorkerName,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello ESM world!', { status: 200 });
            }
          };
        `,
        namespace: dispatchNamespace,
      });

      await scope.finalize();

      // Verify the new worker exists via API
      await assertWorkerExistsInNamespace(api, namespaceName, newWorkerName);

      // Verify the old worker does not exist via API
      await assertWorkerNotExistsInNamespace(
        api,
        namespaceName,
        originalWorkerName,
      );
    } finally {
      await destroy(scope);
    }
  });

  test("create worker with smart placement", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-placement`;

    let worker: Worker | undefined;
    try {
      // Create a worker with smart placement
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello smart placement!', { status: 200 });
            }
          };
        `,
        placement: {
          mode: "smart",
        },
      });

      // Verify the worker was created successfully
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.placement).toEqual({
        mode: "smart",
      });

      // Update the worker to disable smart placement by omitting placement
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello placement disabled!', { status: 200 });
            }
          };
        `,
        // No placement property means smart placement is disabled
      });

      // Verify the placement was disabled (undefined)
      expect(worker.placement).toBeUndefined();
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("create worker with cpu_ms limit", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-cpu-ms`;

    let worker: Worker | undefined;
    try {
      // Create a worker with cpu_ms limit
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello smart placement!', { status: 200 });
            }
          };
        `,
        limits: {
          cpu_ms: 300_000,
        },
      });

      // Verify the worker was created successfully
      expect(worker.limits).toEqual({
        cpu_ms: 300_000,
      });

      // Update the worker to remove cpu_ms limit
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello placement disabled!', { status: 200 });
            }
          };
        `,
        // No placement property means smart placement is disabled
      });

      // Verify the limits were disabled (undefined)
      expect(worker.limits).toBeUndefined();
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("create worker with observability", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-observability`;

    let worker: Worker | undefined;
    try {
      const baseObservability = {
        enabled: true,
        headSamplingRate: 0.5,
      } satisfies WorkerObservability;

      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              console.log('Hellog from observability (see what I did there?)');
              return new Response('Hello observability!', { status: 200 });
            }
          };
        `,
        observability: baseObservability,
      });

      let metadata: any = await getScriptMetadata(api, workerName);

      expect(metadata.default_environment.script.observability).toEqual({
        enabled: true,
        head_sampling_rate: 0.5,
      });

      expect(worker.observability).toEqual(baseObservability);
      expect(worker.observability?.logs).toBeUndefined();

      const newObservability = {
        enabled: true,
        headSamplingRate: 0.5,
        logs: {
          enabled: true,
          invocationLogs: false,
          persist: true,
          destinations: [],
        },
        // TODO(sam): i don't have permission to set this in my account
        // traces: {
        //   enabled: true,
        //   headSamplingRate: 0.1,
        //   persist: true,
        //   destinations: [],
        // },
      } satisfies WorkerObservability;

      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              return new Response('Hello observability!', { status: 200 });
            }
          };
        `,
        observability: newObservability,
      });

      metadata = await getScriptMetadata(api, workerName);

      expect(metadata.default_environment.script.observability).toEqual({
        enabled: true,
        head_sampling_rate: 0.5,
        logs: {
          head_sampling_rate: null,
          enabled: true,
          invocation_logs: false,
          persist: true,
          destinations: [],
        },
      });

      expect(worker.observability).toEqual(newObservability);
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(api, workerName);
    }
  });

  test("delete queues bound to worker versions", async (scope) => {
    const queueName = `${BRANCH_PREFIX}-del-v-q`;
    const workerName = `${BRANCH_PREFIX}-del-v`;

    try {
      const queue = await Queue(queueName, {
        name: queueName,
        adopt: true,
      });

      const script = `
					export default {
						async fetch() {
							return new Response("");
						},

						async queue(
							batch,
						) {
							for (const message of batch.messages) {
								console.log("Received", message);
							}
						},
					};
				`;

      await Worker(workerName, {
        adopt: true,
        script,
        bindings: {
          QUEUE: queue,
        },
        version: "test",
      });

      await Worker(workerName, {
        adopt: true,
        script,
        bindings: {
          QUEUE: queue,
        },
      });
    } finally {
      await destroy(scope);
    }
  });
});
