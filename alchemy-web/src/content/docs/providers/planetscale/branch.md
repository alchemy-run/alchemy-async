---
title: Branch
description: Learn how to create and manage PlanetScale database branches for development workflows and production scaling.
---

The Branch resource lets you create and manage [PlanetScale database branches](https://planetscale.com/docs/concepts/branching) for development workflows, allowing you to safely develop schema changes in isolation.

## Minimal Example

Create a development branch from the main branch:

```ts
import { Branch } from "alchemy/planetscale";

const devBranch = await Branch("feature-123", {
  name: "feature-123",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: false,
});
```

## Production Branch with Cluster Size

Create a production branch with specific cluster sizing:

```ts
import { Branch } from "alchemy/planetscale";

const prodBranch = await Branch("production", {
  name: "production",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: true,
  clusterSize: "PS_20",
});
```

## Branch from Another Branch Object

Create a branch using another Branch resource as the parent:

```ts
import { Branch } from "alchemy/planetscale";

const stagingBranch = await Branch("staging", {
  name: "staging",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: false,
});

const featureBranch = await Branch("feature-456", {
  name: "feature-456",
  organization: "my-org",
  database: "my-database",
  parentBranch: stagingBranch, // Using Branch object
  isProduction: false,
});
```

## Branch from Backup

Create a branch restored from a backup:

```ts
import { Branch } from "alchemy/planetscale";

const restoredBranch = await Branch("restored-data", {
  name: "restored-data",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: true,
  backupId: "backup-123",
  clusterSize: "PS_10",
});
```

## Branch with Safe Migrations

Create a branch with safe migrations enabled:

```ts
import { Branch } from "alchemy/planetscale";

const safeBranch = await Branch("safe-migrations", {
  name: "safe-migrations",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: false,
  safeMigrations: true,
});
```

## Adopting Existing Branch

Adopt and manage an existing branch:

```ts
import { Branch } from "alchemy/planetscale";

const existingBranch = await Branch("existing-feature", {
  name: "existing-feature",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: false,
  adopt: true,
  safeMigrations: false,
});
```

## Branch with Seed Data

Create a branch with seeded data from the last successful backup:

```ts
import { Branch } from "alchemy/planetscale";

const seededBranch = await Branch("seeded-dev", {
  name: "seeded-dev",
  organization: "my-org",
  database: "my-database",
  parentBranch: "main",
  isProduction: false,
  seedData: "last_successful_backup",
});
```
