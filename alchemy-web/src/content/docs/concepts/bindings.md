---
title: Binding
description: Connect your infrastructure resources with type-safe bindings.
sidebar:
  order: 0.2
---

Bindings allow resources to connect to each other in a type-safe way. In Alchemy, bindings are most commonly used with Cloudflare Workers to give them access to other resources.

## What are Bindings?

Bindings expose resources to your code at runtime. For example, they allow a Cloudflare Worker to access:

- Environment variables (non-sensitive strings)
- Secrets (sensitive strings)
- Resources like KV Namespaces, Durable Objects, R2 Buckets, etc.

## Using Bindings in Workers

:::caution
Sensitive values like API keys, passwords, and tokens must not be passed as plain strings. Always wrap them in `alchemy.secret()` to ensure they are handled securely.
:::

```typescript
// alchemy.run.ts
import { Worker, KVNamespace } from "alchemy/cloudflare";

// Create a KV namespace
const myKV = await KVNamespace("MY_KV", {
  title: "my-kv-namespace"
});

// Bind the KV namespace to a worker
const myWorker = await Worker("my-worker", {
  name: "my-worker",
  entrypoint: "./src/worker.ts",
  bindings: {
    // an environment variable (non-sensitive)
    STAGE: "prod",
    // a secret (sensitive)
    API_KEY: alchemy.secret("secret-key"),
    // a resource (binds as an object with methods)
    MY_KV: myKV,
  }
});
```

The worker can then access these bindings through the `env` parameter:

```typescript
import type { myWorker } from "../alchemy.run.ts";

// src/worker.ts
export default {
  async fetch(request: Request, env: typeof myWorker.Env, ctx: any) {
    // Access the KV namespace binding
    const value = await env.MY_KV.get("key");
    
    // Access other bindings
    const apiKey = env.API_KEY;
    const isDebug = env.STAGE === "prod";
    
    return new Response(`Value: ${value}`);
  }
};
```

## Type-Safe Bindings

Alchemy does not use code-generation. Instead, the runtime types of your bindings can be inferred in two ways:

1. Use a type-only import to infer from your worker definition in `alchemy.run.ts`

```typescript
import type { myWorker } from "./alchemy.run";

export default {
  async fetch(request: Request, env: typeof myWorker.Env, ctx: any) {
    env.MY_KV.get("key"); // allowed
    env.NON_EXISTING_BINDING; // type error
  }
}
```

2. Augment `env` from the `cloudflare:workers` module to infer the types globally:

```typescript
import type { myWorker } from "./alchemy.run";

export type WorkerEnv = typeof myWorker.Env;

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends WorkerEnv {}
  }
}
```

Register `env.d.ts` in your `tsconfig.json`'s `types`.
```json
{
  "compilerOptions": {
    "types": ["@cloudflare/workers-types", "./src/env.d.ts"]
  }
}
```

Then, use the type in your worker:

```typescript
// src/worker.ts
export default {
  async fetch(request: Request, env: WorkerEnv, ctx: any) {
    // Type-safe access to bindings
    const value = await env.MY_KV.get("key");
    const apiKey = env.API_KEY;
    
    return new Response(`Value: ${value}`);
  }
};
```

Or use the global import:
```ts
import { env } from "cloudflare:workers";

await env.MY_KV.get("key")
```

## Binding Types

Alchemy supports three types of bindings:

### Strings
For non-sensitive configuration values (visible in logs):

```typescript
const worker = await Worker("my-worker", {
  bindings: {
    STAGE: app.stage,
    VERSION: "1.0.0",
    DEBUG_MODE: "true"
  }
});
```

### Secrets
For sensitive values like API keys (always use `alchemy.secret()`):

```typescript
const worker = await Worker("my-worker", {
  bindings: {
    API_KEY: alchemy.secret("secret-key"),
    DATABASE_PASSWORD: alchemy.secret("db-pass")
  }
});
```

### Resources
For infrastructure connections:

```typescript
import { Worker, KVNamespace, R2Bucket } from "alchemy/cloudflare";

const kvStore = await KVNamespace("MY_KV", { title: "my-kv-namespace" });
const bucket = await R2Bucket("MY_BUCKET", { name: "my-storage-bucket" });

const worker = await Worker("my-worker", {
  bindings: {
    KV_STORE: kvStore,
    STORAGE: bucket,
    STAGE: app.stage,
    API_KEY: alchemy.secret("key")
  }
});
```
