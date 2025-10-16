---
title: Workspace
description: Learn how to manage Prisma Postgres workspaces using Alchemy.
---

Alchemy exposes a utility to easily reference [Prisma Postgres workspaces](https://www.prisma.io/docs/platform/about#workspace) by name or id.

## Minimal Example

```ts
import { WorkspaceRef } from "alchemy/prisma-postgres";

const workspace = await WorkspaceRef("my-workspace");
```

## Using Multiple Workspaces

Prisma Postgres service tokens are scoped to a workspace. In order to use multiple workspaces, you can override the `serviceToken` to the token for the workspace needed.

```ts
const workspaceAProject = await Project("workspace-a-project", {
  serviceToken: alchemy.env.PRISMA_SERVICE_TOKEN_WORKSPACE_A,
});

const workspaceBProject = await Project("workspace-b-project", {
  serviceToken: alchemy.env.PRISMA_SERVICE_TOKEN_WORKSPACE_B,
});

```