import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type {
  ServiceModeV2,
  SplitTunnelConfig,
} from "./warp-device-profile.ts";

/**
 * Properties for updating the WARP Default Profile
 */
export interface WarpDefaultProfileProps extends CloudflareApiOptions {
  /**
   * Service mode configuration for WARP client
   */
  serviceModeV2?: ServiceModeV2;

  /**
   * Disable automatic fallback to direct connection if tunnel fails
   */
  disableAutoFallback?: boolean;

  /**
   * Allow users to manually switch WARP modes
   */
  allowModeSwitch?: boolean;

  /**
   * Lock the WARP toggle switch (users cannot change it)
   */
  switchLocked?: boolean;

  /**
   * Tunnel protocol to use
   */
  tunnelProtocol?: "wireguard" | "masque";

  /**
   * Auto-connect timeout in seconds
   * Set to 0 to disable auto-connect
   */
  autoConnect?: number;

  /**
   * Allow users to disconnect from WARP
   */
  allowedToLeave?: boolean;

  /**
   * Captive portal timeout in seconds
   * Time before showing captive portal
   */
  captivePortal?: number;

  /**
   * Support URL for feedback button in WARP client
   */
  supportUrl?: string;

  /**
   * Exclude office IPs from WARP tunnel
   */
  excludeOfficeIps?: boolean;

  /**
   * LAN allow duration in minutes
   */
  lanAllowMinutes?: number;

  /**
   * LAN subnet size for local network access
   */
  lanAllowSubnetSize?: number;

  /**
   * Split tunnel configuration
   * Controls which routes bypass or use the WARP tunnel
   */
  splitTunnel?: SplitTunnelConfig;

  /**
   * Whether to delete the default profile settings when removed from Alchemy
   * Note: This does not actually delete the default profile (which always exists),
   * but removes it from Alchemy state management
   *
   * @default false
   */
  delete?: boolean;
}

export function isWarpDefaultProfile(
  resource: any,
): resource is WarpDefaultProfile {
  return resource?.[ResourceKind] === "cloudflare::WarpDefaultProfile";
}

/**
 * Output returned after WARP Default Profile update
 */
export type WarpDefaultProfile = WarpDefaultProfileProps & {
  /**
   * Time at which the profile was last modified
   */
  modifiedAt: number;
};

/**
 * Manages the Cloudflare WARP Default Device Profile, which defines the
 * account-wide default WARP client settings that apply when no custom profile matches.
 *
 * The default profile always exists and cannot be deleted. This resource allows you
 * to update its settings programmatically.
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/configure-warp/device-profiles/
 *
 * @example
 * ## Update default WARP settings
 *
 * Configure the default behavior for all devices
 *
 * const defaultProfile = await WarpDefaultProfile("default", {
 *   serviceModeV2: { mode: "warp" },
 *   autoConnect: 0,
 *   captivePortal: 180,
 *   supportUrl: "https://support.example.com"
 * });
 *
 * @example
 * ## Default profile with split tunnel
 *
 * Configure default split tunnel behavior for all devices
 *
 * const defaultWithSplitTunnel = await WarpDefaultProfile("default", {
 *   serviceModeV2: { mode: "warp" },
 *   splitTunnel: {
 *     mode: "exclude",
 *     entries: [
 *       { address: "10.0.0.0/8", description: "Internal network" },
 *       { address: "192.168.0.0/16", description: "Local network" }
 *     ]
 *   }
 * });
 *
 * @example
 * ## Locked default profile
 *
 * Create a locked-down default configuration
 *
 * const lockedDefault = await WarpDefaultProfile("default", {
 *   serviceModeV2: { mode: "warp" },
 *   switchLocked: true,
 *   allowedToLeave: false,
 *   disableAutoFallback: true,
 *   tunnelProtocol: "wireguard"
 * });
 */
export const WarpDefaultProfile = Resource(
  "cloudflare::WarpDefaultProfile",
  async function (
    this: Context<WarpDefaultProfile>,
    id: string,
    props: WarpDefaultProfileProps = {},
  ): Promise<WarpDefaultProfile> {
    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      // Default profile cannot be deleted, just remove from state
      return this.destroy();
    }

    // Update default profile (single PATCH endpoint)
    await updateDefaultPolicy(api, props);

    return {
      ...props,
      modifiedAt: Date.now(),
    };
  },
);

/**
 * Internal API response type for default policy
 * @internal
 */
interface CloudflareDefaultPolicyResponse {
  device_settings?: {
    service_mode_v2?: {
      mode: string;
      port?: number;
    };
    disable_auto_fallback?: boolean;
    allow_mode_switch?: boolean;
    switch_locked?: boolean;
    tunnel_protocol?: string;
    auto_connect?: number;
    allowed_to_leave?: boolean;
    captive_portal?: number;
    support_url?: string;
    exclude_office_ips?: boolean;
    lan_allow_minutes?: number;
    lan_allow_subnet_size?: number;
  };
}

// Keys with special handling (not simple 1:1 mapping)
type SpecialKeys = "serviceModeV2" | "splitTunnel" | "delete";

// Simple device setting keys that map directly to snake_case API fields
type SimpleDeviceSettingKey = Exclude<
  keyof WarpDefaultProfileProps,
  keyof CloudflareApiOptions | SpecialKeys
>;

// Type-safe mapping - TypeScript errors if any SimpleDeviceSettingKey is missing
const DEVICE_SETTINGS_MAP: Record<SimpleDeviceSettingKey, string> = {
  disableAutoFallback: "disable_auto_fallback",
  allowModeSwitch: "allow_mode_switch",
  switchLocked: "switch_locked",
  tunnelProtocol: "tunnel_protocol",
  autoConnect: "auto_connect",
  allowedToLeave: "allowed_to_leave",
  captivePortal: "captive_portal",
  supportUrl: "support_url",
  excludeOfficeIps: "exclude_office_ips",
  lanAllowMinutes: "lan_allow_minutes",
  lanAllowSubnetSize: "lan_allow_subnet_size",
};

async function updateDefaultPolicy(
  api: CloudflareApi,
  props: WarpDefaultProfileProps,
): Promise<void> {
  // Build device settings object
  const deviceSettings: Record<string, unknown> = {};

  if (props.serviceModeV2) {
    deviceSettings.service_mode_v2 = {
      mode: props.serviceModeV2.mode,
      ...(props.serviceModeV2.port && { port: props.serviceModeV2.port }),
    };
  }

  // Apply all simple field mappings
  for (const propKey of Object.keys(
    DEVICE_SETTINGS_MAP,
  ) as SimpleDeviceSettingKey[]) {
    deviceSettings[DEVICE_SETTINGS_MAP[propKey]] = props[propKey];
  }

  // Split tunnel config is part of the body for default policy
  if (props.splitTunnel) {
    if (props.splitTunnel.mode === "include") {
      deviceSettings.include = props.splitTunnel.entries.map((entry) => ({
        address: entry.address,
        ...(entry.description && { description: entry.description }),
      }));
    } else {
      deviceSettings.exclude = props.splitTunnel.entries.map((entry) => ({
        address: entry.address,
        ...(entry.description && { description: entry.description }),
      }));
    }
  }

  const requestBody: any = {
    ...(Object.keys(deviceSettings).length > 0 && { ...deviceSettings }),
  };

  const response = await api.patch(
    `/accounts/${api.accountId}/devices/policy`,
    requestBody,
  );

  if (!response.ok) {
    await handleApiError(response, "update", "warp_default_profile", "default");
  }
}

async function updateDefaultSplitTunnel(
  api: CloudflareApi,
  config: SplitTunnelConfig,
): Promise<void> {
  const routes = config.entries.map((entry) => ({
    address: entry.address,
    ...(entry.description && { description: entry.description }),
  }));

  if (config.mode === "include") {
    const response = await api.put(
      `/accounts/${api.accountId}/devices/policies/default/includes`,
      routes,
    );
    if (!response.ok) {
      await handleApiError(
        response,
        "update split tunnel includes",
        "warp_default_profile",
        "default",
      );
    }
  } else {
    const response = await api.put(
      `/accounts/${api.accountId}/devices/policies/default/excludes`,
      routes,
    );
    if (!response.ok) {
      await handleApiError(
        response,
        "update split tunnel excludes",
        "warp_default_profile",
        "default",
      );
    }
  }
}
