---
title: PlanetScale
description: Learn how to manage PlanetScale MySQL and PostgreSQL databases, branches, and roles using Alchemy.
---

PlanetScale is a serverless database platform that supports both MySQL and PostgreSQL, providing horizontal scaling, branching workflows, and zero-downtime schema changes. Alchemy provides resources to manage PlanetScale databases, branches, and access controls programmatically.

[Official PlanetScale Documentation](https://planetscale.com/docs) | [PlanetScale API Reference](https://api-docs.planetscale.com/)

## Resources

- [Database](/providers/planetscale/database) - Create and manage PlanetScale MySQL and PostgreSQL databases with configuration options
- [Branch](/providers/planetscale/branch) - Create and manage database branches for development workflows
- [Password](/providers/planetscale/password) - Create and manage database passwords with specific roles and permissions (MySQL only)
- [Role](/providers/planetscale/role) - Create and manage database roles with inherited permissions (PostgreSQL only)

## MySQL Example

```ts
import { Database, Branch, Password } from "alchemy/planetscale";

// Create a MySQL database
const database = await Database("my-app-db", {
  name: "my-app-db",
  organization: "my-org",
  clusterSize: "PS_10",
  allowDataBranching: true,
  automaticMigrations: true,
});

// Create a development branch
const devBranch = await Branch("feature-123", {
  name: "feature-123",
  organization: "my-org",
  database: database,
  parentBranch: "main",
  isProduction: false,
});

// Create passwords for database access (MySQL only)
const readerPassword = await Password("app-reader", {
  name: "app-reader",
  organization: "my-org",
  database: database,
  branchName: "main",
  role: "reader"
});

const writerPassword = await Password("app-writer", {
  name: "app-writer",
  organization: "my-org",
  database: database,
  branchName: devBranch,
  role: "writer",
  ttl: 86400 // 24 hours
});
```

## PostgreSQL Example

```ts
import { Database, Branch, Role } from "alchemy/planetscale";

// Create a PostgreSQL database
const pgDatabase = await Database("my-pg-db", {
  name: "my-pg-db",
  organization: "my-org",
  clusterSize: "PS_10",
  kind: "postgresql",
  allowDataBranching: true,
  automaticMigrations: true,
});

// Create a development branch
const devBranch = await Branch("dev-branch", {
  name: "development",
  organization: "my-org",
  database: pgDatabase,
  parentBranch: "main",
  isProduction: false,
});

// Create roles for database access (PostgreSQL only)
const readerRole = await Role("app-reader", {
  database: pgDatabase,
  branch: pgDatabase.defaultBranch,
  inheritedRoles: ["pg_read_all_data", "pg_read_all_settings"],
});

const adminRole = await Role("app-admin", {
  database: pgDatabase,
  branch: devBranch,
  inheritedRoles: ["postgres"],
  ttl: 3600, // 1 hour
});
```
