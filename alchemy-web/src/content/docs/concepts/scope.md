---
title: Scope
description: Learn how Alchemy uses hierarchical scopes to organize and manage infrastructure resources. 
sidebar:
  order: 0.4
---

Scopes in Alchemy are hierarchical containers that organize resources and other scopes, similar to a file system.

```typescript
// Scope hierarchy
app (Application Scope)
├── dev (Stage Scope)
│   ├── api (Nested Scope)
│   └── database (Resource)
└── prod (Stage Scope)
```

## Application Scope

The top-level scope created using the `alchemy()` function:

```typescript
import alchemy from "alchemy";

// Create root scope
const app = await alchemy("my-app");

// Create a resource in this scope
const file = await File("config", { path: "./config.json", content: "{}" });
```

State directory structure:
```
.alchemy/
  my-app/  # Application scope
    $USER/ # Default stage (username)
      config.json
```

## Stage Scope

A scope directly under the application scope for separating environments:

```typescript
// Create app with explicit stage
const app = await alchemy("my-app", {
  stage: "prod"
});

// Resource in prod stage
const database = await Database("main", { /* props */ });
```

```
.alchemy/
  my-app/
    prod/  ## Stage scope
      main.json
```

## Resource Scope

Each resource gets its own scope for managing child resources:

```typescript
export const WebApp = Resource(
  "my::WebApp",
  async function (this, id, props) {
    // Child resources automatically scoped to this WebApp
    const database = await Database("db", {});
    const apiGateway = await ApiGateway("api", {});
    
    return {
      id,
      url: apiGateway.url,
      dbConnectionString: database.connectionString
    };
  }
);

// Usage
const app = await WebApp("my-app", {});
```

```
.alchemy/
  my-app/
    dev/
      my-app.json
      my-app/  # Resource scope
        db.json
        api.json
```

## Nested Scope

Create custom nested scopes to organize related resources:

```typescript
// Create nested scopes
await alchemy.run("backend", async () => {
  await ApiGateway("api", {});
  await Function("handler", {});
});

await alchemy.run("frontend", async () => {
  await Bucket("assets", {});
});
```

```
.alchemy/
  my-app/
    dev/
      backend/
        api.json
        handler.json
      frontend/
        assets.json
```

## Scope Finalization

When finalized, scopes delete any orphaned resources (resources in state but not in code):

```typescript
const app = await alchemy("my-app");

await Bucket("assets", {});
// If a previously existing resource is removed from code,
// it will be deleted during finalization

await app.finalize(); // Manual finalization
```

Application scopes need manual finalization, but nested scopes finalize automatically when their execution completes. 

## Test Scope

Alchemy provides isolated test scopes that automatically clean up after tests:

```typescript
import { alchemy } from "../../src/alchemy";
import "../../src/test/bun";

// Create test scope from filename
const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX
});

// Each test gets an isolated sub-scope
test("create resource", async (scope) => {
  const resource = await Resource("test-resource", {});
  expect(resource.id).toBeTruthy();
  // Resources auto-cleaned when test completes
});
```

Example from Cloudflare Worker tests:

```typescript
import { alchemy } from "../../src/alchemy";
import { Worker } from "../../src/cloudflare/worker";
import "../../src/test/bun";
import { BRANCH_PREFIX } from "../util";

const test = alchemy.test(import.meta, { prefix: BRANCH_PREFIX });

describe("Worker Resource", () => {
  test("create worker", async (scope) => {
    const worker = await Worker(`${BRANCH_PREFIX}-test-worker`, {
      script: "// Worker code",
      format: "esm",
    });
    
    expect(worker.id).toBeTruthy();
  });
});
```

For more details on testing with Alchemy, see [Testing in Alchemy](/concepts/testing).

## Destroy Strategy

By default, Alchemy will destroy scopes in a sequential order. You can change this behavior by passing the `destroyStrategy` option to the Scope constructor.

```typescript
const app = await alchemy("my-app", {
  destroyStrategy: "parallel"
});
```

You can also set the `destroyStrategy` option on the `alchemy.run` function.

```typescript
await alchemy.run("my-app", {
  destroyStrategy: "parallel"
}, async (scope) => {
  // resources will be deleted in parallel during scope deletion/finalization
  await Resource("resource1", {});
  await Resource("resource2", {});
});
```
