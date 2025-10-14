# Prisma Postgres Provider

The Prisma Postgres provider lets you manage Prisma Postgres projects, databases, connection strings, and backup metadata through Alchemy. It interacts with the [Prisma Postgres Management API](https://www.prisma.io/docs/postgres/introduction/management-api) using a workspace service token.

## Authentication

Set the `PRISMA_SERVICE_TOKEN` environment variable or pass `serviceToken` on individual resources. Service tokens are scoped to a Prisma workspace.

## Resources

- [Workspace](./workspace.ts) – look up workspace metadata by id or name
- [Project](./project.ts) – create or adopt Prisma Postgres projects
- [Database](./database.ts) – provision databases and restore from backups
- [DatabaseConnection](./database-connection.ts) – create and manage database connection strings
- [DatabaseBackups](./database-backups.ts) – list available backups and retention metadata

## Usage

```ts
import { Project, Database, DatabaseConnection } from "alchemy/prisma/postgres";

const project = await Project("app-project", {
  name: "app-project",
  region: "us-east-1",
  createDatabase: false,
});

const database = await Database("primary", {
  project,
  name: "primary",
  region: "us-east-1",
});

const connection = await DatabaseConnection("primary-conn", {
  database,
  name: "app",
});
```

## Environment Variables

| Variable                | Description                            |
| ----------------------- | -------------------------------------- |
| `PRISMA_SERVICE_TOKEN`  | Prisma Postgres workspace service token |
