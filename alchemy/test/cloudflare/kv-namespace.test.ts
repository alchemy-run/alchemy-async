import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { KVNamespace } from "../../src/cloudflare/kv-namespace.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { BRANCH_PREFIX } from "../util.ts";

import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("KV Namespace Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-kv`;

  test("create, update, and delete KV namespace", async (scope) => {
    let kvNamespace: KVNamespace | undefined;
    try {
      kvNamespace = await KVNamespace(testId, {
        adopt: true,
        title: `${BRANCH_PREFIX}-Test Namespace ${testId}`,
        values: [
          {
            key: "test-key-1",
            value: "test-value-1",
          },
          {
            key: "test-key-2",
            value: { hello: "world" },
          },
        ],
      });

      expect(kvNamespace.namespaceId).toBeTruthy();
      expect(kvNamespace.title).toEqual(
        `${BRANCH_PREFIX}-Test Namespace ${testId}`,
      );

      // Verify KV values were set by reading them back
      await verifyKVValue(
        kvNamespace.namespaceId,
        "test-key-1",
        "test-value-1",
      );
      const key2Value = await getKVValue(kvNamespace.namespaceId, "test-key-2");
      expect(JSON.parse(key2Value)).toEqual({ hello: "world" });

      // Update the KV namespace with new values
      kvNamespace = await KVNamespace(testId, {
        title: `${BRANCH_PREFIX}-Test Namespace ${testId}`,
        adopt: true,
        values: [
          {
            key: "test-key-1",
            value: "updated-value-1",
          },
          {
            key: "test-key-3",
            value: "new-value-3",
          },
        ],
      });

      expect(kvNamespace.namespaceId).toEqual(kvNamespace.namespaceId);

      // for some reason 1s was not enough ... eventual consistency?
      // TODO(sam): can we read strongly consistent?
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Verify updated values
      await verifyKVValue(
        kvNamespace.namespaceId,
        "test-key-1",
        "updated-value-1",
      );
      await verifyKVValue(kvNamespace.namespaceId, "test-key-3", "new-value-3");
    } finally {
      await alchemy.destroy(scope);
      if (kvNamespace) {
        // Verify namespace was deleted
        await assertKvNamespaceNotExists(kvNamespace.namespaceId);
      }
    }
  });

  test("adopt existing namespace", async (scope) => {
    let kvNamespace: KVNamespace | undefined;
    try {
      kvNamespace = await KVNamespace("kv", {
        title: `${testId}-adopt`,
        adopt: true,
      });

      await alchemy.run("nested", async () => {
        const adoptedNamespace = await KVNamespace("kv", {
          title: `${testId}-adopt`,
          adopt: true,
        });

        expect(adoptedNamespace.namespaceId).toEqual(kvNamespace!.namespaceId);
      });
    } finally {
      await alchemy.destroy(scope);
      await assertKvNamespaceNotExists(kvNamespace!.namespaceId);
    }
  });

  test("adopt existing namespace with delete false", async (scope) => {
    let kvNamespace: KVNamespace | undefined;
    try {
      kvNamespace = await KVNamespace("kv", {
        title: `${testId}-adopt-no-delete`,
        adopt: true,
      });

      await alchemy.run("nested", async (scope) => {
        const adoptedNamespace = await KVNamespace("kv", {
          title: `${testId}-adopt-no-delete`,
          adopt: true,
          delete: false,
        });

        expect(adoptedNamespace.namespaceId).toEqual(kvNamespace!.namespaceId);
        await alchemy.destroy(scope);
        await assertKvNamespaceExists(adoptedNamespace.namespaceId);
      });
    } finally {
      await alchemy.destroy(scope);
      await assertKvNamespaceNotExists(kvNamespace!.namespaceId);
    }
  });

  test("create and delete worker with KV Namespace binding", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-test-worker-kv-binding-kv-1`;

    let worker: Worker | undefined;
    let testKv: KVNamespace | undefined;
    try {
      // Create a KV namespace with initial values
      testKv = await KVNamespace("test-kv-namespace", {
        title: `${BRANCH_PREFIX} Test KV Namespace 2`,
        adopt: true,
        values: [
          {
            key: "testKey",
            value: "initial-value",
          },
        ],
      });
      // Create a worker with the KV Namespace binding
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              // Use the KV binding
              if (request.url.includes('/kv')) {
                const value = await env.TEST_KV.get('testKey');
                return new Response('KV Value: ' + (value || 'not found'), { status: 200 });
              }

              return new Response('Hello with KV Namespace!', { status: 200 });
            }
          };
        `,
        format: "esm",
        bindings: {
          TEST_KV: testKv,
        },
      });
      expect(worker.id).toBeTruthy();
      expect(worker.name).toEqual(workerName);
      expect(worker.bindings).toBeDefined();
    } finally {
      await destroy(scope);
    }
  });

  async function getKVValue(namespaceId: string, key: string): Promise<string> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/storage/kv/namespaces/${namespaceId}/values/${key}`,
    );

    expect(response.ok).toBe(true);
    return await response.text();
  }

  async function assertKvNamespaceExists(namespaceId: string): Promise<void> {
    const api = await createCloudflareApi();
    const response = await api.get(
      `/accounts/${api.accountId}/storage/kv/namespaces/${namespaceId}`,
    );

    expect(response.ok).toBe(true);
    const data: any = await response.json();
    expect(data.result.id).toEqual(namespaceId);
  }

  async function assertKvNamespaceNotExists(
    namespaceId: string,
  ): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const api = await createCloudflareApi();
    const perPage = 100;
    let page = 1;

    while (true) {
      const response = await api.get(
        `/accounts/${api.accountId}/storage/kv/namespaces?page=${page}&per_page=${perPage}`,
      );
      expect(response.ok).toBe(true);

      const data = (await response.json()) as {
        result: { id: string; title: string }[];
        result_info: {
          count: number;
          page: number;
          per_page: number;
          total_count: number;
        };
      };

      const match = data.result.find((ns) => ns.id === namespaceId);
      expect(match).toBeUndefined();

      if (
        data.result_info.page * data.result_info.per_page >=
        data.result_info.total_count
      ) {
        break;
      }
      page++;
    }
  }

  async function verifyKVValue(
    namespaceId: string,
    key: string,
    expectedValue: string,
  ): Promise<void> {
    const maxAttempts = 20; // Total attempts: 1 initial + 5 retries
    const maxWaitTime = 120000; // 2 minutes
    let attempt = 0;
    let lastError;

    while (attempt < maxAttempts) {
      try {
        const value = await getKVValue(namespaceId, key);
        expect(value).toEqual(expectedValue);
        return; // Success, exit the function
      } catch (error) {
        lastError = error;
        attempt++;

        if (attempt >= maxAttempts) break;

        // Calculate exponential backoff time (2^attempt * 1000ms), but cap at maxWaitTime
        const backoffTime = Math.min(
          2 ** attempt * 1000,
          maxWaitTime / maxAttempts,
        );
        console.log(
          `KV value verification failed, retrying in ${backoffTime}ms (attempt ${attempt}/${maxAttempts - 1})...`,
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }
    }

    // If we've exhausted all attempts, throw the last error
    throw lastError;
  }
});
