---
title: Volume
description: Learn how to create, attach, and manage Hetzner Cloud block storage volumes using Alchemy.
---

The `Volume` resource lets you create and manage [Hetzner Cloud block storage volumes](https://docs.hetzner.com/cloud/volumes/overview/). Volumes are persistent block devices you can attach to servers, format with a filesystem, and resize upward at any time.

## Minimal example

Create a 20 GB volume in the Falkenstein location:

```ts
import { Volume } from "alchemy/hetzner";

const vol = await Volume("data", {
  size: 20,
  location: "fsn1",
});

console.log(vol.linuxDevice); // e.g. "/dev/disk/by-id/scsi-0HC_Volume_12345678"
```

## With filesystem format

Create a volume and pre-format it with ext4 so it is ready to mount:

```ts
import { Volume } from "alchemy/hetzner";

const vol = await Volume("data", {
  size: 50,
  location: "nbg1",
  format: "ext4",
});
```

## Attached to a server

Create a volume and attach it to a server in a single step. Supply either a `Server` resource reference or a numeric server ID string:

```ts
import { Server, SSHKey, Volume } from "alchemy/hetzner";

const key = await SSHKey("deploy-key", {
  publicKey: process.env.SSH_PUBLIC_KEY!,
});

const server = await Server("app", {
  serverType: "cx22",
  image: "ubuntu-24.04",
  location: "fsn1",
  sshKeys: [key],
});

const vol = await Volume("app-data", {
  size: 100,
  server: server,
  format: "xfs",
  labels: { env: "production" },
});
```

After provisioning, mount the volume inside the server with:

```bash
mount -o discard,defaults ${vol.linuxDevice} /mnt/data
```

## Adopting an existing volume

Adopt a volume that already exists in your Hetzner account rather than creating a new one:

```ts
import { Volume } from "alchemy/hetzner";

const vol = await Volume("legacy-data", {
  name: "my-existing-volume",
  size: 50,
  adopt: true,
});
```

:::caution
When `adopt: true`, Alchemy takes ownership of the existing volume. It will be **deleted** when the resource is removed from Alchemy unless you also set `delete: false`.
:::

## Props

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `size` | `number` | — | **Required.** Volume size in GB. Can only be increased, never decreased. |
| `name` | `string` | `${app}-${stage}-${id}` | Volume name shown in the Hetzner Cloud console. |
| `location` | `string` | — | Datacenter location, e.g. `"nbg1"`, `"fsn1"`, `"hel1"`, `"ash"`, `"hil"`. Required when no `server` is specified at creation time. |
| `server` | `string \| Server` | — | Server to attach the volume to. Pass a `Server` resource reference or a numeric server ID string. Attachment and detachment are managed automatically when this value changes. |
| `format` | `"ext4" \| "xfs"` | — | Filesystem format to initialise on the volume at creation time. Has no effect on updates. |
| `labels` | `Record<string, string>` | `{}` | Key-value labels for filtering and organisation. |
| `adopt` | `boolean` | `false` | Adopt an existing volume with the same name instead of failing if it already exists. |
| `delete` | `boolean` | `true` | Delete the volume when the resource is removed from Alchemy. Set to `false` to keep the volume even after `alchemy destroy`. |
| `apiToken` | `Secret` | `$HCLOUD_TOKEN` | Hetzner Cloud API token. Defaults to the `HCLOUD_TOKEN` environment variable. |

:::caution[Immutable properties]
`location` and `format` cannot be changed after a volume is created. Hetzner does not support moving volumes between locations; changing `location` requires destroying and recreating the volume. The `format` argument is only used during creation — subsequent `format` changes have no effect and do not trigger a replace.
:::

:::note[Resizing]
`size` can only be increased, never decreased. Attempting to set a smaller `size` than the current value will throw an error. After resizing, you may need to grow the filesystem inside the volume manually (e.g. `resize2fs` for ext4, `xfs_growfs` for xfs).
:::

## Output

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Hetzner-assigned numeric volume ID. |
| `name` | `string` | Volume name. |
| `status` | `"creating" \| "available"` | Current volume status. |
| `size` | `number` | Volume size in GB. |
| `location` | `string` | Datacenter location where the volume resides. |
| `linuxDevice` | `string` | Linux block device path, e.g. `"/dev/disk/by-id/scsi-0HC_Volume_12345678"`. Use this path to mount the volume inside a server. |
| `format` | `"ext4" \| "xfs" \| undefined` | Filesystem format, if one was specified at creation. |
| `server` | `string \| Server \| undefined` | Server the volume is currently attached to, if any. |
| `labels` | `Record<string, string>` | Labels attached to the volume. |
| `created` | `string` | ISO 8601 timestamp of when the volume was created. |

## See also

- [Hetzner Cloud — Volumes overview](https://docs.hetzner.com/cloud/volumes/overview/)
- [Hetzner Cloud — Volume API reference](https://docs.hetzner.cloud/#volumes)
