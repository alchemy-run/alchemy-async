---
title: PlanetScale on Alchemy
date: 2026-05-21
author: Sam Goodwin
excerpt: PlanetScale MySQL and PostgreSQL are now first-class resources in Alchemy. Define a database, branch it for a feature, and wire it into a Worker through Hyperdrive — all in a single TypeScript file.
---

Alchemy now ships first-class resources for [PlanetScale](https://planetscale.com), covering both their serverless MySQL and PostgreSQL offerings. You can stand up a database, fork a branch for a feature, mint scoped credentials, and pipe the whole thing into a Cloudflare Worker through Hyperdrive — without ever leaving your `alchemy.run.ts`.

This is the workflow I've wanted from a serverless database for a long time: real branching, in code, treated as just another resource.

<!-- excerpt -->

## Postgres in one file

Here's the whole thing — a PlanetScale Postgres database, a default role with credentials, a Hyperdrive in front of it, and a Worker that talks to it:

```ts
import alchemy from "alchemy";
import { Hyperdrive, Worker } from "alchemy/cloudflare";
import { Database, DefaultRole } from "alchemy/planetscale";

const app = await alchemy("my-app");

const database = await Database("db", {
  name: "my-app-db",
  clusterSize: "PS_10",
  kind: "postgresql",
});

const role = await DefaultRole("db-role", {
  database,
});

const hyperdrive = await Hyperdrive("db-hyperdrive", {
  origin: role.connectionUrl,
});

export const worker = await Worker("api", {
  entrypoint: "./src/index.ts",
  compatibility: "node",
  bindings: {
    HYPERDRIVE: hyperdrive,
  },
});

await app.finalize();
```

`role.connectionUrl` is a `Secret` — Alchemy keeps it encrypted at rest in your state file and unwraps it when handing it to Hyperdrive. From the Worker's perspective, it's a normal Hyperdrive binding:

```ts
// src/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema.ts";

export default {
  async fetch(_req: Request, env: Env) {
    const db = drizzle(env.HYPERDRIVE.connectionString, { schema });
    const users = await db.select().from(schema.users);
    return Response.json(users);
  },
};
```

That's it. `bun alchemy deploy` provisions the database, generates credentials, configures Hyperdrive, and deploys the Worker. `bun alchemy destroy` tears it all down.

## Branching is the whole point

The reason PlanetScale is exciting is the branching workflow. You can fork your production database the same way you fork a git branch — schema, optionally data, isolated cluster — and Alchemy makes that feel native.

```ts
import { Branch, DefaultRole } from "alchemy/planetscale";

const featureBranch = await Branch("feature-checkout", {
  name: "feature-checkout",
  database,
  parentBranch: "main",
  isProduction: false,
  safeMigrations: true,
});

const featureRole = await DefaultRole("feature-role", {
  database,
  branch: featureBranch,
});

const featureHyperdrive = await Hyperdrive("feature-hyperdrive", {
  origin: featureRole.connectionUrl,
});
```

Now wire `featureHyperdrive` into a preview Worker and you have a full isolated database-per-PR setup with about ten lines of code. Drop the branch when the feature merges and the cluster goes with it.

If you'd rather seed from the last successful backup, that's a single property:

```ts
const seededBranch = await Branch("seeded-dev", {
  name: "seeded-dev",
  database,
  parentBranch: "main",
  seedData: "last_successful_backup",
});
```

## Roles for least privilege

For Postgres, the `Role` resource gives you scoped credentials with inherited permissions and an optional TTL — perfect for short-lived environments or per-service access:

```ts
import { Role } from "alchemy/planetscale";

const readerRole = await Role("reader", {
  database,
  branch: database.defaultBranch,
  inheritedRoles: ["pg_read_all_data", "pg_read_all_settings"],
});

const ephemeralAdmin = await Role("migration-runner", {
  database,
  branch: featureBranch,
  inheritedRoles: ["postgres"],
  ttl: 3600, // expires after an hour
});
```

Every role exposes `connectionUrl` (direct, port 5432) and `connectionUrlPooled` (port 6432) as secrets. Hand either to Hyperdrive and you're done.

## MySQL works the same way

If you're on MySQL, swap `Role`/`DefaultRole` for `Password`:

```ts
import { Database, Branch, Password } from "alchemy/planetscale";

const database = await Database("db", {
  name: "my-app-db",
  clusterSize: "PS_10",
  // kind defaults to "mysql"
});

const devBranch = await Branch("dev", {
  name: "dev",
  database,
  parentBranch: "main",
  isProduction: false,
});

const writer = await Password("writer", {
  database,
  branch: devBranch,
  role: "writer",
  ttl: 86400, // 24 hours
});

console.log(writer.host, writer.username, writer.password.unencrypted);
```

Same Hyperdrive story — pass the connection string to `Hyperdrive` and bind it to your Worker.

## Why this matters

PlanetScale + Hyperdrive + Workers is one of the strongest serverless data stacks available right now. The piece that's been missing is a way to drive the whole thing from one file, with state tracking, ephemeral environments, and zero clicking around dashboards.

That's what these resources unlock. A feature branch in git can now own a real, isolated database branch — provisioned, connected, and torn down by the same `alchemy.run.ts` that ships your code.

Get started: [PlanetScale guide](/providers/planetscale/) · [Hyperdrive](/providers/cloudflare/hyperdrive)

---

## Also in this release

- **Cloudflare Zero Trust Access resources.** You can now define Access Applications, Policies, Groups, Identity Providers, and Service Tokens directly in Alchemy — so the auth layer in front of your Workers and tunnels lives in the same file as everything else. See the [Access docs](/providers/cloudflare/access-application) to get started.
