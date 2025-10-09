---
title: Apps & Stages
description: Deploy isolates copies of your application's infrastructure with stages.
sidebar:
  order: 0
---

An Alchemy **App** is a collection of **Stages** where each deployed Stage is an isolated copy of your Resources including Workers, Databases, Queues, etc.

## App

You can create an app with the `alchemy` function, typically in your `alchemy.run.ts` file.

```ts
// alchemy.run.ts
import alchemy from "alchemy";

const app = await alchemy("my-app");

// create your resources here...
await Worker("api", {
  entrypoint: "./src/worker.ts",
});

// clean up any unused resources from the application
await app.finalize();
```

:::note
Each App has a name, e.g. `"my-app"` that should should be unique and stable within your organization.
:::

## Stage

Inside each App are 1 or more Stages containing the actual Resources. When you run `alchemy deploy`, you are actually deploying a specific stage of your application.

```sh
alchemy deploy # deploys the default $USER stage
```

By default (when running locally) the stage will be your username (`$USER`, or `$USERNAME` on Windows). You can also specify a stage with the `--stage` flag:

```sh
alchemy deploy --stage prod
```

## Recommended Setup

A typical setup for a team is to have a single app with multiple stages:

1. **Personal Stage** - each developer runs `alchemy deploy` or `alchemy dev` and uses the default `$USER` stage
2. **Pull Request Stage** - each Pull Request deploys its own stage, `pr-${pull-request-number}` 
3. **Production Stage** - deploy the `main` branch is deployed to the `prod` stage

:::note
See the [CI](/guides/ci) guide for more information on how to set up CI/CD pipelines for Alchemy projects with GitHub Actions, automated deployments, and PR previews.
:::