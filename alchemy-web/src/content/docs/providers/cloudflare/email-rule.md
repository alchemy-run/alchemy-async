---
title: EmailRule
description: Learn how to create and manage email routing rules that define how emails are processed in Cloudflare.
---

Create email routing rules that define how emails sent to your domain are processed. Rules are evaluated in priority order (lower number = higher priority).

:::caution
Email Routing resources do not work with `wrangler login` (OAuth tokens) due to permission limitations. You must use an API token instead with the following scopes:

- **Zone:Read** - to read zone information
- **Zone:Edit** - to manage email routing settings

See the [Cloudflare guide](/guides/cloudflare/) for details on setting up API token authentication.
:::

## Minimal Example

Forward emails to a specific address:

```ts
import { EmailRule } from "alchemy/cloudflare";

await EmailRule("info-forwarding", {
  zone: "example.com",
  name: "Forward info emails",
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "info@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: ["admin@company.com"],
    },
  ],
});
```

## Forward to Multiple Addresses

Forward emails to multiple destination addresses:

```ts
import { EmailRule } from "alchemy/cloudflare";

await EmailRule("support-forwarding", {
  zone: "example.com",
  name: "Support team forwarding",
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "support@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: ["support@company.com", "backup@company.com"],
    },
  ],
});
```

## Process with Worker

Route emails to a Cloudflare Worker for custom processing:

```ts
import { EmailRule } from "alchemy/cloudflare";

await EmailRule("worker-processing", {
  zone: "example.com",
  name: "Process with Worker",
  priority: 1,
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "webhook@example.com",
    },
  ],
  actions: [
    {
      type: "worker",
      value: ["email-processor"],
    },
  ],
});
```

## Drop Unwanted Emails

Create rules to drop/reject specific emails:

```ts
import { EmailRule } from "alchemy/cloudflare";

await EmailRule("spam-filter", {
  zone: "example.com",
  name: "Drop spam emails",
  priority: 0, // High priority
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "spam@example.com",
    },
  ],
  actions: [
    {
      type: "drop",
    },
  ],
});
```

## Multiple Actions

Rules can perform multiple actions:

```ts
import { EmailRule } from "alchemy/cloudflare";

await EmailRule("complex-routing", {
  zone: "example.com",
  name: "Forward and log emails",
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "orders@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: ["sales@company.com"],
    },
    {
      type: "worker",
      value: ["order-logger"],
    },
  ],
});
```

## Rule Priority

Control rule evaluation order with priority:

```ts
import { EmailRule } from "alchemy/cloudflare";

// High priority rule (evaluated first)
await EmailRule("urgent-rule", {
  zone: "example.com",
  name: "Urgent emails",
  priority: 0,
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "urgent@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: ["urgent@company.com"],
    },
  ],
});

// Lower priority rule (evaluated later)
await EmailRule("general-rule", {
  zone: "example.com",
  name: "General emails",
  priority: 10,
  matchers: [
    {
      type: "literal",
      field: "to",
      value: "contact@example.com",
    },
  ],
  actions: [
    {
      type: "forward",
      value: ["general@company.com"],
    },
  ],
});
```

## Matcher Types

### Literal Matcher

Match exact string values in specific fields:

```ts
{
  type: "literal",
  field: "to",
  value: "sales@example.com"
}
```

### All Matcher

Match all emails (typically used in catch-all rules):

```ts
{
  type: "all";
  // No field or value needed
}
```

## Action Types

### Forward Action

Forward emails to destination addresses:

```ts
{
  type: "forward",
  value: ["destination1@company.com", "destination2@company.com"]
}
```

### Worker Action

Process emails with a Cloudflare Worker:

```ts
{
  type: "worker",
  value: ["worker-script-name"]
}
```

### Drop Action

Drop/reject emails:

```ts
{
  type: "drop";
  // No value needed
}
```

## Properties

### Input Properties

- `zone` (string | Zone): Zone hostname, zone ID, or Zone resource where the rule will be created
- `name` (string, optional): Name for the email routing rule. Defaults to "Email routing rule"
- `enabled` (boolean, optional): Whether the rule is enabled. Defaults to `true`
- `priority` (number, optional): Rule priority - lower numbers have higher priority. Defaults to `0`
- `matchers` (EmailMatcher[]): Array of matchers that define which emails this rule applies to. Literal matchers currently support only `field: "to"`
- `actions` (EmailAction[]): Array of actions to take when emails match this rule

### Output Properties

- `zoneId` (string): Zone ID where the rule is created
- `ruleId` (string): Rule ID
- `name` (string): Rule name
- `enabled` (boolean): Whether the rule is enabled
- `priority` (number): Rule priority
- `matchers` (EmailMatcher[]): Matchers for this rule
- `actions` (EmailAction[]): Actions for this rule
- `tag` (string, optional): Deprecated Cloudflare tag field when present

## Best Practices

### Rule Organization

- **Use Priorities**: Set appropriate priorities to control rule evaluation order
- **Descriptive Names**: Use clear names that explain what each rule does
- **Start Simple**: Begin with basic forwarding rules before adding complex logic

### Matcher Design

- **Be Specific**: Use specific matchers to avoid unintended matches
- **Test Thoroughly**: Test rules with sample emails to ensure they work correctly
- **Consider Edge Cases**: Think about variations in email formatting

### Action Configuration

- **Verify Destinations**: Ensure destination addresses are verified before creating rules
- **Multiple Backups**: Consider multiple forwarding addresses for important emails
- **Worker Testing**: Test Worker scripts thoroughly before using in production

## Rule Evaluation

Rules are processed in the following order:

1. **Priority Order**: Rules with lower priority numbers are evaluated first
2. **First Match**: Once a rule matches, its actions are executed
3. **Stop Processing**: No further rules are evaluated for that email
4. **Catch-All**: If no rules match, catch-all rules are evaluated

## Limitations

- Maximum of 200 routing rules per zone
- Matcher fields are limited to "to", "from", and "subject"
- Worker actions require an existing Cloudflare Worker script

## Troubleshooting

### Rule Not Matching

1. **Check Priority**: Ensure higher priority rules aren't catching emails first
2. **Verify Matchers**: Double-check matcher field and value exactness
3. **Test with Logs**: Use Worker actions to log matching attempts

### Actions Not Working

1. **Verify Destinations**: Check that forwarding addresses are verified
2. **Worker Errors**: Check Worker script logs for processing errors
3. **Rule Enabled**: Ensure the rule is enabled

## Learn More

- [Cloudflare Email Service route emails guide](https://developers.cloudflare.com/email-service/get-started/route-emails/)
- [Cloudflare Email Service email routing rules and addresses](https://developers.cloudflare.com/email-service/configuration/email-routing-addresses/)
