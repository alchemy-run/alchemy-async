import alchemy, { type } from "alchemy";
import {
  DurableObjectNamespace,
  Queue,
  R2Bucket,
  Worker,
  Workflow,
} from "alchemy/cloudflare";
import fs from "node:fs/promises";
import type { HelloWorldDO } from "./src/do.ts";
import type MyRPC from "./src/rpc.ts";

const app = await alchemy("cloudflare-worker");

export const bucket = await R2Bucket("bucket", {
  empty: true,
});

export const queue = await Queue<{
  name: string;
  email: string;
}>("queue", {
  name: `${app.name}-${app.stage}-queue`,
});

export const rpc = await Worker("rpc", {
  name: `${app.name}-${app.stage}-rpc`,
  entrypoint: "./src/rpc.ts",
  rpc: type<MyRPC>,
});

export const worker = await Worker("worker", {
  name: `${app.name}-${app.stage}-worker`,
  entrypoint: "./src/worker.ts",
  bindings: {
    BUCKET: bucket,
    QUEUE: queue,
    WORKFLOW: Workflow("OFACWorkflow", {
      className: "OFACWorkflow",
      workflowName: "ofac-workflow",
    }),
    DO: DurableObjectNamespace<HelloWorldDO>("HelloWorldDO", {
      className: "HelloWorldDO",
      sqlite: true,
    }),
    RPC: rpc,
  },
  url: true,
  eventSources: [
    {
      queue,
      settings: {
        maxWaitTimeMs: 1000,
        batchSize: 10,
      },
    },
  ],
  bundle: {
    metafile: true,
    format: "esm",
    target: "es2020",
  },
});

await bucket.put("test.txt", "Hello, world!");

const content = await (await bucket.get("test.txt"))?.text();

if (content !== "Hello, world!") {
  throw new Error("Content is not correct");
}

const testFile = await fs.readFile("test-file.txt");

await bucket.put("test-file.txt", testFile);

const testFileContent = await (await bucket.get("test-file.txt"))?.text();

if (testFileContent !== testFile.toString()) {
  throw new Error("Content is not correct");
}

console.log(worker.url);

await app.finalize();
