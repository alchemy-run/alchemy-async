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