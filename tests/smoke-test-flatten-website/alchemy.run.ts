import alchemy from "alchemy";
import {
  DurableObjectNamespace,
  KVNamespace,
  Queue,
  R2Bucket,
  Vite,
  Workflow,
  Zone,
} from "alchemy/cloudflare";
import { CloudflareStateStore } from "alchemy/state";
import assert from "node:assert";
import type { HelloWorldDO } from "./src/do.ts";

const app = await alchemy("smoke-test-flatten-website", {
  stateStore: (scope) => new CloudflareStateStore(scope),
});

const zone = await Zone("zone", {
  name: `${app.name}-${app.stage}.us`,
  delete: true,
});

export const queue = await Queue<string>("queue", {
  name: `${app.name}-${app.stage}-queue`,
  adopt: true,
});

const KV = await KVNamespace("kv", {
  title: `${app.name}-${app.stage}-kv`,
  adopt: true,
});

export const worker = await Vite("worker", {
  name: `${app.name}-${app.stage}-worker`,
  entrypoint: "./src/worker.ts",
  url: true,
  adopt: true,
  domains: [zone.name],
  routes: [`${zone.name}/*`],
  bindings: {
    KV,
    BUCKET: await R2Bucket("bucket", {
      name: `${app.name}-${app.stage}-bucket`,
      adopt: true,
      empty: true,
    }),
    QUEUE: queue,
    WORKFLOW: Workflow("OFACWorkflow", {
      className: "OFACWorkflow",
      workflowName: "ofac-workflow",
    }),
    DO: DurableObjectNamespace<HelloWorldDO>("HelloWorldDO", {
      className: "HelloWorldDO",
    }),
  },
  eventSources: [queue],
  bundle: {
    metafile: true,
    format: "esm",
    target: "es2020",
  },
});

console.log(worker.url);

await app.finalize();

if ("RUN_COUNT" in process.env) {
  const RUN_COUNT = Number(process.env.RUN_COUNT);
  const { count } = await fetchJson<{ count: number }>("GET", "/increment");
  assert(
    count === RUN_COUNT,
    `Count is not equal to RUN_COUNT: ${count} !== ${RUN_COUNT}`,
  );
  if (RUN_COUNT === 0) {
    // on first run, the key should be null
    const { key } = await fetchJson<{ key: string | null }>("GET", "/object");
    assert(key === null, `${key} !== null`);
    await fetchJson<{ key: string | null }>("POST", "/object");

    if (!process.env.NO_QUEUE) {
      await sendMessage("key"); // will be delayed for 30 seconds
    }
  } else {
    // on second run the data should still be there
    const { key } = await fetchJson<{ key: string | null }>("GET", "/object");
    assert(key === "value", `${key} !== "value"`);

    await checkMessage("key"); // should still arrive in the new worker
  }
}

async function fetchJson<T>(method: "GET" | "POST", path: string): Promise<T> {
  const response = await fetch(worker.url + path, {
    method,
  });
  if (response.status === 404) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    // sometimes propagation is not immediate, so we retry
    return fetchJson<T>(method, path);
  }
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}: ${response.statusText}`);
  }
  return (await response.json()) as T;
}

async function sendMessage(key: string) {
  await fetchJson<void>("GET", `/queue?key=${key}`);
}

async function checkMessage(key: string) {
  let attempt = 0;
  while (true) {
    const { value } = await fetchJson<{ value: string }>(
      "GET",
      `/check?key=${key}`,
    );
    if (value === "exists") {
      break;
    }
    console.log(
      `Message ${key} not found, retrying in 1s (attempt ${attempt++})...`,
    );
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}
