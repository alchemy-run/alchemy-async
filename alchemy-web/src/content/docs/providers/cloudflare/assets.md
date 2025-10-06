---
title: Assets
description: Learn how to deploy and manage static assets on Cloudflare using Alchemy for optimal performance and delivery.
---

The Assets resource lets you add [static assets](https://developers.cloudflare.com/workers/static-assets/) to your Cloudflare Workers.

## Minimal Example

Create a basic assets bundle from a local directory:

```ts
import { Assets } from "alchemy/cloudflare";

const staticAssets = await Assets({
  path: "./src/assets",
});
```

## Bind to a Worker

Bind the assets to a worker to serve them:

```ts
import { Worker, Assets } from "alchemy/cloudflare";

const staticAssets = await Assets({
  path: "./src/assets",
});

const worker = await Worker("frontend", {
  name: "frontend-worker",
  entrypoint: "./src/worker.ts",
  bindings: {
    ASSETS: staticAssets,
  },
});
```
