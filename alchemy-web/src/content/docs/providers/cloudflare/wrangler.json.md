---
title: WranglerJson
description: Learn how to generate and manage wrangler.json configuration files for your Cloudflare Workers using Alchemy.
---

The WranglerJson resource generates a `wrangler.json` configuration file for a Cloudflare Worker. This file is used by the [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) to deploy and manage Workers.

## Minimal Example

Creates a basic wrangler.json file for a Worker:

```ts
import { Worker, WranglerJson } from "alchemy/cloudflare";

const worker = await Worker("api", {
  name: "api-worker",
  entrypoint: "./src/index.ts",
});

await WranglerJson({
  worker,
});
```

## With Custom Path

Specify a custom path for the wrangler.json file:

```ts
await WranglerJson({
  worker,
  path: "./config/wrangler.dev.json",
});
```

## With Bindings

Generate wrangler.json with Worker bindings:

```ts
const kv = await KVNamespace("cache", {
  title: "cache-store",
});

const queue = await Queue("tasks", {
  name: "task-queue",
});

const worker = await Worker("api", {
  name: "api-worker",
  entrypoint: "./src/index.ts",
  bindings: {
    CACHE: kv,
    TASKS: queue,
  },
});

await WranglerJson({
  worker,
});
```

## With Cron Triggers

If the Worker has scheduled crons, they are written to `wrangler.json` under the
`triggers` field:

```ts
const worker = await Worker("cron", {
  name: "cron-worker",
  entrypoint: "./src/cron.ts",
  crons: ["*/3 * * * *", "0 15 1 * *", "59 23 LW * *"],
});

await WranglerJson({ worker });
```

## With Workflow Step Limits

If the Worker binds to a Workflow with `limits.steps`, that value is written to
the `workflows[].limits.steps` field in `wrangler.json`.

```ts
import { Worker, Workflow, WranglerJson } from "alchemy/cloudflare";

const workflow = Workflow("order-processing", {
  workflowName: "order-processing",
  className: "OrderProcessingWorkflow",
  limits: {
    steps: 25_000,
  },
});

const worker = await Worker("orders", {
  name: "orders-worker",
  entrypoint: "./src/worker.ts",
  bindings: {
    ORDER_WORKFLOW: workflow,
  },
});

await WranglerJson({ worker });
```

## With Transform Hook

The transform hook allows you to customize the wrangler.json configuration. For example, adding a custom environment variable:

```ts
await WranglerJson({
  transform: {
    wrangler: (spec) => ({
      ...spec,
      vars: {
        ...spec.vars,
        CUSTOM_VAR: "value",
      },
    }),
  },
});
```
