---
title: Project
description: Create and manage Railway projects using Alchemy.
---

The `Project` resource creates and manages [Railway](https://railway.com) projects.

## Minimal Example

Create a basic Railway project:

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-app", {
  name: "my-app",
});
```

## With Description

Create a project with a description:

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-app", {
  name: "my-app",
  description: "Production application backend",
});
```

## Adopt Existing Project

Adopt a project that already exists in Railway:

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-app", {
  name: "existing-project-name",
  adopt: true,
});
```

## Prevent Deletion

Keep the project when removed from Alchemy:

```ts
import { Project } from "alchemy/railway";

const project = await Project("my-app", {
  name: "my-app",
  delete: false,
});
```

## Access Default Environment

Every project has a default production environment:

```ts
import { Project, Service } from "alchemy/railway";

const project = await Project("my-app", {
  name: "my-app",
});

// Use the default environment
const service = await Service("api", {
  project,
  name: "api",
  // Uses project.defaultEnvironmentId automatically
});
```
