---
title: Cache
description: Learn how to enable Workers Cache in Alchemy to serve cached responses from Cloudflare's edge without invoking your Worker.
---

[Workers Cache](https://developers.cloudflare.com/workers/cache/) is a Worker-owned edge cache that sits in front of your Worker. When enabled, Cloudflare checks the cache before invoking your Worker and serves matching responses directly from the edge — reducing latency and CPU time. It applies to all `fetch()` invocations: eyeball requests, service binding calls, and loopback fetches.

## Minimal Example

Enable the cache with the `cache` property on a Worker.

```ts
import { Worker } from "alchemy/cloudflare";

const worker = await Worker("my-worker", {
  entrypoint: "./src/worker.ts",
  cache: true,
});
```

## Control Caching with Response Headers

The Worker's code is the configuration surface — standard HTTP response headers decide what gets cached and for how long.

```ts
// src/worker.ts
export default {
  async fetch(request: Request): Promise<Response> {
    return Response.json(
      { hello: "world" },
      {
        headers: {
          "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
          "Cache-Tag": "products",
        },
      },
    );
  },
};
```

Responses with a cacheable `Cache-Control` header are stored at the edge; subsequent requests for the same URL are served from cache without invoking the Worker.

## Purge at Runtime

Purge cached responses programmatically with `ctx.cache.purge()` — by `Cache-Tag`, path prefix, or entirely.

```ts
// src/worker.ts
export default {
  async fetch(request: Request, env: unknown, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/invalidate") {
      await ctx.cache.purge({ tags: ["products"] });
      return new Response("purged");
    }
    // ...
  },
};
```

## Cross-Version Cache Sharing

By default the cache is scoped to a single Worker version, so every deployment starts cold. Opt into sharing cached responses across versions when they are version-agnostic:

```ts
import { Worker } from "alchemy/cloudflare";

const worker = await Worker("my-worker", {
  entrypoint: "./src/worker.ts",
  cache: {
    enabled: true,
    crossVersionCache: true,
  },
});
```

## Configuration Options

- `enabled` — toggles the read-through cache (`cache: true` is shorthand for `{ enabled: true }`)
- `crossVersionCache` — shares cached responses across Worker versions

:::note
Workers Cache is an edge feature and is not emulated in local dev — locally the Worker runs on every request. The cache follows the Worker wherever it runs in production: custom domains, `workers.dev`, behind service bindings, and Workers for Platforms tenants.
:::
