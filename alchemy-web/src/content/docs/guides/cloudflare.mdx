---
title: Cloudflare Auth
description: Configure Cloudflare authentication for your Alchemy applications. Learn to use API tokens, OAuth, or global API keys to securely manage Cloudflare resources.
sidebar:
  order: 0
---

import { Tabs, TabItem } from '@astrojs/starlight/components';

There are three supported ways of authorizing Alchemy with Cloudflare:
1. **OAuth (recommended**) - short-lived access and refresh tokens
2. **API Token** - a token you create once with limited scopes
3. **Global API Key** (legacy) - the global, highly permissive API key

:::tip
We recommend using [Profiles](/concepts/profiles) to manage your credentials. 

While API Tokens and Global API Keys can be set as environment variables, all three methods can be configured using Profiles and the `alchemy configure` CLI command.
:::

## OAuth

To use OAuth with Cloudflare, create a [Profile](/concepts/profiles) with `alchemy configure` and select OAuth for Cloudflare.

Once setup, you can refresh your OAuth tokens with Cloudflare using the `alchemy login` command:

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    bun alchemy login [--profile <profile>]
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    npx alchemy login [--profile <profile>]
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    pnpm alchemy login [--profile <profile>]
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    yarn alchemy login [--profile <profile>]
    ```
  </TabItem>
</Tabs>

Then, deploy your app with `alchemy deploy` (or run another [CLI command](/concepts/cli)):

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

To select a specific profile, use the `--profile` flag:

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    bun alchemy deploy --profile <profile>
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    npx alchemy deploy --profile <profile>
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    pnpm alchemy deploy --profile <profile>
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

## API Token

First, [create an API Token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/) and then use it in your Alchemy app.

:::tip
The Alchemy CLI exposes a utility for creating Cloudflare tokens from your [Alchemy Profile](/concepts/profiles) or "god" tokens with full access to all services.

See [util create-cloudflare-token](/concepts/cli#util-create-cloudflare-token) for more details.
:::

By default, Alchemy will use the `CLOUDFLARE_API_TOKEN` environment variable if set.

You can store the token in your `.env` file
```sh
CLOUDFLARE_API_TOKEN=<token>
```

Or set when deploying your app:

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    CLOUDFLARE_API_TOKEN=<token> bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    CLOUDFLARE_API_TOKEN=<token> npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    CLOUDFLARE_API_TOKEN=<token> pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    CLOUDFLARE_API_TOKEN=<token> yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

You can explciitly set an `apiToken` when creating a Cloudflare Resource, such as a `Worker`:

```ts
await Worker("my-worker", {
  apiToken: alchemy.secret(process.env.MY_TOKEN)
});
```

:::caution
To use `alchemy.secret`, you must set a `password` when initializing your alchemy app. See [Encryption Password](/concepts/secret#encryption-password).
:::

## Global API Key

After you verify your Cloudflare Account's Email, you will be given a [Global API Key](https://developers.cloudflare.com/fundamentals/api/get-started/keys/).

:::caution
These keys have several limitations that make them less secure than API tokens. Whenever possible, use API tokens to interact with the Cloudflare API. 

See [Cloudflare's API Docs](https://developers.cloudflare.com/api/).
:::

By default, Alchemy will use the `CLOUDFLARE_API_KEY` environment variable if set.

You can store the token in your `.env` file
```sh
CLOUDFLARE_API_KEY=<token>
```

Or set when deploying your app:

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    CLOUDFLARE_API_KEY=<token> bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    CLOUDFLARE_API_KEY=<token> npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    CLOUDFLARE_API_KEY=<token> pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    CLOUDFLARE_API_KEY=<token> yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

You can explciitly set an `apiKey` when creating a Cloudflare Resource, such as a `Worker`:

```ts
await Worker("my-worker", {
  apiKey: alchemy.secret(process.env.MY_GLOBAL_KEY)
});
```

:::caution
To use `alchemy.secret`, you must set a `password` when initializing your alchemy app. See [Encryption Password](/concepts/secret#encryption-password).
:::

## Email

When using [Global API Keys](#global-api-key), Alchemy must be configured with the API Key's email.

By default, Alchemy will use the `CLOUDFLARE_EMAIL` if set

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=<token> bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=<token> npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=<token> pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=<token> yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

You can explicitly set `email` when creating a Cloudlfare Resource:

```ts
await Worker("my-worker", {
  apiKey: alchemy.secret(process.env.MY_GLOBAL_KEY),
  email: "me@example.com"
});
```

:::caution
To use `alchemy.secret`, you must set a `password` when initializing your alchemy app. See [Encryption Password](/concepts/secret#encryption-password).
:::

## Account ID

By default, Alchemy will resolve the account ID from the Profile or look it up using your API Key or Token.

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    # will use wrangler login and resolve the first account you have acces to (ideal for personal accounts)
    bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    # will use wrangler login and resolve the first account you have acces to (ideal for personal accounts)
    npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    # will use wrangler login and resolve the first account you have acces to (ideal for personal accounts)
    pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    # will use wrangler login and resolve the first account you have acces to (ideal for personal accounts)
    yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

:::caution
If your token has access to more than one account, Alchemy chooses the first one arbitrarily.
:::

You can override the default account ID with the `CLOUDFLARE_ACCOUNT_ID` environment variable:

<Tabs syncKey="pkgManager">
  <TabItem label="bun">
    ```sh
    CLOUDFLARE_ACCOUNT_ID=<account-id> bun alchemy deploy
    ```
  </TabItem>
  <TabItem label="npm">
    ```sh
    CLOUDFLARE_ACCOUNT_ID=<account-id> npx alchemy deploy
    ```
  </TabItem>
  <TabItem label="pnpm">
    ```sh
    CLOUDFLARE_ACCOUNT_ID=<account-id> pnpm alchemy deploy
    ```
  </TabItem>
  <TabItem label="yarn">
    ```sh
    CLOUDFLARE_ACCOUNT_ID=<account-id> yarn alchemy deploy
    ```
  </TabItem>
</Tabs>

Or by setting `accountId` when creating a Cloudflare Resource:
```ts
await Worker("my-worker", {
  accountId: "my-account-id",
});
``` 