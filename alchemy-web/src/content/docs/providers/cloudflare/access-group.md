---
title: AccessGroup
description: Define reusable rule sets for Cloudflare Zero Trust Access policies.
---

A [Cloudflare Access group](https://developers.cloudflare.com/cloudflare-one/identity/users/groups/) is a reusable bundle of `include` / `exclude` / `require` rules that can be referenced by [AccessPolicy](/providers/cloudflare/access-policy) resources.

## Email Domain Allowlist

```ts
import { AccessGroup } from "alchemy/cloudflare";

const engineering = await AccessGroup("engineering", {
  name: "Engineering",
  include: [{ email_domain: { domain: "acme.com" } }],
});
```

## Nested Groups via the `group` Rule

Groups can reference other groups, and the lifted `string | AccessGroup` type lets you pass the resource directly.

```ts
const admins = await AccessGroup("admins", {
  name: "Admins",
  include: [{ email: { email: "alice@acme.com" } }],
});

const engineeringPlusAdmins = await AccessGroup("eng-plus-admins", {
  name: "Engineering + Admins",
  include: [
    { email_domain: { domain: "acme.com" } },
    { group: { id: admins } },
  ],
});
```

## Default Group

Mark a group as the account default — it applies to every Access application unless overridden.

```ts
const defaultEmployees = await AccessGroup("default-employees", {
  name: "All Employees",
  include: [{ email_domain: { domain: "acme.com" } }],
  isDefault: true,
});
```

## Rule Reference

The `include`, `exclude`, and `require` arrays accept any [AccessRule](/providers/cloudflare/access-policy#rule-reference) — see the AccessPolicy page for the full catalog.
