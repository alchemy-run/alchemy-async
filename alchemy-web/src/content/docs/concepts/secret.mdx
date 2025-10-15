---
title: Secret
description: Learn how to safely handle API keys, passwords and credentials.
sidebar:
  order: 0.3
---

Alchemy provides built-in mechanisms for handling sensitive data securely. This guide explains how to manage secrets in your Alchemy resources.

## What are Secrets?

Secrets in Alchemy are sensitive values that need special handling to prevent exposure in logs, state files, or source code. Examples include:

- API keys and tokens
- Passwords and credentials
- Private certificates
- Connection strings with credentials

## Encryption Password

Secrets are encrypted using a password that you provide when initializing your Alchemy app:

```typescript
const app = await alchemy("my-app", {
  stage: "dev",
  password: process.env.SECRET_PASSPHRASE,
});
```

:::caution
Always store your encryption password securely and never commit it to source control.
:::

## Using the alchemy.secret() Function

The primary way to handle secrets in Alchemy is with the `alchemy.secret()` function:

```typescript
// Create a secret from an environment variable
const apiKey = alchemy.secret(process.env.API_KEY);
```

When a secret is stored in state, it is automatically encrypted:

```json
{
  "props": {
    "key": {
      "@secret": "Tgz3e/WAscu4U1oanm5S4YXH..."
    }
  }
}
```

## Using Secrets in Resources

Secrets can be passed to resources like Cloudflare Workers. First, define your worker script:

```typescript
// worker-script.ts
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname.startsWith('/env/')) {
      const varName = url.pathname.split('/env/')[1];
      const value = env[varName];
      return new Response(value || 'undefined', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }
    
    return new Response('Secret is safe: ' + env.API_KEY, { status: 200 });
  }
};
```

Then use the script and bind the secrets:

```typescript
// Use the script with secrets
const worker = await Worker("multi-secret-worker", {
  name: "multi-secret-worker",
  script: workerScript,
  format: "esm",
  bindings: {
    API_KEY: alchemy.secret(process.env.API_KEY),
    DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
    JWT_SECRET: alchemy.secret(process.env.JWT_SECRET)
  }
});
```
