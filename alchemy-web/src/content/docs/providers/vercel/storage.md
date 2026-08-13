---
title: Storage
description: Create and manage Vercel Storage (Blob) with Alchemy
---

Create and manage Vercel Storage. Blob Storage is currently supported.

## Authentication

You can authenticate with Vercel in one of two ways:

1. Set `VERCEL_ACCESS_TOKEN` in your `.env` file
2. Pass `accessToken` directly in your resource configuration

## Examples

### With `accessToken`

```ts
const storage = await Storage("my-storage", {
  accessToken: alchemy.secret(process.env.VERCEL_ACCESS_TOKEN),
  name: "my-storage",
  region: "iad1",
  team: "team_abc123",
  type: "blob",
});
```

### Minimal

```ts
const storage = await Storage("my-storage", {
  name: "my-storage",
  region: "cdg1",
  team: "team_abc123",
  type: "blob",
});
```

### Connect projects

Automatically connect projects and create environment variable bindings.

```ts
const storage = await Storage("my-storage", {
  name: "my-storage",
  projects: [
    {
      projectId: "prj_123",
      envVarEnvironments: ["production", "preview"],
      envVarPrefix: "MY_STORAGE_",
    },
  ],
  region: "iad1",
  team: "team_abc123",
  type: "blob",
});
```

### Update connections

Updating `projects` will add, remove, or re-create connections as needed. Changing `name`, `region`, `team`, or `type` will replace the Storage resource.

```ts
const storage = await Storage("my-storage", {
  name: "my-storage",
  projects: [
    {
      projectId: "prj_456",
      envVarEnvironments: ["production"],
      envVarPrefix: "BLOB_",
    },
  ],
  region: "iad1",
  team: "team_abc123",
  type: "blob",
});
```

## Props

- **name**: Optional display name for the storage. Defaults to the resource id
- **region**: One of Vercel regions (e.g. `"iad1"`, `"cdg1"`)
- **team**: Team id or a `VercelTeam` object
- **type**: Storage type. Currently only `"blob"`
- **projects**: Optional list of project connections with `projectId`, `envVarEnvironments`, and optional `envVarPrefix`

## Notes

- When replacing storage (changing `name`, `region`, `team`, or `type`), the old storage is deleted and a new one created
- Project connections are reconciled during updates: new ones are created, removed ones are disconnected, and changed ones are re-created