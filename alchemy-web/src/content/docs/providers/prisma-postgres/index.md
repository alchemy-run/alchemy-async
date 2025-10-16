---
title: Prisma Postgres
description: Learn how to manage Prisma Postgres databases, connections, and projects using Alchemy.
---

[Prisma Postgres](https://www.prisma.io/docs/platform/about#overview) provides a managed postgres database service. Alchemy provides resource to manage Prisma databases, connections, and projects programmatically.

## Resources

- [Database](/providers/prisma-postgres/database) - Create and manage Prisma Postgres databases with configuration options
- [Connection](/providers/prisma-postgres/connection) - Create and manage Prisma Postgres database connections with configuration options
- [Project](/providers/prisma-postgres/project) - Create and manage Prisma Postgres projects with configuration options
- [WorkspaceRef](/providers/prisma-postgres/workspace) - reference Prisma Postgres workspaces by name or id

## Authentication

Prisma authentication is handled via environment variables.

### Setting the Service Token

The service token can be set directly by setting the `PRISMA_SERVICE_TOKEN` environment variable.

### Overriding per Resource

To support multiple accounts, alchemy allows you to override the authentication token for a resource by setting the `serviceToken` property on prisma resources.

## Cloudflare Workers Hyperdrive Example

```ts title="alchemy.run.ts"
import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import { Database, Connection, Project } from "alchemy/prisma-postgres";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project");

const database = await Database("database", {
  project,
  region: "us-east-1",
});

const connection = await Connection("connection", {
  database,
  name: "connection",
});

const db = await Hyperdrive("prisma-postgres", {
  origin: connection.connectionString.unencrypted,
});

export const worker = await Worker("worker", {
  entrypoint: "src/worker.ts",
  bindings: {
    HYPERDRIVE: db,
  },
  compatibilityFlags: ["nodejs_compat"],
});

console.log(`worker url: ${worker.url}`);

await app.finalize();
```

```ts title="src/worker.ts"
import { Client } from "pg";
import type { worker } from "../alchemy.run.ts";

export default {
  async fetch(_request: Request, env: typeof worker.Env): Promise<Response> {
    const client = new Client({
      connectionString: env.HYPERDRIVE.connectionString,
    });

    try {
      // Connect to the database
      await client.connect();
      console.log("Connected to PostgreSQL database");

      // Perform a simple query
      const result = await client.query("SELECT * FROM pg_tables");

      return Response.json({
        success: true,
        result: result.rows,
      });
    } catch (error: any) {
      console.error("Database error:", error.message);

      return new Response("Internal error occurred", { status: 500 });
    }
  },
};
```