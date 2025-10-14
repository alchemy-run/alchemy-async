---
title: Database
description: Learn how to create, configure, and manage PlanetScale serverless MySQL and PostgreSQL databases using Alchemy.
---

The Database resource lets you create and manage [PlanetScale databases](https://planetscale.com/docs/concepts/database) with comprehensive configuration options for scaling, migrations, and security. PlanetScale supports both MySQL and PostgreSQL databases.

## Minimal Example

Create a basic MySQL database with default settings:

```ts
import { Database } from "alchemy/planetscale";

const database = await Database("my-app-db", {
  name: "my-app-db",
  organization: "my-org",
  clusterSize: "PS_10",
});
```

## PostgreSQL Database

Create a PostgreSQL database:

```ts
import { Database } from "alchemy/planetscale";

const pgDatabase = await Database("my-pg-db", {
  name: "my-pg-db",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
});
```

## Database with Regional Configuration

Create a database in a specific region with custom settings:

```ts
import { Database } from "alchemy/planetscale";

const database = await Database("eu-app-db", {
  name: "eu-app-db",
  organization: "my-org",
  region: {
    slug: "eu-west",
  },
  clusterSize: "PS_20",
  allowDataBranching: true,
  automaticMigrations: true,
  requireApprovalForDeploy: true,
});
```

## Production Database with Advanced Features

Create a production database with comprehensive configuration:

```ts
import { Database } from "alchemy/planetscale";

const prodDatabase = await Database("production-db", {
  name: "production-db",
  organization: "my-org",
  region: {
    slug: "us-east",
  },
  clusterSize: "PS_40",
  defaultBranch: "production",
  allowDataBranching: true,
  automaticMigrations: false,
  requireApprovalForDeploy: true,
  restrictBranchRegion: true,
  insightsRawQueries: true,
  productionBranchWebConsole: false,
  migrationFramework: "rails",
  migrationTableName: "schema_migrations",
});
```

## Database with Custom API Key

Create a database using a specific API key:

```ts
import { Database } from "alchemy/planetscale";

const database = await Database("custom-auth-db", {
  name: "custom-auth-db",
  organization: "my-org",
  clusterSize: "PS_10",
  apiKey: alchemy.secret(process.env.CUSTOM_PLANETSCALE_TOKEN),
});
```

## PostgreSQL with ARM Architecture

Create a PostgreSQL database with ARM architecture:

```ts
import { Database } from "alchemy/planetscale";

const armDatabase = await Database("arm-pg-db", {
  name: "arm-pg-db",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
  arch: "arm",
});
```

## Adopting Existing Database

Adopt an existing PlanetScale database for management:

```ts
import { Database } from "alchemy/planetscale";

const existingDatabase = await Database("existing-db", {
  name: "existing-db",
  organization: "my-org",
  clusterSize: "PS_20",
  adopt: true,
  allowDataBranching: false,
  automaticMigrations: true,
});
```
