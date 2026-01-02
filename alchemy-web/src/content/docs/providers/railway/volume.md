---
title: Volume
description: Learn how to create persistent storage on Railway with Alchemy
---

Create persistent storage volumes for your Railway services.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file.

## Examples

### Basic Volume

```ts
import { Project, Service, Volume } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const api = await Service("api", {
  project,
  source: { image: "node:20" },
});

const productionEnv = project.environments[0];

const uploads = await Volume("uploads", {
  project,
  service: api,
  environment: productionEnv.id,
  mountPath: "/app/uploads",
});
```

### Database Storage

```ts
const dbService = await Service("postgres", {
  project,
  source: { image: "postgres:16" },
});

const dataVolume = await Volume("postgres-data", {
  project,
  service: dbService,
  environment: productionEnv.id,
  name: "postgres-data",
  mountPath: "/var/lib/postgresql/data",
});
```

### Preserve Data on Destroy

```ts
const volume = await Volume("important-data", {
  project,
  service: api,
  environment: productionEnv.id,
  mountPath: "/data",
  delete: false,  // Volume won't be deleted when removed from Alchemy
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `project` | `string \| Project` | The project containing the volume |
| `service` | `string \| Service` | The service to attach the volume to |
| `environment` | `string \| Environment` | The target environment |
| `name` | `string` | Name of the volume |
| `mountPath` | `string` | Path where the volume is mounted in the container |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The volume ID |
| `name` | `string` | Volume name |
| `mountPath` | `string` | Mount path |
| `projectId` | `string` | Project ID |
| `serviceId` | `string` | Service ID |
| `environmentId` | `string` | Environment ID |
| `createdAt` | `string` | Creation timestamp |

## Important Notes

- **Data Persistence**: Volumes persist data across deployments
- **Single Service**: Each volume can only be attached to one service
- **Mount Path Changes**: Changing the mount path requires volume replacement
- **Data Loss Warning**: Deleting a volume permanently deletes all data
