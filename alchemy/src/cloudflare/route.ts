import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { Worker } from "./worker.ts";
import { getZoneByDomain } from "./zone.ts";

/**
 * Properties for creating or updating a Route
 */
export interface RouteProps extends CloudflareApiOptions {
  /**
   * URL pattern for the route
   * @example "example.com/*"
   */
  pattern: string;

  /**
   * Worker script for the route
   * This can be a Worker resource or script name as a string
   */
  script: Worker | string;

  /**
   * Zone ID for the route
   * If not provided, will be automatically inferred from the route pattern using Cloudflare's zones API.
   * The system will attempt to find a zone that matches the domain in the route pattern.
   *
   * @example
   * // Explicit zone ID:
   * { pattern: "api.example.com/*", zoneId: "abc123def456" }
   *
   * // Automatic inference (recommended):
   * { pattern: "api.example.com/*" } // Zone ID automatically inferred from "example.com"
   * { pattern: "*.example.com/api/*" } // Zone ID inferred from "example.com"
   */
  zoneId?: string;

  /**
   * Whether to adopt an existing route with the same pattern if it exists
   * If true and a route with the same pattern exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the route when removed from Alchemy.
   * If set to false, the route will remain but the resource will be removed from state.
   *
   * @default true
   */
  delete?: boolean;

  /**
   * If true, the route will not be created, but will be retained if it already exists.
   * This is used for local development.
   *
   * @default `false`
   * @internal
   */
  dev?: boolean;
}

/**
 * Output returned after Route creation/update
 */
export interface Route extends RouteProps {
  /**
   * The unique ID of the route
   */
  id: string;

  /**
   * The URL pattern for the route
   */
  pattern: string;

  /**
   * The Worker script name for the route
   */
  script: string;

  /**
   * The Zone ID for the route
   */
  zoneId: string;
}

/**
 * Creates and manages Cloudflare Worker Routes.
 *
 * Routes map URL patterns to Worker scripts, allowing you to control which
 * requests are handled by your Workers.
 *
 * @example
 * // Create a route that maps all requests on a domain to a Worker
 * const basicRoute = await Route("main-route", {
 *   pattern: "example.com/*",
 *   script: "my-worker",
 *   zoneId: "your-zone-id"
 * });
 *
 * @example
 * // Create a route using a Worker resource
 * const worker = await Worker("api-worker", {
 *   script: `
 *     export default {
 *       fetch(request, env) {
 *         return new Response("Hello from API!");
 *       }
 *     }
 *   `
 * });
 *
 * const apiRoute = await Route("api-route", {
 *   pattern: "api.example.com/*",
 *   script: worker,
 *   zoneId: "your-zone-id"
 * });
 *
 * @example
 * // Create a route with automatic zone ID inference
 * // The zone ID will be automatically determined from the domain in the pattern
 * const autoRoute = await Route("auto-route", {
 *   pattern: "api.example.com/*", // Zone ID inferred from example.com
 *   script: "my-worker"
 * });
 *
 * @example
 * // Works with wildcard patterns too
 * const wildcardRoute = await Route("wildcard-route", {
 *   pattern: "*.example.com/api/*", // Zone ID inferred from example.com
 *   script: "api-worker"
 * });
 *
 * @see https://developers.cloudflare.com/workers/configuration/routes/
 */
export const Route = Resource(
  "cloudflare::Route",
  async function (
    this: Context<Route>,
    _id: string,
    props: RouteProps,
  ): Promise<Route> {
    const api = await createCloudflareApi(props);

    // Get script name from script prop (either a string or a Worker resource)
    const scriptName =
      typeof props.script === "string" ? props.script : props.script.name;

    if (this.phase === "delete") {
      logger.log("Deleting Route:", props.pattern);

      // Only delete if we have complete output data (both ID and zoneId)
      // If creation failed, we won't have proper output, so just skip deletion
      if (props.delete !== false && this.output?.id && this.output?.zoneId) {
        await deleteRoute(api, this.output.zoneId, this.output.id);
      }

      // Return void (a deleted route has no content)
      return this.destroy();
    }

    if (this.scope.local && props.dev) {
      // Get or infer zone ID for noop mode too
      let zoneId = props.zoneId;
      if (!zoneId) {
        zoneId = this.output?.zoneId ?? "noop-zone";
      }

      return {
        id: this.output?.id ?? "noop-route",
        pattern: props.pattern,
        script: scriptName,
        zoneId: zoneId,
      };
    }

    // Get or infer zone ID (only needed for create/update phases)
    let zoneId = props.zoneId;
    if (!zoneId) {
      const inferredZoneId = await inferZoneIdFromPattern(api, props.pattern);

      if (!inferredZoneId) {
        throw new Error(
          `Could not infer zone ID for route pattern "${props.pattern}". ` +
            "Please ensure the domain is managed by Cloudflare or specify an explicit zoneId.",
        );
      }

      zoneId = inferredZoneId;
    }

    let routeData: CloudflareRouteResponse;

    if (this.phase === "update" && this.output?.id) {
      logger.log("Updating Route:", props.pattern);

      // Update existing route
      routeData = await updateRoute(
        api,
        zoneId,
        this.output.id,
        props.pattern,
        scriptName,
      );
    } else {
      logger.log("Creating Route:", props.pattern);

      try {
        // Create new route
        routeData = await createRoute(api, zoneId, props.pattern, scriptName);
      } catch (error) {
        // Check if this is a "route already exists" error and adopt is enabled
        if (
          (props.adopt ?? this.scope.adopt) &&
          error instanceof CloudflareApiError &&
          error.status === 409
        ) {
          logger.log(
            `Route with pattern '${props.pattern}' already exists, adopting it`,
          );
          // Find the existing route by pattern
          const existingRoute = await findRouteByPattern(
            api,
            zoneId,
            props.pattern,
          );

          if (!existingRoute) {
            throw new Error(
              `Failed to find existing route with pattern '${props.pattern}' for adoption`,
            );
          }

          // Update the existing route to point to our script
          routeData = await updateRoute(
            api,
            zoneId,
            existingRoute.id,
            props.pattern,
            scriptName,
          );
        } else {
          // Re-throw the error if adopt is false or it's not a 409 error
          throw error;
        }
      }
    }

    // Return the route resource
    return {
      id: routeData.result.id,
      pattern: routeData.result.pattern,
      script: routeData.result.script,
      zoneId,
    };
  },
);

interface CloudflareRouteResponse {
  result: {
    id: string;
    pattern: string;
    script: string;
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

/**
 * Create a new route
 */
async function createRoute(
  api: CloudflareApi,
  zoneId: string,
  pattern: string,
  script: string,
): Promise<CloudflareRouteResponse> {
  const createResponse = await api.post(`/zones/${zoneId}/workers/routes`, {
    pattern,
    script,
  });

  if (!createResponse.ok) {
    return await handleApiError(createResponse, "creating", "Route", pattern);
  }

  return (await createResponse.json()) as CloudflareRouteResponse;
}

/**
 * Update a route
 */
async function updateRoute(
  api: CloudflareApi,
  zoneId: string,
  routeId: string,
  pattern: string,
  script: string,
): Promise<CloudflareRouteResponse> {
  const updateResponse = await api.put(
    `/zones/${zoneId}/workers/routes/${routeId}`,
    {
      pattern,
      script,
    },
  );

  if (updateResponse.status === 404) {
    return await createRoute(api, zoneId, pattern, script);
  }

  if (!updateResponse.ok) {
    return await handleApiError(updateResponse, "updating", "Route", pattern);
  }

  return (await updateResponse.json()) as CloudflareRouteResponse;
}

/**
 * Delete a route
 */
async function deleteRoute(
  api: CloudflareApi,
  zoneId: string,
  routeId: string,
): Promise<void> {
  const deleteResponse = await api.delete(
    `/zones/${zoneId}/workers/routes/${routeId}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorData: any = await deleteResponse.json().catch(() => ({
      errors: [{ message: deleteResponse.statusText }],
    }));

    throw new CloudflareApiError(
      `Error deleting Route '${routeId}': ${errorData.errors?.[0]?.message || deleteResponse.statusText}`,
      deleteResponse,
    );
  }
}

/**
 * Get a route by ID
 */
export async function getRoute(
  api: CloudflareApi,
  zoneId: string,
  routeId: string,
): Promise<CloudflareRouteResponse> {
  const response = await api.get(`/zones/${zoneId}/workers/routes/${routeId}`);

  if (!response.ok) {
    throw new CloudflareApiError(
      `Failed to get route ${routeId}: ${response.statusText}`,
      response,
    );
  }

  return (await response.json()) as CloudflareRouteResponse;
}

/**
 * List all routes for a zone
 */
export async function listRoutes(
  api: CloudflareApi,
  zoneId: string,
): Promise<CloudflareRouteResponse> {
  const response = await api.get(`/zones/${zoneId}/workers/routes`);

  if (!response.ok) {
    throw new CloudflareApiError(
      `Failed to list routes: ${response.statusText}`,
      response,
    );
  }

  return (await response.json()) as CloudflareRouteResponse;
}

/**
 * Find a route by pattern
 */
async function findRouteByPattern(
  api: CloudflareApi,
  zoneId: string,
  pattern: string,
): Promise<{ id: string; pattern: string; script: string } | null> {
  const response = await api.get(`/zones/${zoneId}/workers/routes`);

  if (!response.ok) {
    throw new CloudflareApiError(
      `Failed to list routes: ${response.statusText}`,
      response,
    );
  }

  const data = (await response.json()) as {
    result: Array<{
      id: string;
      pattern: string;
      script: string;
    }>;
    success: boolean;
    errors: Array<{ code: number; message: string }>;
    messages: string[];
  };

  if (!data.success) {
    throw new CloudflareApiError(
      `Failed to list routes: ${data.errors?.[0]?.message || "Unknown error"}`,
      response,
    );
  }

  // Look for a route with matching pattern
  const match = data.result.find((route) => route.pattern === pattern);
  return match || null;
}

/**
 * Extract domain from a route pattern, similar to wrangler's logic
 * @param pattern The route pattern (e.g., "api.example.com/*", "*.example.com/api/*")
 * @returns The domain part of the pattern
 */
function extractDomainFromPattern(pattern: string): string {
  // Remove protocol if present
  let domain = pattern.replace(/^https?:\/\//, "");

  // Remove path part (everything after the first '/')
  domain = domain.split("/")[0];

  // Remove port if present
  domain = domain.split(":")[0];

  return domain;
}

/**
 * Infer zone ID from a route pattern using Cloudflare API
 * This implements similar logic to wrangler's zone inference
 * @param pattern The route pattern
 * @param apiOptions API options for Cloudflare API calls
 * @returns Promise resolving to zone ID or null if not found
 */
export async function inferZoneIdFromPattern(
  api: CloudflareApi,
  pattern: string,
): Promise<string> {
  const domain = extractDomainFromPattern(pattern);

  // Handle wildcard domains by removing the wildcard part
  const cleanDomain = domain.replace(/^\*\./, "");

  // Try to find zone for the exact domain first
  let zone = await getZoneByDomain(api, cleanDomain);
  if (zone) {
    return zone.id;
  }

  // If not found, try parent domains (similar to wrangler's logic)
  const domainParts = cleanDomain.split(".");
  for (let i = 1; i < domainParts.length - 1; i++) {
    const parentDomain = domainParts.slice(i).join(".");
    zone = await getZoneByDomain(api, parentDomain);
    if (zone) {
      return zone.id;
    }
  }

  throw new Error(
    `Could not infer zone ID for route pattern "${pattern}". ` +
      "Please ensure the domain is managed by Cloudflare or specify an explicit zoneId.",
  );
}
