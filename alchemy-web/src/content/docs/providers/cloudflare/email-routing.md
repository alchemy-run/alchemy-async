---
title: EmailRouting
description: Learn how to enable and configure email routing for your Cloudflare zone using Alchemy.
---

Enable and configure email routing for your Cloudflare zone to start receiving and routing emails sent to your domain.

:::note
Cloudflare Email Service is currently in beta. The routing APIs used by these resources may still change before general availability.
:::

:::caution
Email Routing resources do not work with `wrangler login` (OAuth tokens) due to permission limitations. You must use an API token instead with the following scopes:

- **Zone:Read** - to read zone information
- **Zone:Edit** - to manage email routing settings

See the [Cloudflare guide](/guides/cloudflare/) for details on setting up API token authentication.
:::

## Minimal Example

Enable email routing for your domain:

```ts
import { EmailRouting } from "alchemy/cloudflare";

await EmailRouting("my-email-routing", {
  zone: "example.com",
  enabled: true,
});
```

## Enable with Zone Resource

Use an existing Zone resource reference:

```ts
import { EmailRouting, Zone } from "alchemy/cloudflare";

const zone = await Zone("my-zone", {
  name: "example.com",
});

await EmailRouting("my-email-routing", {
  zone: zone,
  enabled: true,
  skipWizard: true,
});
```

## Configuration Options

Configure email routing with specific settings:

```ts
import { EmailRouting } from "alchemy/cloudflare";

await EmailRouting("custom-email-routing", {
  zone: "example.com",
  enabled: true,
  skipWizard: true, // Skip DNS setup wizard
});
```

## Disable Email Routing

Disable email routing when no longer needed:

```ts
import { EmailRouting } from "alchemy/cloudflare";

await EmailRouting("my-email-routing", {
  zone: "example.com",
  enabled: false,
});
```

## Properties

### Input Properties

- `zone` (string | Zone): Zone hostname, zone ID, or Zone resource where email routing will be configured
- `enabled` (boolean, optional): Whether email routing should be enabled. Defaults to `true`
- `skipWizard` (boolean, optional): Skip the DNS setup wizard when enabling email routing. Defaults to `false`

### Output Properties

- `zoneId` (string): Zone ID where email routing is configured
- `enabled` (boolean): Whether email routing is enabled
- `name` (string): Zone name
- `created` (string): When email routing was created
- `modified` (string): When email routing was last modified
- `tag` (string): Zone tag

## Prerequisites

Before enabling email routing, ensure:

1. You have a Cloudflare zone configured for your domain
2. Your domain's nameservers are pointed to Cloudflare
3. You have the necessary DNS permissions for the zone

## DNS Requirements

When email routing is enabled, Cloudflare automatically creates the necessary MX and TXT records for your domain. These records are required for email routing to function properly.

## Next Steps

After enabling email routing:

1. [Create destination email addresses](/providers/cloudflare/email-address) to receive forwarded emails
2. [Set up routing rules](/providers/cloudflare/email-rule) to define how emails are processed
3. [Configure a catch-all rule](/providers/cloudflare/email-catch-all) for unmatched emails

## Learn More

- [Cloudflare Email Service route emails guide](https://developers.cloudflare.com/email-service/get-started/route-emails/)
- [Cloudflare Email Service domain configuration](https://developers.cloudflare.com/email-service/configuration/domains/)
