---
title: WarpDefaultProfile
description: Manage the Cloudflare WARP default device profile settings that apply when no custom profile matches.
---

The [Cloudflare WARP Default Device Profile](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/configure-warp/device-profiles/) defines the account-wide default WARP client settings that apply when no custom profile matches a device. The default profile always exists and cannot be deleted.

## Minimal Example

Update the default WARP settings:

```ts
import { WarpDefaultProfile } from "alchemy/cloudflare";

const defaultProfile = await WarpDefaultProfile("default", {
  serviceModeV2: { mode: "warp" },
  autoConnect: 0,
  captivePortal: 180,
  supportUrl: "https://support.example.com"
});
```

## With Split Tunnel Configuration

Configure default split tunnel behavior:

```ts
import { WarpDefaultProfile } from "alchemy/cloudflare";

const defaultProfile = await WarpDefaultProfile("default", {
  serviceModeV2: { mode: "warp" },
  splitTunnel: {
    mode: "exclude",
    entries: [
      { address: "10.0.0.0/8", description: "Internal network" },
      { address: "192.168.0.0/16", description: "Local network" }
    ]
  }
});
```

## Include Mode Split Tunnel

Only route specific networks through WARP by default:

```ts
import { WarpDefaultProfile } from "alchemy/cloudflare";

const defaultProfile = await WarpDefaultProfile("default", {
  serviceModeV2: { mode: "warp" },
  splitTunnel: {
    mode: "include",
    entries: [
      { address: "10.0.0.0/8", description: "Company network" },
      { address: "company.com", description: "Company domain" }
    ]
  }
});
```

## Locked Default Configuration

Create a locked-down default configuration:

```ts
import { WarpDefaultProfile } from "alchemy/cloudflare";

const defaultProfile = await WarpDefaultProfile("default", {
  serviceModeV2: { mode: "warp" },
  switchLocked: true,
  allowedToLeave: false,
  disableAutoFallback: true,
  tunnelProtocol: "wireguard"
});
```

## Comprehensive Default Settings

Configure all default WARP client settings:

```ts
import { WarpDefaultProfile } from "alchemy/cloudflare";

const defaultProfile = await WarpDefaultProfile("default", {
  serviceModeV2: { mode: "warp" },
  disableAutoFallback: false,
  allowModeSwitch: false,
  switchLocked: true,
  tunnelProtocol: "wireguard",
  autoConnect: 0,
  allowedToLeave: false,
  captivePortal: 180,
  supportUrl: "https://support.example.com",
  excludeOfficeIps: true,
  lanAllowMinutes: 5,
  lanAllowSubnetSize: 24
});
```

## Profile Properties

| Property | Type | Description |
|----------|------|-------------|
| `serviceModeV2` | `{ mode: "warp" \| "proxy" \| "doh_only" \| "warp_tunnel_only"; port?: number }` | WARP client operational mode |
| `disableAutoFallback` | `boolean` | Disable automatic fallback to direct connection |
| `allowModeSwitch` | `boolean` | Allow users to manually switch WARP modes |
| `switchLocked` | `boolean` | Lock the WARP toggle switch |
| `tunnelProtocol` | `"wireguard" \| "masque"` | Tunnel protocol to use |
| `autoConnect` | `number` | Auto-connect timeout in seconds (0 to disable) |
| `allowedToLeave` | `boolean` | Allow users to disconnect from WARP |
| `captivePortal` | `number` | Captive portal timeout in seconds |
| `supportUrl` | `string` | Support URL for feedback button |
| `excludeOfficeIps` | `boolean` | Exclude office IPs from WARP tunnel |
| `lanAllowMinutes` | `number` | LAN allow duration in minutes |
| `lanAllowSubnetSize` | `number` | LAN subnet size for local network access |
| `splitTunnel` | `SplitTunnelConfig` | Split tunnel configuration |

The `SplitTunnelConfig` includes:
- `mode`: `"include"` (only specified routes use WARP) or `"exclude"` (all routes except specified ones use WARP)
- `entries`: Array of routes with `address` (IP/CIDR or domain) and optional `description`


