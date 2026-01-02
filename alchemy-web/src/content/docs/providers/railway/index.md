---
title: Railway Provider
description: Deploy and manage Railway resources using Alchemy
---

The Railway provider allows you to deploy applications, databases, and infrastructure to [Railway](https://railway.app), a modern platform-as-a-service. With this provider, you can create projects, deploy services from GitHub or Docker, provision databases, and configure networking.

## Authentication

Set `RAILWAY_API_TOKEN` in your `.env` file or pass `apiToken` directly in your resource configuration. You can create an API token from your [Railway account settings](https://railway.com/account/tokens).

## Resources

The Railway provider includes the following resources:

- [Project](/providers/railway/project/) - Create and manage Railway projects
- [Environment](/providers/railway/environment/) - Create deployment environments (staging, production, etc.)
- [Service](/providers/railway/service/) - Deploy applications from GitHub repos or Docker images
- [Domain](/providers/railway/domain/) - Configure custom or Railway-generated domains
- [Variable](/providers/railway/variable/) - Manage environment variables
- [Volume](/providers/railway/volume/) - Create persistent storage
- [TcpProxy](/providers/railway/tcp-proxy/) - Enable TCP access for databases and other services
- [PostgresDatabase](/providers/railway/database/) - Deploy PostgreSQL databases
- [MysqlDatabase](/providers/railway/database/) - Deploy MySQL databases
- [RedisDatabase](/providers/railway/database/) - Deploy Redis databases
- [MongoDatabase](/providers/railway/database/) - Deploy MongoDB databases

## Example

Here's a complete example deploying a web application with a PostgreSQL database:

```typescript
import { alchemy } from "alchemy";
import {
  Project,
  Service,
  PostgresDatabase,
  Domain,
  Variable,
} from "alchemy/railway";

const app = await alchemy("my-app", {
  stage: "production",
});

// Create a Railway project
const project = await Project("my-project", {
  name: "My Application",
  description: "Production application",
});

// Deploy a PostgreSQL database
const db = await PostgresDatabase("db", {
  project,
  name: "postgres",
});

// Deploy the API service from GitHub
const api = await Service("api", {
  project,
  name: "api",
  source: {
    repo: "myorg/api",
    branch: "main",
  },
  startCommand: "npm start",
});

// Get the production environment
const productionEnv = project.environments.find((e) => e.name === "production");

// Set the database URL as an environment variable
if (productionEnv) {
  await Variable("db-url", {
    project,
    environment: productionEnv.id,
    service: api,
    name: "DATABASE_URL",
    value: db.connectionUrl,
  });
}

// Add a domain
const domain = await Domain("api-domain", {
  service: api,
  environment: productionEnv!.id,
});

console.log(`API deployed at: https://${domain.domain}`);

await app.finalize();
```

## Additional Resources

- [Railway Documentation](https://docs.railway.com)
- [Railway API Reference](https://docs.railway.com/reference/public-api)
