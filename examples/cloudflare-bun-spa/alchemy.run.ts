/// <reference types="node" />

import alchemy from "alchemy";
import { BunSPA, KVNamespace } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-bun-spa");

export const kv = await KVNamespace("kv", {
  title: `${app.name}-${app.stage}-kv`,
  adopt: true,
});

export const bunsite = await BunSPA("website", {
  entrypoint: "src/server.ts",
  frontend: "index.html",
  noBundle: false,
  adopt: true,
  bindings: {
    KV: kv,
    ALCHEMY_TEST_VALUE: alchemy.secret("Hello from Alchemy!"),
  },
});

console.log({
  url: bunsite.url,
  apiUrl: bunsite.apiUrl,
});

if (process.env.ALCHEMY_E2E) {
  const { test } = await import("./test/e2e.js");
  await test({
    url: bunsite.url!,
    apiUrl: bunsite.apiUrl,
    env: { ALCHEMY_TEST_VALUE: "Hello from Alchemy!" },
  });
}

await app.finalize();
