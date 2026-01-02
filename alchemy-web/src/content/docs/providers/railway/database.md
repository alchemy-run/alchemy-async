---
title: Databases
description: Learn how to deploy databases on Railway with Alchemy
---

Railway provides managed database services for PostgreSQL, MySQL, Redis, and MongoDB.

## Authentication

To use these resources, set `RAILWAY_API_TOKEN` in your `.env` file.

## PostgreSQL

### Basic Usage

```ts
import { Project, PostgresDatabase } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const db = await PostgresDatabase("db", {
  project,
  name: "postgres",
});

// Use the connection URL
console.log(db.connectionUrl);  // Secret
console.log(db.host);           // hostname
console.log(db.port);           // 5432
console.log(db.database);       // database name
console.log(db.user);           // username
console.log(db.password);       // Secret
```

### With Service

```ts
import { Project, Service, PostgresDatabase, Variable } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const db = await PostgresDatabase("db", { project });

const api = await Service("api", {
  project,
  source: { repo: "myorg/api" },
});

// Connect the database to the service
const productionEnv = project.environments[0];
await Variable("db-url", {
  project,
  environment: productionEnv.id,
  service: api,
  name: "DATABASE_URL",
  value: db.connectionUrl,
});
```

## MySQL

```ts
import { Project, MysqlDatabase } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const db = await MysqlDatabase("mysql", {
  project,
  name: "mysql-db",
});

console.log(db.connectionUrl);  // mysql://...
console.log(db.host);
console.log(db.port);           // 3306
console.log(db.database);
console.log(db.user);
console.log(db.password);
```

## Redis

```ts
import { Project, RedisDatabase } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const redis = await RedisDatabase("cache", {
  project,
  name: "redis-cache",
});

console.log(redis.connectionUrl);  // redis://...
console.log(redis.host);
console.log(redis.port);           // 6379
console.log(redis.password);
```

## MongoDB

```ts
import { Project, MongoDatabase } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const mongo = await MongoDatabase("mongo", {
  project,
  name: "mongodb",
});

console.log(mongo.connectionUrl);  // mongodb://...
```

## Properties (All Databases)

| Property | Type | Description |
|----------|------|-------------|
| `project` | `string \| Project` | The project to create the database in |
| `environment` | `string \| Environment` | Target environment (optional) |
| `name` | `string` | Name of the database service |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

### PostgreSQL / MySQL

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The service ID |
| `connectionUrl` | `Secret` | Full connection URL |
| `host` | `string` | Database host |
| `port` | `number` | Database port |
| `database` | `string` | Database name |
| `user` | `string` | Database user |
| `password` | `Secret` | Database password |

### Redis

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The service ID |
| `connectionUrl` | `Secret` | Full connection URL |
| `host` | `string` | Redis host |
| `port` | `number` | Redis port (6379) |
| `password` | `Secret` | Redis password |

### MongoDB

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The service ID |
| `connectionUrl` | `Secret` | Full connection URL |

## Data Persistence

By default, databases are deleted when removed from Alchemy. To preserve data:

```ts
const db = await PostgresDatabase("db", {
  project,
  delete: false,  // Database will not be deleted
});
```
