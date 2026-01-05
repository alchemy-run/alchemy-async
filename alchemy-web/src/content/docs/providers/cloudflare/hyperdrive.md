---
title: Hyperdrive
description: Learn how to configure and use Cloudflare Hyperdrive using Alchemy to accelerate access to your existing databases.
---

[Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/) provides serverless connection pooling and caching for PostgreSQL databases.

## Minimal Example

Create a basic Hyperdrive connection to a PostgreSQL database.

```ts
import { Hyperdrive } from "alchemy/cloudflare";

const db = await Hyperdrive("my-postgres-db", {
  name: "my-postgres-db",
  origin: "postgresql://user:password@ep-example-host-1234.us-east-1.aws.neon.tech/mydb?sslmode=require",
});
```

:::tip
Your origin can be a string, secret, or an object containing connection parameters.
:::

## With Local Origin

If you want to use a local database for development, you can set the `dev.origin` property.

This will be used by Miniflare to connect to the local database.

```ts
const db = await Hyperdrive("my-postgres-db", {
  name: "my-postgres-db",
  origin: "postgresql://user:password@ep-example-host-1234.us-east-1.aws.neon.tech/mydb?sslmode=require",
  dev: {
    origin: "postgres://user:password@localhost:5432/postgres",
  },
});
```

## With Remote Development

If you want to use the remote Hyperdrive even when running in local/watch mode, set `dev.remote: true`.

This is useful when you need to test against the actual Cloudflare Hyperdrive connection pooling during development.

```ts
const db = await Hyperdrive("my-postgres-db", {
  name: "my-postgres-db",
  origin: "postgresql://user:password@ep-example-host-1234.us-east-1.aws.neon.tech/mydb?sslmode=require",
  dev: {
    remote: true,
  },
});
```

:::tip
When `dev.remote` is `true`, the Hyperdrive configuration will be deployed to Cloudflare even in local development mode, allowing you to test the actual connection pooling behavior.
:::

## With Explicit Origin Object

If you'd prefer to set parameters explicitly, you can use an object.

```ts
const db = await Hyperdrive("my-postgres-db", {
  name: "my-postgres-db",
  origin: {
    database: "postgres",
    host: "database.example.com",
    password: "password",
    port: 5432,
    user: "postgres",
  },
});
```

:::tip
Your password can be a string or a secret. If you provide a string, Alchemy will convert it to a secret for you.
:::

## With Caching Disabled

Create a Hyperdrive connection with caching disabled.

```ts
const noCacheDb = await Hyperdrive("no-cache-db", {
  name: "no-cache-db",
  origin: {
    database: "postgres",
    host: "database.example.com",
    password: alchemy.secret.env.DB_PASSWORD,
    port: 5432,
    user: "postgres",
  },
  caching: {
    disabled: true,
  },
});
```

## With mTLS Configuration

Create a Hyperdrive connection with mTLS security.

```ts
const secureDb = await Hyperdrive("secure-db", {
  name: "secure-db",
  origin: {
    database: "postgres",
    host: "database.example.com",
    password: alchemy.secret.env.DB_PASSWORD,
    port: 5432,
    user: "postgres",
  },
  mtls: {
    ca_certificate_id: "00000000-0000-0000-0000-0000000000",
    mtls_certificate_id: "00000000-0000-0000-0000-0000000000",
    sslmode: "verify-full",
  },
});
```

## With Access Client Credentials

Create a Hyperdrive connection using access client credentials.

```ts
const accessDb = await Hyperdrive("access-db", {
  name: "access-db",
  origin: {
    database: "postgres",
    host: "database.example.com",
    access_client_id: "client-id",
    access_client_secret: alchemy.secret.env.ACCESS_CLIENT_SECRET,
    port: 5432,
    user: "postgres",
  },
});
```

## Bind to a Worker

Use Hyperdrive with a Cloudflare Worker.

```ts
import { Worker, Hyperdrive } from "alchemy/cloudflare";

const db = await Hyperdrive("my-db", {
  name: "my-db",
  origin: {
    database: "postgres",
    host: "database.example.com",
    password: alchemy.secret("password"),
    user: "postgres",
  },
});

await Worker("my-worker", {
  name: "my-worker",
  script: "console.log('Hello, world!')",
  bindings: {
    DB: db,
  },
});
```

## Reference Existing Hyperdrive

Use `HyperdriveRef` to reference an existing Hyperdrive configuration without managing its lifecycle.

You can reference a Hyperdrive by its name or by its UUID:

```ts
import { Worker, HyperdriveRef } from "alchemy/cloudflare";

// Reference by name (Alchemy will look it up using the API)
const dbRefByName = await HyperdriveRef({
  name: "existing-hyperdrive-config",
});

// Reference by UUID (direct reference)
const dbRefById = await HyperdriveRef({
  id: "asd83q1asd...",
});

await Worker("my-worker", {
  name: "my-worker",
  script: "console.log('Hello, world!')",
  bindings: {
    DB: dbRefByName, // or dbRefById
  },
});
```

:::tip
`HyperdriveRef` is useful when you want to bind to a Hyperdrive configuration that was created outside of your current Alchemy deployment, or when you want to share a single Hyperdrive across multiple deployments without coupling their lifecycles.
:::
