---
title: R2BucketNotification
description: Learn how to configure event notifications for R2 buckets to send messages to Cloudflare Queues when objects are created or deleted.
---

The R2BucketNotification component lets you configure [R2 Event Notifications](https://developers.cloudflare.com/r2/buckets/event-notifications/) to send messages to a Cloudflare Queue when objects are created or deleted in your R2 bucket.

## Minimal Example

Create an event notification that triggers when objects are created in a bucket.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("uploads");
const queue = await Queue("upload-events");

await R2BucketNotification("upload-notifications", {
  bucket,
  queue,
  eventTypes: ["object-create"],
});
```

## Typed Queue Messages

Use the `R2BucketNotificationMessage` type for type-safe message handling.

```ts
import {
  R2Bucket,
  Queue,
  R2BucketNotification,
  R2BucketNotificationMessage,
} from "alchemy/cloudflare";

const bucket = await R2Bucket("uploads");
const queue = await Queue<R2BucketNotificationMessage>("upload-events");

await R2BucketNotification("upload-notifications", {
  bucket,
  queue,
  eventTypes: ["object-create"],
});
```

## Filtered Notifications

Use prefix and suffix filters to only receive notifications for specific object patterns.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("documents");
const queue = await Queue("pdf-processing");

await R2BucketNotification("pdf-uploads", {
  bucket,
  queue,
  eventTypes: ["object-create"],
  prefix: "incoming/",
  suffix: ".pdf",
  description: "Process uploaded PDF files",
});
```

## Multiple Suffixes

Create rules for multiple file extensions at once. This creates separate notification rules for each suffix.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("media");
const queue = await Queue("audio-processing");

await R2BucketNotification("audio-uploads", {
  bucket,
  queue,
  eventTypes: ["object-create"],
  prefix: "audio/",
  suffix: [".mp3", ".wav", ".flac", ".aac"],
});
```

## Multiple Prefixes

Create rules for multiple directory paths at once. This creates separate notification rules for each prefix.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("uploads");
const queue = await Queue("file-processing");

await R2BucketNotification("multi-path-uploads", {
  bucket,
  queue,
  eventTypes: ["object-create"],
  prefix: ["uploads/", "imports/", "temp/"],
  suffix: ".json",
});
```

> **Note:** Either `prefix` OR `suffix` can be an array, but not both at the same time.

## Multiple Event Types

Listen for both create and delete events.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("assets");
const queue = await Queue("asset-events");

await R2BucketNotification("asset-notifications", {
  bucket,
  queue,
  eventTypes: ["object-create", "object-delete"],
});
```

## Process Notifications with a Worker

Complete example showing how to process bucket notifications with a Worker.

```ts
import {
  R2Bucket,
  Queue,
  R2BucketNotification,
  Worker,
  R2BucketNotificationMessage,
} from "alchemy/cloudflare";

const bucket = await R2Bucket("uploads");
const queue = await Queue<R2BucketNotificationMessage>("upload-events");

await R2BucketNotification("upload-notifications", {
  bucket,
  queue,
  eventTypes: ["object-create"],
});

export const worker = await Worker("processor", {
  entrypoint: "./src/processor.ts",
  bindings: {
    BUCKET: bucket,
  },
  eventSources: [queue],
});
```

```ts
// src/processor.ts
import type { worker, queue } from "../alchemy.run";

export default {
  async queue(batch: typeof queue.Batch, env: typeof worker.Env) {
    for (const message of batch.messages) {
      const event = message.body;
      console.log(`Object ${event.action}: ${event.object.key}`);

      if (event.action === "PutObject") {
        // Process newly uploaded object
        const object = await env.BUCKET.get(event.object.key);
        if (object) {
          console.log(`Processing ${event.object.key} (${event.object.size} bytes)`);
        }
      }

      message.ack();
    }
  },
};
```

## EU Jurisdiction Bucket

Configure notifications for a bucket in the EU jurisdiction.

```ts
import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";

const bucket = await R2Bucket("eu-data", {
  jurisdiction: "eu",
});

const queue = await Queue("eu-events");

await R2BucketNotification("eu-notifications", {
  bucket,
  queue,
  eventTypes: ["object-create", "object-delete"],
  jurisdiction: "eu",
});
```

## Event Types

| Event Type | Description | Trigger Actions |
|------------|-------------|-----------------|
| `object-create` | Triggered when objects are created or overwritten | `PutObject`, `CompleteMultipartUpload`, `CopyObject` |
| `object-delete` | Triggered when objects are explicitly deleted | `DeleteObject`, `LifecycleDeletion` |

## Message Format

Queue consumers receive notification messages with the following structure:

```ts
interface R2BucketNotificationMessage {
  account: string;      // Cloudflare account ID
  action: string;       // Action that triggered the event (e.g., "PutObject")
  bucket: string;       // Bucket name
  object: {
    key: string;        // Object key/name
    size?: number;      // Size in bytes (not present for deletes)
    eTag?: string;      // Entity tag (not present for deletes)
  };
  eventTime: string;    // ISO 8601 timestamp
  copySource?: {        // Only present for CopyObject events
    bucket: string;
    object: string;
  };
}
```
