---
title: EmailCatchAll
description: Learn how to configure catch-all email routing rules that handle emails not matched by other rules.
---

Configure a catch-all email routing rule that handles emails not matched by other routing rules. This rule is processed last and matches all unhandled emails.

:::caution
Email Routing resources do not work with `wrangler login` (OAuth tokens) due to permission limitations. You must use an API token instead with the following scopes:

- **Zone:Read** - to read zone information
- **Zone:Edit** - to manage email routing settings

See the [Cloudflare guide](/guides/cloudflare/) for details on setting up API token authentication.
:::

## Minimal Example

Forward all unmatched emails to an admin address:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("default-catchall", {
  zone: "example.com",
  enabled: true,
  actions: [
    {
      type: "forward",
      value: ["admin@company.com"],
    },
  ],
});
```

## Drop Unmatched Emails

Configure catch-all to drop any emails that don't match specific rules:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("drop-catchall", {
  zone: "example.com",
  enabled: true,
  actions: [
    {
      type: "drop",
    },
  ],
});
```

## Process with Worker

Use a Worker to handle all unmatched emails for custom processing:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("worker-catchall", {
  zone: "example.com",
  enabled: true,
  name: "Worker processing",
  actions: [
    {
      type: "worker",
      value: ["email-processor"],
    },
  ],
});
```

## Forward to Multiple Addresses

Send unmatched emails to multiple destinations:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("multi-forward-catchall", {
  zone: "example.com",
  enabled: true,
  name: "Multi-destination catch-all",
  actions: [
    {
      type: "forward",
      value: ["admin@company.com", "backup@company.com"],
    },
  ],
});
```

## Multiple Actions

Perform multiple actions on unmatched emails:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("multi-action-catchall", {
  zone: "example.com",
  enabled: true,
  name: "Forward and log all emails",
  actions: [
    {
      type: "forward",
      value: ["admin@company.com"],
    },
    {
      type: "worker",
      value: ["email-logger"],
    },
  ],
});
```

## Disable Catch-All

Disable the catch-all rule when not needed:

```ts
import { EmailCatchAll } from "alchemy/cloudflare";

await EmailCatchAll("disabled-catchall", {
  zone: "example.com",
  enabled: false,
  actions: [
    {
      type: "drop",
    },
  ],
});
```

## Use with Zone Resource

Reference an existing Zone resource:

```ts
import { EmailCatchAll, Zone } from "alchemy/cloudflare";

const zone = await Zone("my-zone", {
  name: "example.com",
});

await EmailCatchAll("zone-ref-catchall", {
  zone: zone,
  enabled: true,
  actions: [
    {
      type: "forward",
      value: ["admin@company.com"],
    },
  ],
});
```

## Properties

### Input Properties

- `zone` (string | Zone): Zone hostname, zone ID, or Zone resource where the catch-all rule will be configured
- `enabled` (boolean, optional): Whether the catch-all rule is enabled. Defaults to `true`
- `name` (string, optional): Name for the catch-all rule. Defaults to "Catch All"
- `matchers` ({ type: "all" }[], optional): Matchers for the catch-all rule. Defaults to `[{ type: "all" }]`
- `actions` (EmailAction[]): Actions to take for emails that don't match other rules

### Output Properties

- `zoneId` (string): Zone ID where the catch-all rule is configured
- `ruleId` (string): Catch-all rule identifier
- `enabled` (boolean): Whether the catch-all rule is enabled
- `name` (string): Rule name
- `matchers` ({ type: "all" }[]): Matchers for the catch-all rule
- `actions` (EmailAction[]): Actions for the catch-all rule
- `tag` (string, optional): Deprecated Cloudflare tag field when present

## How Catch-All Works

The catch-all rule works differently from regular email rules:

1. **Last Priority**: Catch-all rules are evaluated after all other routing rules
2. **Unmatched Emails**: Only emails that don't match any other rules reach the catch-all
3. **Single Rule**: There can only be one catch-all rule per zone
4. **Special Endpoint**: Uses a dedicated API endpoint (`/catch_all`) instead of regular rules

## Common Use Cases

### Admin Notification

Forward unmatched emails to administrators:

```ts
await EmailCatchAll("admin-notification", {
  zone: "example.com",
  enabled: true,
  name: "Admin notifications",
  actions: [
    {
      type: "forward",
      value: ["admin@company.com"],
    },
  ],
});
```

### Spam Prevention

Drop unmatched emails to prevent spam:

```ts
await EmailCatchAll("spam-prevention", {
  zone: "example.com",
  enabled: true,
  name: "Drop unmatched emails",
  actions: [
    {
      type: "drop",
    },
  ],
});
```

### Custom Processing

Process unmatched emails with custom logic:

```ts
await EmailCatchAll("custom-processing", {
  zone: "example.com",
  enabled: true,
  name: "Custom email processing",
  actions: [
    {
      type: "worker",
      value: ["unmatched-email-handler"],
    },
  ],
});
```

## Best Practices

### Strategy Selection

- **Forward First**: Start by forwarding unmatched emails to see what you're getting
- **Analyze Patterns**: Look for common patterns in unmatched emails
- **Refine Rules**: Create specific rules for common patterns, then update catch-all

### Security Considerations

- **Monitor Volume**: Watch for sudden increases in unmatched emails
- **Verify Destinations**: Ensure catch-all destinations can handle the volume
- **Review Regularly**: Periodically review what emails are being caught

### Performance Optimization

- **Use Drop Wisely**: Drop obvious spam/unwanted emails to reduce processing
- **Worker Efficiency**: Keep Worker processing lightweight for high volumes
- **Multiple Destinations**: Distribute load across multiple forwarding addresses

## Action Types

### Forward Action

Forward unmatched emails to destination addresses:

```ts
{
  type: "forward",
  value: ["admin@company.com", "backup@company.com"]
}
```

### Worker Action

Process unmatched emails with a Cloudflare Worker:

```ts
{
  type: "worker",
  value: ["unmatched-email-processor"]
}
```

### Drop Action

Drop/reject unmatched emails:

```ts
{
  type: "drop";
  // No value needed
}
```

## Limitations

- Only one catch-all rule per zone
- Catch-all rules are evaluated last (after all other rules)
- All limitations of regular email routing apply (destination verification, etc.)

## Troubleshooting

### Catch-All Not Working

1. **Check if Enabled**: Verify the catch-all rule is enabled
2. **Other Rules Matching**: Check if other rules are catching emails first
3. **Verify Destinations**: Ensure forwarding addresses are verified

### Too Many Emails

1. **Create Specific Rules**: Add rules for common patterns to reduce catch-all volume
2. **Use Drop Action**: Drop unwanted emails before they reach catch-all
3. **Monitor Patterns**: Analyze unmatched emails to improve rule coverage

### Processing Errors

1. **Worker Logs**: Check Worker script logs for processing errors
2. **Timeout Issues**: Ensure Worker processing is fast enough for email volume
3. **Memory Limits**: Monitor Worker memory usage for high-volume processing

## Learn More

- [Cloudflare Email Service route emails guide](https://developers.cloudflare.com/email-service/get-started/route-emails/)
- [Cloudflare Email Service email routing rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
