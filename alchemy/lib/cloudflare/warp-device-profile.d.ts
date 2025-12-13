import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
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
export declare function isWarpDeviceProfile(resource: any): resource is WarpDeviceProfile;
/**
 * Output returned after WARP Device Profile creation/update
 */
export type WarpDeviceProfile = Omit<WarpDeviceProfileProps, "delete" | "adopt"> & {
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
export declare const WarpDeviceProfile: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<WarpDeviceProfile>, id: string, props?: WarpDeviceProfileProps) => Promise<WarpDeviceProfile>);
//# sourceMappingURL=warp-device-profile.d.ts.map