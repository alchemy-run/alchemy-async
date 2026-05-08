---
title: Bucket
description: Learn how to create and manage Hetzner Object Storage buckets using Alchemy's S3-compatible API.
---

The `Bucket` resource lets you create and manage [Hetzner Object Storage](https://www.hetzner.com/storage/object-storage) buckets. Hetzner Object Storage is fully S3-compatible and hosted across three European regions.

## Minimal Example

Create a bucket in the Frankfurt region using credentials from environment variables:

```ts
import { Bucket } from "alchemy/hetzner";

const bucket = await Bucket("assets", {
  region: "fsn1",
});

console.log(bucket.endpoint);          // https://fsn1.your-objectstorage.com
console.log(bucket.bucketDomainName);  // assets-my-app-prod.fsn1.your-objectstorage.com
```

## Explicit Name and Region

Pin a bucket to a specific name and region — useful when the name must be stable across stages:

```ts
import { Bucket } from "alchemy/hetzner";

const bucket = await Bucket("backups", {
  name: "my-app-backups",
  region: "nbg1",
});
```

:::caution
`name` is **immutable** after creation. Changing it destroys the old bucket and creates a new one.
:::

## Explicit Credentials

Supply credentials directly instead of relying on environment variables:

```ts
import alchemy from "alchemy";
import { Bucket } from "alchemy/hetzner";

const bucket = await Bucket("uploads", {
  region: "hel1",
  accessKeyId: alchemy.secret.env.HETZNER_ACCESS_KEY_ID,
  secretAccessKey: alchemy.secret.env.HETZNER_SECRET_ACCESS_KEY,
});
```

## Retain on Destroy

Prevent the bucket from being deleted when removed from Alchemy — useful for production data that should outlive infrastructure changes:

```ts
import { Bucket } from "alchemy/hetzner";

const bucket = await Bucket("long-lived", {
  region: "fsn1",
  delete: false,
});
```

## Props

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `name` | `string` | No | `${app}-${stage}-${id}` | The bucket name. **Immutable** — changing it triggers a replacement. |
| `region` | `"fsn1" \| "nbg1" \| "hel1"` | Yes | — | Hetzner Object Storage region (`fsn1` = Frankfurt, `nbg1` = Nuremberg, `hel1` = Helsinki). |
| `accessKeyId` | `Secret` | No | `HETZNER_ACCESS_KEY_ID` env var | S3-compatible access key ID. |
| `secretAccessKey` | `Secret` | No | `HETZNER_SECRET_ACCESS_KEY` env var | S3-compatible secret access key. |
| `delete` | `boolean` | No | `true` | Whether to delete the bucket when the resource is removed from Alchemy. |

## Output

| Property | Type | Description |
|---|---|---|
| `name` | `string` | The resolved bucket name. |
| `region` | `"fsn1" \| "nbg1" \| "hel1"` | The region where the bucket lives. |
| `endpoint` | `string` | S3-compatible endpoint URL for this region (e.g. `https://fsn1.your-objectstorage.com`). |
| `bucketDomainName` | `string` | Fully-qualified domain name for the bucket (e.g. `my-bucket.fsn1.your-objectstorage.com`). |
| `delete` | `boolean \| undefined` | The configured deletion behaviour. |

## Reference

- [Hetzner Object Storage documentation](https://docs.hetzner.com/storage/object-storage/)
- [Hetzner S3-compatible API reference](https://docs.hetzner.com/storage/object-storage/api-compatibility/aws-cli/)
