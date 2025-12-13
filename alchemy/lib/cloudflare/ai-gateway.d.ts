import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a Cloudflare AI Gateway.
 */
export interface AiGatewayProps extends CloudflareApiOptions {
    /**
     * Name of the AI Gateway.
     *
     * @default ${app.name}-${app.stage}-${id}
     */
    gatewayName?: string;
    /**
     * Invalidate cache on update.
     * @default true
     */
    cacheInvalidateOnUpdate?: boolean;
    /**
     * Cache TTL in seconds. Set to 0 to disable caching.
     * @default 0
     * @minimum 0
     */
    cacheTtl?: number;
    /**
     * Collect logs for the gateway.
     * @default true
     */
    collectLogs?: boolean;
    /**
     * Rate limiting interval in seconds. Set to 0 to disable rate limiting.
     * @default 0
     * @minimum 0
     */
    rateLimitingInterval?: number;
    /**
     * Rate limiting limit per interval. Set to 0 to disable rate limiting.
     * @default 0
     * @minimum 0
     */
    rateLimitingLimit?: number;
    /**
     * Rate limiting technique.
     * @default "fixed"
     */
    rateLimitingTechnique?: "fixed" | "sliding";
    /**
     * Enable authentication for the gateway.
     * @default false
     */
    authentication?: boolean;
    /**
     * Log retention limit in requests.
     * @default undefined
     * @minimum 10000
     * @maximum 10000000
     */
    logManagement?: number;
    /**
     * Strategy for handling log limits.
     * @default undefined
     */
    logManagementStrategy?: "STOP_INSERTING" | "DELETE_OLDEST";
    /**
     * Enable logpush for the gateway.
     * @default false
     */
    logpush?: boolean;
    /**
     * Public key for logpush encryption.
     * @default undefined
     * @minLength 16
     * @maxLength 1024
     */
    logpushPublicKey?: string;
}
/**
 * Output returned after Cloudflare AI Gateway creation/update.
 * IMPORTANT: The interface name MUST match the exported resource name.
 */
export interface AiGateway extends AiGatewayProps {
    /**
     * The ID (name) of the gateway.
     */
    id: string;
    /**
     * Cloudflare account ID associated with the gateway.
     */
    accountId: string;
    /**
     * Cloudflare account tag associated with the gateway.
     */
    accountTag: string;
    /**
     * Time at which the gateway was created (ISO 8601 format).
     */
    createdAt: string;
    /**
     * The internal UUID of the gateway.
     */
    internalId: string;
    /**
     * Time at which the gateway was last modified (ISO 8601 format).
     */
    modifiedAt: string;
    /**
     * Resource type identifier for binding.
     * @internal
     */
    type: "ai_gateway";
}
/**
 * Represents a Cloudflare AI Gateway.
 *
 * @example
 * // Create a basic AI Gateway with default settings:
 * const basicGateway = await AiGateway("my-ai-gateway", {});
 *
 * @example
 * // Create an AI Gateway with authentication and rate limiting:
 * const secureGateway = await AiGateway("secure-ai-gateway", {
 *   authentication: true,
 *   rateLimitingInterval: 60, // 60 seconds
 *   rateLimitingLimit: 100,   // 100 requests
 *   rateLimitingTechnique: "sliding"
 * });
 *
 * @example
 * // Create an AI Gateway with logging enabled and logpush:
 * const loggingGateway = await AiGateway("logging-ai-gateway", {
 *   collectLogs: true,
 *   logpush: true,
 *   logpushPublicKey: "mypublickey..." // Replace with actual public key
 * });
 */
export declare const AiGateway: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<AiGateway>, id: string, props?: AiGatewayProps) => Promise<AiGateway>);
//# sourceMappingURL=ai-gateway.d.ts.map