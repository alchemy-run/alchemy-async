---
title: Domain
description: Learn how to configure domains on Railway with Alchemy
---

Configure custom domains or Railway-generated domains for your services.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file.

## Examples

### Railway-Generated Domain

```ts
import { Project, Service, Domain } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const api = await Service("api", {
  project,
  source: { image: "nginx:alpine" },
});

const productionEnv = project.environments[0];

const domain = await Domain("api-domain", {
  service: api,
  environment: productionEnv.id,
});

console.log(`Service available at: https://${domain.domain}`);
// e.g., https://api-production-abc123.up.railway.app
```

### Custom Domain

```ts
import { Project, Service, Domain } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const api = await Service("api", {
  project,
  source: { repo: "myorg/api" },
});

const productionEnv = project.environments[0];

const domain = await Domain("custom-domain", {
  service: api,
  environment: productionEnv.id,
  customDomain: "api.example.com",
});

// Don't forget to configure DNS!
// Add a CNAME record pointing api.example.com to your Railway domain
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `service` | `string \| Service` | The service to attach the domain to |
| `environment` | `string \| Environment` | The target environment |
| `customDomain` | `string` | Custom domain (e.g., "api.example.com") |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The domain ID |
| `domain` | `string` | The domain name |
| `serviceId` | `string` | Associated service ID |
| `environmentId` | `string` | Associated environment ID |
| `isCustom` | `boolean` | Whether this is a custom domain |
| `targetPort` | `number` | Target port (if configured) |

## DNS Configuration

For custom domains, you need to configure DNS:

1. **CNAME Record**: Point your custom domain to your Railway-generated domain
2. **SSL**: Railway automatically provisions SSL certificates for custom domains

Example DNS configuration:
```
api.example.com.  CNAME  api-production-abc123.up.railway.app.
```
