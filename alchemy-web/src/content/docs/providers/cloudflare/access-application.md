---
title: AccessApplication
description: Protect an application with Cloudflare Zero Trust Access.
---

A [Cloudflare Access application](https://developers.cloudflare.com/cloudflare-one/applications/) is the protected resource — a self-hosted domain, a SaaS integration, or a launcher bookmark. Three variants are strictly typed (`self_hosted`, `saas`, `bookmark`); the rest fall back to a permissive shape.

## Self-Hosted Application

Protect a hostname with one or more reusable [AccessPolicy](/providers/cloudflare/access-policy) resources.

```ts
import { AccessApplication, AccessPolicy } from "alchemy/cloudflare";

const employees = await AccessPolicy("employees", {
  name: "Employees",
  decision: "allow",
  include: [{ email_domain: { domain: "acme.com" } }],
});

const admin = await AccessApplication("admin", {
  type: "self_hosted",
  name: "Internal Admin",
  domain: "admin.acme.com",
  policies: [employees],
  sessionDuration: "8h",
});

// Validate `cf-access-jwt-assertion` against `admin.aud` at your origin.
```

## Bookmark Application

A vanity link in the Access launcher — no policy enforcement, just a tile.

```ts
const wiki = await AccessApplication("wiki", {
  type: "bookmark",
  name: "Internal Wiki",
  domain: "https://wiki.acme.com",
  appLauncherVisible: true,
});
```

## SaaS OIDC Integration

Cloudflare brokers SSO between your IdP and a SaaS vendor over OIDC (or SAML).

```ts
const slack = await AccessApplication("slack-saas", {
  type: "saas",
  name: "Slack",
  saas: {
    authType: "oidc",
    redirectUris: ["https://acme.slack.com/oidc/callback"],
    scopes: ["openid", "email", "profile"],
  },
  policies: [employees],
});

// slack.clientId / slack.clientSecret.unencrypted are returned only on
// creation — register them in Slack's SSO settings.
```

## Notes

- `type` and `zone` are **immutable** — changing either forces replacement.
- `domain` is required for `self_hosted`, and is the link target for `bookmark`.
- For SaaS OIDC apps, `clientSecret` is only returned on creation; subsequent updates retain the original.
- Set `zone: someZone` to scope the application to a specific zone instead of the account; only `self_hosted`, `bookmark`, and a few others support this.
