---
title: SendEmailBinding
description: Learn how to configure Cloudflare Email Service send_email bindings for Workers using Alchemy.
---

The [Cloudflare Email Service Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/) lets your Worker send outbound email through a native `send_email` binding.

Use `SendEmailBinding()` inside a Worker's `bindings` block when you want first-class, type-safe email sending from `env`.

## Minimal Example

Create a Worker with an email binding:

```ts
import { SendEmailBinding, Worker } from "alchemy/cloudflare";

const worker = await Worker("mailer", {
  name: "mailer",
  entrypoint: "./src/worker.ts",
  bindings: {
    EMAIL: SendEmailBinding(),
  },
});
```

## Worker Runtime Usage

Send an email from your Worker:

```ts
interface Env {
  EMAIL: SendEmail;
}

export default {
  async fetch(_request: Request, env: Env) {
    await env.EMAIL.send({
      from: "noreply@example.com",
      to: "hello@example.com",
      subject: "Hello",
      text: "Sent from Cloudflare Email Service.",
    });

    return new Response("sent");
  },
};
```

## Restrict Allowed Senders

Lock the binding down to one or more sender addresses:

```ts
import { SendEmailBinding, Worker } from "alchemy/cloudflare";

const worker = await Worker("mailer", {
  name: "mailer",
  entrypoint: "./src/worker.ts",
  bindings: {
    EMAIL: SendEmailBinding({
      allowedSenderAddresses: ["noreply@example.com"],
    }),
  },
});
```

## Restrict Destinations

Use `destinationAddress` to pin delivery to a single address, or `allowedDestinationAddresses` to allow a list of addresses:

```ts
import { SendEmailBinding, Worker } from "alchemy/cloudflare";

const worker = await Worker("mailer", {
  name: "mailer",
  entrypoint: "./src/worker.ts",
  bindings: {
    EMAIL: SendEmailBinding({
      allowedDestinationAddresses: [
        "ops@example.com",
        "support@example.com",
      ],
    }),
  },
});
```

`destinationAddress` and `allowedDestinationAddresses` are mutually exclusive.

## Local Development With Remote Email Sending

Set `dev.remote` to `true` to keep the Worker running locally while the email binding sends through Cloudflare:

```ts
import { SendEmailBinding, Worker } from "alchemy/cloudflare";

const worker = await Worker("mailer", {
  name: "mailer",
  entrypoint: "./src/worker.ts",
  bindings: {
    EMAIL: SendEmailBinding({
      allowedSenderAddresses: ["noreply@example.com"],
      dev: { remote: true },
    }),
  },
});
```

## Properties

### Input Properties

- `destinationAddress` (string, optional): Restrict all sends to a single destination address
- `allowedDestinationAddresses` (string[], optional): Restrict sends to a fixed allowlist of destination addresses
- `allowedSenderAddresses` (string[], optional): Restrict sends to a fixed allowlist of sender addresses
- `dev.remote` (boolean, optional): Use Cloudflare's remote binding while developing locally

## Learn More

- [Cloudflare Email Service Workers API](https://developers.cloudflare.com/email-service/api/send-emails/workers-api/)
- [Cloudflare local development for Email Service](https://developers.cloudflare.com/email-service/local-development/sending/)
