---
title: LoadBalancer
description: Create and manage Hetzner Cloud Load Balancers that distribute traffic across servers.
---

The `LoadBalancer` resource creates and manages a [Hetzner Cloud Load Balancer](https://www.hetzner.com/cloud/load-balancer). It distributes incoming traffic across backend servers or label-selected instances, with configurable services, health checks, and network attachment.

## Simple HTTP Load Balancer

Route HTTP traffic to two servers using the smallest load balancer type:

```ts
import { LoadBalancer, Server } from "alchemy/hetzner";

const web1 = await Server("web-1", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
});

const web2 = await Server("web-2", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
});

const lb = await LoadBalancer("web-lb", {
  loadBalancerType: "lb11",
  location: "nbg1",
  services: [
    {
      protocol: "http",
      listenPort: 80,
      destinationPort: 8080,
      healthCheck: {
        protocol: "http",
        port: 8080,
        http: { path: "/health" },
      },
    },
  ],
  targets: [
    { type: "server", server: web1 },
    { type: "server", server: web2 },
  ],
});

console.log(lb.publicNet.ipv4.ip); // public IPv4 of the load balancer
```

## HTTPS with Sticky Sessions

Terminate TLS and enable session persistence via cookie:

```ts
import { LoadBalancer } from "alchemy/hetzner";

const lb = await LoadBalancer("app-lb", {
  loadBalancerType: "lb21",
  location: "fsn1",
  services: [
    {
      protocol: "https",
      listenPort: 443,
      destinationPort: 3000,
      http: {
        redirectHttp: true,
        stickySessionsCookieName: "LB_SESSION",
        certificates: [12345], // Hetzner managed certificate ID
      },
      healthCheck: {
        protocol: "http",
        port: 3000,
        interval: 10,
        timeout: 5,
        retries: 3,
        http: { path: "/healthz", statusCodes: ["200"] },
      },
    },
  ],
  targets: [
    { type: "label_selector", labelSelector: "app=backend" },
  ],
  labels: { env: "production" },
});
```

## Private Network Load Balancer

Attach the load balancer to a private network and disable the public interface:

```ts
import { LoadBalancer, Network } from "alchemy/hetzner";

const net = await Network("private-net", {
  name: "app-network",
  ipRange: "10.0.0.0/16",
});

const lb = await LoadBalancer("private-lb", {
  loadBalancerType: "lb11",
  location: "hel1",
  network: net,
  publicInterface: false,
  services: [
    {
      protocol: "tcp",
      listenPort: 5432,
      destinationPort: 5432,
    },
  ],
  targets: [
    { type: "server", server: "42", usePrivateIp: true },
  ],
});
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `loadBalancerType` | `string` | — | **Required.** Load balancer plan name, e.g. `"lb11"`, `"lb21"`, `"lb31"`. |
| `location` | `string` | — | Datacenter location, e.g. `"nbg1"`, `"fsn1"`, `"hel1"`. **Immutable** — changing this triggers resource replacement. |
| `services` | `LBService[]` | — | **Required.** One or more port mappings and health check configs (see below). |
| `targets` | `LBTarget[]` | — | **Required.** Backend targets — servers, label selectors, or IP addresses. |
| `name` | `string` | `{app}-{stage}-{id}` | Physical name on Hetzner Cloud. |
| `network` | `string \| NetworkRef` | — | Attach to a private network. Pass a `Network` resource or a numeric network ID as string. |
| `publicInterface` | `boolean` | `true` | Whether to expose a public IPv4/IPv6 address. Set to `false` for private-only load balancers. |
| `labels` | `Record<string, string>` | `{}` | Hetzner resource labels for filtering and tagging. |
| `adopt` | `boolean` | `false` | Adopt an existing load balancer by name instead of failing if it already exists. |
| `apiToken` | `string \| Secret` | `HETZNER_API_TOKEN` env | Hetzner API token. |

### LBService

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `protocol` | `"http" \| "https" \| "tcp"` | — | **Required.** Listener protocol. |
| `listenPort` | `number` | — | **Required.** Port the load balancer accepts traffic on. |
| `destinationPort` | `number` | — | **Required.** Port traffic is forwarded to on backend servers. |
| `proxyprotocol` | `boolean` | `false` | Prepend PROXY protocol header to connections. |
| `http.redirectHttp` | `boolean` | `false` | Redirect plain HTTP to HTTPS (only for `https` protocol). |
| `http.stickySessionsCookieName` | `string` | — | Enable sticky sessions using a cookie with this name. |
| `http.certificates` | `number[]` | `[]` | Hetzner managed certificate IDs for TLS termination. |
| `healthCheck.protocol` | `"http" \| "tcp"` | — | Health check protocol. |
| `healthCheck.port` | `number` | — | Port to health-check on backend servers. |
| `healthCheck.interval` | `number` | `15` | Seconds between checks. |
| `healthCheck.timeout` | `number` | `10` | Seconds before a check times out. |
| `healthCheck.retries` | `number` | `3` | Failed checks before marking a target unhealthy. |
| `healthCheck.http.path` | `string` | `"/"` | HTTP path to request for health checks. |
| `healthCheck.http.statusCodes` | `string[]` | `["2??","3??"]` | Accepted status code patterns. |
| `healthCheck.http.tls` | `boolean` | `false` | Use TLS for health check requests. |

### LBTarget

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `type` | `"server" \| "label_selector" \| "ip"` | — | **Required.** Target type. |
| `server` | `string \| ServerRef` | — | Server resource or numeric ID string (for `type: "server"`). |
| `labelSelector` | `string` | — | Hetzner label selector expression (for `type: "label_selector"`). |
| `ip` | `string` | — | Target IP address (for `type: "ip"`). |
| `usePrivateIp` | `boolean` | `false` | Forward traffic to the server's private IP instead of its public IP. |

## Outputs

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Hetzner-assigned load balancer ID. |
| `name` | `string` | Physical name of the load balancer. |
| `publicNet.ipv4.ip` | `string` | Public IPv4 address. Empty string if `publicInterface` is `false`. |
| `publicNet.ipv6.ip` | `string` | Public IPv6 address. Empty string if `publicInterface` is `false`. |
| `privateNet` | `{ networkId: number; ip: string }[]` | Private network attachments with the assigned private IP. |
| `created` | `string` | ISO 8601 creation timestamp. |
| `loadBalancerType` | `string` | Resolved plan name from the Hetzner API. |
| `location` | `string` | Resolved location name from the Hetzner API. |

---

See the [Hetzner Load Balancer API reference](https://docs.hetzner.cloud/#load-balancers) for the full list of load balancer types, locations, and configuration options.
