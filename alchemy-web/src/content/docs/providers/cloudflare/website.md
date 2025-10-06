---
title: Website
description: Learn how to deploy static and dynamic websites to Cloudflare Workers using Alchemy.
---

The Website resource deploys a static website to Cloudflare Workers with an optional Worker for server-side functionality.

## Minimal Example

Deploy a static site from a local directory:

```ts
import { Website } from "alchemy/cloudflare";

const site = await Website("my-site", {
  name: "my-site",
  build: "npm run build",
  dev: "npm run dev",
  assets: "./dist",
});
```

## With Custom Worker

Add server-side functionality with a Worker:

```ts
const site = await Website("my-site", {
  name: "my-site",
  build: "npm run build",
  assets: "./dist",
  entrypoint: "./src/worker.ts",
  bindings: {
    DB: database,
    API_KEY: alchemy.secret(process.env.API_KEY),
  },
});
```

## With Advanced Configuration

Configure caching, routing and other options:

```ts
const site = await Website("my-site", {
  name: "my-site",
  build: "npm run build",
  assets: {
    directory: "./dist",
    html_handling: "force-trailing-slash",
    not_found_handling: "single-page-application",
    _headers: "/*\n  Cache-Control: public, max-age=3600",
    _redirects: "/old/* /new/:splat 301",
  },
  compatibilityFlags: ["nodejs_compat"],
  wrangler: true,
});
```

## Bind to a Worker

Use the Website's assets in another Worker:

```ts
import { Worker, Website } from "alchemy/cloudflare";

const site = await Website("my-site", {
  build: "npm run build",
  assets: "./dist",
});

await Worker("api", {
  name: "api-worker",
  script: "console.log('Hello')",
  bindings: {
    ASSETS: site,
  },
});
```

## With Transform Hook

The transform hook allows you to customize the wrangler.json configuration. For example, adding a custom environment variable:

```ts
await Website("my-app", {
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
