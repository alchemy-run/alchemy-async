# Astro + Cloudflare + Alchemy Example

This example demonstrates how to deploy an Astro application to Cloudflare Workers using Alchemy Infrastructure-as-Code.

## Features

- 🚀 **Astro** - Modern web framework with component islands
- ☁️ **Cloudflare Workers** - Edge runtime with global deployment
- 🔮 **Alchemy** - TypeScript Infrastructure-as-Code

## Getting Started

1. **Install dependencies:**

```bash
bun install
```

2. **Login to Cloudflare:**

```bash
bun wrangler login
```

3. **Deploy the application:**

```bash
bun run deploy
```

## Local Development

Run the Astro development server:

```bash
bun run dev
```

## Project Structure

```bash
src/
├── layouts/
│   └── Layout.astro       # Base layout component
├── pages/
│   ├── index.astro        # Homepage
│   └── api/
│       └── hello.ts       # API endpoint
└── env.d.ts              # TypeScript environment types
```

## Cloudflare Bindings

This example uses the standard Astro Cloudflare adapter bindings and runtime context.

Access these in your Astro API routes via the request context.

## Cleanup

```bash
bun run destroy
```
