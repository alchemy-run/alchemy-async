import alchemy from "alchemy";
import { Container, KVNamespace, Vite } from "alchemy/cloudflare";
import type { MyContainer } from "./src/index.ts";

const app = await alchemy("cloudflare-vite");

const container = await Container<MyContainer>("container", {
  className: "MyContainer",
});

export const kv = await KVNamespace("kv", {
  title: `${app.name}-${app.stage}-kv`,
});

export const website = await Vite("website", {
  entrypoint: "src/index.ts",
  noBundle: false,
  bindings: {
    KV: kv,
    ALCHEMY_TEST_VALUE: alchemy.secret("Hello from Alchemy!"),
    MY_CONTAINER: container,
  },
  dev: {
    command: "vite dev --port 5006",
  },
});

console.log({
  url: website.url,
});

if (process.env.ALCHEMY_E2E) {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const { test } = await import("./test/e2e.js");
  await test({
    url: website.url,
  });
}

await app.finalize();
