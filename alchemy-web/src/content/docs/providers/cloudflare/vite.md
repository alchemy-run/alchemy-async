---
title: Vite
description: Learn how to deploy Vite.js applications to Cloudflare Workers using Alchemy.
---

Deploy a [Vite](https://vitejs.dev/) application to Cloudflare Workers with automatic configuration.

## Minimal Example

Deploy a basic Vite app with default settings.

```ts
import { Vite } from "alchemy/cloudflare";

const app = await Vite("my-vite-app", {
  name: "my-vite-app",
});
```

## With Custom Bindings

Add database and environment bindings to the Vite app.

```ts
import { Vite, D1Database } from "alchemy/cloudflare";

const db = await D1Database("my-db", {
  name: "my-db",
});

const app = await Vite("my-vite-app", {
  name: "my-vite-app",
  bindings: {
    DB: db,
    API_KEY: alchemy.secret(process.env.API_KEY),
  },
});
```

## Worker.DevUrl

Use the `Worker.DevUrl` binding to inject the Worker's own dev domain URL into the compiled Vite SPA.

```ts
import { Vite, Worker } from "alchemy/cloudflare";

const app = await Vite("my-vite-app", {
  name: "my-vite-app",
  bindings: {
    VITE_PUBLIC_URL: Worker.DevUrl,
  },
});
```

:::note
When running locally, the dev domain will be set to `localhost:{port}` where port is derived with the following algorithm:
1. if `dev.command` contains `--port`, use the port from the argument
2. if `vite.config.ts` contains `server.port`, use the port from the config, or else default to `5173`
3. if we can't import `vite.config.ts`, then you will receive an error and will be required to set `dev.domain` manually

```ts
const app = await Vite("my-vite-app", {
  // ..
  dev: {
    domain: "localhost:5006",
  }
});
```
:::

## With Custom Build Configuration

Customize the build command and output paths.

```ts
import { Vite } from "alchemy/cloudflare";

const app = await Vite("my-vite-app", {
  name: "my-vite-app",
  command: "bun run test && bun run build:production",
  entrypoint: "./dist/worker.js",
  assets: "./dist/client",
});
```

## With Transform Hook

The transform hook allows you to customize the wrangler.json configuration. For example, adding a custom environment variable:

```ts
await Vite("my-app", {
  wrangler: {
    transform: (spec) => ({
      ...spec,
      vars: {
        ...spec.vars,
        CUSTOM_VAR: "value",
      },
    }),
  },
});
```
