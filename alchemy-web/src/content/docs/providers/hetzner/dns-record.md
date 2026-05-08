---
title: DNSRecord
description: Learn how to create, update, and manage individual DNS records within a Hetzner DNS zone using Alchemy.
---

The `DNSRecord` resource lets you create and manage individual DNS records within a [Hetzner DNS](https://www.hetzner.com/dns-console) zone. It supports all common record types and integrates directly with the `DNSZone` resource.

## Minimal example

Create an A record pointing to a server's IP address:

```ts
import { DNSRecord, DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("example-zone", {
  name: "example.com",
});

const record = await DNSRecord("www", {
  zone: zone,
  name: "www",
  type: "A",
  value: "192.0.2.1",
  ttl: 300,
});

console.log(record.id); // Hetzner-assigned record ID
```

## CNAME and subdomain routing

Route a subdomain to another hostname using a CNAME record:

```ts
import { DNSRecord, DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("example-zone", {
  name: "example.com",
});

const apiAlias = await DNSRecord("api-cname", {
  zone: zone,
  name: "api",
  type: "CNAME",
  value: "www.example.com",
});
```

## Email records (MX and SPF)

Configure email delivery for your domain by adding MX and TXT records:

```ts
import { DNSRecord, DNSZone } from "alchemy/hetzner";

const zone = await DNSZone("example-zone", {
  name: "example.com",
});

const mx = await DNSRecord("mail-mx", {
  zone: zone,
  name: "@",
  type: "MX",
  value: "10 mail.example.com",
  ttl: 3600,
});

const spf = await DNSRecord("mail-spf", {
  zone: zone,
  name: "@",
  type: "TXT",
  value: "v=spf1 include:_spf.google.com ~all",
  ttl: 3600,
});
```

The `@` name represents the zone apex (i.e. `example.com` itself). For MX records the `value` field must include the priority prefix (e.g. `"10 mail.example.com"`).

## Using a zone ID string

Pass a raw zone ID string instead of a `DNSZone` resource when managing records in a pre-existing zone:

```ts
import { DNSRecord } from "alchemy/hetzner";

const record = await DNSRecord("legacy-www", {
  zone: "abc123zone456id",
  name: "www",
  type: "A",
  value: "203.0.113.42",
});
```

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `zone` | `string \| DNSZone` | — | **Required.** The zone this record belongs to. Pass a `DNSZone` resource or a zone ID string. **Immutable** — changing this triggers a replacement. |
| `name` | `string` | — | **Required.** The record name, e.g. `"www"`, `"api"`, or `"@"` for the zone apex. |
| `type` | `DNSRecordType` | — | **Required.** The DNS record type. **Immutable** — changing this triggers a replacement. |
| `value` | `string` | — | **Required.** The record value. For A records: an IPv4 address. For MX records: `"<priority> <hostname>"`. For TXT records: the raw text content. |
| `ttl` | `number` | zone default | Time-to-live in seconds. Omit to inherit the zone's default TTL. |
| `apiToken` | `Secret` | `$HETZNER_DNS_TOKEN` | Hetzner DNS API token. Defaults to the `HETZNER_DNS_TOKEN` environment variable. |

### `DNSRecordType`

Accepted values for the `type` property:

```
"A" | "AAAA" | "CNAME" | "MX" | "NS" | "TXT" | "SRV" | "CAA" | "PTR"
```

:::caution[Immutable properties]
`zone` and `type` cannot be changed after a record is created. Updating either of these properties will **replace** the record (delete the old one and create a new one). The record's `id` will change as a result.
:::

## Output

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Hetzner-assigned record ID. |
| `zoneId` | `string` | The zone ID this record belongs to. |
| `name` | `string` | The record name. |
| `type` | `DNSRecordType` | The DNS record type. |
| `value` | `string` | The record value. |
| `ttl` | `number` | TTL in seconds. |
| `created` | `string` | ISO 8601 timestamp of when the record was created. |
| `modified` | `string` | ISO 8601 timestamp of when the record was last modified. |

## See also

- [Hetzner DNS — Overview](https://docs.hetzner.com/dns-console/dns/general/dns-overview/)
- [Hetzner DNS API reference — Records](https://dns.hetzner.com/api-docs/#tag/Records)
