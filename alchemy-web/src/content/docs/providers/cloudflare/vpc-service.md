---
title: VpcService
description: Connect Cloudflare Workers to private network services securely through Cloudflare Tunnel.
---

[Cloudflare VPC Services](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/) enable Workers to securely access private network resources through Cloudflare Tunnel.

## Minimal Example

Create a VPC service that routes to a local hostname through a tunnel:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("my-tunnel", {
  ingress: [{ service: "http://localhost:3000" }],
});

const vpcService = await VpcService("my-service", {
  host: {
    hostname: "localhost",
    resolverNetwork: {
      tunnel,
      resolverIps: ["127.0.0.1"],
    },
  },
});
```

## With IPv4 Address

Route to a service using an IPv4 address:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("internal-tunnel", {
  ingress: [{ service: "http://192.168.1.100:8080" }],
});

const vpcService = await VpcService("internal-api", {
  host: {
    ipv4: "192.168.1.100",
    network: { tunnel },
  },
});
```

## With IPv6 Address

Route to a service using an IPv6 address:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("ipv6-tunnel", {
  ingress: [{ service: "http://[::1]:8080" }],
});

const vpcService = await VpcService("ipv6-service", {
  host: {
    ipv6: "::1",
    network: { tunnel },
  },
});
```

## With Dual Stack

Route to a service that supports both IPv4 and IPv6:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("dual-stack-tunnel", {
  ingress: [{ service: "http://localhost:8080" }],
});

const vpcService = await VpcService("dual-stack-service", {
  host: {
    ipv4: "192.168.1.100",
    ipv6: "::1",
    network: { tunnel },
  },
});
```

## With Custom Ports

Configure custom HTTP and HTTPS ports:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("custom-port-tunnel", {
  ingress: [{ service: "http://localhost:5173" }],
});

const vpcService = await VpcService("dev-server", {
  httpPort: 5173,
  httpsPort: 5174,
  host: {
    hostname: "localhost",
    resolverNetwork: {
      tunnel,
      resolverIps: ["127.0.0.1"],
    },
  },
});
```

## Bind to a Worker

Use a VPC service binding in a Cloudflare Worker to access private services:

```ts
import { Tunnel, VpcService, Worker } from "alchemy/cloudflare";

const tunnel = await Tunnel("api-tunnel", {
  ingress: [{ service: "http://internal-api:8080" }],
});

const vpcService = await VpcService("private-api", {
  httpPort: 8080,
  host: {
    hostname: "internal-api",
    resolverNetwork: {
      tunnel,
      resolverIps: ["10.0.0.1"],
    },
  },
});

const worker = await Worker("api-gateway", {
  entrypoint: "./src/worker.ts",
  bindings: {
    PRIVATE_API: vpcService,
  },
});
```

Then in your Worker code, use the binding to fetch from the private service:

```ts
export default {
  async fetch(request: Request, env: { PRIVATE_API: Fetcher }) {
    // The VPC service routes this request through the tunnel
    // to your private network
    return await env.PRIVATE_API.fetch("http://internal-api/data");
  },
};
```

:::note
The URL passed to `fetch()` affects HTTP headers and SNI values, but the actual routing is determined by the VPC Service configuration (host and ports).
:::

## With Existing Tunnel ID

Reference an existing tunnel by its ID instead of using a Tunnel resource:

```ts
import { VpcService } from "alchemy/cloudflare";

const vpcService = await VpcService("existing-tunnel-service", {
  host: {
    hostname: "internal.example.com",
    resolverNetwork: {
      tunnelId: "e6a0817c-79c5-40ca-9776-a1c019defe70",
      resolverIps: ["10.0.0.53"],
    },
  },
});
```

## Adopting Existing Services

Take over management of an existing VPC service:

```ts
import { Tunnel, VpcService } from "alchemy/cloudflare";

const tunnel = await Tunnel("adopted-tunnel", {
  ingress: [{ service: "http://localhost:3000" }],
});

const vpcService = await VpcService("adopted-service", {
  name: "existing-service-name",
  adopt: true,
  host: {
    hostname: "localhost",
    resolverNetwork: { tunnel },
  },
});
```

## Reference Existing VPC Service

Use `VpcServiceRef` to reference an existing VPC service without managing its lifecycle.

You can reference a VPC service by the Cloudflare-assigned ID or by name:

```ts
// Reference by Cloudflare-assigned ID

import { VpcServiceRef } from "alchemy/cloudflare";

const vpcService = await VpcServiceRef({
  serviceId: "123e4567-e89b-12d3-a456-426614174000",
});
```

```ts
// Reference by name

import { VpcServiceRef } from "alchemy/cloudflare";

const vpcService = await VpcServiceRef({
  name: "existing-vpc-service",
});
```

:::tip
`VpcServiceRef` is useful when you want to bind to a VPC service that was created outside of your current Alchemy deployment, or when you want to share a single VPC service across multiple deployments without coupling their lifecycles.
:::

## Host Configuration Options

### Hostname Host

Use DNS resolution to reach the service:

| Property | Type | Description |
|----------|------|-------------|
| `hostname` | `string` | The hostname to resolve |
| `resolverNetwork.tunnel` | `Tunnel` | The tunnel resource to use |
| `resolverNetwork.tunnelId` | `string` | Alternative: existing tunnel ID |
| `resolverNetwork.resolverIps` | `string[]` | Optional DNS resolver IPs |

### IP Address Host

Use a direct IP address:

| Property | Type | Description |
|----------|------|-------------|
| `ipv4` | `string` | IPv4 address of the service |
| `ipv6` | `string` | IPv6 address of the service |
| `network.tunnel` | `Tunnel` | The tunnel resource to use |
| `network.tunnelId` | `string` | Alternative: existing tunnel ID |

## Port Configuration

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `httpPort` | `number` | 80 | Port for HTTP traffic |
| `httpsPort` | `number` | 443 | Port for HTTPS traffic |
| `tcpPort` | `number` | - | Port for TCP traffic (future support) |
| `appProtocol` | `string` | - | Application protocol identifier |

:::tip
VPC Services currently support HTTP service type. TCP support is planned for the future.
:::

## Access Control

To use VPC Services, users need the appropriate Cloudflare roles:

- **Bind to services**: Requires "Connectivity Directory Bind" role
- **Create/manage services**: Requires "Connectivity Directory Admin" role

If you use `alchemy login`, these scopes are included by default.
