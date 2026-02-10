---
title: DefaultRole
description: Learn how to create and manage the default PostgreSQL role for PlanetScale PostgreSQL branches using Alchemy.
---

The DefaultRole resource creates and manages the [default role](https://planetscale.com/docs/postgres/roles#default-role) for a PlanetScale PostgreSQL database branch. Each database and branch combination has at most one default role; creating it gives you the credentials needed to connect (host, username, password, and connection URLs).

:::note
DefaultRole is only available for PostgreSQL databases. For MySQL databases, use the [Password](/providers/planetscale/password) resource instead.
:::

## Minimal Example

Create the default role for a PostgreSQL database's main branch:

```ts
import { Database, DefaultRole } from "alchemy/planetscale";

const database = await Database("my-db", {
  name: "my-database",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
});

const defaultRole = await DefaultRole("my-default-role", {
  database,
});
```

## Default Role Already Exists

Only one default role exists per database and branch. If you try to create a default role when one already exists (e.g. from another Alchemy resource or the PlanetScale console), the call will throw. Use `forceReset: true` to reset the existing default role and receive new credentials:

```ts
import { DefaultRole } from "alchemy/planetscale";

// Fails if a default role already exists for this database and branch
const defaultRole = await DefaultRole("my-default-role", {
  database,
});

// Reset the existing default role and get new credentials (new ID and password)
const resetRole = await DefaultRole("my-default-role", {
  database,
  forceReset: true,
});
```

:::warning
`forceReset` deletes the existing default role and creates a new one. Any existing connection strings or stored credentials will stop working. Use only when you intend to rotate credentials or adopt the default role into Alchemy.
:::

## Default Role for a Specific Branch

Create the default role for a branch other than `main`:

```ts
import { Database, Branch, DefaultRole } from "alchemy/planetscale";

const database = await Database("my-db", {
  name: "my-database",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
});

const branch = await Branch("dev-branch", {
  name: "development",
  organization: "my-org",
  database,
  parentBranch: "main",
});

const defaultRole = await DefaultRole("dev-default-role", {
  database,
  branch,
});
```

## Default Role with Named Database and Branch

You can pass the database and branch as strings when they are defined outside of Alchemy:

```ts
import { DefaultRole } from "alchemy/planetscale";

const defaultRole = await DefaultRole("my-default-role", {
  organization: "my-org", // Required when using string database name
  database: "my-database",
  branch: "main",
});
```

:::warning
If the database is provided as a string, you must set the `organization` property or the `PLANETSCALE_ORGANIZATION` environment variable.
:::

## Accessing Connection Details

DefaultRole returns the same connection shape as [Role](/providers/planetscale/role):

```ts
import { DefaultRole } from "alchemy/planetscale";

const defaultRole = await DefaultRole("my-default-role", {
  database,
});

console.log("Host:", defaultRole.host);
console.log("Username:", defaultRole.username);
console.log("Database Name:", defaultRole.databaseName);
console.log("Expires At:", defaultRole.expiresAt);

// Connection URLs (secrets)
const directConnection = defaultRole.connectionUrl;       // Port 5432
const pooledConnection = defaultRole.connectionUrlPooled; // Port 6432 (recommended)
```

## Using with Hyperdrive

DefaultRole works with Cloudflare Hyperdrive for connection pooling:

```ts
import { Database, DefaultRole } from "alchemy/planetscale";
import { Hyperdrive } from "alchemy/cloudflare";

const database = await Database("my-db", {
  name: "my-database",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
});

const defaultRole = await DefaultRole("my-default-role", {
  database,
});

const hyperdrive = await Hyperdrive("my-hyperdrive", {
  origin: defaultRole.connectionUrl,
  caching: { disabled: true },
});
```

## DefaultRole vs Role

- **DefaultRole**: One per database and branch. Use it when you want the single default credential set for that branch (e.g. for app connections or Hyperdrive). No custom permissions; you get the branch’s default role as defined by PlanetScale.
- **Role**: Multiple named roles per database and branch with configurable `inheritedRoles`, TTL, and optional `delete` behavior. Use when you need distinct users or least-privilege access.

For MySQL, use [Password](/providers/planetscale/password) instead of DefaultRole or Role.
