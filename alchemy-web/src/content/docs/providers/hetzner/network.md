---
title: Network
description: Learn how to create and manage Hetzner Cloud private networks and subnets using Alchemy.
---

The `Network` resource lets you create and manage [Hetzner Cloud private networks](https://docs.hetzner.com/cloud/networks/overview/). Private networks connect your servers with isolated, high-bandwidth links that never leave Hetzner's infrastructure.

## Minimal example

Create a private network with a `/16` address space:

```ts
import { Network } from "alchemy/hetzner";

const network = await Network("app-network", {
  ipRange: "10.0.0.0/16",
});

console.log(network.id); // Hetzner-assigned numeric ID
```

## Network with subnets

Attach one or more subnets so servers get addresses in specific zones:

```ts
import { Network } from "alchemy/hetzner";

const network = await Network("app-network", {
  ipRange: "10.0.0.0/16",
  subnets: [
    {
      type: "cloud",
      networkZone: "eu-central",
      ipRange: "10.0.1.0/24",
    },
    {
      type: "cloud",
      networkZone: "eu-central",
      ipRange: "10.0.2.0/24",
    },
  ],
  labels: { env: "production", team: "infra" },
});
```

## vSwitch subnet

Connect a Hetzner vSwitch (bare-metal) to the same network:

```ts
import { Network } from "alchemy/hetzner";

const network = await Network("hybrid-network", {
  ipRange: "10.10.0.0/16",
  subnets: [
    {
      type: "cloud",
      networkZone: "eu-central",
      ipRange: "10.10.1.0/24",
    },
    {
      type: "vswitch",
      networkZone: "eu-central",
      ipRange: "10.10.2.0/24",
      vswitchId: 12345,
    },
  ],
});
```

## Adopting an existing network

If a network with the same name already exists, adopt it instead of failing:

```ts
import { Network } from "alchemy/hetzner";

const network = await Network("existing-network", {
  ipRange: "10.0.0.0/16",
  adopt: true,
});
```

## Props

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `ipRange` | `string` | Yes | — | CIDR block for the network (e.g. `"10.0.0.0/16"`). **Immutable** — changing this replaces the network. |
| `name` | `string` | No | `${app}-${stage}-${id}` | Human-readable name shown in the Hetzner console. |
| `subnets` | `SubnetConfig[]` | No | `[]` | List of subnets to attach. Added/removed subnets are reconciled on each deploy. |
| `labels` | `Record<string, string>` | No | — | Key/value labels for filtering and organisation. |
| `adopt` | `boolean` | No | `false` | Adopt an existing network with the same name instead of throwing. |
| `apiToken` | `Secret` | No | `$HCLOUD_TOKEN` | Hetzner Cloud API token. Defaults to the `HCLOUD_TOKEN` environment variable. |

### SubnetConfig

| Property | Type | Required | Description |
|---|---|---|---|
| `type` | `"cloud" \| "server" \| "vswitch"` | Yes | Subnet type. Use `"cloud"` for regular VMs, `"vswitch"` for bare-metal. |
| `networkZone` | `string` | Yes | Hetzner network zone, e.g. `"eu-central"` or `"us-east"`. |
| `ipRange` | `string` | No | Optional sub-CIDR within the network's `ipRange`. |
| `vswitchId` | `number` | No | vSwitch ID — required when `type` is `"vswitch"`. |

## Output

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Hetzner-assigned numeric ID of the network. |
| `name` | `string` | Name of the network. |
| `ipRange` | `string` | CIDR block of the network. |
| `subnets` | `SubnetConfig[]` | Current list of subnets. |
| `labels` | `Record<string, string>` | Labels attached to the network. |
| `servers` | `number[]` | IDs of servers currently attached to this network. |
| `created` | `string` | ISO 8601 timestamp of when the network was created. |

:::caution
`ipRange` is **immutable**. Changing it after creation triggers a full replace (delete + recreate), which will detach any servers currently on the network.
:::

## See also

- [Hetzner Cloud Networks documentation](https://docs.hetzner.com/cloud/networks/overview/)
- [Hetzner Cloud API — Networks](https://docs.hetzner.com/cloud/api/overview/#networks)
