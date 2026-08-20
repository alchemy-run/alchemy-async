---
title: Volume
description: Attach persistent storage to Railway services using Alchemy.
---

The `Volume` resource creates and manages persistent volumes attached to [Railway](https://railway.com) services.

## Minimal Example

Attach a persistent volume to a service:

```ts
import { Project, Service, Volume } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", { project, name: "api" });

const volume = await Volume("data", {
  project,
  service: api,
  environment: project.defaultEnvironmentId,
  mountPath: "/data",
});
```

## Database Storage

Attach a volume for database storage:

```ts
import { Project, Service, Volume } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const db = await Service("postgres", {
  project,
  name: "postgres",
  source: { image: "postgres:16" },
});

const volume = await Volume("pg-data", {
  project,
  service: db,
  environment: project.defaultEnvironmentId,
  mountPath: "/var/lib/postgresql/data",
});
```

## Prevent Deletion

Keep the volume even when removed from Alchemy:

```ts
import { Project, Service, Volume } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const db = await Service("db", { project, name: "db" });

const volume = await Volume("db-data", {
  project,
  service: db,
  environment: project.defaultEnvironmentId,
  mountPath: "/data",
  delete: false,
});
```

:::note
The `mountPath` is immutable. If it changes, the volume will be replaced (deleted and recreated).
:::
