---
order: 5
title: Testing
description: Learn how to test custom Alchemy resources.
---

Alchemy resources are easy to test since they're just functions, but Alchemy also offers a simple `alchemy.test` utility to help isolate your [Scopes](/concepts/scope) for each test suite.

## Test Setup

Import alchemy's test utility and your resource:

```typescript
import { describe, expect } from "bun:test";
import alchemy, { destroy } from "alchemy";
import { Database } from "../src/neon/database";

// make sure to augment `alchemy` by importing your preferred testing utility
import "alchemy/test/bun";
```

## Test Scope Creation

Create a `test` function at the top of your test suite:

```typescript
// Create test scope using filename
const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX
});
```

We pass `import.meta` so that all the resources created in this test suite will be isolated from other tests.

## Resource Test Implementation

Now, create a test as you ordinarily would:

```typescript
test("create, update, and delete database", async (scope) => {
  // ..
});
```

Note how our test is passed a `scope` value - we'll use that at the end to clean up our resources.

Inside our test, we can simple create and update our resources, make assertions, etc.:
```ts
// Create resource
let database = await Database(testId, {
  name: `${testId}-db`,
  // Other required properties...
});

// Test assertions
expect(database.id).toBeTruthy();

// Update resource
database = await Database(testId, {
  // Updated properties...
});
```

Finally, wrap all of this in a `try-finally` so that we can ensure our test resources are cleaned up.

```ts
try {
  // (create, update and assertions)
} finally {
  // delete all resources
  await destroy(scope);
  
  // Verify resource was deleted if you want to
}
```

:::tip
It's recommended to use a `try-finally` so that you can assert the resource was actually deleted.
::: 

## Integration Testing with Vitest Global Setup

For integration tests where you want to deploy infrastructure once before all tests run and clean up after, use Vitest's global setup feature.

### Configure Vitest

Create a `vitest.config.ts` that references your global setup file:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    globalSetup: "./vitest.setup.ts",
  },
});
```

### Create Global Setup

Create a `vitest.setup.ts` that deploys your infrastructure and provides context to tests:

```typescript
/// <reference types="vitest" />

import type { TestProject } from "vitest/node";

export async function setup({ provide }: TestProject) {
  // Import and run your alchemy app
  const { app, worker } = await import("./alchemy.run.ts");
  
  if (!worker.url) {
    throw new Error("worker.url is not defined");
  }
  
  // Provide values to your tests
  provide("workerUrl", worker.url);
  
  // Return cleanup function
  return async () => {
    await app.cleanup();
  };
}

// Declare the provided context for type safety
declare module "vitest" {
  export interface ProvidedContext {
    workerUrl: string;
  }
}
```

### Write Tests

Use `inject()` to access the provided context in your tests:

```typescript
import { describe, expect, inject, it } from "vitest";

describe("worker", () => {
  it("should return the correct response", async () => {
    const workerUrl = inject("workerUrl");
    const response = await fetch(workerUrl);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Ok");
  });
});
```

:::tip
This pattern is ideal for testing deployed Cloudflare Workers, APIs, or any infrastructure that needs to be live during tests. The infrastructure is deployed once, all tests run against it, and then it's cleaned up automatically.
:::

