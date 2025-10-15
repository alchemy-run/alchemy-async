---
title: Prisma Postgres
headline: Manage Prisma Postgres projects and databases with Alchemy.
description: Learn how to configure a Prisma Postgres service token and manage projects, databases, and connection strings with Alchemy.
---

## Prerequisites

- A Prisma Postgres workspace
- A service token with workspace access
- `PRISMA_SERVICE_TOKEN` set in your environment

## Install Dependencies

```bash
bun i alchemy
```

## Configure the Service Token

Create a workspace service token in the Prisma dashboard and export it before running Alchemy commands:

```bash
export PRISMA_SERVICE_TOKEN="sk_..."
```

## Create a Project and Database

```ts
import alchemy from "alchemy";
import {
  Project,
  Database,
  Connection,
} from "alchemy/prisma/postgres";

const app = await alchemy("prisma-postgres-example");

const project = await Project("project", {
  name: "prisma-app",
  region: "us-east-1",
  createDatabase: false,
});

const database = await Database("database", {
  project,
  name: "primary",
  region: "us-east-1",
});

const connection = await Connection("connection", {
  database,
  name: "application",
});

console.log("Database URL", connection.connectionString.unencrypted);

await app.finalize();
```

## Cleanup

To remove all resources created by the guide, run:

```bash
alchemy destroy
```
