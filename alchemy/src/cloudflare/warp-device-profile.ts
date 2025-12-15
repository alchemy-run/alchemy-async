import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";

/**
 * Service mode configuration for WARP client
 */
export interface ServiceModeV2 {
  /**
   * WARP client operational mode
   */
  mode: "warp" | "proxy" | "doh_only" | "warp_tunnel_only";

  /**
   * Port number (only used for proxy mode)
   */
  port?: number;
}

/**
 * Split tunnel route entry
 */
export interface SplitTunnelEntry {
  /**
   * IP address or CIDR block (e.g., "10.0.0.0/8" or "192.168.1.1")
   * or domain name (e.g., "example.com"). Use either address or host.
   */
  address?: string;

  /**
   * Domain host for split tunnel (alternative to address)
   */
  host?: string;

  /**
   * Optional description for this route
   */
  description?: string;
}

/**
 * Split tunnel configuration
 */
export interface SplitTunnelConfig {
  /**
   * Split tunnel mode
   * - "include": Only specified routes go through WARP
   * - "exclude": All routes except specified ones go through WARP
   */
  mode: "include" | "exclude";

  /**
   * List of routes to include or exclude
   */
  entries: SplitTunnelEntry[];
}

/**
 * Properties for creating or updating a WARP Device Profile
 */
export interface WarpDeviceProfileProps extends CloudflareApiOptions {
  /**
   * Name of the device profile
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Description of the device profile
   */
  description?: string;

  /**
   * Wirefilter expression for device matching
   * Determines which devices this profile applies to
   *
   * @example 'identity.groups.name == "Engineering"'
   * @example 'identity.email == "admin@example.com"'
   */
  match?: string;

  /**
   * Precedence order (lower number = higher priority)
   * Profiles with lower precedence values are evaluated first
   */
  precedence?: number;

  /**
   * Whether the profile is enabled
   *
   * @default true
   */
  enabled?: boolean;

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
   * Whether to adopt an existing profile with the same name if it exists
   * If true and a profile with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the profile when removed from Alchemy
   * If set to false, the profile will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;
}

export function isWarpDeviceProfile(
  resource: any,
): resource is WarpDeviceProfile {
  return resource?.[ResourceKind] === "cloudflare::WarpDeviceProfile";
}

/**
 * Output returned after WARP Device Profile creation/update
 */
export type WarpDeviceProfile = Omit<
  WarpDeviceProfileProps,
  "delete" | "adopt"
> & {
  /**
   * The policy ID assigned by Cloudflare
   */
  policyId: string;

  /**
   * Name of the profile (required in output)
   */
  name: string;

  /**
   * Time at which the profile was created
   */
  createdAt: number;

  /**
   * Time at which the profile was last modified
   */
  modifiedAt: number;
};

/**
 * Creates and manages a Cloudflare WARP Device Profile, which defines WARP client
 * settings for specific sets of devices based on matching rules.
 *
 * Device profiles allow you to apply different WARP configurations to different
 * groups of devices based on user identity, groups, operating system, or other criteria.
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-devices/warp/configure-warp/device-profiles/
 *
 * @example
 * ## Basic device profile for a user group
 *
 * Create a profile that applies to all devices belonging to the Engineering group
 *
 * const engProfile = await WarpDeviceProfile("engineering", {
 *   name: "Engineering Team",
 *   match: 'identity.groups.name == "Engineering"',
 *   precedence: 100,
 *   serviceModeV2: { mode: "warp" },
 *   allowedToLeave: false,
 *   switchLocked: true
 * });
 *
 * @example
 * ## Profile with split tunnel configuration
 *
 * Create a profile that excludes internal network routes from the WARP tunnel
 *
 * const internalProfile = await WarpDeviceProfile("internal-network", {
 *   name: "Internal Network Access",
 *   match: 'identity.email.ends_with("@company.com")',
 *   precedence: 50,
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
 * ## Profile with include mode split tunnel
 *
 * Only route specific networks through WARP
 *
 * const selectiveProfile = await WarpDeviceProfile("selective", {
 *   name: "Selective Routing",
 *   match: 'identity.groups.name == "Remote Workers"',
 *   precedence: 200,
 *   serviceModeV2: { mode: "warp" },
 *   splitTunnel: {
 *     mode: "include",
 *     entries: [
 *       { address: "10.0.0.0/8", description: "Company network" },
 *       { address: "company.com", description: "Company domain" }
 *     ]
 *   }
 * });
 *
 * @example
 * ## Adopt an existing profile
 *
 * Take over management of an existing device profile
 *
 * const existingProfile = await WarpDeviceProfile("existing", {
 *   name: "Existing Profile",
 *   adopt: true,
 *   match: 'identity.groups.name == "IT"',
 *   precedence: 10
 * });
 *
 * @example
 * ## Profile with all WARP settings
 *
 * Configure comprehensive WARP client behavior
 *
 * const fullProfile = await WarpDeviceProfile("comprehensive", {
 *   name: "Full Configuration",
 *   match: 'identity.email == "admin@example.com"',
 *   precedence: 1,
 *   enabled: true,
 *   serviceModeV2: { mode: "warp" },
 *   disableAutoFallback: false,
 *   allowModeSwitch: false,
 *   switchLocked: true,
 *   tunnelProtocol: "wireguard",
 *   autoConnect: 0,
 *   allowedToLeave: false,
 *   captivePortal: 180,
 *   supportUrl: "https://support.example.com",
 *   excludeOfficeIps: true,
 *   lanAllowMinutes: 5,
 *   lanAllowSubnetSize: 24
 * });
 */
export const WarpDeviceProfile = Resource(
  "cloudflare::WarpDeviceProfile",
  async function (
    this: Context<WarpDeviceProfile>,
    id: string,
    props: WarpDeviceProfileProps = {},
  ): Promise<WarpDeviceProfile> {
    const api = await createCloudflareApi(props);

    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const adopt = props.adopt ?? this.scope.adopt;

    if (this.phase === "delete") {
      if (this.output?.policyId && props.delete !== false) {
        await deletePolicy(api, this.output.policyId);
      }
      return this.destroy();
    }

    // Handle replacement for immutable properties
    if (this.phase === "update" && this.output?.name !== name) {
      this.replace();
    }

    let policyId: string;
    let createdAt = this.output?.createdAt ?? Date.now();

    if (this.phase === "update" && this.output?.policyId) {
      // Update existing policy
      await updatePolicy(api, this.output.policyId, { ...props, name });
      policyId = this.output.policyId;
    } else {
      // Create new policy
      try {
        const result = await createPolicy(api, { ...props, name });
        policyId = result.policy_id ?? result.id;
        createdAt = Date.now();
      } catch (error) {
        if (
          adopt &&
          error instanceof CloudflareApiError &&
          (error.status === 400 || error.status === 409) &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate") ||
            error.message.includes("precedence must be unique"))
        ) {
          logger.log(
            `WARP device profile '${name}' already exists, adopting it`,
          );
          const existing = await findPolicyByName(api, name);
          if (!existing) {
            throw new Error(
              `Failed to find existing WARP device profile '${name}' for adoption`,
            );
          }
          policyId = existing.policy_id;
        } else {
          throw error;
        }
      }
    }

    // Update split tunnel configuration if provided
    if (props.splitTunnel) {
      await updateSplitTunnel(api, policyId, props.splitTunnel);
    }

    return {
      policyId,
      name,
      description: props.description,
      match: props.match,
      precedence: props.precedence,
      enabled: props.enabled ?? true,
      serviceModeV2: props.serviceModeV2,
      disableAutoFallback: props.disableAutoFallback,
      allowModeSwitch: props.allowModeSwitch,
      switchLocked: props.switchLocked,
      tunnelProtocol: props.tunnelProtocol,
      autoConnect: props.autoConnect,
      allowedToLeave: props.allowedToLeave,
      captivePortal: props.captivePortal,
      supportUrl: props.supportUrl,
      excludeOfficeIps: props.excludeOfficeIps,
      lanAllowMinutes: props.lanAllowMinutes,
      lanAllowSubnetSize: props.lanAllowSubnetSize,
      splitTunnel: props.splitTunnel,
      createdAt,
      modifiedAt: Date.now(),
    };
  },
);

/**
 * Internal API response type for policy creation
 * @internal
 */
interface CloudflarePolicyResponse {
  id: string;
  policy_id?: string;
  name?: string;
  description?: string;
  match?: string;
  precedence?: number;
  enabled?: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Internal API response type for policy list
 * @internal
 */
interface CloudflarePolicyListItem {
  id: string;
  policy_id?: string;
  name: string;
  description?: string;
  match?: string;
  precedence?: number;
  enabled?: boolean;
}

async function createPolicy(
  api: CloudflareApi,
  props: WarpDeviceProfileProps & { name: string },
): Promise<CloudflarePolicyResponse> {
  const requestBody = buildRequestBody(props);

  const response = await api.post(
    `/accounts/${api.accountId}/devices/policy`,
    requestBody,
  );

  if (!response.ok) {
    await handleApiError(response, "create", "warp_device_profile", props.name);
  }

  return await extractCloudflareResult<CloudflarePolicyResponse>(
    `create WARP device profile "${props.name}"`,
    Promise.resolve(response),
  );
}

async function updatePolicy(
  api: CloudflareApi,
  policyId: string,
  props: WarpDeviceProfileProps & { name: string },
): Promise<void> {
  const requestBody = buildRequestBody(props);

  const response = await api.patch(
    `/accounts/${api.accountId}/devices/policy/${policyId}`,
    requestBody,
  );

  if (!response.ok) {
    await handleApiError(response, "update", "warp_device_profile", policyId);
  }
}

async function deletePolicy(
  api: CloudflareApi,
  policyId: string,
): Promise<void> {
  const response = await api.delete(
    `/accounts/${api.accountId}/devices/policy/${policyId}`,
  );

  if (!response.ok && response.status !== 404) {
    await handleApiError(response, "delete", "warp_device_profile", policyId);
  }
}

async function findPolicyByName(
  api: CloudflareApi,
  name: string,
): Promise<{ policy_id: string } | null> {
  const response = await api.get(`/accounts/${api.accountId}/devices/policies`);

  if (!response.ok) {
    await handleApiError(response, "list", "warp_device_profile", "all");
  }

  const data = (await response.json()) as {
    result: CloudflarePolicyListItem[];
  };

  const policy = data.result?.find((p) => p.name === name);
  if (!policy) return null;
  return {
    policy_id: policy.policy_id ?? policy.id,
  };
}

async function updateSplitTunnel(
  api: CloudflareApi,
  policyId: string,
  config: SplitTunnelConfig,
): Promise<void> {
  const routes = config.entries.map((entry) => ({
    ...(entry.address && { address: entry.address }),
    ...(entry.host && { host: entry.host }),
    ...(entry.description && { description: entry.description }),
  }));

  if (config.mode === "include") {
    const response = await api.put(
      `/accounts/${api.accountId}/devices/policy/${policyId}/include`,
      routes,
    );
    if (!response.ok) {
      await handleApiError(
        response,
        "update split tunnel includes",
        "warp_device_profile",
        policyId,
      );
    }
  } else {
    const response = await api.put(
      `/accounts/${api.accountId}/devices/policy/${policyId}/exclude`,
      routes,
    );
    if (!response.ok) {
      await handleApiError(
        response,
        "update split tunnel excludes",
        "warp_device_profile",
        policyId,
      );
    }
  }
}

function buildRequestBody(
  props: WarpDeviceProfileProps & { name: string },
): Record<string, unknown> {
  const requestBody: Record<string, unknown> = {
    name: props.name,
  };

  if (props.description !== undefined) {
    requestBody.description = props.description;
  }
  if (props.match !== undefined) {
    requestBody.match = props.match;
  }
  if (props.precedence !== undefined) {
    requestBody.precedence = props.precedence;
  }
  if (props.enabled !== undefined) {
    requestBody.enabled = props.enabled;
  }

  if (props.serviceModeV2) {
    requestBody.service_mode_v2 = {
      mode: props.serviceModeV2.mode,
      ...(props.serviceModeV2.port && { port: props.serviceModeV2.port }),
    };
  }
  if (props.disableAutoFallback !== undefined) {
    requestBody.disable_auto_fallback = props.disableAutoFallback;
  }
  if (props.allowModeSwitch !== undefined) {
    requestBody.allow_mode_switch = props.allowModeSwitch;
  }
  if (props.switchLocked !== undefined) {
    requestBody.switch_locked = props.switchLocked;
  }
  if (props.tunnelProtocol !== undefined) {
    requestBody.tunnel_protocol = props.tunnelProtocol;
  }
  if (props.autoConnect !== undefined) {
    requestBody.auto_connect = props.autoConnect;
  }
  if (props.allowedToLeave !== undefined) {
    requestBody.allowed_to_leave = props.allowedToLeave;
  }
  if (props.captivePortal !== undefined) {
    requestBody.captive_portal = props.captivePortal;
  }
  if (props.supportUrl !== undefined) {
    requestBody.support_url = props.supportUrl;
  }
  if (props.excludeOfficeIps !== undefined) {
    requestBody.exclude_office_ips = props.excludeOfficeIps;
  }
  if (props.lanAllowMinutes !== undefined) {
    requestBody.lan_allow_minutes = props.lanAllowMinutes;
  }
  if (props.lanAllowSubnetSize !== undefined) {
    requestBody.lan_allow_subnet_size = props.lanAllowSubnetSize;
  }

  return requestBody;
}
