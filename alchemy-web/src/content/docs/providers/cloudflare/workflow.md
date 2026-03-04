---
title: Workflow
description: Learn how to create and manage Cloudflare Workflows using Alchemy to orchestrate and automate tasks.
---

A [Cloudflare Workflow](https://developers.cloudflare.com/workers/configuration/workflows/) allows you to define reusable logic that can be shared across multiple Workers.

## Minimal Example

Create a basic workflow that can be bound to a Worker.

```ts
import { Workflow } from "alchemy/cloudflare";

const workflow = Workflow("my-workflow", {
  workflowName: "my-workflow",
  className: "MyWorkflow",
});
```

## Use a Workflow Defined in Another Script

Reference a workflow implemented in a different worker script using `scriptName`.

```ts
import { Workflow } from "alchemy/cloudflare";

const workflow = Workflow("shared-workflow", {
  workflowName: "my-workflow",
  className: "MyWorkflow",
  scriptName: "shared-worker",
});
```

## Bind to a Worker

Bind a workflow to a Worker to use its functionality.

```ts
import { Worker, Workflow } from "alchemy/cloudflare";

const workflow = Workflow("my-workflow", {
  workflowName: "my-workflow",
  className: "MyWorkflow",
});

await Worker("my-worker", {
  name: "my-worker",
  script: "console.log('Hello, world!')",
  bindings: {
    WORKFLOW: workflow,
  },
});
```

## Workflow Step Limits

Set the maximum number of steps per workflow instance with `limits.steps`.

```ts
import { Workflow } from "alchemy/cloudflare";

const workflow = Workflow("order-processing", {
  workflowName: "order-processing",
  className: "OrderProcessingWorkflow",
  limits: {
    steps: 25_000,
  },
});
```

## Rename Class Name

Alchemy takes care of migrations automatically when you rename the class name.

```diff lang='ts'
 import { Workflow } from "alchemy/cloudflare";

 const workflow = Workflow("my-workflow", {
-  className: "MyWorkflow",
+  className: "MyWorkflowV2",
 });
```

:::caution
You cannot rename the `"my-workflow"` ID in `Workflow("my-workflow")` - we call this the "stable identifier" for the Workflow and it is immutable for the lifetime of the application.
:::

## Cross-Script Binding

You can share workflows across multiple Workers, allowing one Worker to trigger workflows defined in another Worker.

### Method 1: Using re-exported syntax

You can directly reference the workflow binding from the provider Worker:

```ts
import { Worker, Workflow } from "alchemy/cloudflare";

// Create the provider Worker with the Workflow
const host = await Worker("Host", {
  entrypoint: "./workflow-provider.ts",
  bindings: {
    SHARED_PROCESSOR: Workflow("shared-processor", {
      className: "SharedProcessor",
      workflowName: "order-processing",
    }),
  },
});

// Create the client Worker using the provider's Workflow binding directly
const client = await Worker("client", {
  entrypoint: "./client-worker.ts",
  bindings: {
    // Re-use the exact same Workflow binding from the provider worker
    SHARED_PROCESSOR: host.bindings.SHARED_PROCESSOR,
  },
});
```

### Method 2: Using `scriptName` directly

Alternatively, when creating a Workflow binding in a client Worker, you can reference a workflow defined in another Worker by specifying the `scriptName`:

```ts
import { Worker, Workflow } from "alchemy/cloudflare";

const hostWorkerName = "host";

const sharedWorkflow = Workflow("shared-processor", {
  className: "SharedProcessor",
  workflowName: "order-processing",
  scriptName: hostWorkerName,
});

// First, create the Worker that defines the Workflow
const host = await Worker("host", {
  entrypoint: "./workflow-provider.ts",
  name: hostWorkerName,
  bindings: {
    // Define the Workflow in this worker
    SHARED_PROCESSOR: sharedWorkflow,
  },
});

// Then, create a client Worker that uses the cross-script Workflow
const client = await Worker("client", {
  entrypoint: "./client-worker.ts",
  bindings: {
    // Reference the same Workflow but specify which script it comes from
    SHARED_PROCESSOR: sharedWorkflow,
  },
});
```
