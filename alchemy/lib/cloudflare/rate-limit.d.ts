/**
 * Base interface for rate limiting configuration.
 */
export interface RateLimitProps {
    /**
     * A positive integer that uniquely defines this rate limiting configuration (e.g., namespace_id = 999).
     */
    namespace_id: number;
    /**
     * Simple rate limiting configuration.
     */
    simple: {
        /**
         * The limit (number of requests or API calls) to be applied. This is incremented when you call the limit() function in your Worker.
         */
        limit: number;
        /**
         * The period, in seconds, to measure increments to the limit over. Must be either 10 or 60.
         */
        period: 60 | 10;
    };
}
/**
 * RateLimit binding for Cloudflare Workers.
 */
export interface RateLimit extends RateLimitProps {
    type: "ratelimit";
}
/**
 * Rate limiting binding for Cloudflare Workers.
 *
 * The RateLimit binding provides access to Cloudflare's rate limiting functionality,
 * allowing you to implement rate limiting directly in your Workers without needing
 * to rely on external services.
 *
 * @example
 * ```ts
 * import { Worker, RateLimit } from "alchemy/cloudflare";
 *
 * const rateLimit = RateLimit({
 *   namespace_id: 1001,
 *   simple: {
 *     limit: 1500,
 *     period: 60
 *   }
 * });
 *
 * await Worker("my-worker", {
 *   name: "my-worker",
 *   entrypoint: "./src/worker.ts",
 *   bindings: {
 *     MY_RATE_LIMIT: rateLimit
 *   }
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
 *
 * Creates a rate limiting binding for Cloudflare Workers.
 * @returns A RateLimit binding object.
 */
export declare function RateLimit(options: RateLimitProps): RateLimit;
//# sourceMappingURL=rate-limit.d.ts.map