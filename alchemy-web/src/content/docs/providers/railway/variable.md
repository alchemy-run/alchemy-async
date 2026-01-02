---
title: Variable
description: Learn how to manage environment variables on Railway with Alchemy
---

Manage environment variables for your Railway services.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file.

## Examples

### Service-Specific Variable

```ts
import { Project, Service, Variable } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const api = await Service("api", {
  project,
  source: { repo: "myorg/api" },
});

const productionEnv = project.environments[0];

await Variable("api-key", {
  project,
  environment: productionEnv.id,
  service: api,
  name: "API_KEY",
  value: alchemy.secret(process.env.API_KEY),
});
```

### Shared Variable

Variables without a service are shared across all services in the environment:

```ts
await Variable("shared-secret", {
  project,
  environment: productionEnv.id,
  name: "SHARED_SECRET",
  value: alchemy.secret(process.env.SHARED_SECRET),
});
```

### Reference Variables

Use Railway's reference syntax to link variables between services:

```ts
// Reference a variable from another service
await Variable("redis-url", {
  project,
  environment: productionEnv.id,
  service: api,
  name: "REDIS_URL",
  value: "${{Redis.REDIS_URL}}",
});
```

### Database Connection

```ts
import { Project, Service, PostgresDatabase, Variable } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const db = await PostgresDatabase("db", { project });

const api = await Service("api", {
  project,
  source: { repo: "myorg/api" },
});

const productionEnv = project.environments[0];

await Variable("database-url", {
  project,
  environment: productionEnv.id,
  service: api,
  name: "DATABASE_URL",
  value: db.connectionUrl,
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `project` | `string \| Project` | The project containing the variable |
| `environment` | `string \| Environment` | The target environment |
| `service` | `string \| Service` | Service to attach to (optional for shared) |
| `name` | `string` | Variable name (e.g., "DATABASE_URL") |
| `value` | `string \| Secret` | Variable value |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Variable name |
| `value` | `Secret` | Variable value (wrapped) |
| `projectId` | `string` | Project ID |
| `environmentId` | `string` | Environment ID |
| `serviceId` | `string` | Service ID (if service-specific) |

## Best Practices

1. **Use Secrets**: Always wrap sensitive values with `alchemy.secret()`
2. **Service-Specific**: Prefer service-specific variables over shared when possible
3. **Reference Variables**: Use Railway's reference syntax for cross-service dependencies
