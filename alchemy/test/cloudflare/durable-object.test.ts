import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { DurableObjectNamespace } from "../../src/cloudflare/durable-object-namespace.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

// Create a Cloudflare API client for verification
const api = await createCloudflareApi();

// Sample ESM worker script with a Durable Object
const durableObjectWorkerScript = `
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
    // Use the DO binding if needed
    if (request.url.includes('/counter')) {
      const id = env.COUNTER.idFromName('default');
      const stub = env.COUNTER.get(id);
      return stub.fetch(request);
    }

    return new Response('Hello with Durable Object!', { status: 200 });
  }
};
`;

// Helper function to check if a worker exists
async function assertWorkerDoesNotExist(workerName: string) {
  try {
    const response = await api.get(
      `/accounts/${api.accountId}/workers/scripts/${workerName}`,
    );
    expect(response.status).toEqual(404);
  } catch {
    // 404 is expected, so we can ignore it
    return;
  }
}

describe("Durable Object Namespace", () => {
  test("create and delete worker with Durable Object binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-do-binding-do-1`;

    let worker: Worker | undefined;
    try {
      // First create the worker without the DO binding
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: durableObjectWorkerScript,
        format: "esm",
        // No bindings yet
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toEqual({});

      // Create a Durable Object namespace
      const counterNamespace = DurableObjectNamespace(
        "test-counter-namespace",
        {
          className: "Counter",
          scriptName: workerName,
        },
      );

      // Update the worker with the DO binding
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: durableObjectWorkerScript,
        format: "esm",
        bindings: {
          COUNTER: counterNamespace,
        },
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(workerName);
    }
  });

  test("add environment variables to worker with durable object", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-do-with-env-doenv-1`;

    let worker: Worker | undefined;
    try {
      // First create a worker with a Durable Object but no env vars
      worker = await Worker(workerName, {
        name: workerName,
        script: durableObjectWorkerScript,
        format: "esm",
      });

      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);

      // Create a Durable Object namespace
      const counterNamespace = DurableObjectNamespace(
        "test-counter-env-namespace",
        {
          className: "Counter",
          scriptName: workerName,
        },
      );

      // Update the worker with the DO binding
      worker = await Worker(workerName, {
        name: workerName,
        script: durableObjectWorkerScript,
        format: "esm",
        bindings: {
          COUNTER: counterNamespace,
        },
      });

      // Apply the worker with binding
      expect(worker.bindings).toBeDefined();
      expect(worker.env).toBeUndefined();

      // Now update the worker by adding environment variables
      worker = await Worker(workerName, {
        name: workerName,
        script: durableObjectWorkerScript,
        format: "esm",
        bindings: {
          COUNTER: counterNamespace,
        },
        env: {
          API_SECRET: "test-secret-123",
          DEBUG_MODE: "true",
        },
      });

      expect(worker.bindings).toBeDefined();
      expect(worker.env).toBeDefined();
      expect(worker.env?.API_SECRET).toEqual("test-secret-123");
      expect(worker.env?.DEBUG_MODE).toEqual("true");
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(workerName);
    }
  });

  test("create and test worker with cross-script durable object binding", async (scope) => {
    // Create names for both workers
    const doWorkerName = `${BRANCH_PREFIX}-do-provider-worker`;
    const clientWorkerName = `${BRANCH_PREFIX}-do-client-worker`;

    // Script for the worker that defines the durable object
    const doProviderWorkerScript = `
      export class SharedCounter {
        constructor(state, env) {
          this.state = state;
          this.env = env;
          this.counter = 0;
        }

        async fetch(request) {
          const url = new URL(request.url);
          
          if (url.pathname === '/increment') {
            this.counter++;
            return new Response(JSON.stringify({
              action: 'increment',
              counter: this.counter,
              worker: '${doWorkerName}'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (url.pathname === '/get') {
            return new Response(JSON.stringify({
              action: 'get',
              counter: this.counter,
              worker: '${doWorkerName}'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          return new Response('SharedCounter DO is running!', { status: 200 });
        }
      }

      export default {
        async fetch(request, env, ctx) {
          return new Response('DO Provider Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    // Script for the worker that uses the cross-script durable object
    const clientWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          const url = new URL(request.url);
          
          if (url.pathname === '/increment') {
            try {
              // Get the durable object instance and increment
              const id = env.SHARED_COUNTER.idFromName('test-counter');
              const stub = env.SHARED_COUNTER.get(id);
              const response = await stub.fetch(new Request('https://example.com/increment'));
              const data = await response.json();
              
              return Response.json({
                success: true,
                clientWorker: '${clientWorkerName}',
                result: data,
                crossScriptWorking: true
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message,
                crossScriptWorking: false
              }, { status: 500 });
            }
          }

          if (url.pathname === '/get') {
            try {
              // Get the current counter value
              const id = env.SHARED_COUNTER.idFromName('test-counter');
              const stub = env.SHARED_COUNTER.get(id);
              const response = await stub.fetch(new Request('https://example.com/get'));
              const data = await response.json();
              
              return Response.json({
                success: true,
                clientWorker: '${clientWorkerName}',
                result: data
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message
              }, { status: 500 });
            }
          }

          return new Response('DO Client Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    let doProviderWorker;
    let clientWorker;

    try {
      // First create the worker that defines the durable object with its own binding
      doProviderWorker = await Worker(doWorkerName, {
        name: doWorkerName,
        script: doProviderWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a durable object namespace for the provider worker
          SHARED_COUNTER: DurableObjectNamespace("provider-counter-namespace", {
            className: "SharedCounter",
            // No scriptName means it binds to its own script
          }), // Bind to its own durable object
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(doProviderWorker.id).toBeTruthy();
      expect(doProviderWorker.name).toEqual(doWorkerName);
      expect(doProviderWorker.url).toBeTruthy();

      // Create the client worker with the cross-script durable object binding
      clientWorker = await Worker(clientWorkerName, {
        name: clientWorkerName,
        script: clientWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a cross-script durable object namespace that references the first worker
          SHARED_COUNTER: DurableObjectNamespace(
            "cross-script-counter-namespace",
            {
              className: "SharedCounter",
              scriptName: doWorkerName, // This makes it cross-script
            },
          ), // Cross-script binding
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(clientWorker.id).toBeTruthy();
      expect(clientWorker.name).toEqual(clientWorkerName);
      expect(clientWorker.url).toBeTruthy();
      expect(clientWorker.bindings?.SHARED_COUNTER).toBeDefined();

      // Verify the binding configuration
      const binding = clientWorker.bindings.SHARED_COUNTER;
      expect(binding.className).toEqual("SharedCounter");
      expect(binding.scriptName).toEqual(doWorkerName);

      // Test that both workers respond to basic requests
      const doProviderResponse = await fetchAndExpectOK(doProviderWorker.url!);
      const doProviderText = await doProviderResponse.text();
      expect(doProviderText).toEqual("DO Provider Worker is running!");

      const clientResponse = await fetchAndExpectOK(clientWorker.url!);
      const clientText = await clientResponse.text();
      expect(clientText).toEqual("DO Client Worker is running!");

      // Test cross-script durable object functionality by calling increment
      const incrementResponse = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const incrementData: any = await incrementResponse.json();

      expect(incrementData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        crossScriptWorking: true,
        result: {
          action: "increment",
          worker: doWorkerName,
        },
      });

      // Test getting the counter value
      const getResponse = await fetchAndExpectOK(`${clientWorker.url}/get`);
      const getData: any = await getResponse.json();

      expect(getData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        result: {
          action: "get",
          worker: doWorkerName,
        },
      });

      // Test state persistence by making multiple increment calls
      const firstIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const firstData: any = await firstIncrement.json();

      const secondIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const secondData: any = await secondIncrement.json();

      const thirdIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const thirdData: any = await thirdIncrement.json();

      // Verify that the counter is incrementing properly across calls
      expect(firstData.result.counter).toBeLessThan(secondData.result.counter);
      expect(secondData.result.counter).toBeLessThan(thirdData.result.counter);
    } finally {
      await destroy(scope);
      // Verify both workers were deleted
      await assertWorkerDoesNotExist(doWorkerName);
      await assertWorkerDoesNotExist(clientWorkerName);
    }
  }, 120000); // Increased timeout for cross-script DO operations

  test("migrate durable object by renaming class", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-do-migration-migrate-1`;

    // Sample ESM worker script with renamed CounterV2 class
    const doMigrationWorkerScriptV2 = `
export class CounterV2 {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.counter = 0;
  }

  async fetch(request) {
    this.counter++;
    return new Response('Counter V2: ' + this.counter, { status: 200 });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.url.includes('/counter')) {
      const id = env.COUNTER.idFromName('default');
      const stub = env.COUNTER.get(id);
      return stub.fetch(request);
    }
    return new Response('Hello with Counter V2!', { status: 200 });
  }
};
`;

    // Sample ESM worker script with original Counter class
    const doMigrationWorkerScriptV1 = `
export class Counter {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.counter = 0;
  }

  async fetch(request) {
    this.counter++;
    return new Response('Counter V1: ' + this.counter, { status: 200 });
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.url.includes('/counter')) {
      const id = env.COUNTER.idFromName('default');
      const stub = env.COUNTER.get(id);
      return stub.fetch(request);
    }
    return new Response('Hello with Counter V1!', { status: 200 });
  }
};
`;

    let worker: Worker | undefined;
    try {
      // First create the worker with the original Counter class
      worker = await Worker(workerName, {
        name: workerName,
        script: doMigrationWorkerScriptV1,
        format: "esm",
        adopt: true,
      });

      // Apply to create the worker first
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);

      // Create a stable DO namespace with the original Counter class
      const counterNamespace = DurableObjectNamespace(
        "test-counter-namespace",
        {
          className: "Counter",
          scriptName: workerName,
        },
      );

      // Update worker with the original Counter binding
      worker = await Worker(workerName, {
        name: workerName,
        script: doMigrationWorkerScriptV1,
        format: "esm",
        bindings: {
          COUNTER: counterNamespace,
        },
      });

      expect(worker.bindings).toBeDefined();

      // Now update the namespace to use CounterV2 class
      const updatedNamespace = DurableObjectNamespace(
        "test-counter-namespace",
        {
          className: "CounterV2",
          scriptName: workerName,
        },
      );

      // Update worker with the migrated binding
      worker = await Worker(workerName, {
        name: workerName,
        script: doMigrationWorkerScriptV2,
        format: "esm",
        bindings: {
          COUNTER: updatedNamespace,
        },
      });

      expect(worker.bindings).toBeDefined();
    } finally {
      await destroy(scope);
      await assertWorkerDoesNotExist(workerName);
    }
  });

  test("create and test worker with cross-script durable object binding using re-exported syntax", async (scope) => {
    // Create names for both workers
    const doWorkerName = `${BRANCH_PREFIX}-do-provider-worker-re-exported`;
    const clientWorkerName = `${BRANCH_PREFIX}-do-client-worker-re-exported`;

    // Script for the worker that defines the durable object
    const doProviderWorkerScript = `
      export class SharedCounter {
        constructor(state, env) {
          this.state = state;
          this.env = env;
          this.counter = 0;
        }

        async fetch(request) {
          const url = new URL(request.url);
          
          if (url.pathname === '/increment') {
            this.counter++;
            return new Response(JSON.stringify({
              action: 'increment',
              counter: this.counter,
              worker: '${doWorkerName}'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          if (url.pathname === '/get') {
            return new Response(JSON.stringify({
              action: 'get',
              counter: this.counter,
              worker: '${doWorkerName}'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          }

          return new Response('SharedCounter DO is running!', { status: 200 });
        }
      }

      export default {
        async fetch(request, env, ctx) {
          return new Response('DO Provider Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    // Script for the worker that uses the cross-script durable object
    const clientWorkerScript = `
      export default {
        async fetch(request, env, ctx) {
          const url = new URL(request.url);
          
          if (url.pathname === '/increment') {
            try {
              // Get the durable object instance and increment
              const id = env.SHARED_COUNTER.idFromName('test-counter');
              const stub = env.SHARED_COUNTER.get(id);
              const response = await stub.fetch(new Request('https://example.com/increment'));
              const data = await response.json();
              
              return Response.json({
                success: true,
                clientWorker: '${clientWorkerName}',
                result: data,
                crossScriptWorking: true
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message,
                crossScriptWorking: false
              }, { status: 500 });
            }
          }

          if (url.pathname === '/get') {
            try {
              // Get the current counter value
              const id = env.SHARED_COUNTER.idFromName('test-counter');
              const stub = env.SHARED_COUNTER.get(id);
              const response = await stub.fetch(new Request('https://example.com/get'));
              const data = await response.json();
              
              return Response.json({
                success: true,
                clientWorker: '${clientWorkerName}',
                result: data
              });
            } catch (error) {
              return Response.json({
                success: false,
                error: error.message
              }, { status: 500 });
            }
          }

          return new Response('DO Client Worker is running!', {
            status: 200,
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      };
    `;

    let doProviderWorker;
    let clientWorker;

    try {
      // First create the worker that defines the durable object with its own binding
      doProviderWorker = await Worker(doWorkerName, {
        name: doWorkerName,
        script: doProviderWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a durable object namespace for the provider worker
          SHARED_COUNTER: DurableObjectNamespace("provider-counter-namespace", {
            className: "SharedCounter",
            // No scriptName means it binds to its own script
          }), // Bind to its own durable object
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(doProviderWorker.id).toBeTruthy();
      expect(doProviderWorker.name).toEqual(doWorkerName);
      expect(doProviderWorker.url).toBeTruthy();

      expect(doProviderWorker.bindings.SHARED_COUNTER.scriptName).toEqual(
        doWorkerName,
      );

      // Create the client worker with the cross-script durable object binding
      clientWorker = await Worker(clientWorkerName, {
        name: clientWorkerName,
        script: clientWorkerScript,
        format: "esm",
        url: true, // Enable workers.dev URL
        bindings: {
          // Create a cross-script durable object namespace that references the first worker
          SHARED_COUNTER: doProviderWorker.bindings.SHARED_COUNTER,
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      expect(clientWorker.id).toBeTruthy();
      expect(clientWorker.name).toEqual(clientWorkerName);
      expect(clientWorker.url).toBeTruthy();
      expect(clientWorker.bindings?.SHARED_COUNTER).toBeDefined();

      // Verify the binding configuration
      const binding = clientWorker.bindings.SHARED_COUNTER;
      expect(binding.className).toEqual("SharedCounter");
      expect(binding.scriptName).toEqual(doWorkerName);

      // Test that both workers respond to basic requests
      const url = doProviderWorker.url!;
      const doProviderResponse = await fetchAndExpectOK(url);
      const doProviderText = await doProviderResponse.text();
      expect(doProviderText).toEqual("DO Provider Worker is running!");

      const clientResponse = await fetchAndExpectOK(clientWorker.url!);
      const clientText = await clientResponse.text();
      expect(clientText).toEqual("DO Client Worker is running!");

      // Test cross-script durable object functionality by calling increment
      const incrementResponse = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const incrementData: any = await incrementResponse.json();

      expect(incrementData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        crossScriptWorking: true,
        result: {
          action: "increment",
          worker: doWorkerName,
        },
      });

      // Test getting the counter value
      const getResponse = await fetchAndExpectOK(`${clientWorker.url}/get`);
      const getData: any = await getResponse.json();

      expect(getData).toMatchObject({
        success: true,
        clientWorker: clientWorkerName,
        result: {
          action: "get",
          worker: doWorkerName,
        },
      });

      // Test state persistence by making multiple increment calls
      const firstIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const firstData: any = await firstIncrement.json();

      const secondIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const secondData: any = await secondIncrement.json();

      const thirdIncrement = await fetchAndExpectOK(
        `${clientWorker.url}/increment`,
      );
      const thirdData: any = await thirdIncrement.json();

      // Verify that the counter is incrementing properly across calls
      expect(firstData.result.counter).toBeLessThan(secondData.result.counter);
      expect(secondData.result.counter).toBeLessThan(thirdData.result.counter);
    } finally {
      await destroy(scope);
      // Verify both workers were deleted
      await assertWorkerDoesNotExist(doWorkerName);
      await assertWorkerDoesNotExist(clientWorkerName);
    }
  }, 120000); // Increased timeout for cross-script DO operations

  test("adopting a Worker should use server-side state to migrate classes", async (scope) => {
    try {
      const workerName = `${BRANCH_PREFIX}-test-worker-adoption-migrate`;
      await Worker("worker-1", {
        name: workerName,
        script: `
          export class Counter {}
          export default { fetch() {} }
        `,
        bindings: {
          DO: DurableObjectNamespace("DO", {
            className: "Counter",
          }),
        },
      });

      await Worker("worker-2", {
        name: workerName,
        // adopt the worker since it already exists
        adopt: true,
        script: `
          export class Counter2 {}
          export default { fetch() {} }
        `,
        bindings: {
          // mapped by stable ID "DO"
          DO_1: DurableObjectNamespace("DO", {
            // should migrate to Counter 2
            className: "Counter2",
          }),
        },
      });
    } finally {
      await destroy(scope);
    }
  });
});
