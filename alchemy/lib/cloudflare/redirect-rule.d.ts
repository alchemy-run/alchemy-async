import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { type Zone } from "./zone.ts";
/**
 * Properties for creating or updating a RedirectRule
 */
export interface RedirectRuleProps extends CloudflareApiOptions {
    /**
     * Description of the redirect rule
     *
     * @default ${app.name}-${app.stage}-${id}
     */
    description?: string;
    /**
     * The zone where the redirect rule will be applied
     * Can be a zone ID string or a Zone resource
     */
    zone: string | Zone;
    /**
     * For wildcard redirects: the URL pattern to match
     * Example: "https://*.example.com/files/*"
     * This is mutually exclusive with `expression`
     */
    requestUrl?: string;
    /**
     * For dynamic redirects: a Cloudflare Rules expression
     * Example: 'http.request.uri.path matches "/autodiscover\\.(xml|src)$"'
     * This is mutually exclusive with `requestUrl`
     * @see https://developers.cloudflare.com/ruleset-engine/rules-language/expressions/
     */
    expression?: string;
    /**
     * The target URL for the redirect
     * Can include placeholders like ${1}, ${2} for wildcard matches
     * Example: "https://example.com/${1}/files/${2}"
     */
    targetUrl: string;
    /**
     * HTTP status code for the redirect
     * @default 301
     */
    statusCode?: 301 | 302 | 303 | 307 | 308;
    /**
     * Whether to preserve query string parameters
     * @default true
     */
    preserveQueryString?: boolean;
}
/**
 * Cloudflare Rule response format
 */
interface CloudflareRule {
    id: string;
    version: string;
    action: string;
    expression: string;
    description?: string;
    last_updated: string;
    ref: string;
    enabled: boolean;
    action_parameters?: {
        from_value?: {
            status_code?: number;
            target_url?: {
                value?: string;
                expression?: string;
            };
            preserve_query_string?: boolean;
        };
    };
}
/**
 * Output returned after RedirectRule creation/update
 */
export interface RedirectRule {
    /**
     * The ID of the redirect rule
     */
    ruleId: string;
    /**
     * The ID of the ruleset containing this rule
     */
    rulesetId: string;
    /**
     * The zone ID where the rule is applied
     */
    zoneId: string;
    /**
     * Description of the redirect rule
     */
    description: string;
    /**
     * The request URL pattern (for wildcard redirects)
     */
    requestUrl?: string;
    /**
     * The expression (for dynamic redirects)
     */
    expression?: string;
    /**
     * The target URL for the redirect
     */
    targetUrl: string;
    /**
     * HTTP status code for the redirect
     */
    statusCode: number;
    /**
     * Whether query string parameters are preserved
     */
    preserveQueryString: boolean;
    /**
     * Whether the rule is enabled
     */
    enabled: boolean;
    /**
     * Time when the rule was last updated
     */
    lastUpdated: string;
}
/**
 * A Cloudflare Redirect Rule enables URL redirects and rewrites using Cloudflare's Rules engine.
 * Supports wildcard redirects, static redirects, and dynamic redirects with expressions.
 *
 * @example
 * ## Wildcard Redirect
 *
 * Redirect from a wildcard pattern to a target URL with placeholders.
 *
 * ```ts
 * const wildcardRedirect = await RedirectRule("my-wildcard-redirect", {
 *   zone: "example.com",
 *   requestUrl: "https://*.example.com/files/*",
 *   targetUrl: "https://example.com/${1}/files/${2}",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @example
 * ## Static Redirect
 *
 * Simple redirect from any request to a static target URL.
 *
 * ```ts
 * const staticRedirect = await RedirectRule("my-static-redirect", {
 *   zone: "example.com",
 *   targetUrl: "https://example.com/",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @example
 * ## Dynamic Redirect with Expression
 *
 * Complex redirect using Cloudflare's Rules language for advanced matching.
 *
 * ```ts
 * const dynamicRedirect = await RedirectRule("my-dynamic-redirect", {
 *   zone: "example.com",
 *   expression: 'http.request.uri.path matches "/autodiscover\\.(xml|src)$"',
 *   targetUrl: "https://example.com/not-found",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/rules/url-forwarding/single-redirects/
 */
export declare const RedirectRule: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RedirectRule>, id: string, props: RedirectRuleProps) => Promise<RedirectRule>);
/**
 * Find a specific rule in a ruleset
 */
export declare function findRuleInRuleset(api: CloudflareApi, zoneId: string, rulesetId: string, ruleId: string): Promise<CloudflareRule | null>;
export {};
//# sourceMappingURL=redirect-rule.d.ts.map