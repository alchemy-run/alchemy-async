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
import { spawn } from "node:child_process";
import type { DO } from "./src/worker1.ts";

const app = await alchemy("cloudflare-worker-simple");

// to test with remote bindings, set to true
const remote = false;

const [d1, kv, r2] = await Promise.all([
  D1Database("d1", {
    name: `${app.name}-${app.stage}-d1`,
    adopt: true,
    migrationsDir: "migrations",
    dev: { remote },
  }),
  KVNamespace("kv", {
    title: `${app.name}-${app.stage}-kv`,
    adopt: true,
    values: [
      {
        key: "my-object-value",
        value: { type: "object", properties: { id: { type: "string" } } },
      },
      { key: "my-string-value", value: "hello-world" },
    ],
    dev: { remote },
  }),
  R2Bucket("r2", {
    name: `${app.name}-${app.stage}-r2`,
    adopt: true,
    dev: { remote },
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

if (process.env.ALCHEMY_E2E) {
  const child = spawn("node", ["e2e.test.ts"], {
    env: {
      PATH: process.env.PATH,
      WORKER_URL: worker1.url,
    },
  });
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  await new Promise((resolve, reject) => {
    child.on("exit", resolve);
    child.on("error", reject);
  });
  if (child.exitCode !== 0) {
    throw new Error(`Test exited with code ${child.exitCode}`);
  }
}

await app.finalize();

// ensure the worker names are computed correctly
assert.strictEqual(worker1.name, `${app.name}-worker1-${app.stage}`);
assert.strictEqual(worker2.name, `${app.name}-worker2-${app.stage}`);
