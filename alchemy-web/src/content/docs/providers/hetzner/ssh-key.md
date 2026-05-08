---
title: SSHKey
description: Learn how to upload and manage SSH public keys in Hetzner Cloud using Alchemy, enabling passwordless server access.
---

The `SSHKey` resource lets you upload and manage [SSH public keys](https://docs.hetzner.cloud/#ssh-keys) in Hetzner Cloud. Once uploaded, you can reference an SSH key when creating servers to enable passwordless access.

## Minimal Example

Upload an SSH public key to Hetzner Cloud:

```ts
import { SSHKey } from "alchemy/hetzner";

const key = await SSHKey("my-key", {
  publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...",
});

console.log(key.fingerprint); // e.g. "b7:31:9e:..."
```

## From an Environment Variable

Read the public key from an environment variable — a common pattern for CI/CD pipelines:

```ts
import { SSHKey } from "alchemy/hetzner";

const deployKey = await SSHKey("deploy-key", {
  name: "deploy-key-prod",
  publicKey: process.env.SSH_PUBLIC_KEY!,
  labels: { env: "prod", team: "infra" },
});
```

## Adopting an Existing Key

If a key with the same name already exists in Hetzner Cloud, use `adopt: true` to take ownership of it rather than failing:

```ts
import { SSHKey } from "alchemy/hetzner";

const key = await SSHKey("shared-key", {
  publicKey: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAI...",
  adopt: true,
});
```

:::caution
Adopting an existing key means it will be deleted when this Alchemy resource is destroyed. Use `adopt: true` only when you intend to manage the key's full lifecycle through Alchemy.
:::

## Props

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `publicKey` | `string` | yes | — | The SSH public key content (e.g. `ssh-ed25519 AAAA...`) |
| `name` | `string` | no | `${app}-${stage}-${id}` | Name of the SSH key in Hetzner Cloud |
| `labels` | `Record<string, string>` | no | `{}` | User-defined labels attached to the key |
| `adopt` | `boolean` | no | `false` | Adopt an existing key with the same name instead of failing |
| `apiToken` | `string \| Secret` | no | `$HETZNER_API_TOKEN` | Hetzner API token (overrides the environment variable) |
| `baseUrl` | `string` | no | `https://api.hetzner.cloud/v1` | Override the Hetzner API base URL |

:::note
`publicKey` is **immutable** after creation. Changing it triggers a resource replacement — the old key is deleted and a new one is created.
:::

## Outputs

| Property | Type | Description |
|---|---|---|
| `id` | `number` | Hetzner-assigned numeric ID of the SSH key |
| `name` | `string` | Name of the SSH key |
| `fingerprint` | `string` | MD5 fingerprint of the public key |
| `publicKey` | `string` | The SSH public key content |
| `labels` | `Record<string, string>` | Labels attached to the key |
| `created` | `string` | ISO 8601 timestamp of when the key was created |

## See Also

- [Hetzner Cloud SSH Keys API](https://docs.hetzner.cloud/#ssh-keys)
