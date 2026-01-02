---
title: Service
description: Learn how to deploy services on Railway with Alchemy
---

Deploy applications from GitHub repositories or Docker images to Railway.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file or pass `apiToken` directly in your resource configuration.

## Examples

### Deploy from GitHub

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const api = await Service("api", {
  project,
  name: "api-service",
  source: {
    repo: "myorg/api",
    branch: "main",
  },
});
```

### Deploy from Docker Image

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const nginx = await Service("nginx", {
  project,
  name: "nginx",
  source: {
    image: "nginx:alpine",
  },
});
```

### With Build Configuration

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const app = await Service("app", {
  project,
  source: {
    repo: "myorg/monorepo",
    branch: "main",
  },
  buildCommand: "npm run build",
  startCommand: "npm start",
  rootDirectory: "packages/api",
});
```

### With Environment

```ts
import { Project, Environment, Service } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const staging = await Environment("staging", {
  project,
  name: "staging",
});

const api = await Service("api", {
  project,
  environment: staging,
  source: {
    repo: "myorg/api",
  },
});
```

### With Health Checks

```ts
const api = await Service("api", {
  project,
  source: { image: "myorg/api:latest" },
  healthcheckPath: "/health",
  healthcheckTimeout: 30,
  restartPolicyType: "ON_FAILURE",
  restartPolicyMaxRetries: 3,
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `project` | `string \| Project` | The project to deploy to |
| `environment` | `string \| Environment` | Target environment |
| `name` | `string` | Name of the service |
| `source.repo` | `string` | GitHub repository (e.g., "owner/repo") |
| `source.branch` | `string` | Git branch to deploy |
| `source.image` | `string` | Docker image to deploy |
| `buildCommand` | `string` | Build command |
| `startCommand` | `string` | Start command |
| `rootDirectory` | `string` | Root directory for builds |
| `numReplicas` | `number` | Number of replicas |
| `healthcheckPath` | `string` | Health check endpoint |
| `healthcheckTimeout` | `number` | Health check timeout (seconds) |
| `restartPolicyType` | `string` | Restart policy: ON_FAILURE, ALWAYS, NEVER |
| `restartPolicyMaxRetries` | `number` | Max restart retries |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The service ID |
| `name` | `string` | Name of the service |
| `projectId` | `string` | Parent project ID |
| `createdAt` | `string` | Creation timestamp |
| `domains` | `Array<{id, domain}>` | Associated domains |
