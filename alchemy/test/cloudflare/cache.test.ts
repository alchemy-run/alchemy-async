import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

/**
 * Every invocation returns a fresh UUID, so two fetches returning the same
 * `invocation` proves the second response was served from Workers Cache
 * without invoking the Worker.
 */
const cacheWorkerScript = `
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/purge") {
      await ctx.cache.purge({ tags: ["alchemy-test"] });
      return Response.json({ purged: true });
    }
    return Response.json(
      { invocation: crypto.randomUUID() },
      {
        headers: {
          "Cache-Control": "public, max-age=300",
          "Cache-Tag": "alchemy-test",
        },
      },
    );
  },
};
`;

async function getInvocation(url: string): Promise<string> {
  const response = await fetchAndExpectOK(url);
  const body: any = await response.json();
  expect(typeof body.invocation).toBe("string");
  return body.invocation;
}

/**
 * Polls until `fn` returns a value satisfying `predicate`, to absorb edge
 * cache propagation delays.
 */
async function poll<T>(
  fn: () => Promise<T>,
  predicate: (value: T) => boolean,
  attempts = 10,
  delayMs = 1000,
): Promise<T> {
  let value = await fn();
  for (let i = 0; i < attempts && !predicate(value); i++) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    value = await fn();
  }
  return value;
}

describe("Cache", () => {
  test("workers cache serves repeat requests without invoking the worker", async (scope) => {
    const workerName = `${BRANCH_PREFIX}-workers-cache`;
    try {
      const worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: cacheWorkerScript,
        cache: {
          enabled: true,
          crossVersionCache: true,
        },
      });

      expect(worker.url).toBeTruthy();
      expect(worker.cache).toEqual({
        enabled: true,
        crossVersionCache: true,
      });

      const url = new URL(`/cached/${crypto.randomUUID()}`, worker.url).href;

      // the first request populates the cache; repeats are served from the
      // edge without invoking the Worker, so the invocation id is stable
      const first = await getInvocation(url);
      const second = await poll(
        () => getInvocation(url),
        (invocation) => invocation === first,
      );
      expect(second).toEqual(first);

      // purging by Cache-Tag invalidates the entry, so a fresh invocation runs
      const purgeResponse = await fetchAndExpectOK(
        new URL("/purge", worker.url).href,
      );
      expect(await purgeResponse.json()).toEqual({ purged: true });
      const afterPurge = await poll(
        () => getInvocation(url),
        (invocation) => invocation !== first,
      );
      expect(afterPurge).not.toEqual(first);
    } finally {
      await destroy(scope);
    }
  });

  test(
    "cache prop deploys and no-ops in local dev",
    { local: true },
    async (scope) => {
      const workerName = `${BRANCH_PREFIX}-workers-cache-local`;
      try {
        const worker = await Worker(workerName, {
          name: workerName,
          script: `
          export default {
            async fetch() {
              return Response.json(
                { invocation: crypto.randomUUID() },
                { headers: { "Cache-Control": "public, max-age=300" } },
              );
            },
          };
        `,
          cache: true,
        });

        expect(worker.url).toMatch(/^http:\/\/localhost:\d+/);
        expect(worker.cache).toEqual(true);

        // Workers Cache is not emulated locally; the Worker just runs
        const url = new URL("/cached", worker.url).href;
        const first = await getInvocation(url);
        const second = await getInvocation(url);
        expect(second).not.toEqual(first);
      } finally {
        await destroy(scope);
      }
    },
  );
});
