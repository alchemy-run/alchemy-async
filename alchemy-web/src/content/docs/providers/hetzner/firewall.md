---
title: Firewall
description: Learn how to create, configure, and manage Hetzner Cloud Firewalls with inbound and outbound rules using Alchemy.
---

The `Firewall` resource creates and manages [Hetzner Cloud Firewalls](https://docs.hetzner.com/cloud/firewalls/overview/) — stateful network filters that control inbound and outbound traffic for your servers.

## Minimal Example

Create a firewall that allows inbound HTTP and HTTPS traffic:

```ts
import { Firewall } from "alchemy/hetzner";

const firewall = await Firewall("web-firewall", {
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "80",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Allow HTTP",
    },
    {
      direction: "in",
      protocol: "tcp",
      port: "443",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Allow HTTPS",
    },
  ],
});
```

## Allow SSH from Specific IPs

Restrict SSH access to a known CIDR range instead of the open internet:

```ts
import { Firewall } from "alchemy/hetzner";

const firewall = await Firewall("ssh-firewall", {
  name: "ssh-restricted",
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "22",
      sourceIps: ["203.0.113.0/24"],
      description: "Allow SSH from office",
    },
  ],
  labels: { env: "prod", team: "infra" },
});
```

## Port Range and ICMP

Allow a port range for a custom application and permit ICMP (ping):

```ts
import { Firewall } from "alchemy/hetzner";

const firewall = await Firewall("app-firewall", {
  rules: [
    {
      direction: "in",
      protocol: "tcp",
      port: "8000-9000",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Application port range",
    },
    {
      direction: "in",
      protocol: "icmp",
      sourceIps: ["0.0.0.0/0", "::/0"],
      description: "Allow ICMP ping",
    },
  ],
});

console.log(firewall.id);   // Hetzner-assigned numeric ID
console.log(firewall.name); // Resolved physical name
```

## Props

### `FirewallProps`

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `rules` | `FirewallRule[]` | yes | — | List of firewall rules applied to this firewall |
| `name` | `string` | no | `${app}-${stage}-${id}` | Name of the firewall |
| `labels` | `Record<string, string>` | no | `{}` | User-defined labels attached to the firewall |
| `adopt` | `boolean` | no | `false` | Adopt an existing firewall with the same name instead of failing |
| `apiToken` | `string \| Secret` | no | `$HETZNER_API_TOKEN` | Hetzner API token (overrides env var) |
| `baseUrl` | `string` | no | `https://api.hetzner.cloud/v1` | Override the Hetzner API base URL |

### `FirewallRule`

| Property | Type | Required | Description |
|---|---|---|---|
| `direction` | `"in" \| "out"` | yes | Traffic direction this rule applies to |
| `protocol` | `"tcp" \| "udp" \| "icmp" \| "esp" \| "gre"` | yes | IP protocol |
| `port` | `string` | no | Port or port range (e.g. `"80"`, `"8000-9000"`). Omit for `icmp`, `esp`, and `gre`. |
| `sourceIps` | `string[]` | no | CIDR list of allowed source IPs for inbound rules |
| `destinationIps` | `string[]` | no | CIDR list of allowed destination IPs for outbound rules |
| `description` | `string` | no | Human-readable description of the rule |

## Output

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Hetzner-assigned numeric ID of the firewall |
| `name` | `string` | Resolved name of the firewall |
| `rules` | `FirewallRule[]` | The rules currently applied to this firewall |
| `labels` | `Record<string, string>` | Labels attached to the firewall |
| `created` | `string` | ISO 8601 timestamp of when the firewall was created |
| `apiToken` | `string \| Secret` | The API token used (if explicitly provided) |
| `baseUrl` | `string` | The base URL used (if explicitly provided) |

:::note
Rules are replaced **wholesale** on update — Hetzner does not support partial rule patches. Alchemy calls `POST /firewalls/{id}/actions/set_rules` with the full new rule set each time rules change.
:::

## Reference

- [Hetzner Cloud Firewall API](https://docs.hetzner.com/cloud/firewalls/api-reference/)
- [Hetzner Cloud Firewall Overview](https://docs.hetzner.com/cloud/firewalls/overview/)
