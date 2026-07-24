import { describe, expect, it } from "vitest";
import * as miniflare from "miniflare";
import http from "node:http";
import { createMiniflareWorkerProxy } from "../../src/cloudflare/miniflare/miniflare-worker-proxy.ts";

/**
 * Regression for https://github.com/alchemy-run/alchemy/issues/938
 *
 * Client disconnect mid-response aborts Miniflare dispatch; the response body
 * Readable then emits 'error'. Without a listener, Node treats that as an
 * unhandled 'error' and kills the process (taking Vite + the whole `alchemy
 * dev` session with it).
 *
 * Note: Bun swallows these stream errors, so this must run under Node (Vitest).
 */
describe("MiniflareWorkerProxy", () => {
  it("survives client disconnects mid-response without unhandled stream errors", async () => {
    const workerName = "abort-body-worker";
    const mf = new miniflare.Miniflare({
      workers: [
        {
          name: workerName,
          modules: true,
          script: `
            export default {
              async fetch() {
                const encoder = new TextEncoder();
                const stream = new ReadableStream({
                  async start(controller) {
                    for (let i = 0; i < 200; i++) {
                      controller.enqueue(encoder.encode("x".repeat(1024)));
                      await new Promise((r) => setTimeout(r, 20));
                    }
                    controller.close();
                  },
                });
                return new Response(stream, {
                  headers: { "Content-Type": "text/plain" },
                });
              },
            };
          `,
          compatibilityDate: "2024-11-18",
        },
      ],
    });

    await mf.ready;

    const proxy = await createMiniflareWorkerProxy({
      port: 0,
      getWorkerName: () => workerName,
      getMiniflare: async () => mf,
      mode: "local",
    });

    const uncaught: Error[] = [];
    const onUncaught = (error: Error) => {
      uncaught.push(error);
    };
    // Collect instead of letting Node terminate the worker thread.
    process.on("uncaughtException", onUncaught);

    try {
      const abortMidFlight = () =>
        new Promise<void>((resolve) => {
          const req = http.request(proxy.url, { method: "GET" }, (res) => {
            res.on("data", () => {
              // Destroy as soon as body bytes arrive so the proxy is mid-pipe.
              req.destroy();
            });
            res.on("error", () => resolve());
            res.on("close", () => resolve());
          });
          req.on("error", () => resolve());
          req.setTimeout(50, () => req.destroy());
          req.end();
        });

      // Concurrent aborts; slow stream + destroy-on-first-byte makes this
      // reliable even on fast machines (unlike aborting before headers).
      for (let round = 0; round < 20; round++) {
        await Promise.all(Array.from({ length: 8 }, () => abortMidFlight()));
      }

      expect(uncaught).toEqual([]);
    } finally {
      process.off("uncaughtException", onUncaught);
      await proxy.close();
      await mf.dispose();
    }
  });
});
