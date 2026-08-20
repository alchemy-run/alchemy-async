---
title: Service
description: Deploy and configure Railway services using Alchemy.
---

The `Service` resource creates and manages services within a [Railway](https://railway.com) project.

## Minimal Example

Create a basic service in a project:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const service = await Service("api", {
  project,
  name: "api-service",
});
```

## Docker Image

Deploy a service from a Docker image:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const service = await Service("web", {
  project,
  name: "web-server",
  source: { image: "nginx:latest" },
});
```

## GitHub Repository

Deploy from a GitHub repository:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const service = await Service("api", {
  project,
  name: "api",
  source: { repo: "myorg/myrepo" },
  buildCommand: "npm run build",
  startCommand: "npm start",
});
```

## Custom Configuration

Configure replicas, healthchecks, and more:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const service = await Service("api", {
  project,
  name: "api",
  startCommand: "node server.js",
  healthcheckPath: "/health",
  numReplicas: 2,
  region: "us-west1",
});
```

## Cron Service

Create a scheduled cron job:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });

const cron = await Service("cleanup", {
  project,
  name: "cleanup-job",
  startCommand: "node cleanup.js",
  cronSchedule: "0 0 * * *", // Daily at midnight
});
```

## Specific Environment

Deploy a service in a specific environment:

```ts
import { Project, Service, Environment } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const staging = await Environment("staging", {
  project,
  name: "staging",
});

const service = await Service("api", {
  project,
  name: "api",
  environment: staging,
  startCommand: "npm start",
});
```
