---
title: DatabaseConnection
description: Learn how to create and manage connection strings for Prisma Hosted Databases using Alchemy.
---

The DatabaseConnection resource lets you create and manage [connection strings](https://www.prisma.io/docs/data-platform/about#connection-strings) for Prisma Data Platform databases. Each connection provides secure credentials and connection details for accessing your database.

## Minimal Example

Create a basic connection string for a database:

```ts
import { DatabaseConnection } from "alchemy/prisma";

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
import { Project, Database, DatabaseConnection } from "alchemy/prisma";

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
import { Database, DatabaseConnection } from "alchemy/prisma";
import { Hyperdrive, Worker } from "alchemy/cloudflare";

const database = await Database("my-db", {
  project: "prj_12345abcde",
  region: "us-east-1"
});

const connection = await DatabaseConnection("app-connection", {
  database: database
});

const db = await Hyperdrive("prisma-postgres", {
  name: "prisma-postgres",
  origin: `postgres://${connection.user}:${connection.password?.unencrypted}@${connection.host}/${connection.database}`,
});

const worker = await Worker("api", {
  entrypoint: "./src/worker.ts",
  bindings: {
    DATABASE: hyperdrive
  }
});
```

## Related Resources

- [Database](/providers/prisma/database) - Create databases for connections
- [Project](/providers/prisma/project) - Create projects to contain databases
- [Hyperdrive](/providers/cloudflare/hyperdrive) - Accelerate database connections with Cloudflare
- [Worker](/providers/cloudflare/worker) - Deploy serverless functions with database access

