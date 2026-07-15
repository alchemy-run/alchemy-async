---
title: AccessPolicy
description: Reusable allow / deny / bypass rules attached to Cloudflare Zero Trust Access applications.
---

A reusable [Cloudflare Access policy](https://developers.cloudflare.com/cloudflare-one/policies/access/) defines who can reach an [AccessApplication](/providers/cloudflare/access-application). Attach the same policy to multiple applications via their `policies` array.

## Simple Allow Policy

```ts
import { AccessPolicy } from "alchemy/cloudflare";

const employees = await AccessPolicy("employees", {
  name: "Employees",
  decision: "allow",
  include: [{ email_domain: { domain: "acme.com" } }],
});
```

## Bypass Policy for Office IPs

```ts
const officeBypass = await AccessPolicy("office-bypass", {
  name: "Office Bypass",
  decision: "bypass",
  include: [{ ip: { ip: "203.0.113.0/24" } }],
});
```

## Reference an AccessGroup with Approval Required

```ts
const sensitive = await AccessPolicy("sensitive", {
  name: "Sensitive admin access",
  decision: "allow",
  include: [{ group: { id: adminGroup } }],
  approvalRequired: true,
  approvalGroups: [
    { approvalsNeeded: 2, emailAddresses: ["security@acme.com"] },
  ],
  isolationRequired: true,
});
```

## Decision Is Immutable

Changing `decision` (e.g. `allow` → `deny`) forces replacement of the underlying Cloudflare resource. Other fields (`name`, rules, approval settings) update in place.

## Rule Reference

The `include`, `exclude`, and `require` arrays accept any of these rule shapes:

| Rule | Shape |
|---|---|
| `email` | `{ email: { email: "user@acme.com" } }` |
| `email_domain` | `{ email_domain: { domain: "acme.com" } }` |
| `ip` | `{ ip: { ip: "203.0.113.0/24" } }` |
| `ip_list` | `{ ip_list: { id: "<list-uuid>" } }` |
| `geo` / `country` | `{ geo: { country_code: "US" } }` |
| `everyone` | `{ everyone: {} }` |
| `group` | `{ group: { id: groupResource } }` |
| `service_token` | `{ service_token: { token_id: tokenResource } }` |
| `any_valid_service_token` | `{ any_valid_service_token: {} }` |
| `azure` / `okta` / `gsuite` / `github_organization` / `saml` | `{ <key>: { …, identity_provider_id: idpResource } }` |
| `certificate` / `common_name` | `{ certificate: {} }` / `{ common_name: { common_name: "..." } }` |
| `device_posture` | `{ device_posture: { integration_uid: "..." } }` |
| `auth_method` / `login_method` / `oidc_claim` / `authentication_context` | per Cloudflare docs |

Resource-typed fields (`group.id`, `service_token.token_id`, `*.identity_provider_id`, `login_method.id`) accept either a string ID or the corresponding Alchemy resource — references are normalised at the API boundary. See the [Cloudflare rules-language docs](https://developers.cloudflare.com/cloudflare-one/policies/access/#rule-types) for the full list.
