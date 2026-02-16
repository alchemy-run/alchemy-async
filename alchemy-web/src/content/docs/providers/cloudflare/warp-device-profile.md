---
title: WarpDeviceProfile
description: Create and manage Cloudflare WARP device profiles with custom matching rules and split tunnel configuration.
---

A [Cloudflare WARP Device Profile](https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/configure-warp/device-profiles/) defines WARP client settings for specific sets of devices based on matching rules. Device profiles allow you to apply different WARP configurations to different groups of devices based on user identity, groups, operating system, or other criteria.

## Minimal Example

Create a basic device profile for a user group:

```ts
import { WarpDeviceProfile } from "alchemy/cloudflare";

const profile = await WarpDeviceProfile("engineering", {
  name: "Engineering Team",
  match: 'identity.groups.name == "Engineering"',
  precedence: 100,
});
```

## With Split Tunnel Configuration

Configure which routes bypass the WARP tunnel:

```ts
import { WarpDeviceProfile } from "alchemy/cloudflare";

const profile = await WarpDeviceProfile("internal-network", {
  name: "Internal Network Access",
  match: 'identity.email.ends_with("@company.com")',
  precedence: 50,
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

Only route specific networks through WARP:

```ts
import { WarpDeviceProfile } from "alchemy/cloudflare";

const profile = await WarpDeviceProfile("selective", {
  name: "Selective Routing",
  match: 'identity.groups.name == "Remote Workers"',
  precedence: 200,
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

## Comprehensive Configuration

Configure all WARP client settings:

```ts
import { WarpDeviceProfile } from "alchemy/cloudflare";

const profile = await WarpDeviceProfile("comprehensive", {
  name: "Full Configuration",
  match: 'identity.email == "admin@example.com"',
  precedence: 1,
  enabled: true,
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

## Adopting Existing Profiles

Take over management of an existing device profile:

```ts
import { WarpDeviceProfile } from "alchemy/cloudflare";

const profile = await WarpDeviceProfile("existing", {
  name: "Existing Profile",
  adopt: true,
  match: 'identity.groups.name == "IT"',
  precedence: 10
});
```

## Profile Properties

### Matching Rules

| Property | Type | Description |
|----------|------|-------------|
| `match` | `string` | Wirefilter expression for device matching (e.g., `'identity.groups.name == "Engineering"'`) |
| `precedence` | `number` | Priority order (lower number = higher priority) |
| `enabled` | `boolean` | Whether the profile is enabled |

### WARP Settings

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

### Split Tunnel

| Property | Type | Description |
|----------|------|-------------|
| `splitTunnel` | `SplitTunnelConfig` | Split tunnel configuration |

The `SplitTunnelConfig` includes:
- `mode`: `"include"` (only specified routes use WARP) or `"exclude"` (all routes except specified ones use WARP)
- `entries`: Array of routes with `address` (IP/CIDR or domain) and optional `description`


