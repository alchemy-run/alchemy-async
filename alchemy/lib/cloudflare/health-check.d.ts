import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
export type CheckRegion = "WNAM" | "ENAM" | "WEU" | "EEU" | "NSAM" | "SSAM" | "OC" | "ME" | "NAF" | "SAF" | "IN" | "SEAS" | "NEAS" | "ALL_REGIONS" | (string & {});
export interface HTTPConfiguration {
    /**
     * Do not validate the certificate when the health check uses HTTPS
     * @default false
     */
    allowInsecure?: boolean;
    /**
     * A case-insensitive sub-string to look for in the response body
     * If this string is not found, the origin will be marked as unhealthy
     * @default undefined
     */
    expectedBody?: string;
    /**
     * The expected HTTP response codes (e.g. "200") or code ranges (e.g. "2xx" for all codes starting with 2)
     * @default undefined
     */
    expectedCodes?: string[];
    /**
     * Follow redirects if the origin returns a 3xx status code
     * @default false
     */
    followRedirects?: boolean;
    /**
     * The HTTP request headers to send in the health check
     * It is recommended you set a Host header by default
     * The User-Agent header cannot be overridden
     * Supports secret values for sensitive headers
     */
    header?: Record<string, (string | Secret<string>)[]>;
    /**
     * The HTTP method to use for the health check
     * @default "GET"
     */
    method?: "GET" | "HEAD";
    /**
     * The endpoint path to health check against
     * @default "/"
     */
    path?: string;
    /**
     * Port number to connect to for the health check
     * Defaults based on the health check type (specified via the `type` property):
     * @default 80 for HTTP
     * @default 443 for HTTPS
     */
    port?: number;
}
export interface TCPConfiguration {
    /**
     * The TCP connection method to use for the health check
     * @default "connection_established"
     */
    method?: "connection_established";
    /**
     * Port number to connect to for the health check
     * @default 80
     */
    port?: number;
}
export interface HealthCheckProps extends CloudflareApiOptions {
    /**
     * Zone this health check belongs to
     * Can be either a Zone resource or a zone ID string
     */
    zone: string | Zone;
    /**
     * The hostname or IP address of the origin server to run health checks on
     */
    address: string;
    /**
     * A short name to identify the health check
     * Only alphanumeric characters, hyphens and underscores are allowed
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * A list of regions from which to run health checks
     * If not specified, Cloudflare will pick a default region
     */
    checkRegions?: CheckRegion[];
    /**
     * The number of consecutive fails required from a health check before changing the health to unhealthy
     * @default 1
     */
    consecutiveFails?: number;
    /**
     * The number of consecutive successes required from a health check before changing the health to healthy
     * @default 1
     */
    consecutiveSuccesses?: number;
    /**
     * A human-readable description of the health check
     */
    description?: string;
    /**
     * Parameters specific to an HTTP or HTTPS health check
     */
    httpConfig?: HTTPConfiguration;
    /**
     * The interval between each health check in seconds
     * Shorter intervals may give quicker notifications if the origin status changes,
     * but will increase load on the origin as we check from multiple locations
     * @default 60
     */
    interval?: number;
    /**
     * The number of retries to attempt in case of a timeout before marking the origin as unhealthy
     * Retries are attempted immediately
     * @default 2
     */
    retries?: number;
    /**
     * If suspended, no health checks are sent to the origin
     * @default false
     */
    suspended?: boolean;
    /**
     * Parameters specific to TCP health check
     */
    tcpConfig?: TCPConfiguration;
    /**
     * The timeout (in seconds) before marking the health check as failed
     * @default 5
     */
    timeout?: number;
    /**
     * The protocol to use for the health check
     * Currently supported protocols are 'HTTP', 'HTTPS' and 'TCP'
     * @default "HTTP"
     */
    type?: string;
    /**
     * Whether to adopt an existing health check
     * @default false
     */
    adopt?: boolean;
}
/**
 * Output returned after Cloudflare Health Check creation/update
 * IMPORTANT: The type name MUST match the exported resource name
 */
export type HealthCheck = Omit<HealthCheckProps, "zone" | "adopt"> & {
    /**
     * The resource ID
     */
    id: string;
    /**
     * The Cloudflare-generated health check ID
     */
    healthCheckId: string;
    /**
     * The name of the health check
     */
    name: string;
    /**
     * The zone ID (extracted from zone prop)
     */
    zoneId: string;
    /**
     * Time at which the health check was created
     */
    createdOn?: string;
    /**
     * Time at which the health check was last modified
     */
    modifiedOn?: string;
    /**
     * The current status of the origin server according to the health check
     */
    status?: "unknown" | "healthy" | "unhealthy" | "suspended";
    /**
     * The current failure reason if status is unhealthy
     */
    failureReason?: string;
};
/**
 * Delete a health check from Cloudflare
 * @internal
 */
export declare function deleteHealthCheck(api: CloudflareApi, zoneId: string, healthCheckId: string, id: string): Promise<void>;
/**
 * Represents a Cloudflare Health Check for monitoring origin server availability.
 *
 * Health Checks monitor the availability of your origin servers and can be used
 * with Load Balancers to automatically route traffic away from unhealthy origins.
 *
 * @example
 * // Create a basic HTTP health check
 * const basicHealthCheck = await HealthCheck("api-healthcheck", {
 *   zone: "023e105f4ecef8ad9ca31a8372d0c353",
 *   address: "api.example.com",
 *   name: "api-server-check"
 * });
 *
 * @example
 * // Create an HTTPS health check with custom path and expected response
 * const httpsHealthCheck = await HealthCheck("secure-api-check", {
 *   zone: "023e105f4ecef8ad9ca31a8372d0c353",
 *   address: "secure-api.example.com",
 *   name: "secure-api-check",
 *   type: "HTTPS",
 *   httpConfig: {
 *     path: "/health",
 *     expectedCodes: ["200", "201"],
 *     expectedBody: "OK",
 *     method: "GET"
 *   }
 * });
 *
 * @example
 * // Create a health check with custom intervals and retry logic
 * const customHealthCheck = await HealthCheck("custom-check", {
 *   zone: "023e105f4ecef8ad9ca31a8372d0c353",
 *   address: "backend.example.com",
 *   name: "backend-check",
 *   interval: 30,
 *   timeout: 10,
 *   retries: 3,
 *   consecutiveFails: 2,
 *   consecutiveSuccesses: 2,
 *   description: "Backend server health monitoring"
 * });
 *
 * @example
 * // Create a TCP health check
 * const tcpHealthCheck = await HealthCheck("tcp-check", {
 *   zone: "023e105f4ecef8ad9ca31a8372d0c353",
 *   address: "database.example.com",
 *   name: "database-check",
 *   type: "TCP",
 *   tcpConfig: {
 *     port: 5432,
 *     method: "connection_established"
 *   }
 * });
 *
 * @example
 * // Create a health check with specific regions and custom headers
 * const regionalHealthCheck = await HealthCheck("regional-check", {
 *   zone: "023e105f4ecef8ad9ca31a8372d0c353",
 *   address: "api.example.com",
 *   name: "regional-api-check",
 *   checkRegions: ["WNAM", "ENAM", "WEU"],
 *   httpConfig: {
 *     path: "/api/health",
 *     header: {
 *       "Host": ["api.example.com"],
 *       "X-Health-Check": ["true"]
 *     },
 *     followRedirects: true
 *   }
 * });
 */
export declare const HealthCheck: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<HealthCheck>, id: string, props: HealthCheckProps) => Promise<HealthCheck>);
//# sourceMappingURL=health-check.d.ts.map