# DevScript Example

This example demonstrates how to use the `DevScript` resource to run local development tools alongside your cloud infrastructure.

## What This Example Does

1. **Deploys a Cloudflare Worker** - A simple API endpoint
2. **Runs a Local Dashboard** - Uses `DevScript` to start a monitoring dashboard that watches the Worker
3. **Waits for Readiness** - DevScript extracts the dashboard URL from output before completing

## Features Demonstrated

- ✅ **Local-only execution** - Dashboard only runs in `alchemy dev` mode
- ✅ **Local development** - Both Worker and Dashboard run on localhost in dev mode
- ✅ **Extract patterns** - Waits for dashboard URL before completing deployment
- ✅ **Environment variables** - Passes local Worker URL to dashboard
- ✅ **Restart policies** - Dashboard restarts when Worker URL changes
- ✅ **Production behavior** - Dashboard skipped when deploying to Cloudflare

## Quick Start

```bash
# Install dependencies
bun install

# Run in development mode
# - Worker runs locally (http://localhost:8787)
# - Dashboard monitors the local Worker
bun run dev

# Deploy to production
# - Worker deploys to Cloudflare (https://xxx.workers.dev)
# - Dashboard does NOT run (local-only)
bun run deploy

# Clean up
bun run destroy
```

## What Happens

### Development Mode (`bun run dev`)

1. Alchemy starts the Worker **locally** via Miniflare (e.g., `http://localhost:8787`)
2. DevScript starts the local dashboard (e.g., `http://localhost:3002`)
3. Dashboard monitors the **local** Worker
4. Both URLs are printed to console
5. Changes to Worker code trigger hot reload
6. Dashboard automatically restarts if Worker URL changes

**Example output:**
```
📡 Worker URL:    http://localhost:8787
🎯 Dashboard URL: http://localhost:3002
```

### Production Mode (`bun run deploy`)

1. Alchemy deploys the Worker to **Cloudflare** (e.g., `https://xxx.workers.dev`)
2. DevScript returns metadata without starting (non-local mode)
3. Only the Worker is active in production
4. Dashboard does NOT run in production

**Example output:**
```
📡 Worker URL:    https://os-dev-script-worker-prod.xxx.workers.dev
🎯 Dashboard URL: undefined (not running in production)
```

## Dashboard Features

The dashboard (`src/dashboard.ts`) is a simple monitoring tool that:

- Polls the Worker every 2 seconds
- Displays response times and status
- Shows the last 10 requests
- Provides a simple HTTP interface

## Project Structure

```
os-dev-script/
├── alchemy.run.ts       # Main deployment script
├── src/
│   └── dashboard.ts     # Local monitoring dashboard
├── package.json
├── tsconfig.json
└── README.md
```

## Customization

### Change Dashboard Port

Edit `src/dashboard.ts`:

```ts
const PORT = 3001; // Change this
```

### Change Restart Policy

Edit `alchemy.run.ts`:

```ts
export const dashboard = await DevScript("dashboard", {
  // ...
  restartOnUpdate: "always", // or "never"
});
```

### Add Secrets

Edit `alchemy.run.ts`:

```ts
export const dashboard = await DevScript("dashboard", {
  // ...
  env: {
    WORKER_URL: worker.url,
    API_KEY: alchemy.secret.env.API_KEY,
  },
});
```

## Learn More

- [DevScript Documentation](/providers/os/dev-script/)
- [OS Provider Overview](/providers/os/)
- [Alchemy Dev Mode Guide](/guides/dev-mode/)

