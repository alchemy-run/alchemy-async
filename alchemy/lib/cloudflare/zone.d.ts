import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { type BotManagement } from "./zone-bot-management.ts";
import type { AlwaysUseHTTPSValue, AutomaticHTTPSRewritesValue, BrotliValue, DevelopmentModeValue, EarlyHintsValue, EmailObfuscationValue, HTTP2Value, HTTP3Value, HotlinkProtectionValue, IPv6Value, MinTLSVersionValue, SSLValue, TLS13Value, WebSocketsValue, ZeroRTTValue } from "./zone-settings.ts";
/**
 * Properties for creating or updating a Zone
 */
export interface ZoneProps extends CloudflareApiOptions {
    /**
     * The domain name for the zone
     */
    name: string;
    /**
     * Whether to delete the zone
     * @default false
     */
    delete?: boolean;
    /**
     * The type of zone to create
     * "full" - Full zone implies that DNS is hosted with Cloudflare
     * "partial" - Partial zone is typically a partner-hosted zone or a CNAME setup
     * "secondary" - Secondary zone is a zone that mirrors the primary zone
     * @default "full"
     */
    type?: "full" | "partial" | "secondary";
    /**
     * Whether to jump start the zone
     * When enabled, Cloudflare will attempt to fetch existing DNS records
     * @default true
     */
    jumpStart?: boolean;
    /**
     * Settings to apply to the zone
     */
    settings?: {
        /**
         * Enable SSL/TLS encryption for the zone
         * "off" - SSL disabled
         * "flexible" - Encrypts traffic between browser and Cloudflare
         * "full" - Encrypts traffic between browser and server, allows self-signed certs
         * "strict" - Encrypts traffic between browser and server, requires valid cert
         */
        ssl?: SSLValue;
        /**
         * Enable Always Use HTTPS
         * Redirects all HTTP traffic to HTTPS
         * @default "on" (unless explicitly set to "off")
         */
        alwaysUseHttps?: AlwaysUseHTTPSValue;
        /**
         * Enable Automatic HTTPS Rewrites
         * Automatically rewrites HTTP URLs to HTTPS
         * @default "off"
         */
        automaticHttpsRewrites?: AutomaticHTTPSRewritesValue;
        /**
         * Enable TLS 1.3
         * Enables the latest version of TLS encryption
         * @default "off"
         */
        tls13?: TLS13Value;
        /**
         * Enable Early Hints
         * Speeds up page loads by serving Link headers
         * @default "off"
         */
        earlyHints?: EarlyHintsValue;
        /**
         * Enable Email Obfuscation
         * Obfuscates email addresses on the site
         * @default "off"
         */
        emailObfuscation?: EmailObfuscationValue;
        /**
         * Enable Browser Cache TTL
         * Sets the browser cache TTL in seconds
         */
        browserCacheTtl?: number;
        /**
         * Enable Development Mode
         * Disables caching and enables real-time updates
         * @default "off"
         */
        developmentMode?: DevelopmentModeValue;
        /**
         * Enable HTTP/2
         * @default "on"
         */
        http2?: HTTP2Value;
        /**
         * Enable HTTP/3
         * @default "on"
         */
        http3?: HTTP3Value;
        /**
         * Enable IPv6
         * @default "on"
         */
        ipv6?: IPv6Value;
        /**
         * Enable WebSockets
         * @default "on"
         */
        websockets?: WebSocketsValue;
        /**
         * Enable Zero-RTT
         * @default "off"
         */
        zeroRtt?: ZeroRTTValue;
        /**
         * Enable Brotli compression
         * @default "on"
         */
        brotli?: BrotliValue;
        /**
         * Enable Hotlink Protection
         * @default "off"
         */
        hotlinkProtection?: HotlinkProtectionValue;
        /**
         * Minimum TLS Version
         * @default "1.0"
         */
        minTlsVersion?: MinTLSVersionValue;
    };
    /**
     * Cloudflare Bot Management settings
     */
    botManagement?: BotManagement;
}
/**
 * Zone data structure (used for lookup functions)
 */
export interface ZoneData {
    /**
     * The ID of the zone
     */
    id: string;
    /**
     * The domain name for the zone
     */
    name: string;
    /**
     * The type of zone
     */
    type: "full" | "partial" | "secondary";
    /**
     * The status of the zone
     */
    status: string;
    /**
     * Whether the zone is paused
     */
    paused: boolean;
    /**
     * The account ID the zone belongs to
     */
    accountId: string;
    /**
     * The nameservers assigned to the zone
     */
    nameservers: string[];
    /**
     * The original nameservers for the zone
     */
    originalNameservers: string[] | null;
    /**
     * Time at which the zone was created
     */
    createdAt: number;
    /**
     * Time at which the zone was last modified
     */
    modifiedAt: number;
    /**
     * Time at which the zone was activated
     */
    activatedAt: number | null;
    /**
     * The zone's current settings
     */
    settings: {
        ssl: SSLValue;
        alwaysUseHttps: AlwaysUseHTTPSValue;
        automaticHttpsRewrites: AutomaticHTTPSRewritesValue;
        tls13: TLS13Value;
        earlyHints: EarlyHintsValue;
        emailObfuscation: EmailObfuscationValue;
        browserCacheTtl: number;
        developmentMode: DevelopmentModeValue;
        http2: HTTP2Value;
        http3: HTTP3Value;
        ipv6: IPv6Value;
        websockets: WebSocketsValue;
        zeroRtt: ZeroRTTValue;
        brotli: BrotliValue;
        hotlinkProtection: HotlinkProtectionValue;
        minTlsVersion: MinTLSVersionValue;
    };
}
/**
 * Output returned after Zone creation/update
 */
export interface Zone extends ZoneData {
}
/**
 * A Cloudflare Zone represents a domain and its configuration settings on Cloudflare.
 * Zones allow you to manage DNS, SSL/TLS, caching, security and other settings for a domain.
 *
 * @example
 * // Create a basic zone with default settings
 * const basicZone = await Zone("example.com", {
 *   name: "example.com",
 *   type: "full",
 *   jumpStart: true
 * });
 *
 * @example
 * // Create a zone with enhanced security settings
 * const secureZone = await Zone("secure.example.com", {
 *   name: "secure.example.com",
 *   type: "full",
 *   settings: {
 *     ssl: "strict",
 *     alwaysUseHttps: "on",
 *     automaticHttpsRewrites: "on",
 *     minTlsVersion: "1.3",
 *     tls13: "zrt"
 *   }
 * });
 *
 * @example
 * // Create a zone with optimized performance settings
 * const fastZone = await Zone("fast.example.com", {
 *   name: "fast.example.com",
 *   settings: {
 *     browserCacheTtl: 7200,
 *     brotli: "on",
 *     zeroRtt: "on",
 *     http2: "on",
 *     http3: "on",
 *     earlyHints: "on"
 *   }
 * });
 *
 * @example
 * // Create a development zone with specific features
 * const devZone = await Zone("dev.example.com", {
 *   name: "dev.example.com",
 *   settings: {
 *     developmentMode: "on",
 *     emailObfuscation: "on",
 *     hotlinkProtection: "on",
 *     ipv6: "on",
 *     websockets: "on"
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/dns/zone-setups/
 */
export declare const Zone: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Zone, ZoneProps>, _id: string, props: ZoneProps) => Promise<Zone>);
/**
 * Look up a Cloudflare zone by domain name
 *
 * @param domainName The domain name to look up (e.g., "example.com")
 * @param options Optional API configuration
 * @returns Promise resolving to zone details or null if not found
 *
 * @example
 * // Look up a zone by domain name
 * const zone = await getZoneByDomain(api, "example.com");
 * if (zone) {
 *   console.log(`Zone ID: ${zone.id}`);
 *   console.log(`Nameservers: ${zone.nameservers.join(", ")}`);
 * }
 *
 * @example
 * // Look up a zone with custom API options
 * const zone = await getZoneByDomain(api, "example.com");
 */
export declare function getZoneByDomain(api: CloudflareApi, domainName: string): Promise<CloudflareZone | undefined>;
/**
 * Cloudflare Zone response format
 */
export interface CloudflareZone {
    id: string;
    name: string;
    type: "full" | "partial" | "secondary";
    status: string;
    paused: boolean;
    account: {
        id: string;
    };
    name_servers: string[];
    original_name_servers: string[] | null;
    created_on: string;
    modified_on: string;
    activated_on: string | null;
}
/**
 * Helper function to find zone ID from a hostname
 * Searches for the zone that matches the hostname or its parent domains
 *
 * @param api CloudflareApi instance
 * @param hostname The hostname to find the zone for
 * @returns Promise resolving to the zone ID and zone name
 */
export declare function findZoneForHostname(api: CloudflareApi, hostname: string): Promise<{
    zoneId: string;
    zoneName: string;
}>;
//# sourceMappingURL=zone.d.ts.map