import alchemy from "alchemy";
import { Container, KVNamespace, Vite } from "alchemy/cloudflare";
import type { MyContainer } from "./src/index.ts";

const app = await alchemy("cloudflare-vite");

const container = await Container<MyContainer>("container", {
  className: "MyContainer",
  adopt: true,
  // build: {
  //   context: import.meta.dirname,
  //   dockerfile: "Dockerfile",
  //   args: {
  //     IMAGE_VERSION: "1.24-alpine",
  //   },
  // },
});

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
    env: { ALCHEMY_TEST_VALUE: "Hello from Alchemy!" },
  });
}

await app.finalize();
