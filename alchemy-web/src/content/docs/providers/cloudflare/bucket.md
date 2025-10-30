---
title: R2Bucket
description: Learn how to create, configure, and manage Cloudflare R2 Buckets using Alchemy for scalable object storage.
---

Creates and manages [Cloudflare R2 Buckets](https://developers.cloudflare.com/r2/buckets/) for object storage with S3 compatibility.

## Minimal Example

Create a basic R2 bucket with default settings:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("my-bucket", {
  name: "my-bucket",
});
```

## Bind to a Worker

```ts
import { Worker, R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("my-bucket", {
  name: "my-bucket",
});

await Worker("my-worker", {
  name: "my-worker",
  script: "console.log('Hello, world!')",
  bindings: {
    BUCKET: bucket,
  },
});
```

## With Location Hint

Create a bucket with location hint for optimal performance:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const euBucket = await R2Bucket("eu-bucket", {
  name: "eu-bucket",
  locationHint: "eu",
  jurisdiction: "eu",
});
```

## With `r2.dev` Domain

Create a development bucket with the `r2.dev` domain enabled:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const publicBucket = await R2Bucket("public-assets", {
  name: "public-assets",
  devDomain: true,
});
console.log(publicBucket.devDomain); // [random-id].r2.dev
```

This enables the `r2.dev` domain for the bucket. This URL is rate-limited and not recommended for production use.

## With Custom Domain

Create a bucket with a custom domain:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const customDomainBucket = await R2Bucket("custom-domain-bucket", {
  name: "custom-domain-bucket",
  domains: "custom-domain.com", // or ["custom-domain-1.com", "custom-domain-2.com"] to set more than one
});
```

## With CORS

Create a bucket with CORS rules:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const corsBucket = await R2Bucket("cors-bucket", {
  name: "cors-bucket",
  cors: [
    {
      allowed: {
        origins: ["https://example.com"],
        methods: ["GET", "POST", "PUT", "DELETE", "HEAD"],
        headers: ["*"],
      },
    },
  ],
});
```

## With Auto-Emptying

Create a bucket that will be automatically emptied when deleted:

```ts
import { R2Bucket } from "alchemy/cloudflare";

const tempBucket = await R2Bucket("temp-storage", {
  name: "temp-storage",
  empty: true, // All objects will be deleted when this resource is destroyed
});
```

## With Lifecycle Rules

Configure automatic transitions like aborting multipart uploads, deleting objects after an age or date, or moving objects to Infrequent Access.

```ts
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("logs", {
  name: "logs",
  lifecycle: [
    // Abort incomplete multipart uploads after 7 days
    {
      id: "abort-mpu-7d",
      conditions: { prefix: "" }, // empty means apply to all objects/uploads
      enabled: true,
      abortMultipartUploadsTransition: {
        condition: { type: "Age", maxAge: 7 * 24 * 60 * 60 },
      },
    },
    // Delete objects after 30 days
    {
      id: "delete-30d",
      conditions: { prefix: "archive/" },
      deleteObjectsTransition: {
        condition: { type: "Age", maxAge: 30 * 24 * 60 * 60 },
      },
    },
    // Transition storage class to InfrequentAccess after 60 days
    {
      id: "ia-60d",
      conditions: { prefix: "cold/" },
      storageClassTransitions: [
        {
          condition: { type: "Age", maxAge: 60 * 24 * 60 * 60 },
          storageClass: "InfrequentAccess",
        },
      ],
    },
  ],
});
```

- **conditions.prefix**: Scope rule to keys beginning with a prefix. Use "" for all keys.
- **enabled**: Defaults to `true` when omitted.
- **Age condition fields**: lifecycle uses `maxAge` (seconds).
- **Date condition fields**: use ISO strings like `"2025-01-01T00:00:00Z"`.

## With Object Lock Rules

Apply retention locks to objects by age, until a fixed date, or indefinitely.

```ts
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("legal-holds", {
  name: "legal-holds",
  lock: [
    // Lock all objects for 7 days
    {
      id: "retain-7d",
      prefix: "",
      enabled: true,
      condition: { type: "Age", maxAgeSeconds: 7 * 24 * 60 * 60 },
    },
    // Indefinite lock for the legal prefix
    {
      id: "legal-indef",
      prefix: "legal/",
      condition: { type: "Indefinite" },
    },
    // Retain until a specific date
    {
      id: "retain-until-2025",
      prefix: "exports/",
      condition: { type: "Date", date: "2025-01-01T00:00:00Z" },
    },
  ],
});
```

- **prefix**: Scope the lock rule to objects starting with the prefix. Omit or set to "" for all keys.
- **enabled**: Defaults to `true` when omitted.
- **Age condition fields**: lock uses `maxAgeSeconds` (seconds).

## With Data Catalog

Enable data catalog for the bucket.

```ts
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("my-bucket", {
  name: "my-bucket",
  dataCatalog: true,
});

console.log(bucket.catalog);
```

## Object Operations

Use the returned `R2Bucket` instance to work with objects directly from your scripts.

```ts
import { R2Bucket } from "alchemy/cloudflare";

const bucket = await R2Bucket("my-bucket", {
  name: "my-bucket",
});
```


### `head`

Retrieve metadata about an object.

```ts
const head = await bucket.head("example.txt");
if (head) {
  console.log(head.etag, head.size);
}
```

### `get`

Retrieve an object from the bucket.

```ts
const obj = await bucket.get("example.txt");
const text = await obj?.text();
```

### `put`

Upload an object to the bucket.

```ts
const putInfo = await bucket.put("example.txt", "Hello, R2!\n");
```

### `delete`

Delete an object from the bucket.

```ts
await bucket.delete("example.txt");
```

### `list`  

List objects in the bucket.

```ts
const list = await bucket.list();
console.log(list.objects.length);
```