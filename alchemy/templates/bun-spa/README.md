# Bun + React + TypeScript

[![Deployed with Alchemy](https://alchemy.run/alchemy-badge.svg)](https://alchemy.run)

This template provides a minimal setup to get React working with Bun's native bundler, featuring Hot Module Reloading (HMR) and a simple backend API.

## Features

- **Bun's Native Bundler**: Fast bundling with built-in support for TypeScript, JSX, and CSS
- **Hot Module Reloading**: Changes to your frontend code are instantly reflected in the browser
- **Cloudflare Workers**: Backend API powered by Cloudflare Workers
- **Single Page Application**: Optimized static asset serving in production

## Making API Calls to the Backend

The template includes a simple example of calling your backend API. Use the `getBackendUrl()` helper to get the correct backend URL in both dev and production:

```tsx
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

const apiBaseUrl = getBackendUrl();

function backendUrl(path: string) {
  return new URL(path, apiBaseUrl);
}

// Make API calls
const response = await fetch(backendUrl("/api/hello"));
const data = await response.json();
```

This pattern works seamlessly in both:
- **Development**: Routes requests to your local dev server
- **Production**: Routes requests to your deployed Cloudflare Worker

## Development vs Production

### Development

In development mode (`bun run dev`), Bun serves your application with HMR enabled:
- Frontend changes are applied instantly in the browser
- Backend changes trigger automatic redeployment
- Static assets are served directly by Bun's dev server

### Production

In production (`bun run deploy`), your application is optimized for Cloudflare:
- Static assets are bundled into the `dist/client` directory
- Assets are uploaded to Cloudflare and served before the worker
- Worker handles API routes and fallback responses

## Getting Started

```sh
# Install dependencies
bun install

# Start development server
bun run dev

# Deploy to Cloudflare
bun run deploy

# Destroy resources
bun run destroy
```

## Project Structure

```
├── alchemy.run.ts      # Infrastructure definition
├── bunfig.toml         # Bun configuration for BUN_PUBLIC_* env vars
├── package.json        # Dependencies and scripts
├── src/
│   ├── index.html      # Main HTML entry point
│   ├── App.tsx         # Main React component
│   ├── frontend.tsx    # React entry point with HMR
│   ├── worker.ts       # Cloudflare Worker backend
│   └── assets/         # Static assets (images, etc.)
└── types/
    └── worker.d.ts     # Worker's Env type definition from bindings
```

## Environment Variables

The `bunfig.toml` file is required for Bun to expose `BUN_PUBLIC_*` environment variables to your frontend during development. This allows alchemy to pass configuration to your frontend during development.

## Learn More

- [Alchemy Documentation](https://alchemy.run)
- [Bun Documentation](https://bun.sh/docs)
- [React Documentation](https://react.dev)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)

