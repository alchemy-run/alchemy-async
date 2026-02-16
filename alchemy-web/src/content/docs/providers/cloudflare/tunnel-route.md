---
title: TunnelRoute
description: Route private network traffic through Cloudflare Tunnels for Zero Trust network access.
---

A [Cloudflare Tunnel Route](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/) routes private network traffic (CIDR ranges) through a Cloudflare Tunnel, enabling Zero Trust network access to private networks.

## Minimal Example

Create a basic tunnel route for a private network:

```ts
import { Tunnel, TunnelRoute } from "alchemy/cloudflare";

const tunnel = await Tunnel("my-tunnel", {
  name: "my-tunnel",
});

const route = await TunnelRoute("private-network", {
  network: "172.16.0.0/16",
  tunnel: tunnel,
});
```

## With Comment

Add a descriptive comment to the route:

```ts
const route = await TunnelRoute("vpc-route", {
  network: "10.0.0.0/8",
  tunnel: tunnel,
  comment: "Main VPC network route",
});
```

## Using Tunnel ID String

You can also pass the tunnel ID as a string instead of a Tunnel resource:

```ts
const route = await TunnelRoute("route-by-id", {
  network: "192.168.1.0/24",
  tunnel: "f70ff985-a4ef-4643-bbbc-4a0ed4fc8415", // Tunnel UUID
  comment: "Route using tunnel ID",
});
```

## With Virtual Network

Specify a virtual network ID for the route:

```ts
const route = await TunnelRoute("vpc-route", {
  network: "10.0.0.0/8",
  tunnel: tunnel,
  virtualNetworkId: "f70ff985-a4ef-4643-bbbc-4a0ed4fc8415",
  comment: "Route in custom virtual network",
});
```

## Adopt Existing Route

Adopt an existing route if it already exists:

```ts
const route = await TunnelRoute("existing-route", {
  network: "192.168.1.0/24",
  tunnel: tunnel,
  adopt: true,
  comment: "Updated comment for adopted route",
});
```

## Keep Route on Deletion

Prevent the route from being deleted when removed from Alchemy:

```ts
const route = await TunnelRoute("persistent-route", {
  network: "10.1.0.0/16",
  tunnel: tunnel,
  delete: false, // Route will remain even if removed from Alchemy
});
```

## Update Route Comment

Update the comment on an existing route:

```ts
// Create initial route
let route = await TunnelRoute("my-route", {
  network: "172.16.0.0/16",
  tunnel: tunnel,
  comment: "Initial comment",
});

// Update the comment
route = await TunnelRoute("my-route", {
  network: "172.16.0.0/16",
  tunnel: tunnel,
  comment: "Updated comment",
});
```

:::caution
The `network` CIDR and `tunnel` are immutable properties. Changing either will trigger a replacement (delete old route, create new route) rather than an update.
:::

## API Token Requirements

TunnelRoute requires a Cloudflare API token with the following permissions:
- **Cloudflare One Networks Write** - Required for creating, updating, and deleting routes
- **Cloudflare Tunnel Write** - Required for managing tunnel routes

You can create an API token at [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens).

:::info
OAuth tokens from `wrangler login` do not support TunnelRoute operations. You must use an API token.
:::

## See Also

- [Tunnel](/providers/cloudflare/tunnel) - Create and manage Cloudflare Tunnels
- [Cloudflare Zero Trust Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/)
- [Cloudflare Tunnel Routes API](https://developers.cloudflare.com/api/operations/zero-trust-networks-routes-create-a-tunnel-route)

