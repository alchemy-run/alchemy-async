---
title: Project
description: Learn how to create and manage Prisma Postgres projects using Alchemy.
---

The Project resource lets you create and manage [Prisma Postgres projects](https://www.prisma.io/docs/platform/about#project), which serve as containers for your databases and their configurations. Projects belong to a workspace and can contain multiple databases.

## Minimal Example

Create a basic project with default settings:

```ts
import { Project } from "alchemy/prisma-postgres";

const project = await Project("my-app");

console.log(`Project ID: ${project.id}`);
console.log(`Project Name: ${project.name}`);
console.log(`Workspace: ${project.workspace.name}`);
```

## Project with Delete Protection

By default, projects are not deleted when the Alchemy resource is destroyed in order to prevent accidental data loss. Enable deletion if you want the project to be removed:

```diff lang='ts'
import { Project } from "alchemy/prisma-postgres";

 const ephemeralProject = await Project("test-project", {
   name: "test-project",
+  delete: true
 });
```

## Complete Example with Database

Create a project and add databases to it:

```ts
import { Project, Database } from "alchemy/prisma-postgres";

const project = await Project("my-app", {
  name: "my-app"
});

const productionDb = await Database("production", {
  project: project,
  region: "us-east-1"
});
console.log(`Production DB: ${productionDb.name}`);
```

## Related Resources

- [Database](/providers/prisma-postgres/database) - Create databases within a project
- [Connection](/providers/prisma-postgres/connection) - Create connection strings for databases
- [Workspace](/providers/prisma-postgres/workspace) - Learn about Prisma workspaces

