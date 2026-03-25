/**
 * "Hello, world" worker with `dev.remote: true` to test regression where subdomain was not enabled in `alchemy dev`.
 */

import alchemy from "alchemy";
import { Worker } from "alchemy/cloudflare";

export const app = await alchemy("cloudflare-hello-world");

export const worker = await Worker("worker", {
  entrypoint: "./worker.ts",
  dev: {
    remote: true,
  },
});

console.log({ url: worker.url });

if (process.env.ALCHEMY_E2E) {
  const { test } = await import("./e2e.test.ts");
  await test(worker.url!);
}

await app.finalize();
