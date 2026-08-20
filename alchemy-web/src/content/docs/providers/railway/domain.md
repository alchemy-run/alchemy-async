---
title: Domain
description: Add domains to Railway services using Alchemy.
---

The `Domain` resource creates and manages domains for [Railway](https://railway.com) services. You can create Railway-generated domains (*.up.railway.app) or attach custom domains.

## Railway Domain

Get a Railway-generated domain:

```ts
import { Project, Service, Domain } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", {
  project,
  name: "api",
  source: { image: "node:20" },
});

const domain = await Domain("api-domain", {
  service: api,
  environment: project.defaultEnvironmentId,
});

console.log(`https://${domain.domain}`);
// e.g. https://api-production-xxxx.up.railway.app
```

## Custom Domain

Attach a custom domain to a service:

```ts
import { Project, Service, Domain } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", { project, name: "api" });

const domain = await Domain("custom", {
  service: api,
  environment: project.defaultEnvironmentId,
  domain: "api.example.com",
  projectId: project.projectId,
});
```

## With Target Port

Route traffic to a specific port:

```ts
import { Project, Service, Domain } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const api = await Service("api", { project, name: "api" });

const domain = await Domain("api-domain", {
  service: api,
  environment: project.defaultEnvironmentId,
  targetPort: 3000,
});
```

:::note
Domain names are immutable. If the custom domain changes, the domain will be replaced (deleted and recreated).
:::
