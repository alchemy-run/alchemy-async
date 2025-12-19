---
title: RedirectRule
description: Learn how to create and manage Cloudflare redirect rules for URL forwarding using Alchemy.
---

A [Cloudflare Redirect Rule](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/) enables URL redirects and rewrites using Cloudflare's Rules engine. Supports wildcard redirects, static redirects, and dynamic redirects with expressions.

## Minimal Example

Create a basic redirect rule that redirects all requests to a target URL:

```ts
import { RedirectRule } from "alchemy/cloudflare";

const redirect = await RedirectRule("basic-redirect", {
  zone: "example.com",
  targetUrl: "https://example.com/",
  statusCode: 301,
});
```

## With Custom Description

Add a custom description to identify the rule in the Cloudflare dashboard:

```ts
import { RedirectRule } from "alchemy/cloudflare";

const redirect = await RedirectRule("basic-redirect", {
  zone: "example.com",
  description: "Redirect legacy URLs to new homepage",
  targetUrl: "https://example.com/",
  statusCode: 301,
});
```

## Wildcard Redirect

Redirect from a wildcard pattern to a target URL with placeholders:

```ts
import { RedirectRule } from "alchemy/cloudflare";

const wildcardRedirect = await RedirectRule("wildcard-redirect", {
  zone: "example.com",
  requestUrl: "https://*.example.com/files/*",
  targetUrl: "https://example.com/${1}/files/${2}",
  statusCode: 301,
  preserveQueryString: true,
});
```

## Dynamic Redirect with Expression

Create complex redirects using Cloudflare's Rules language for advanced matching:

```ts
import { RedirectRule } from "alchemy/cloudflare";

const dynamicRedirect = await RedirectRule("dynamic-redirect", {
  zone: "example.com",
  expression: 'http.request.uri.path matches "/autodiscover\\.(xml|src)$"',
  targetUrl: "https://example.com/not-found",
  statusCode: 301,
  preserveQueryString: true,
});
```

## Different Status Codes

Configure redirects with various HTTP status codes:

```ts
import { RedirectRule } from "alchemy/cloudflare";

// Temporary redirect
const temporaryRedirect = await RedirectRule("temp-redirect", {
  zone: "example.com",
  requestUrl: "https://example.com/temp/*",
  targetUrl: "https://example.com/new/${1}",
  statusCode: 302,
});

// Permanent redirect
const permanentRedirect = await RedirectRule("perm-redirect", {
  zone: "example.com",
  requestUrl: "https://example.com/old/*",
  targetUrl: "https://example.com/new/${1}",
  statusCode: 301,
});
```

## Query String Handling

Control whether query string parameters are preserved in redirects:

```ts
import { RedirectRule } from "alchemy/cloudflare";

// Preserve query strings (default)
const preserveQuery = await RedirectRule("preserve-query", {
  zone: "example.com",
  requestUrl: "https://example.com/search/*",
  targetUrl: "https://example.com/find/${1}",
  preserveQueryString: true,
});

// Drop query strings
const dropQuery = await RedirectRule("drop-query", {
  zone: "example.com",
  requestUrl: "https://example.com/old/*",
  targetUrl: "https://example.com/new/${1}",
  preserveQueryString: false,
});
```

## Using Zone Resource

Reference an existing zone resource instead of zone ID:

```ts
import { RedirectRule, Zone } from "alchemy/cloudflare";

const zone = await Zone("my-zone", {
  name: "example.com",
  type: "full",
});

const redirect = await RedirectRule("zone-redirect", {
  zone: zone,
  targetUrl: "https://example.com/",
  statusCode: 301,
});
```

:::tip
You can use either `requestUrl` for wildcard redirects or `expression` for dynamic redirects, but not both. If neither is provided, the rule will redirect all requests (static redirect).
:::

:::note
Wildcard redirects use placeholders like `${1}`, `${2}` in the target URL to reference captured groups from the request URL pattern.
:::

:::caution
The `expression` field uses Cloudflare's Rules language. See the [Rules language documentation](https://developers.cloudflare.com/ruleset-engine/rules-language/expressions/) for syntax details.
:::
