import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Tunnel data as returned by Cloudflare API
 */
interface CloudflareTunnel {
    id: string;
    account_tag: string;
    created_at: string;
    deleted_at: string | null;
    name: string;
    metadata?: Record<string, any>;
    credentials_file?: {
        AccountTag: string;
        TunnelID: string;
        TunnelName: string;
        TunnelSecret: string;
    };
    token?: string;
}
/**
 * Properties for creating or updating a Cloudflare Tunnel
 *
 * @remarks
 * This interface includes all configuration options supported by Cloudflare Tunnels
 * for both remotely-managed (configSrc: 'cloudflare') and locally-managed tunnels.
 */
export interface TunnelProps extends CloudflareApiOptions {
    /**
     * Name for the tunnel
     *
     * Note: Tunnel names are immutable and cannot be changed after creation.
     * When updating a tunnel, any name change will be ignored.
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Secret for the tunnel
     * If not provided, will be generated automatically
     */
    tunnelSecret?: Secret<string>;
    /**
     * Optional metadata object for the tunnel
     */
    metadata?: Record<string, any>;
    /**
     * Configuration source
     * - 'cloudflare' - Use Cloudflare configuration (default, managed via API)
     * - 'local' - Use local configuration (managed via config file)
     *
     * @default 'cloudflare'
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/tunnel-useful-terms/#remotely-managed-tunnel
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/tunnel-useful-terms/#locally-managed-tunnel
     */
    configSrc?: "cloudflare" | "local";
    /**
     * Ingress rules defining how requests are routed
     * Must include a catch-all rule at the end
     * Only used when configSrc is 'cloudflare'
     *
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#ingress-rules
     */
    ingress?: IngressRule[];
    /**
     * WarpRouting configuration for private network access
     * Only used when configSrc is 'cloudflare'
     *
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/
     */
    warpRouting?: {
        enabled?: boolean;
    };
    /**
     * Origin request configuration to apply to all rules
     * Only used when configSrc is 'cloudflare'
     *
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#origin-request-parameters
     */
    originRequest?: OriginRequestConfig;
    /**
     * Whether to adopt an existing tunnel with the same name if it exists
     * If true and a tunnel with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to delete the tunnel.
     * If set to false, the tunnel will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
}
/**
 * Tunnel configuration for routing traffic
 */
export interface TunnelConfig {
    /**
     * Ingress rules defining how requests are routed
     * Must include a catch-all rule at the end
     */
    ingress?: IngressRule[];
    /**
     * WarpRouting configuration for private network access
     */
    warpRouting?: {
        enabled?: boolean;
    };
    /**
     * Origin request configuration to apply to all rules
     */
    originRequest?: OriginRequestConfig;
}
/**
 * Ingress rule defining how a hostname is routed
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#ingress-rules
 */
export interface IngressRule {
    /**
     * Hostname to match for this rule
     * Use service: "http_status:404" as catch-all
     */
    hostname?: string;
    /**
     * Service to route to (e.g., "http://localhost:8000" or "http_status:404")
     *
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#supported-protocols
     */
    service: string;
    /**
     * Path to match for this rule
     */
    path?: string;
    /**
     * Origin request configuration for this specific rule
     */
    originRequest?: OriginRequestConfig;
}
/**
 * Origin request configuration
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#origin-request-parameters
 */
export interface OriginRequestConfig {
    /**
     * Timeout for origin server to respond to a request
     */
    connectTimeout?: number;
    /**
     * Timeout for closing the connection to the origin server
     */
    tlsTimeout?: number;
    /**
     * Timeout for TCP connections to the origin server
     */
    tcpKeepAlive?: number;
    /**
     * Disable keep-alive connections
     */
    noHappyEyeballs?: boolean;
    /**
     * Keep connections open after a request
     */
    keepAliveConnections?: number;
    /**
     * Timeout for keep-alive connections
     */
    keepAliveTimeout?: number;
    /**
     * HTTP/2 origin support
     */
    http2Origin?: boolean;
    /**
     * Headers to add to origin requests
     */
    httpHostHeader?: string;
    /**
     * CA pool for origin TLS verification
     */
    caPool?: string;
    /**
     * Disable TLS verification
     */
    noTLSVerify?: boolean;
    /**
     * Disable chunked encoding
     */
    disableChunkedEncoding?: boolean;
    /**
     * Rewrite the Host header
     */
    bastionMode?: boolean;
    /**
     * Proxy protocol version
     */
    proxyProtocol?: "off" | "v1" | "v2";
    /**
     * Proxy outgoing connections through a specified address
     */
    proxyAddress?: string;
    /**
     * Port to use for proxy connections
     */
    proxyPort?: number;
    /**
     * Type of proxy to use
     */
    proxyType?: string;
    /**
     * Enable TCP keep-alive for connection pooling
     */
    tcpKeepAliveInterval?: number;
}
export declare function isTunnel(resource: any): resource is Tunnel;
/**
 * Output returned after Tunnel creation/update
 */
export interface Tunnel extends Omit<TunnelProps, "delete" | "tunnelSecret"> {
    /**
     * The name of the tunnel
     */
    name: string;
    /**
     * The ID of the tunnel
     */
    tunnelId: string;
    /**
     * The account ID that owns the tunnel
     */
    accountTag: string;
    /**
     * Time at which the tunnel was created
     */
    createdAt: string;
    /**
     * Time at which the tunnel was deleted (null if active)
     */
    deletedAt: string | null;
    /**
     * Credentials for connecting to the tunnel
     */
    credentials: {
        accountTag: string;
        tunnelId: string;
        tunnelName: string;
        tunnelSecret: Secret<string>;
    };
    /**
     * Token for running the tunnel
     *
     * @remarks
     * Use this token with `cloudflared tunnel run --token <token>` to start the tunnel
     *
     * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel-api/#install-and-run-the-tunnel
     */
    token: Secret<string>;
    /**
     * DNS records automatically created for hostnames in ingress rules
     * Maps hostname to DNS record ID
     * @internal
     */
    dnsRecords?: Record<string, string>;
}
/**
 * Creates and manages a Cloudflare Tunnel, which provides a secure connection between
 * your origin server and Cloudflare's edge. This resource handles the tunnel lifecycle
 * (create, update, delete) and configuration.
 *
 * @remarks
 * After creating a tunnel, use the returned credentials and token to run the
 * cloudflared connector on your origin server.
 *
 * When hostnames are specified in ingress rules, this resource automatically creates
 * the required DNS CNAME records pointing to <tunnel-id>.cfargotunnel.com, following
 * the Cloudflare API documentation for connecting applications (step 3a).
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel-api/
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/
 *
 * @example
 * // Create a basic tunnel
 * const tunnel = await Tunnel("my-app", {
 *   name: "my-app-tunnel"
 * });
 *
 * // Run cloudflared with:
 * // cloudflared tunnel run --token <tunnel.token.unencrypted>
 *
 * @example
 * // Create a tunnel with ingress configuration for a web app
 * // DNS records are automatically created for each hostname
 * const webTunnel = await Tunnel("web-app", {
 *   name: "web-app-tunnel",
 *   ingress: [
 *     {
 *       hostname: "app.example.com",
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       service: "http_status:404"  // catch-all rule
 *     }
 *   ]
 * });
 * // A CNAME record for app.example.com → webTunnel.tunnelId.cfargotunnel.com
 * // is automatically created in the appropriate zone
 *
 * @example
 * // Create a tunnel with multiple services and origin configuration
 * const apiTunnel = await Tunnel("api", {
 *   name: "api-tunnel",
 *   ingress: [
 *     {
 *       hostname: "api.example.com",
 *       path: "/v1/*",
 *       service: "http://localhost:8080",
 *       originRequest: {
 *         httpHostHeader: "api.internal",
 *         connectTimeout: 30
 *       }
 *     },
 *     {
 *       hostname: "api.example.com",
 *       path: "/v2/*",
 *       service: "http://localhost:8081"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a tunnel for private network access with WARP
 * const privateTunnel = await Tunnel("private-network", {
 *   name: "private-network-tunnel",
 *   warpRouting: {
 *     enabled: true
 *   }
 * });
 *
 * @example
 * // Create a tunnel with origin request configuration
 * const secureTunnel = await Tunnel("secure", {
 *   name: "secure-tunnel",
 *   originRequest: {
 *     noTLSVerify: false,
 *     connectTimeout: 30,
 *     httpHostHeader: "internal.service"
 *   },
 *   ingress: [
 *     {
 *       hostname: "secure.example.com",
 *       service: "https://localhost:8443"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Adopt an existing tunnel if it already exists
 * const existingTunnel = await Tunnel("existing", {
 *   name: "existing-tunnel",
 *   adopt: true,
 *   ingress: [
 *     {
 *       hostname: "updated.example.com",
 *       service: "http://localhost:5000"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Tunnel with automatic DNS record creation
 * // The Tunnel resource automatically creates DNS records for hostnames in ingress rules
 * const appTunnel = await Tunnel("app", {
 *   name: "app-tunnel",
 *   ingress: [
 *     {
 *       hostname: "app.example.com",
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       hostname: "api.example.com",
 *       service: "http://localhost:8080"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 * // DNS CNAME records are automatically created:
 * // - app.example.com → {tunnelId}.cfargotunnel.com
 * // - api.example.com → {tunnelId}.cfargotunnel.com
 *
 * // Run the tunnel:
 * // cloudflared tunnel run --token <appTunnel.token.unencrypted>
 *
 * @example
 * // For advanced DNS control, you can still manually manage DNS records
 * // by omitting hostnames from ingress rules:
 * const tunnel = await Tunnel("manual-dns", {
 *   name: "manual-dns-tunnel",
 *   ingress: [
 *     {
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 * // Then create DNS records separately with custom configuration
 */
export declare const Tunnel: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Tunnel>, id: string, props: TunnelProps) => Promise<Tunnel>);
/**
 * Get tunnel details
 * @internal
 */
export declare function getTunnel(api: CloudflareApi, tunnelId: string): Promise<CloudflareTunnel>;
/**
 * Get tunnel configuration
 * @internal
 */
export declare function getTunnelConfiguration(api: CloudflareApi, tunnelId: string): Promise<TunnelConfig>;
/**
 * List all tunnels with pagination support
 * @internal
 */
export declare function listTunnels(api: CloudflareApi, options?: {
    /** Whether to include deleted tunnels */
    includeDeleted?: boolean;
    /** Maximum number of tunnels to return */
    limit?: number;
}): Promise<CloudflareTunnel[]>;
/**
 * Find a tunnel by name with pagination support
 * @internal
 */
export declare function findTunnelByName(api: CloudflareApi, name: string): Promise<CloudflareTunnel | null>;
export {};
//# sourceMappingURL=tunnel.d.ts.map