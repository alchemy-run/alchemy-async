/// <reference types="@types/node" />

import alchemy from "alchemy";
import {
  Assets,
  D1Database,
  DurableObjectNamespace,
  KVNamespace,
  R2Bucket,
  Worker,
} from "alchemy/cloudflare";
import assert from "node:assert";
import type { DO } from "./src/worker1.ts";

const app = await alchemy("cloudflare-worker-simple");

const [d1, kv, r2] = await Promise.all([
  D1Database("d1", {
    name: `${app.name}-${app.stage}-d1`,
    adopt: true,
    migrationsDir: "migrations",
  }),
  KVNamespace("kv", {
    title: `${app.name}-${app.stage}-kv`,
    adopt: true,
    values: [
      { key: "test1", value: "test1" },
      { key: "test2", value: "test2" },
    ],
  }),
  R2Bucket("r2", {
    name: `${app.name}-${app.stage}-r2`,
    adopt: true,
  }),
]);
const doNamespace = DurableObjectNamespace<DO>("DO", {
  className: "DO",
  sqlite: true,
});
export const worker1 = await Worker("worker1", {
  entrypoint: "src/worker1.ts",
  adopt: true,
  bindings: {
    KV: kv,
    D1: d1,
    R2: r2,
    DO: doNamespace,
    ASSETS: await Assets({
      path: "./assets",
    }),
  },
  compatibilityFlags: ["nodejs_compat"],
});

export const worker2 = await Worker("worker2", {
  entrypoint: "src/worker2.ts",
  adopt: true,
  bindings: {
    WORKER: worker1,
    DO: worker1.bindings.DO,
  },
  compatibilityFlags: ["nodejs_compat"],
});

console.log(`worker1.url: ${worker1.url}`);
console.log(`worker2.url: ${worker2.url}`);

console.log("worker1.name", worker1.name);
console.log("worker2.name", worker2.name);

await app.finalize();

// ensure the worker names are computed correctly
assert.strictEqual(worker1.name, `${app.name}-worker1-${app.stage}`);
assert.strictEqual(worker2.name, `${app.name}-worker2-${app.stage}`);
