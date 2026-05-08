---
title: DNSZone
description: Learn how to create and manage Hetzner DNS zones using Alchemy.
---

The `DNSZone` resource lets you create and manage [Hetzner DNS zones](https://dns.hetzner.com). A DNS zone represents a domain (e.g. `example.com`) hosted on Hetzner's nameservers.

## Minimal example

Create a DNS zone for a domain with the default TTL:

```ts
import { DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("my-zone", {
  name: "example.com",
});

console.log(zone.nsSet); // nameservers to set at your registrar
```

## Custom TTL

Set a lower default TTL so DNS changes propagate quickly:

```ts
import { DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("my-zone", {
  name: "example.com",
  ttl: 300,
});
```

## Adopt an existing zone

Bring an existing Hetzner DNS zone under Alchemy management instead of creating a new one:

```ts
import { DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("my-zone", {
  name: "example.com",
  adopt: true,
});
```

:::caution
When `adopt: true`, Alchemy takes ownership of the existing zone. It will be **deleted** when the resource is removed from Alchemy unless you also set `delete: false`.
:::

## Keep zone on destroy

Retain the zone in Hetzner even when `alchemy destroy` is run:

```ts
import { DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("my-zone", {
  name: "example.com",
  delete: false,
});
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | `string` | — | **Required. Immutable.** The domain name for the zone, e.g. `"example.com"`. Changing this value destroys and recreates the zone. |
| `ttl` | `number` | Hetzner default | Default TTL in seconds applied to records in this zone. |
| `adopt` | `boolean` | `false` | Adopt an existing zone with this name instead of failing if it already exists. |
| `delete` | `boolean` | `true` | Delete the zone when the resource is removed from Alchemy. Set to `false` to keep the zone after `alchemy destroy`. |
| `apiToken` | `Secret` | `$HETZNER_DNS_API_TOKEN` | Hetzner DNS API token. Defaults to the `HETZNER_DNS_API_TOKEN` environment variable. |

:::caution[Immutable property]
`name` is immutable. Changing the domain name triggers a **replacement** — the existing zone is deleted and a new one is created.
:::

## Output

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Hetzner-assigned zone ID. |
| `name` | `string` | The domain name. |
| `ttl` | `number` | Default TTL in seconds. |
| `status` | `"verified" \| "failed" \| "pending"` | Verification status of the zone. Hetzner verifies ownership via nameserver delegation. |
| `nsSet` | `string[]` | Nameservers assigned by Hetzner for this zone (e.g. `["hydrogen.ns.hetzner.com", "oxygen.ns.hetzner.com", "helium.ns.hetzner.de"]`). Configure these at your domain registrar. |
| `created` | `string` | ISO 8601 timestamp of when the zone was created. |
| `modified` | `string` | ISO 8601 timestamp of the last modification. |

## See also

- [Hetzner DNS — Getting started](https://docs.hetzner.com/dns-console/dns/general/getting-started-with-hetzner-dns/)
- [Hetzner DNS API reference](https://dns.hetzner.com/api/v1)
