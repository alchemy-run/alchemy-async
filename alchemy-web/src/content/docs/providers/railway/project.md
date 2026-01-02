---
title: Project
description: Learn how to create and manage Railway Projects with Alchemy
---

Create and manage Railway projects. A project is the top-level container for your services, databases, and environments.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file or pass `apiToken` directly in your resource configuration.

## Examples

### Basic Project

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My Application",
  description: "Production application",
});
```

### With API Token

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-project", {
  apiToken: alchemy.secret(process.env.RAILWAY_API_TOKEN),
  name: "My Application",
});
```

### Adopt Existing Project

```ts
import { Project } from "alchemy/railway";

const project = await Project("existing", {
  adopt: true,
  name: "existing-project-name",
});
```

### Reference Existing Project

```ts
import { ProjectRef } from "alchemy/railway";

const project = await ProjectRef({
  projectId: "your-project-id",
});
```

### Prevent Deletion

```ts
import { Project } from "alchemy/railway";

const project = await Project("important", {
  name: "Critical Production",
  delete: false, // Won't be deleted when removed from Alchemy
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | Name of the project |
| `description` | `string` | Description of the project |
| `isPublic` | `boolean` | Whether the project is public (default: false) |
| `teamId` | `string` | Team ID for team projects |
| `adopt` | `boolean` | Adopt an existing project by name |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |
| `apiToken` | `Secret` | Railway API token |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The project ID |
| `name` | `string` | Name of the project |
| `description` | `string` | Description of the project |
| `createdAt` | `string` | Creation timestamp |
| `updatedAt` | `string` | Last update timestamp |
| `environments` | `Array<{id, name}>` | Environments in the project |
