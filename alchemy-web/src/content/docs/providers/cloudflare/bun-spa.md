---
title: BunSPA
description: Learn how to deploy Bun-based single-page applications to Cloudflare Workers using Alchemy.
---

Deploy a Bun-based SPA with an optional Cloudflare Worker backend. BunSPA uses Bun's native bundler and dev server for the frontend, with Cloudflare Workers for the backend API.

## Minimal Example

Deploy a basic Bun SPA with a single HTML entrypoint:

```ts
import { BunSPA } from "alchemy/cloudflare";

const app = await BunSPA("my-app", {
  frontend: "src/index.html",
});
```

## With Multiple HTML Files

Serve multiple pages by providing an array of HTML entrypoints:

```ts
import { BunSPA } from "alchemy/cloudflare";

const app = await BunSPA("my-app", {
  frontend: ["src/index.html", "src/about.html", "src/contact.html"],
});
```

## With Backend API

Add a Cloudflare Worker backend to handle API requests:

```ts
import { BunSPA } from "alchemy/cloudflare";

const app = await BunSPA("my-app", {
  frontend: "src/index.html",
  entrypoint: "./src/worker.ts",
});
```

### Accessing the Backend from Frontend

Use the `getBackendUrl` utility to reliably get your backend URL in both development and production:

```typescript
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

const apiBaseUrl = getBackendUrl();

// Make API requests
fetch(`${apiBaseUrl.protocol}${apiBaseUrl.host}/api/users`)
  .then(res => res.json())
  .then(data => console.log(data));
```

For API routes with specific paths, pass the `routePath` option:

```typescript
const apiBaseUrl = getBackendUrl({ routePath: "/api" });
```

### Hot Module Replacement

Enable [Hot Module Replacement (HMR)](https://bun.com/docs/bundler/hmr) in your frontend code for instant updates during development. Add this to your main entry file:

```typescript
// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Enable hot module replacement
if (import.meta.hot) {
  import.meta.hot.accept();
}
```

The `import.meta.hot.accept()` call tells Bun that this module can be hot-replaced. When you save changes to your frontend files, Bun will automatically update the running application without a full page reload, preserving your application state.

## With Custom Bindings

Add Cloudflare resource bindings and secrets:

```ts
import { BunSPA, KVNamespace, D1Database } from "alchemy/cloudflare";

const kv = await KVNamespace("kv", {
  title: "my-kv-store",
});

const db = await D1Database("db", {
  name: "my-database",
});

const app = await BunSPA("my-app", {
  frontend: "src/index.html",
  entrypoint: "./src/worker.ts",
  bindings: {
    KV: kv,
    DB: db,
    API_KEY: alchemy.secret(process.env.API_KEY),
  },
});
```

## With Custom Build Configuration

Customize the build output directory:

```ts
import { BunSPA } from "alchemy/cloudflare";

const app = await BunSPA("my-app", {
  frontend: "src/index.html",
  outDir: "build/client",
  build: "bun run test && bun build src/index.html --outdir build/client",
});
```

## With Transform Hook

The transform hook allows you to customize the wrangler.json configuration. For example, adding a custom environment variable:

```ts
await BunSPA("my-app", {
  frontend: "src/index.html",
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

## Configuration Notes

### bunfig.toml Requirement

BunSPA requires a `bunfig.toml` file in your project root to expose `BUN_PUBLIC_*` environment variables during development:

```toml
[serve.static]
env='BUN_PUBLIC_*'
```

This allows Bun to inline environment variables prefixed with `BUN_PUBLIC_` into your frontend code.

### Accessing the Backend

Use the `getBackendUrl` utility function from `alchemy/cloudflare/bun-spa` to get the backend URL. This function automatically handles both development and production environments:

```typescript
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

const apiBaseUrl = getBackendUrl();
fetch(new URL('api/endpoint', apiBaseUrl));
```

Under the hood, this uses the `BUN_PUBLIC_BACKEND_URL` environment variable in development, which is automatically set by Alchemy, and falls back to the current origin in production.

