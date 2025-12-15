import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { handleApiError } from "./api-error.ts";
import type {
  CloudflareApiListResponse,
  CloudflareApiResponse,
} from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
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

export function isTunnelRoute(resource: any): resource is TunnelRoute {
  return resource?.[ResourceKind] === "cloudflare::TunnelRoute";
}

/**
 * Output returned after TunnelRoute creation/update
 */
export interface TunnelRoute
  extends Omit<TunnelRouteProps, "delete" | "tunnel" | "routeId"> {
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
export const TunnelRoute = Resource(
  "cloudflare::TunnelRoute",
  async function (
    this: Context<TunnelRoute>,
    id: string,
    props: TunnelRouteProps,
  ): Promise<TunnelRoute> {
    // Create Cloudflare API client with automatic account discovery
    const api = await createCloudflareApi(props);

    // Resolve tunnel ID from either string or Tunnel resource
    const tunnelId =
      typeof props.tunnel === "string" ? props.tunnel : props.tunnel.tunnelId;

    const routeId = props.routeId || this.output?.id;
    const adopt = props.adopt ?? this.scope.adopt;

    if (this.phase === "delete") {
      // For delete operations, check if the route ID exists in the output
      if (routeId && props.delete !== false) {
        await deleteRoute(api, routeId);
      }

      // Return destroyed state
      return this.destroy();
    }

    // Check if network is being changed - network is immutable
    if (
      this.phase === "update" &&
      this.output?.network &&
      this.output.network !== props.network
    ) {
      logger.log(
        `Network changed from '${this.output.network}' to '${props.network}', replacing route`,
      );
      this.replace(true);
    }

    // Check if tunnel is being changed - tunnel is immutable
    if (
      this.phase === "update" &&
      this.output?.tunnelId &&
      this.output.tunnelId !== tunnelId
    ) {
      logger.log(
        `Tunnel changed from '${this.output.tunnelId}' to '${tunnelId}', replacing route`,
      );
      this.replace(true);
    }

    let routeData: CloudflareRoute;

    if (this.phase === "update" && routeId) {
      // Update existing route (only comment and virtualNetworkId can be updated)
      routeData = await updateRoute(api, routeId, {
        comment: props.comment,
        virtualNetworkId: props.virtualNetworkId,
      });
    } else {
      // Create new route
      try {
        routeData = await createRoute(api, {
          network: props.network,
          tunnelId,
          comment: props.comment,
          virtualNetworkId: props.virtualNetworkId,
        });
      } catch (error) {
        // Check if this is a "route already exists" error and adopt is enabled
        if (
          adopt &&
          error instanceof Error &&
          (error.message.includes("already exists") ||
            error.message.includes("duplicate") ||
            (error as any).status === 409)
        ) {
          logger.log(
            `Route for network '${props.network}' and tunnel '${tunnelId}' already exists, adopting it`,
          );

          // Find the existing route by network and tunnel
          const existingRoute = await findRouteByNetworkAndTunnel(
            api,
            props.network,
            tunnelId,
          );

          if (!existingRoute) {
            throw new Error(
              `Failed to find existing route for network '${props.network}' and tunnel '${tunnelId}' for adoption`,
            );
          }

          routeData = existingRoute;

          // Update comment/virtualNetworkId if provided
          if (
            props.comment !== undefined ||
            props.virtualNetworkId !== undefined
          ) {
            routeData = await updateRoute(api, existingRoute.id, {
              comment: props.comment,
              virtualNetworkId: props.virtualNetworkId,
            });
          }
        } else {
          // Re-throw the error if adopt is false or it's not an "already exists" error
          throw error;
        }
      }
    }

    // Transform API response to our interface
    return {
      id: routeData.id,
      network: routeData.network,
      tunnelId: routeData.tunnel_id,
      comment: routeData.comment,
      virtualNetworkId: routeData.virtual_network_id,
      createdAt: routeData.created_at,
      deletedAt: routeData.deleted_at,
      type: "cloudflare::TunnelRoute",
    };
  },
);

/**
 * Get tunnel route details
 * @internal
 */
export async function getTunnelRoute(
  api: CloudflareApi,
  routeId: string,
): Promise<CloudflareRoute> {
  const response = await api.get(
    `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
  );

  if (!response.ok) {
    await handleApiError(response, "get", "route", routeId);
  }

  const data =
    (await response.json()) as CloudflareApiResponse<CloudflareRoute>;
  return data.result;
}

/**
 * List all tunnel routes with pagination support
 * @internal
 */
export async function listTunnelRoutes(
  api: CloudflareApi,
  options?: {
    /** Maximum number of routes to return */
    limit?: number;
  },
): Promise<CloudflareRoute[]> {
  const routes: CloudflareRoute[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by API
  let hasMorePages = true;
  const limit = options?.limit;

  while (hasMorePages) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    const response = await api.get(
      `/accounts/${api.accountId}/teamnet/routes?${params.toString()}`,
    );

    if (!response.ok) {
      await handleApiError(response, "list", "route", "all");
    }

    const data =
      (await response.json()) as CloudflareApiListResponse<CloudflareRoute>;

    routes.push(...data.result);
    const resultInfo = data.result_info;

    // Check if we've reached the limit
    if (limit && routes.length >= limit) {
      return routes.slice(0, limit);
    }

    // Check if we've seen all pages
    hasMorePages =
      resultInfo.page * resultInfo.per_page < resultInfo.total_count;
    page++;
  }

  return routes;
}

/**
 * Find a route by network and tunnel ID
 * @internal
 */
export async function findRouteByNetworkAndTunnel(
  api: CloudflareApi,
  network: string,
  tunnelId: string,
): Promise<CloudflareRoute | null> {
  const routes = await listTunnelRoutes(api);

  // Look for a route with matching network and tunnel_id
  const match = routes.find(
    (route) => route.network === network && route.tunnel_id === tunnelId,
  );

  return match || null;
}

/**
 * Delete a route
 * @internal
 */
async function deleteRoute(api: CloudflareApi, routeId: string): Promise<void> {
  const response = await api.delete(
    `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
  );

  if (!response.ok && response.status !== 404) {
    await handleApiError(response, "delete", "route", routeId);
  }
}

/**
 * Create a new route
 * @internal
 */
async function createRoute(
  api: CloudflareApi,
  props: {
    network: string;
    tunnelId: string;
    comment?: string;
    virtualNetworkId?: string;
  },
): Promise<CloudflareRoute> {
  const payload: Record<string, any> = {
    network: props.network,
    tunnel_id: props.tunnelId,
  };

  if (props.comment !== undefined) {
    payload.comment = props.comment;
  }

  if (props.virtualNetworkId !== undefined) {
    payload.virtual_network_id = props.virtualNetworkId;
  }

  const response = await api.post(
    `/accounts/${api.accountId}/teamnet/routes`,
    payload,
  );

  if (!response.ok) {
    await handleApiError(
      response,
      "create",
      "route",
      `${props.network} -> ${props.tunnelId}`,
    );
  }

  const data =
    (await response.json()) as CloudflareApiResponse<CloudflareRoute>;
  return data.result;
}

/**
 * Update route configuration
 * @internal
 */
async function updateRoute(
  api: CloudflareApi,
  routeId: string,
  props: {
    comment?: string;
    virtualNetworkId?: string;
  },
): Promise<CloudflareRoute> {
  const payload: Record<string, any> = {};

  if (props.comment !== undefined) {
    payload.comment = props.comment;
  }

  if (props.virtualNetworkId !== undefined) {
    payload.virtual_network_id = props.virtualNetworkId;
  }

  const response = await api.patch(
    `/accounts/${api.accountId}/teamnet/routes/${routeId}`,
    payload,
  );

  if (!response.ok) {
    await handleApiError(response, "update", "route", routeId);
  }

  const data =
    (await response.json()) as CloudflareApiResponse<CloudflareRoute>;
  return data.result;
}
