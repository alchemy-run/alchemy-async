---
title: DispatchNamespace
description: Learn how to create and manage Cloudflare Workers for Platforms dispatch namespaces for multi-tenant architectures.
---

A [Cloudflare Dispatch Namespace](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/reference/how-workers-for-platforms-works/) is a container for Workers for Platforms (WFP) that enables multi-tenant architectures by allowing you to deploy and manage multiple isolated worker scripts within a single namespace.

## Minimal Example

Create a dispatch namespace for multi-tenant worker deployment:

```ts
import { DispatchNamespace } from "alchemy/cloudflare";

const namespace = await DispatchNamespace("tenant-workers", {
  namespace: "production-tenants",
});
```

## Deploy Worker to Dispatch Namespace

Deploy a worker to a dispatch namespace to make it available for multi-tenant routing:

```ts
import { Worker, DispatchNamespace } from "alchemy/cloudflare";

const namespace = await DispatchNamespace("tenant-workers", {
  namespace: "production-tenants",
});

// Deploy a worker to the dispatch namespace
const tenantWorker = await Worker("tenant-handler", {
  name: "tenant-handler",
  entrypoint: "./src/tenant.ts",
  namespace: namespace,
});
```

## Bind to Dispatch Namespace

Create a worker that can route requests to workers within a dispatch namespace:

```ts
import { Worker, DispatchNamespace } from "alchemy/cloudflare";

const namespace = await DispatchNamespace("tenant-workers", {
  namespace: "production-tenants",
});

// Create a router worker that binds to the dispatch namespace
const router = await Worker("router", {
  name: "main-router",
  entrypoint: "./src/router.ts",
  bindings: {
    TENANTS: namespace,
  },
});
```

In your router worker:

```ts
// src/router.ts
export default {
  async fetch(request: Request, env: { TENANTS: DispatchNamespace }) {
    // Extract tenant ID from the request
    const url = new URL(request.url);
    const tenantId = url.hostname.split(".")[0];

    // Get the tenant's worker from the dispatch namespace
    const tenantWorker = env.TENANTS.get(tenantId);

    // Forward the request to the tenant's worker
    return await tenantWorker.fetch(request);
  },
};
```

## Outbound Worker

Attach an [outbound Worker](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/configuration/outbound-workers/) to the dispatch namespace *binding* to intercept every subrequest the dispatched user Workers make — e.g. to enforce an egress policy or inject platform credentials the untrusted user Worker must never hold:

```ts
import { Worker, DispatchNamespace } from "alchemy/cloudflare";

const egress = await Worker("egress-policy", {
  name: "egress-policy",
  entrypoint: "./src/egress.ts",
});

const namespace = await DispatchNamespace("tenant-workers", {
  namespace: "production-tenants",
});

const router = await Worker("router", {
  name: "main-router",
  entrypoint: "./src/router.ts",
  bindings: {
    TENANTS: {
      ...namespace,
      outbound: {
        service: "egress-policy",
        // Names of the per-dispatch parameters the router supplies below.
        parameters: ["TENANT_ID"],
      },
    },
  },
});
```

The router supplies the declared parameters per dispatch; they surface on the outbound Worker's `env`:

```ts
// src/router.ts
const tenantWorker = env.TENANTS.get(tenantId, {}, {
  outbound: { TENANT_ID: tenantId },
});

// src/egress.ts — runs for every subrequest the user worker makes
export default {
  async fetch(request: Request, env: { TENANT_ID?: string }) {
    // enforce policy / inject credentials based on env.TENANT_ID, then:
    return fetch(request);
  },
};
```

## Multi-Tenant Architecture Example

Create a complete multi-tenant setup with customer-specific workers:

```ts
import {
  Worker,
  DispatchNamespace,
  KVNamespace,
  Json,
} from "alchemy/cloudflare";

// Create a dispatch namespace for tenant workers
const tenants = await DispatchNamespace("tenants", {
  namespace: "customer-workers",
});

// Create KV namespace for tenant metadata
const tenantData = await KVNamespace("tenant-data", {
  title: "Tenant Configuration",
});

// Deploy tenant-specific workers
const tenantWorkerA = await Worker("tenant-a", {
  name: "customer-a-worker",
  entrypoint: "./src/tenant-worker.ts",
  namespace: tenants,
  bindings: {
    CONFIG: Json({
      customerId: "customer-a",
      features: ["feature1", "feature2"],
    }),
  },
});

const tenantWorkerB = await Worker("tenant-b", {
  name: "customer-b-worker",
  entrypoint: "./src/tenant-worker.ts",
  namespace: tenants,
  bindings: {
    CONFIG: Json({
      customerId: "customer-b",
      features: ["feature1", "feature3"],
    }),
  },
});

// Create the main router that handles all tenant requests
const mainRouter = await Worker("main-router", {
  name: "platform-router",
  entrypoint: "./src/main-router.ts",
  bindings: {
    TENANT_NAMESPACE: tenants,
    TENANT_DATA: tenantData,
  },
  routes: [
    {
      pattern: "*.platform.example.com/*",
    },
  ],
});
```

## Properties

### `namespace`

**Type:** `string`  
**Required:** Yes

The name of the dispatch namespace. This must be unique within your account.

### `accountId`

**Type:** `string`  
**Required:** No (uses environment variable or auto-discovery)

The Cloudflare account ID.

### `apiKey`

**Type:** `string`  
**Required:** No (uses environment variable)

The Cloudflare API key for authentication.

### `apiToken`

**Type:** `string`  
**Required:** No (uses environment variable)

The Cloudflare API token for authentication.

## Important Notes

- **Workers for Platforms**: Dispatch namespaces are part of Cloudflare's Workers for Platforms offering, which may require a specific plan
- **Isolation**: Each worker within a dispatch namespace runs in isolation with its own bindings and configuration
- **Routing**: The dispatch namespace provides a `get()` method to retrieve specific workers by name
- **Naming**: Worker names within a dispatch namespace must be unique
- **Performance**: Dispatch namespaces are optimized for multi-tenant architectures with minimal overhead

## See Also

- [Worker](/providers/cloudflare/worker) - Deploy workers to dispatch namespaces
- [Workers for Platforms Documentation](https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/)
