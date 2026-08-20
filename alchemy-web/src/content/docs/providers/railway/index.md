---
title: Railway
description: Deploy and manage Railway projects, services, environments, variables, volumes, domains, and TCP proxies using Alchemy.
---

Railway is a cloud infrastructure platform for deploying applications, databases, and services with zero configuration. Alchemy provides resources to manage Railway infrastructure programmatically using the Railway GraphQL API.

[Official Railway Documentation](https://docs.railway.com) | [Railway API Reference](https://docs.railway.com/guides/public-api)

## Resources

- [Project](/providers/railway/project) - Create and manage Railway projects
- [Service](/providers/railway/service) - Deploy and configure services within projects
- [Environment](/providers/railway/environment) - Create isolated environments for staging, development, etc.
- [Variable](/providers/railway/variable) - Manage environment variables for services
- [Volume](/providers/railway/volume) - Attach persistent storage to services
- [Domain](/providers/railway/domain) - Add Railway-generated or custom domains to services
- [TCPProxy](/providers/railway/tcp-proxy) - Expose non-HTTP services via TCP

## Authentication

Railway uses API tokens for authentication. Set the `RAILWAY_API_TOKEN` environment variable, or pass the token directly via the `apiToken` property on any resource.

```bash
export RAILWAY_API_TOKEN=your-token-here
```

You can create an API token from your [Railway account settings](https://railway.com/account/tokens).

## Example Usage

```ts
import {
  Project,
  Service,
  Variable,
  Domain,
} from "alchemy/railway";

// Create a project
const project = await Project("my-app", {
  name: "my-app",
  description: "Production application",
});

// Deploy a service
const api = await Service("api", {
  project,
  name: "api-service",
  source: { image: "node:20" },
  startCommand: "node server.js",
});

// Set environment variables
await Variable("api-vars", {
  project,
  environment: project.defaultEnvironmentId,
  service: api,
  variables: {
    NODE_ENV: "production",
    PORT: "3000",
    DATABASE_URL: alchemy.secret.env.DATABASE_URL,
  },
});

// Add a domain
const domain = await Domain("api-domain", {
  service: api,
  environment: project.defaultEnvironmentId,
});

console.log(`API available at: https://${domain.domain}`);
```
