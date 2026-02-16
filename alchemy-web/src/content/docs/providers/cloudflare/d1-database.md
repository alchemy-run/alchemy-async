---
title: D1Database
description: Learn how to create, query, and manage Cloudflare D1 Databases using Alchemy for serverless SQL databases.
---

The D1Database component lets you add [Cloudflare D1 Databases](https://developers.cloudflare.com/d1/) to your app.

```ts
import { D1Database } from "alchemy/cloudflare";

const db = await D1Database("my-db", {
  name: "my-db",
});

const worker = await Worker("my-worker", {
  entrypoint: "./worker.ts",
  bindings: {
    DB: db,
  },
});
```

## Migrations

Create a database with SQL migrations.

```ts
import { D1Database } from "alchemy/cloudflare";

const db = await D1Database("users-db", {
  name: "users-db",
  migrationsDir: "./migrations",
});
```

## Custom Migration Table

By default, D1Database uses a table named `d1_migrations` to track migration history. You can customize this table name using the `migrationsTable` property, which is useful for compatibility with tools like Drizzle:

```ts
import { D1Database } from "alchemy/cloudflare";

// Use custom migration table (compatible with Drizzle)
const db = await D1Database("my-db", {
  name: "my-db",
  migrationsDir: "./migrations",
  migrationsTable: "drizzle_migrations",
});
```

If you don't specify `migrationsTable`, it defaults to `d1_migrations`:

```ts
import { D1Database } from "alchemy/cloudflare";

// Uses default migration table 'd1_migrations'
const db = await D1Database("my-db", {
  name: "my-db",
  migrationsDir: "./migrations",
});
```

## Importing Data

Create a database with import SQL files.

```ts
import { D1Database } from "alchemy/cloudflare";

const db = await D1Database("my-db", {
  name: "my-db",
  importFiles: ["./my-file.sql"],
});
```

The import files will be run using [Cloudflare's D1 import API](https://developers.cloudflare.com/d1/best-practices/import-export-data/).

## With Location Hint

Create a database with a specific location hint for optimal performance.

```ts
import { D1Database } from "alchemy/cloudflare";

const db = await D1Database("eu-db", {
  name: "eu-db",
  primaryLocationHint: "weur",
  readReplication: {
    mode: "auto",
  },
});
```

## With Jurisdiction

Create a database with a specific jurisdiction.

```ts
import { D1Database } from "alchemy/cloudflare";

const db = await D1Database("eu-db", {
  name: "eu-db",
  jurisdiction: "eu",
});
```

## Cloning Databases

Create a database by cloning data from an existing database. There are three ways to specify the source database:

## Clone by Database ID

```ts
import { D1Database } from "alchemy/cloudflare";

const clonedDb = await D1Database("clone-db", {
  name: "clone-db",
  clone: { id: "existing-db-uuid" },
});
```

## Clone by Database Name

```ts
import { D1Database } from "alchemy/cloudflare";

const clonedDb = await D1Database("clone-db", {
  name: "clone-db",
  clone: { name: "source-db-name" },
});
```

## Clone from `D1Database`

```ts
import { D1Database } from "alchemy/cloudflare";

// First create or get the source database
const sourceDb = await D1Database("source-db", {
  name: "source-db",
});

// Then create a new database as a clone of the source
const clonedDb = await D1Database("clone-db", {
  name: "clone-db",
  clone: sourceDb,
});
```

## Bind to a Worker

```ts
import { Worker, D1Database } from "alchemy/cloudflare";

const db = await D1Database("my-db", {
  name: "my-db",
});

await Worker("my-worker", {
  name: "my-worker",
  script: "console.log('Hello, world!')",
  bindings: {
    DB: db,
  },
});
```
