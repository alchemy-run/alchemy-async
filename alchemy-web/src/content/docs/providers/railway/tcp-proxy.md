---
title: TCPProxy
description: Expose non-HTTP Railway services via TCP using Alchemy.
---

The `TCPProxy` resource creates and manages TCP proxies for [Railway](https://railway.com) services. This is useful for exposing databases, Redis, and other non-HTTP services externally.

## Minimal Example

Expose a service via TCP:

```ts
import { Project, Service, TCPProxy } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const db = await Service("postgres", {
  project,
  name: "postgres",
  source: { image: "postgres:16" },
});

const proxy = await TCPProxy("db-proxy", {
  service: db,
  environment: project.defaultEnvironmentId,
  applicationPort: 5432,
});

console.log(`postgres://user:pass@${proxy.domain}:${proxy.proxyPort}/mydb`);
```

## Redis Proxy

Expose a Redis service externally:

```ts
import { Project, Service, TCPProxy } from "alchemy/railway";

const project = await Project("my-app", { name: "my-app" });
const redis = await Service("redis", {
  project,
  name: "redis",
  source: { image: "redis:7" },
});

const proxy = await TCPProxy("redis-proxy", {
  service: redis,
  environment: project.defaultEnvironmentId,
  applicationPort: 6379,
});

console.log(`redis://${proxy.domain}:${proxy.proxyPort}`);
```

:::note
The `applicationPort` is immutable. If it changes, the TCP proxy will be replaced (deleted and recreated).
:::
