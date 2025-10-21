---
title: File
description: Learn how to create and manage Stripe Files for uploads using Alchemy.
---

The File resource lets you create and manage [Stripe Files](https://stripe.com/docs/api/files) for uploading documents and images to Stripe.

## Minimal Example

Upload a dispute evidence file:

```ts
import { File } from "alchemy/stripe";
import fs from "node:fs/promises";

const disputeEvidence = await File("dispute-evidence", {
  file: await fs.readFile("./evidence.pdf"),
  purpose: "dispute_evidence",
});
```

## Identity Document

Upload an identity document:

```ts
import { File } from "alchemy/stripe";
import fs from "node:fs/promises";

const identityDocument = await File("identity-doc", {
  file: await fs.readFile("./passport.jpg"),
  purpose: "identity_document",
});
```

## Business Logo with File Link

Upload a business logo with file link:

```ts
import { File } from "alchemy/stripe";
import fs from "node:fs/promises";

const businessLogo = await File("business-logo", {
  file: await fs.readFile("./logo.png"),
  purpose: "business_logo",
  fileLink: {
    create: true,
    expiresAt: Math.floor(Date.now() / 1000) + 86400,
    metadata: {
      brand: "company_logo",
    },
  },
});
```
