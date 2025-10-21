---
title: OrganizationRef
description: Learn how to manage PlanetScale Organizations using Alchemy.
---

For ease of use we expose `OrganizationRef` to allow you to reference an organization by name.

## Minimal Example

An organization can be referenced by name or by ID, then passed to other planetscale resources.

```diff lang="ts"
 import { OrganizationRef, Service, Database } from "alchemy/planetscale";

+const organization = await OrganizationRef("Alchemy");

 const database = await Database("my-db", {
+  organization,
   name: "my-db",
   clusterSize: "PS_10",
 });
```