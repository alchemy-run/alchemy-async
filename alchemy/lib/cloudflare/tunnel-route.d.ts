import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Tunnel } from "./tunnel.ts";
/**
 * Route data as returned by Cloudflare API
 * @internal
 */
interface CloudflareRoute {
    id: string;
    network: string;
    tunnel_id: string;
    comment?: string;
    virtual_network_id?: string;
    created_at: string;
    deleted_at: string | null;
}
/**
 * Properties for creating or updating a Cloudflare Tunnel Route
 */
export interface TunnelRouteProps extends CloudflareApiOptions {
    /**
     * The private IPv4 or IPv6 range connected by the route, in CIDR notation
     * (e.g., "172.16.0.0/16" or "2001:db8::/32")
     *
     * Note: The network CIDR is immutable and cannot be changed after creation.
     * When updating a route, any network change will trigger a replacement.
     */
    network: string;
    /**
     * The tunnel to route traffic through
     * Can be a Tunnel resource or a tunnel ID (UUID)
     */
    tunnel: string | Tunnel;
    /**
     * Optional remark describing the route
     * @maxLength 100
     */
    comment?: string;
    /**
     * UUID of the virtual network
     * If not provided, the route will be added to the default virtual network
     */
    virtualNetworkId?: string;
    /**
     * Whether to adopt an existing route with the same network and tunnel if it exists
     * If true and a route with the same network and tunnel exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to delete the route when removed from Alchemy
     * If set to false, the route will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
    /**
     * Internal route ID for lifecycle management
     * @internal
     */
    routeId?: string;
}
export declare function isTunnelRoute(resource: any): resource is TunnelRoute;
/**
 * Output returned after TunnelRoute creation/update
 */
export interface TunnelRoute extends Omit<TunnelRouteProps, "delete" | "tunnel" | "routeId"> {
    /**
     * The ID of the route
     */
    id: string;
    /**
     * The private IPv4 or IPv6 range connected by the route, in CIDR notation
     */
    network: string;
    /**
     * The UUID of the tunnel this route uses
     */
    tunnelId: string;
    /**
     * Optional remark describing the route
     */
    comment?: string;
    /**
     * UUID of the virtual network
     */
    virtualNetworkId?: string;
    /**
     * Time at which the route was created
     */
    createdAt: string;
    /**
     * Time at which the route was deleted (null if active)
     */
    deletedAt: string | null;
    /**
     * Resource type identifier for binding
     * @internal
     */
    type: "cloudflare::TunnelRoute";
}
/**
 * Creates and manages a Cloudflare Tunnel Route, which routes private network traffic
 * through a Cloudflare Tunnel. This resource handles the route lifecycle (create, update, delete).
 *
 * @remarks
 * Tunnel Routes enable private network access by routing CIDR ranges through Cloudflare Tunnels.
 * This is commonly used for Zero Trust network access scenarios where you need to connect
 * private networks to Cloudflare's edge.
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/
 * @see https://developers.cloudflare.com/api/operations/zero-trust-networks-routes-create-a-tunnel-route
 *
 * @example
 * // Create a basic tunnel route for a private network
 * const tunnel = await Tunnel("my-tunnel", {
 *   name: "my-tunnel"
 * });
 *
 * const route = await TunnelRoute("private-network", {
 *   network: "172.16.0.0/16",
 *   tunnel: tunnel
 * });
 *
 * @example
 * // Create a route with a comment and virtual network
 * const route = await TunnelRoute("vpc-route", {
 *   network: "10.0.0.0/8",
 *   tunnel: "f70ff985-a4ef-4643-bbbc-4a0ed4fc8415",
 *   comment: "Main VPC network route",
 *   virtualNetworkId: "f70ff985-a4ef-4643-bbbc-4a0ed4fc8415"
 * });
 *
 * @example
 * // Adopt an existing route if it already exists
 * const route = await TunnelRoute("existing-route", {
 *   network: "192.168.1.0/24",
 *   tunnel: tunnel,
 *   adopt: true,
 *   comment: "Updated comment"
 * });
 *
 * @example
 * // Create a route without deleting it when removed from Alchemy
 * const route = await TunnelRoute("persistent-route", {
 *   network: "10.1.0.0/16",
 *   tunnel: tunnel,
 *   delete: false
 * });
 */
export declare const TunnelRoute: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<TunnelRoute>, id: string, props: TunnelRouteProps) => Promise<TunnelRoute>);
/**
 * Get tunnel route details
 * @internal
 */
export declare function getTunnelRoute(api: CloudflareApi, routeId: string): Promise<CloudflareRoute>;
/**
 * List all tunnel routes with pagination support
 * @internal
 */
export declare function listTunnelRoutes(api: CloudflareApi, options?: {
    /** Maximum number of routes to return */
    limit?: number;
}): Promise<CloudflareRoute[]>;
/**
 * Find a route by network and tunnel ID
 * @internal
 */
export declare function findRouteByNetworkAndTunnel(api: CloudflareApi, network: string, tunnelId: string): Promise<CloudflareRoute | null>;
export {};
//# sourceMappingURL=tunnel-route.d.ts.map