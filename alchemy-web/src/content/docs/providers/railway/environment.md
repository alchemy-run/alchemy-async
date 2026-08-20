---
title: Environment
description: Create and manage Railway environments using Alchemy.
---

The `Environment` resource creates and manages environments within a [Railway](https://railway.com) project. Environments provide isolated deployments for staging, development, or feature branches.

## Minimal Example

Create a staging environment:

```ts
import { Project, Environment } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const staging = await Environment("staging", {
  project,
  name: "staging",
});
```

## With Project ID

Reference a project by its ID string:

```ts
import { Environment } from "alchemy/railway";

const env = await Environment("dev", {
  project: "project-id-123",
  name: "development",
});
```

## Adopt Existing

Adopt an environment that already exists:

```ts
import { Project, Environment } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const env = await Environment("staging", {
  project,
  name: "staging",
  adopt: true,
});
```

:::note
Environment names are immutable in Railway. If the name changes, the environment will be replaced (deleted and recreated).
:::
