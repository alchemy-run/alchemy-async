---
title: FloatingIP
description: Learn how to reserve, assign, and manage Hetzner Cloud Floating IPs using Alchemy.
---

The FloatingIP resource lets you reserve and manage [Hetzner Cloud Floating IPs](https://docs.hetzner.cloud/#floating-ips) — static public IP addresses that can be moved between servers at any time.

## Minimal Example

Reserve an IPv4 floating IP in Nuremberg:

```ts
import { FloatingIP } from "alchemy/hetzner";

const ip = await FloatingIP("my-ip", {
  type: "ipv4",
  homeLocation: "fsn1",
});

console.log(ip.ip); // e.g. "203.0.113.1"
```

## Assign to a Server

Reserve a floating IP and immediately attach it to a server:

```ts
import { Server, FloatingIP } from "alchemy/hetzner";

const server = await Server("web", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "fsn1",
});

const ip = await FloatingIP("web-ip", {
  type: "ipv4",
  homeLocation: "fsn1",
  server, // accepts a Server resource or a server ID string
});

console.log(ip.ip); // public IPv4 address assigned to the server
```

## Retain IP After Destroy

By default, deleting a FloatingIP resource releases the IP back to Hetzner. Set `delete: false` to retain it even when the resource is removed from Alchemy — useful for IPs that need to outlive individual deployments:

```ts
import { FloatingIP } from "alchemy/hetzner";

const ip = await FloatingIP("static-ip", {
  type: "ipv4",
  homeLocation: "nbg1",
  description: "Production ingress IP — do not release",
  delete: false,
});
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `type` | `"ipv4" \| "ipv6"` | — | **Required.** IP version to reserve. Immutable — changing this triggers replacement. |
| `name` | `string` | `${app}-${stage}-${id}` | Name for the floating IP in the Hetzner Cloud console. |
| `homeLocation` | `string` | — | Hetzner location where the IP is anchored, e.g. `"fsn1"`, `"nbg1"`, `"hel1"`. |
| `server` | `string \| Server` | — | Server to assign the floating IP to. Pass a Server resource or a numeric server ID string. |
| `description` | `string` | — | Human-readable description shown in the Hetzner Cloud console. |
| `labels` | `Record<string, string>` | `{}` | Key-value labels for filtering and organisation. |
| `delete` | `boolean` | `true` | Release the floating IP when the resource is removed from Alchemy. Set to `false` to retain it. |
| `adopt` | `boolean` | `false` | Adopt an existing floating IP with the same name instead of failing on conflict. |
| `apiToken` | `Secret` | `$HCLOUD_TOKEN` | Hetzner Cloud API token. Defaults to the `HCLOUD_TOKEN` environment variable. |

:::caution[Immutable property]
`type` (`"ipv4"` or `"ipv6"`) cannot be changed after creation. Modifying it triggers a **replace**: the existing floating IP is released and a new one is reserved.
:::

## Output

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Hetzner-assigned numeric ID for this floating IP. |
| `name` | `string` | Name of the floating IP as stored in Hetzner. |
| `type` | `"ipv4" \| "ipv6"` | IP version of the reserved address. |
| `ip` | `string` | The actual IP address allocated by Hetzner (e.g. `"203.0.113.1"`). |
| `homeLocation` | `string` | Location name where the IP is anchored (e.g. `"fsn1"`). |
| `description` | `string \| undefined` | Human-readable description. |
| `labels` | `Record<string, string> \| undefined` | Key-value labels attached to the IP. |
| `dnsPtr` | `Array<{ ip: string; dnsPtr: string }>` | Reverse-DNS (PTR) records for this IP. |
| `created` | `string` | ISO 8601 timestamp of when the floating IP was created. |

## See also

- [Hetzner Cloud — Floating IPs API reference](https://docs.hetzner.cloud/#floating-ips)
- [Hetzner Cloud — Locations](https://docs.hetzner.cloud/#locations)
