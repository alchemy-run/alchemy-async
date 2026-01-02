# Railway Example

This example demonstrates deploying a web service with a PostgreSQL database to Railway using Alchemy.

## Prerequisites

1. Create a Railway account at [railway.app](https://railway.app)
2. Get an API token from [Railway account settings](https://railway.com/account/tokens)

## Setup

1. Add your Railway API token to `.env`:

```bash
RAILWAY_API_TOKEN=your_token_here
```

2. Install dependencies:

```bash
bun install
```

## Deploy

```bash
bun run deploy
```

This will:
- Create a Railway project
- Deploy a PostgreSQL database
- Deploy an nginx web server
- Configure the database connection as an environment variable
- Create a public domain for the web service

## Resources Created

- **Project**: Container for all services
- **PostgresDatabase**: Managed PostgreSQL database
- **Service**: nginx web server (can be replaced with your app)
- **Variable**: DATABASE_URL environment variable
- **Domain**: Public URL for the web service

## Tear Down

```bash
bun run destroy
```

⚠️ This will delete the database and all its data.

## Customization

Replace the nginx image with your own Docker image or GitHub repository:

```typescript
// From Docker image
const api = await Service("api", {
  project,
  source: {
    image: "your-registry/your-image:tag",
  },
});

// From GitHub
const api = await Service("api", {
  project,
  source: {
    repo: "your-username/your-repo",
    branch: "main",
  },
  buildCommand: "npm run build",
  startCommand: "npm start",
});
```
