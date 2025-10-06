---
title: Service
description: Learn how to create, configure, and manage Clickhouse databases using Alchemy.
---

The Service resource lets you create and manage [Clickhouse Services](https://clickhouse.com) using Alchemy.

## Basic Example

Pass your organization name directly as a string.

```ts
import { Service } from "alchemy/clickhouse";

const service = await Service("clickhouse", {
	organization: "my-organization",
	provider: "aws",
	region: "us-east-1",
	minReplicaMemoryGb: 8,
	maxReplicaMemoryGb: 356,
	numReplicas: 3,
});
```

## Using Organization ID

Pass an organization ID directly instead of a name.

```ts
const service = await Service("clickhouse", {
	organization: "org_abc123def456",
	provider: "aws",
	region: "us-east-1",
	minReplicaMemoryGb: 8,
	maxReplicaMemoryGb: 356,
	numReplicas: 3,
});
```

## Using OrganizationRef

Look up an organization by name to get additional metadata.

```ts
import { Service, OrganizationRef } from "alchemy/clickhouse";

const organization = await OrganizationRef("my-organization");

const service = await Service("clickhouse", {
	organization,
	provider: "aws",
	region: "us-east-1",
	minReplicaMemoryGb: 8,
	maxReplicaMemoryGb: 356,
	numReplicas: 3,
});
```

## Example with Cloudflare Worker
```ts
// alchemy.run.ts
import alchemy from "alchemy";
import { Service } from "alchemy/clickhouse";
import { Worker } from "alchemy/cloudflare";

export const app = await alchemy("alchemy-test-clickhouse");

const service = await Service("clickhouse", {
	organization: "my-organization",
	provider: "aws",
	region: "us-east-1",
	minReplicaMemoryGb: 8,
	maxReplicaMemoryGb: 356,
	numReplicas: 3,
});

const serviceEndpoint = service.endpoints.find(
	(endpoint) => endpoint.protocol === "https",
)!;

export const worker = await Worker("worker", {
	entrypoint: "./src/worker.ts",
	bindings: {
		CLICKHOUSE_URL: `https://${serviceEndpoint.host}:${serviceEndpoint.port}`,
		CLICKHOUSE_PASSWORD: service.password,
	},
});

await app.finalize();
```

```ts
// src/worker.ts
import type { worker } from "../alchemy.run";
import { createClient } from "@clickhouse/client-web";

export default {
	async fetch(req: Request, env: typeof worker.Env): Promise<Response> {
		const url = new URL(req.url);
		const clickhouseClient = createClient({
			url: env.CLICKHOUSE_URL,
			password: env.CLICKHOUSE_PASSWORD,
		});

		if (url.pathname === "/read") {
			const query = "SELECT id, time FROM worker_log";
			const result = await clickhouseClient.query({
				query,
				format: "JSONEachRow",
			});
			const rows = await result.json();
			return new Response(JSON.stringify(rows), {
				headers: { "Content-Type": "application/json" },
			});
		} else if (url.pathname === "/") {
			const id = crypto.randomUUID();
			await clickhouseClient.insert({
				table: "worker_log",
				values: [{ id, time: new Date().toISOString() }],
				format: "JSONEachRow",
			});
			return new Response(JSON.stringify({ success: true }), {
				headers: { "Content-Type": "application/json" },
			});
		} else {
			return new Response("Not found", { status: 404 });
		}
	},
};

```