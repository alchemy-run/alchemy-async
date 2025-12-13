import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
import type { ServiceModeV2, SplitTunnelConfig } from "./warp-device-profile.ts";
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
export declare function isWarpDefaultProfile(resource: any): resource is WarpDefaultProfile;
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
export declare const WarpDefaultProfile: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<WarpDefaultProfile>, id: string, props?: WarpDefaultProfileProps) => Promise<WarpDefaultProfile>);
//# sourceMappingURL=warp-default-profile.d.ts.map