---
title: Prisma
description: Learn how to manage Prisma databases, connections, and projects using Alchemy.
---

Prisma provides a managed postgres database service. Alchemy provides resource to manage Prisma databases, connections, and projects programmatically.

[Official Prisma Documentation](https://www.prisma.io/docs) | [Prisma API Reference](https://www.prisma.io/docs/orm/prisma-api)

## Resources

- [Database](/providers/prisma/database) - Create and manage Prisma databases with configuration options
- [DatabaseConnection](/providers/prisma/database-connection) - Create and manage Prisma database connections with configuration options
- [Project](/providers/prisma/project) - Create and manage Prisma projects with configuration options
- [WorkspaceRef](/providers/prisma/workspace) - reference Prisma workspaces by name or id

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
import { Database, DatabaseConnection, Project } from "alchemy/prisma";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project");

const database = await Database("database", {
  project,
  region: "us-east-1",
});

const connection = await DatabaseConnection("connection", {
  database,
  name: "connection",
});

const db = await Hyperdrive("prisma-postgres", {
  name: "prisma-postgres",
  origin: `postgres://${connection.user}:${connection.password?.unencrypted}@${connection.host}/${connection.database}`,
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