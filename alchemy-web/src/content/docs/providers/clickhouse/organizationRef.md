---
title: OrganizationRef
description: Learn how to manage Clickhouse Cloud Organizations using Alchemy.
---

Clickhouse Cloud doesn't allow orchestration of organizations via api, all organizations need to be created and configured manually.

For ease of use we expose `OrganizationRef` to allow you to reference an organization by name.

## Minimal Example

```ts
import { OrganizationRef, Service } from "alchemy/clickhouse";

const organization = await OrganizationRef("Alchemy");

const service = await Service("clickhouse", {
	organization,
	provider: "aws",
	region: "us-east-1",
	minReplicaMemoryGb: 8,
	maxReplicaMemoryGb: 356,
	numReplicas: 3,
});
```