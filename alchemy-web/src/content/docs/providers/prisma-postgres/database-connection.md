---
title: DatabaseConnection
description: Learn how to create and manage connection strings for Prisma Hosted Databases using Alchemy.
---

The `DatabaseConnection` resource lets you create and manage connection strings for Prisma Postgres databases. Each connection provides secure credentials and connection details for accessing your database.

## Minimal Example

Create a basic connection string for a database:

```ts
import { DatabaseConnection } from "alchemy/prisma-postgres";

const connection = await DatabaseConnection("app-connection", {
  database: "db_12345abcde"
});

console.log(`Connection ID: ${connection.id}`);
console.log(`Connection String: ${connection.connectionString.unencrypted}`);
console.log(`Host: ${connection.host}`);
console.log(`User: ${connection.user}`);
```

## Complete Example with Project and Database

Create a full setup from project to connection:

```ts
import { Project, Database, DatabaseConnection } from "alchemy/prisma-postgres";

const project = await Project("my-app");

const database = await Database("production", {
  project: project,
});

const connection = await DatabaseConnection("app-connection", {
  database: database,
  name: "production-api-connection"
});

console.log(`Host: ${connection.host}`);
console.log(`User: ${connection.user}`);
console.log(`Password: ${connection.password?.unencrypted}`);
console.log(`Connection String: ${connection.connectionString.unencrypted}`);
```

## Using with Cloudflare Hyperdrive

Integrate Prisma database connections with Cloudflare Hyperdrive for accelerated database access:

```ts
import { Database, DatabaseConnection } from "alchemy/prisma-postgres";
import { Hyperdrive, Worker } from "alchemy/cloudflare";

const database = await Database("my-db", {
  project: "prj_12345abcde",
  region: "us-east-1"
});

const connection = await DatabaseConnection("app-connection", {
  database: database
});

const db = await Hyperdrive("prisma-postgres", {
  origin: connection.connectionString.unencrypted,
});

const worker = await Worker("api", {
  entrypoint: "./src/worker.ts",
  bindings: {
    DATABASE: hyperdrive
  }
});
```

## Related Resources

- [Database](/providers/prisma-postgres/database) - Create databases for connections
- [Project](/providers/prisma-postgres/project) - Create projects to contain databases
- [Hyperdrive](/providers/cloudflare/hyperdrive) - Accelerate database connections with Cloudflare
- [Worker](/providers/cloudflare/worker) - Deploy serverless functions with database access

