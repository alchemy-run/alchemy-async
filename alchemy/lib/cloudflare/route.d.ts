import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Worker } from "./worker.ts";
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
export declare const Route: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Route>, _id: string, props: RouteProps) => Promise<Route>);
interface CloudflareRouteResponse {
    result: {
        id: string;
        pattern: string;
        script: string;
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Get a route by ID
 */
export declare function getRoute(api: CloudflareApi, zoneId: string, routeId: string): Promise<CloudflareRouteResponse>;
/**
 * List all routes for a zone
 */
export declare function listRoutes(api: CloudflareApi, zoneId: string): Promise<CloudflareRouteResponse>;
/**
 * Infer zone ID from a route pattern using Cloudflare API
 * This implements similar logic to wrangler's zone inference
 * @param pattern The route pattern
 * @param apiOptions API options for Cloudflare API calls
 * @returns Promise resolving to zone ID or null if not found
 */
export declare function inferZoneIdFromPattern(api: CloudflareApi, pattern: string): Promise<string>;
export {};
//# sourceMappingURL=route.d.ts.map