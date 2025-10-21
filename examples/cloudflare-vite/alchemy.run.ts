import alchemy from "alchemy";
import { KVNamespace, Vite } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-vite");

export const kv = await KVNamespace("kv", {
  title: `${app.name}-${app.stage}-kv`,
  adopt: true,
});

export const website = await Vite("website", {
  entrypoint: "src/index.ts",
  noBundle: false,
  adopt: true,
  bindings: {
    KV: kv,
    ALCHEMY_TEST_VALUE: alchemy.secret("Hello from Alchemy!"),
  },
  dev: {
    command: "vite dev --port 5006",
  },
});

console.log({
  url: website.url,
});

if (process.env.ALCHEMY_E2E) {
  const { test } = await import("./test/e2e.js");
  await test({
    url: website.url,
    env: { ALCHEMY_TEST_VALUE: "Hello from Alchemy!" },
  });
}

await app.finalize();
