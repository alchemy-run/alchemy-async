---
title: TCP Proxy
description: Learn how to configure TCP proxies on Railway with Alchemy
---

Enable external TCP access to your Railway services for databases and other non-HTTP protocols.

## Authentication

To use this resource, set `RAILWAY_API_TOKEN` in your `.env` file.

## Examples

### Database Access

```ts
import { Project, PostgresDatabase, TcpProxy } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const db = await PostgresDatabase("db", { project });

const productionEnv = project.environments[0];

const proxy = await TcpProxy("db-proxy", {
  service: db,
  environment: productionEnv.id,
  applicationPort: 5432,
});

console.log(`Connect to: ${proxy.domain}:${proxy.proxyPort}`);
// e.g., monorail.proxy.rlwy.net:12345
```

### Redis Access

```ts
import { Project, RedisDatabase, TcpProxy } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const redis = await RedisDatabase("cache", { project });

const productionEnv = project.environments[0];

const proxy = await TcpProxy("redis-proxy", {
  service: redis,
  environment: productionEnv.id,
  applicationPort: 6379,
});

// Connect from external applications
// redis-cli -h monorail.proxy.rlwy.net -p 12345 -a <password>
```

### Custom Service

```ts
import { Project, Service, TcpProxy } from "alchemy/railway";

const project = await Project("my-project", {
  name: "My App",
});

const mqService = await Service("rabbitmq", {
  project,
  source: { image: "rabbitmq:3-management" },
});

const productionEnv = project.environments[0];

// Expose AMQP port
const amqpProxy = await TcpProxy("amqp-proxy", {
  service: mqService,
  environment: productionEnv.id,
  applicationPort: 5672,
});
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `service` | `string \| Service` | The service to proxy |
| `environment` | `string \| Environment` | The target environment |
| `applicationPort` | `number` | The port on the service to forward to |
| `delete` | `boolean` | Whether to delete on destroy (default: true) |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The TCP proxy ID |
| `domain` | `string` | The proxy domain (e.g., monorail.proxy.rlwy.net) |
| `proxyPort` | `number` | The external port to connect to |
| `applicationPort` | `number` | The internal application port |
| `serviceId` | `string` | Associated service ID |
| `environmentId` | `string` | Associated environment ID |

## Connection String

To connect to your proxied service:

```
<protocol>://<domain>:<proxyPort>

# PostgreSQL
postgresql://user:pass@monorail.proxy.rlwy.net:12345/dbname

# Redis
redis://default:pass@monorail.proxy.rlwy.net:12346

# MongoDB
mongodb://user:pass@monorail.proxy.rlwy.net:12347/dbname
```

## Use Cases

- **Database Access**: Connect to databases from local development
- **Message Queues**: Expose RabbitMQ, Redis Pub/Sub, etc.
- **Game Servers**: TCP-based game server connections
- **Custom Protocols**: Any non-HTTP TCP service
