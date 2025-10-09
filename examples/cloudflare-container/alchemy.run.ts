/// <reference types="@types/node" />

import alchemy from "alchemy";
import { Container, Worker } from "alchemy/cloudflare";
import { SQLiteStateStore } from "alchemy/state";
import { test } from "./e2e.ts";
import type { MyContainer } from "./src/worker.ts";

const app = await alchemy("cloudflare-container", {
  stateStore: (scope) => new SQLiteStateStore(scope),
});

const container = await Container<MyContainer>("container", {
  className: "MyContainer",
  adopt: true,
  build: {
    context: import.meta.dirname,
    dockerfile: "Dockerfile",
    args: {
      IMAGE_VERSION: "1.24-alpine",
    },
  },
});

export const worker = await Worker("test-worker", {
  entrypoint: "src/worker.ts",
  adopt: true,
  bindings: {
    MY_CONTAINER: container,
  },
});

console.log(worker.url);

if (process.env.ALCHEMY_E2E) {
  await test({ url: worker.url });
}

await app.finalize();
