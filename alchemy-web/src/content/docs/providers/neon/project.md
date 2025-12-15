---
title: NeonProject
description: Learn how to create, configure, and manage Neon serverless Postgres projects and databases using Alchemy.
---

The NeonProject resource lets you create and manage [Neon serverless PostgreSQL](https://neon.tech) projects.

## Minimal Example

Create a basic Neon project with default settings:

```ts
import { NeonProject } from "alchemy/neon";

const project = await NeonProject("my-project", {
  name: "My Project",
});
```

## Custom Region and Version

Create a project in a specific region with a specific PostgreSQL version:

```ts
import { NeonProject } from "alchemy/neon";

const project = await NeonProject("eu-project", {
  name: "EU Project",
  region_id: "aws-eu-west-1",
  pg_version: 16,
  apiKey: alchemy.secret(process.env.NEON_API_KEY),
});
```

## Custom Branch Name

Create a project with a custom default branch name:

```ts
import { NeonProject } from "alchemy/neon";

const project = await NeonProject("dev-project", {
  name: "Development Project",
  default_branch_name: "development",
});
```

## Adopting an Existing Project

Use `NeonProject` to adopt an existing project by name.

```ts
import { NeonProject } from "alchemy/neon";

const project = await NeonProject("my-project", {
  adopt: true,
});
```

:::caution
Adopting an existing project will cause the resource to be managed by the current Alchemy app. This means it will be deleted when the app is destroyed. To avoid this, you can:
- Set `delete: false` to prevent the project from being deleted when the app is destroyed.
- Use `NeonProjectRef` for a read-only reference to the project.
:::

## Referencing an Existing Project (NeonProjectRef)

Use `NeonProjectRef` to reference an existing project by name.

```ts
import { NeonProjectRef } from "alchemy/neon";

const projectRef = await NeonProjectRef({
  name: "my-project",
});
```

:::caution
This will throw if the project does not exist, or if multiple projects are found with the same name.
:::