---
title: Environment
description: Learn how to create deployment environments on Railway with Alchemy
---

Create and manage deployment environments (staging, production, etc.) within a Railway project.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file.

## Examples

### Create Environment

```ts
import { Project, Environment } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const staging = await Environment("staging", {
  project,
  name: "staging",
});

const production = await Environment("production", {
  project,
  name: "production",
});
```

### Copy from Existing Environment

```ts
const staging = await Environment("staging", {
  project,
  name: "staging",
});

// Create preview environment with staging's configuration
const preview = await Environment("preview", {
  project,
  name: "preview",
  sourceEnvironmentId: staging.id,
});
```

### Reference Existing Environment

```ts
import { EnvironmentRef } from "alchemy/railway";

const existingEnv = await EnvironmentRef({
  environmentId: "your-environment-id",
});
```

### Deploy to Specific Environment

```ts
import { Project, Environment, Service } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const staging = await Environment("staging", {
  project,
  name: "staging",
});

const api = await Service("api", {
  project,
  environment: staging,
  source: { repo: "myorg/api" },
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `project` | `string \| Project` | The project containing the environment |
| `name` | `string` | Name of the environment |
| `sourceEnvironmentId` | `string` | Environment to copy configuration from |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The environment ID |
| `name` | `string` | Environment name |
| `projectId` | `string` | Parent project ID |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |

## Default Environment

Every Railway project comes with a default "production" environment. You can access it via the project:

```ts
const project = await Project("my-project", {
  name: "My App",
});

const productionEnv = project.environments.find(
  (env) => env.name === "production"
);
```

## Best Practices

1. **Consistent Naming**: Use consistent names like "staging", "production", "preview"
2. **Environment Isolation**: Keep production and non-production environments separate
3. **Copy Configuration**: Use `sourceEnvironmentId` to copy variables and settings
