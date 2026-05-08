---
title: Server
description: Learn how to create, configure, and manage Hetzner Cloud virtual machines using Alchemy.
---

The Server resource lets you create and manage [Hetzner Cloud](https://www.hetzner.com/cloud) virtual machines (VMs). Servers are the core compute unit in Hetzner Cloud — you can attach SSH keys, private networks, firewalls, and block storage volumes at creation time.

## Minimal Example

Create a basic Ubuntu server in Nuremberg:

```ts
import { Server } from "alchemy/hetzner";

const server = await Server("web", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
});

console.log(server.publicIpv4); // e.g. "1.2.3.4"
```

## With SSH Key and Cloud-Init

Provision a server with your public key pre-installed and run a startup script via `userData`:

```ts
import { Server, SSHKey } from "alchemy/hetzner";

const key = await SSHKey("deploy-key", {
  publicKey: process.env.SSH_PUBLIC_KEY!,
});

const server = await Server("app", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "nbg1",
  sshKeys: [key],
  userData: `#!/bin/bash
apt-get update -y
apt-get install -y nodejs npm
`,
});
```

## With Private Network, Firewall, and Volume

Attach a server to an existing private network, protect it with a firewall, and mount a block storage volume:

```ts
import { Server, SSHKey, Network, Firewall, Volume } from "alchemy/hetzner";

const key = await SSHKey("deploy-key", {
  publicKey: process.env.SSH_PUBLIC_KEY!,
});

const network = await Network("app-network", {
  ipRange: "10.0.0.0/16",
  subnets: [
    { type: "cloud", networkZone: "eu-central", ipRange: "10.0.1.0/24" },
  ],
});

const firewall = await Firewall("app-firewall", {
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "22",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "443",
      sourceIps: ["0.0.0.0/0", "::/0"],
    },
  ],
});

const dataVolume = await Volume("data", {
  size: 50,
  location: "nbg1",
  format: "ext4",
});

const server = await Server("app", {
  serverType: "cx32",
  image: "ubuntu-24.04",
  location: "nbg1",
  sshKeys: [key],
  networks: [network],
  firewalls: [firewall],
  volumes: [dataVolume],
});
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `serverType` | `string` | — | **Required.** Server type name, e.g. `"cx22"`, `"cx32"`, `"cpx41"`. Immutable — changing this triggers replacement. |
| `image` | `string` | — | **Required.** OS image name or ID, e.g. `"ubuntu-24.04"`, `"debian-12"`. Immutable — changing this triggers replacement. |
| `name` | `string` | `${app}-${stage}-${id}` | Server hostname visible in Hetzner Cloud console. Immutable — changing this triggers replacement. |
| `location` | `string` | — | Datacenter location, e.g. `"nbg1"`, `"fsn1"`, `"hel1"`, `"ash"`, `"hil"`. Mutually exclusive with `datacenter`. Immutable. |
| `datacenter` | `string` | — | Datacenter name, e.g. `"nbg1-dc3"`. Mutually exclusive with `location`. Immutable. |
| `sshKeys` | `Array<string \| SSHKey>` | `[]` | SSH keys to pre-install on the server. Pass resource objects or key names/IDs. |
| `networks` | `Array<number \| Network>` | `[]` | Private networks to attach the server to at boot. |
| `firewalls` | `Array<number \| Firewall>` | `[]` | Firewalls to apply to the server. |
| `volumes` | `Array<number \| Volume>` | `[]` | Block storage volumes to attach to the server. |
| `userData` | `string` | — | Cloud-init script executed on first boot. Passed verbatim to Hetzner; must start with `#!` or be valid cloud-config YAML. |
| `labels` | `Record<string, string>` | `{}` | Key-value labels for filtering and organisation. |
| `publicNet` | `{ enableIpv4?: boolean; enableIpv6?: boolean }` | both enabled | Control whether a public IPv4 or IPv6 address is assigned. |
| `startAfterCreate` | `boolean` | `true` | Whether to start the server immediately after creation. |
| `adopt` | `boolean` | `false` | Adopt an existing server with the same name instead of failing. |
| `delete` | `boolean` | `true` | Delete the server when the resource is removed from Alchemy. |
| `apiToken` | `Secret` | `$HCLOUD_TOKEN` | Hetzner Cloud API token. Defaults to the `HCLOUD_TOKEN` environment variable. |

:::caution[Immutable properties]
`name`, `serverType`, `image`, `location`, and `datacenter` cannot be changed after creation. Modifying any of these triggers a **replace**: the old server is deleted and a new one is created.
:::

## Output

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Hetzner-assigned numeric server ID. |
| `name` | `string` | Server hostname. |
| `status` | `string` | Current server status: `"running"`, `"off"`, `"starting"`, `"stopping"`, `"rebuilding"`, `"migrating"`, `"deleting"`, `"unknown"`. |
| `publicIpv4` | `string \| null` | Public IPv4 address, or `null` if disabled. |
| `publicIpv6` | `string \| null` | Public IPv6 network (CIDR notation), or `null` if disabled. |
| `privateNetworks` | `Array<{ networkId: number; ip: string; aliasIps: string[]; macAddress: string }>` | Private network interfaces attached to the server. |
| `serverType` | `string` | Server type name as provided (e.g. `"cx22"`). |
| `datacenter` | `string` | Datacenter name where the server was provisioned (e.g. `"nbg1-dc3"`). |
| `image` | `string` | OS image name or ID used to create the server. |
| `labels` | `Record<string, string>` | Labels attached to the server. |
| `created` | `string` | ISO 8601 timestamp of when the server was created. |

## See also

- [Hetzner Cloud — Server API reference](https://docs.hetzner.cloud/#servers)
- [Hetzner Cloud — Server types](https://docs.hetzner.cloud/#server-types)
- [Hetzner Cloud — Images](https://docs.hetzner.cloud/#images)
- [Hetzner Cloud — Locations](https://docs.hetzner.cloud/#locations)
