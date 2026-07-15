---
title: AccessIdentityProvider
description: Configure Cloudflare Zero Trust Access identity providers (Google, Okta, OIDC, SAML, OneTimePin and more).
---

A [Cloudflare Access identity provider](https://developers.cloudflare.com/cloudflare-one/identity/idp-integration/) allows users to sign in to Access-protected applications. The five most common types (`onetimepin`, `google`, `okta`, `oidc`, `saml`) are strictly typed; everything else falls back to a permissive `config` object.

## OneTimePin (Email Code)

The simplest provider — Cloudflare emails a one-time code to the user. No external setup required.

```ts
import { AccessIdentityProvider } from "alchemy/cloudflare";

const otp = await AccessIdentityProvider("otp", {
  type: "onetimepin",
  name: "Email OTP",
});
```

## Google OAuth

```ts
const google = await AccessIdentityProvider("google", {
  type: "google",
  name: "Google",
  clientId: alchemy.secret.env.GOOGLE_CLIENT_ID.unencrypted,
  clientSecret: alchemy.secret.env.GOOGLE_CLIENT_SECRET,
});
```

## Generic OIDC

```ts
const oidc = await AccessIdentityProvider("idp", {
  type: "oidc",
  name: "Corporate IdP",
  authUrl: "https://idp.example.com/oauth2/authorize",
  tokenUrl: "https://idp.example.com/oauth2/token",
  certsUrl: "https://idp.example.com/oauth2/certs",
  clientId: "my-app",
  clientSecret: alchemy.secret.env.IDP_CLIENT_SECRET,
  scopes: ["openid", "email", "profile"],
  pkceEnabled: true,
});
```

## Notes

- The `type` field is **immutable** — changing it forces replacement of the underlying Cloudflare resource.
- `clientSecret` is re-sent on every update; Cloudflare clears it if the field is omitted.
- Deleting an identity provider fails if any [AccessApplication](/providers/cloudflare/access-application) references it via `allowedIdps`.
