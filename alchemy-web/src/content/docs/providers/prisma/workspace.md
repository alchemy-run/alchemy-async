---
title: Workspace
description: Learn how to manage Prisma workspaces using Alchemy.
---

Alchemy exposes a utility to easily reference Prisma workspaces by name or id.

## Minimal Example

```ts
import { WorkspaceRef } from "alchemy/prisma";

const workspace = await WorkspaceRef("my-workspace");
```