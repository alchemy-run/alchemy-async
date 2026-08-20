---
title: Variable
description: Manage Railway environment variables using Alchemy.
---

The `Variable` resource creates and manages environment variables in a [Railway](https://railway.com) project. Variables can be scoped to a specific service or shared across all services in an environment.

## Service Variables

Set environment variables for a specific service:

```ts
import { Project, Service, Variable } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", { project, name: "api" });

await Variable("api-vars", {
  project,
  environment: project.defaultEnvironmentId,
  service: api,
  variables: {
    NODE_ENV: "production",
    PORT: "3000",
  },
});
```

## Shared Variables

Set variables shared across all services in an environment:

```ts
import { Project, Variable } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

await Variable("shared-vars", {
  project,
  environment: project.defaultEnvironmentId,
  variables: {
    APP_NAME: "My App",
    LOG_LEVEL: "info",
  },
});
```

## Secret Values

Use `alchemy.secret()` for sensitive values:

```ts
import { Project, Service, Variable } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", { project, name: "api" });

await Variable("api-secrets", {
  project,
  environment: project.defaultEnvironmentId,
  service: api,
  variables: {
    DATABASE_URL: alchemy.secret.env.DATABASE_URL,
    API_KEY: alchemy.secret.env.API_KEY,
  },
});
```

:::note
When variables are updated, any removed keys are automatically deleted from Railway. Only the keys in the current `variables` object will exist after an update.
:::
