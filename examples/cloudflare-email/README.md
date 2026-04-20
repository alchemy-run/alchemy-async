# Cloudflare Email Service Example

This example shows how to bind Cloudflare Email Service to a Worker with Alchemy and send either a plain-text or HTML email.

## What it does

- Creates a Cloudflare Worker
- Attaches a `send_email` binding with `EmailSender()`
- Sends a plain-text email from `/`
- Sends an HTML email from `/html`

## Before you deploy

You need a Cloudflare account on a Workers Paid plan and a configured Email Service sender that matches the `from` address used by the Worker.

Update the sender and recipient addresses in [worker.ts](./worker.ts) and [alchemy.run.ts](./alchemy.run.ts):

- `from`: must be a sender address allowed by your Email Service setup
- `to`: should be a valid destination address for testing

## Deploy

```sh
bun run deploy
```

After deployment, request:

- `/` to send a plain-text email
- `/html` to send an HTML email

## Local development

```sh
bun run dev
```

This example uses `dev.remote: true` so local requests still send through Cloudflare Email Service.

## Cleanup

```sh
bun run destroy
```
