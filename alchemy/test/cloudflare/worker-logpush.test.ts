import { beforeAll, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import type { WorkerScriptMetadata } from "../../src/cloudflare/worker-metadata.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { WranglerJson } from "../../src/cloudflare/wrangler.json.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX, waitFor } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Worker LogPush", () => {
  const prefix = `${BRANCH_PREFIX}-lp`;
  let api: Awaited<ReturnType<typeof createCloudflareApi>>;

  beforeAll(async () => {
    api = await createCloudflareApi();
  });

  const name = (s: string) => `${prefix}-${s}`;

  async function makeWorker(suffix: string, opts: { logpush?: boolean } = {}) {
    return Worker(name(suffix), {
      entrypoint: "./alchemy/test/cloudflare/test-handlers/basic-fetch.ts",
      logpush: opts.logpush,
      url: false,
      adopt: true,
    });
  }

  async function serviceLogpush(workerName: string) {
    const res = await api.get(
      `/accounts/${api.accountId}/workers/services/${workerName}`,
    );
    if (!res.ok)
      throw new Error(`Failed to fetch worker metadata: ${res.statusText}`);
    const json = (await res.json()) as { result: WorkerScriptMetadata };
    return json.result.default_environment?.script?.logpush;
  }

  test("enable-logpush-updates-cloudflare-metadata", async (scope) => {
    let worker: Worker | undefined;
    try {
      worker = await makeWorker("metadata", { logpush: true });
      expect(worker.logpush).toBe(true);

      await waitFor(
        async () => (await serviceLogpush(worker!.name)) === true,
        (v) => v === true,
        { timeoutMs: 10000, intervalMs: 500 },
      );

      worker = await makeWorker("metadata", { logpush: false });
      expect(worker.logpush).toBe(false);

      await waitFor(
        async () => (await serviceLogpush(worker!.name)) === false,
        (v) => v === true,
        { timeoutMs: 10000, intervalMs: 500 },
      );
    } finally {
      await destroy(scope);
      if (worker?.name) {
        const res = await api.get(
          `/accounts/${api.accountId}/workers/services/${worker.name}`,
        );
        expect(res.status).toBe(404);
      }
    }
  });

  test("wrangler-json-logpush-field", async (scope) => {
    try {
      const worker = await makeWorker("wrangler-enabled", { logpush: true });
      const wr = await WranglerJson({ worker, path: "./test-output" });
      expect(wr.spec.logpush).toBe(true);
    } finally {
      await destroy(scope);
    }
  });

  test("wrangler-json-default-unset", async (scope) => {
    try {
      const worker = await makeWorker("wrangler-default");
      const wr = await WranglerJson({ worker, path: "./test-output" });
      expect(wr.spec.logpush).toBeUndefined();
    } finally {
      await destroy(scope);
    }
  });

  test("props-defaults", async (scope) => {
    try {
      const on = await makeWorker("enabled", { logpush: true });
      expect(on.logpush).toBe(true);

      const off = await makeWorker("default");
      expect(off.logpush).toBeUndefined();
    } finally {
      await destroy(scope);
    }
  });
});
