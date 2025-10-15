---
title: Database
description: Learn how to create and manage Prisma Postgres databases using Alchemy.
---

The Database resource lets you create and manage Prisma Postgres database resources within an alchemy project. Each database is a fully managed PostgreSQL instance that can be connected to applications.

## Minimal Example

Create a basic database in a project:

```ts
import { Database } from "alchemy/prisma-postgres";

const database = await Database("my-db", {
  project: "prj_12345abcde",
});

console.log(`Database ID: ${database.id}`);
console.log(`Database Name: ${database.name}`);
console.log(`Status: ${database.status}`);
```

## Database with Project Resource

Create a database using a Project resource:

```ts
import { Project, Database } from "alchemy/prisma-postgres";

const project = await Project("my-app");

const database = await Database("production", {
  project: project,
});
```

## Database in Different Regions

Create databases in various regions:

```ts
import { Database } from "alchemy/prisma-postgres";

// Asia Pacific
const apDatabase = await Database("ap-db", {
  project: project,
  region: "ap-northeast-1"
});
```

## Database with Delete Protection

By default, databases are not deleted when the Alchemy resource is destroyed. Enable deletion for ephemeral databases:

```ts
import { Database } from "alchemy/prisma-postgres";

const testDatabase = await Database("test-db", {
  project: "prj_12345abcde",
  region: "us-east-1",
  delete: true // Will delete the database on destroy
});
```

## Complete Example with Connection

Create a database and connection string for your application:

```ts
import { Project, Database, Connection } from "alchemy/prisma-postgres";

const project = await Project("my-app");

const database = await Database("production", {
  project: project,
  region: "us-east-1"
});

const connection = await Connection("app-connection", {
  database: database,
});

console.log(`Connection string available at: ${connection.connectionString.unencrypted}`);
```
## Related Resources

- [Project](/providers/prisma-postgres/project) - Create projects to contain databases
- [Connection](/providers/prisma-postgres/connection) - Create connection strings for databases
- [Workspace](/providers/prisma-postgres/workspace) - Learn about Prisma workspaces

