# Railway Provider

Alchemy provider for [Railway](https://railway.com), a modern cloud platform for deploying applications, databases, and services.

## Resources

| Resource | Kind | Lifecycle | Immutable Props |
|----------|------|-----------|-----------------|
| [Project](./project.ts) | `railway::Project` | Create, Update, Delete | - |
| [Service](./service.ts) | `railway::Service` | Create, Update, Delete | `source` |
| [Environment](./environment.ts) | `railway::Environment` | Create, Replace, Delete | `name` |
| [Domain](./domain.ts) | `railway::Domain` | Create, Update, Replace, Delete | `domain` (custom) |
| [Variable](./variable.ts) | `railway::Variable` | Create, Update, Delete | - |
| [Volume](./volume.ts) | `railway::Volume` | Create, Replace, Delete | `mountPath` |
| [TCPProxy](./tcp-proxy.ts) | `railway::TCPProxy` | Create, Replace, Delete | `applicationPort` |

## Architecture

### API Client (`api.ts`)

`RailwayApi` is a minimal GraphQL client targeting `https://backboard.railway.com/graphql/v2`. Authentication is via a Bearer token from:
1. `apiToken` prop (as `Secret`)
2. `RAILWAY_API_TOKEN` environment variable

Errors are wrapped in `RailwayError` which preserves the GraphQL error array for pattern matching in retry logic.

### Delete Retry (`delete-retry.ts`)

`runRailwayDeleteMutation` wraps delete operations with exponential backoff to handle Railway's transient "operation is already in progress" lock errors. It also swallows "not found" errors (resource already deleted).

Configuration: up to 8 attempts, 500ms initial delay, 5s max delay.

All 7 resources use this for their delete phase.

### Immutable Property Replacement

When an immutable property changes (e.g., `mountPath` on Volume, `name` on Environment), the resource calls `this.replace()` which:
1. Creates a new resource with the updated properties
2. Schedules the old resource for deletion during `scope.finalize()`

### Resource References

Props that reference other Railway entities accept `string | Resource` unions:
- `project: string | Project` (resolves to `projectId`)
- `service: string | Service` (resolves to `serviceId`)
- `environment: string | Environment` (resolves to `environmentId`)

This enables both Alchemy-managed references and raw ID strings for external resources.

## Resource Details

### Project

Root resource. Supports `adopt: true` to adopt existing projects by name. `delete: false` prevents deletion on teardown. Resolves `workspaceId` from props, `RAILWAY_WORKSPACE_ID` env var, or auto-detects the first workspace.

### Service

Most complex resource. Supports GitHub repo and Docker image sources. Manages deployment triggers (GitHub webhook integration) with full reconciliation on update. Configurable build/start commands, health checks, replicas, cron schedules, and region.

### Environment

Creates non-production environments within a project. Name is immutable (triggers replacement).

### Domain

Two types: Railway-generated (`*.up.railway.app`) and custom domains. Custom domain changes trigger replacement. `targetPort` can be updated in-place via `serviceInstanceUpdate`.

### Variable

Manages key-value environment variables scoped to a project+environment, optionally to a service. Tracks keys for differential updates: new keys are upserted, removed keys are deleted concurrently via `Promise.all`. Supports `Secret` values.

### Volume

Persistent storage attached to a service. `mountPath` is immutable (triggers replacement). Supports `delete: false` to preserve data on teardown.

### TCPProxy

Exposes non-HTTP services via a public TCP endpoint. Railway assigns the proxy domain and port. `applicationPort` is immutable (triggers replacement).
