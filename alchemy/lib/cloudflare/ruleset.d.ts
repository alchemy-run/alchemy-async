import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Kind, Rule, RulePhase } from "./rule.ts";
import { type Zone } from "./zone.ts";
/**
 * Properties for creating or updating a Ruleset
 */
export interface RulesetProps<Phase extends RulePhase> extends Partial<CloudflareApiOptions> {
    /**
     * The zone to apply the ruleset to
     */
    zone: string | Zone;
    /**
     * The phase of the ruleset
     * @default "http_ratelimit"
     */
    phase: Phase;
    /**
     * Rules to apply to the ruleset
     */
    rules: Array<Rule>;
    /**
     * Human-readable name for the ruleset
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Description of the ruleset
     */
    description?: string;
}
/**
 * Output returned after Ruleset creation/update
 */
export interface Ruleset<Phase extends RulePhase> {
    /**
     * The ID of the ruleset
     */
    id: string;
    /**
     * The zone ID
     */
    zoneId: string;
    /**
     * The phase of the ruleset
     */
    phase: Phase;
    /**
     * Human-readable name of the ruleset
     */
    name: string;
    /**
     * Description of the ruleset
     */
    description?: string;
    /**
     * The rules in the ruleset
     */
    rules: Array<Rule>;
    /**
     * ISO datetime the ruleset was last updated
     */
    lastUpdated: string;
    /**
     * Version string of the ruleset
     */
    version: string;
}
/**
 * Cloudflare Ruleset manages rules within a specific phase's entrypoint ruleset.
 * This resource allows you to configure rules for various phases like rate limiting,
 * firewall, transforms, and more.
 *
 * @example
 * // Create a rate limiting ruleset
 * const rateLimits = await Ruleset("api-rate-limits", {
 *   zone: "example.com",
 *   phase: "http_ratelimit",
 *   rules: [
 *     {
 *       description: "API rate limit",
 *       expression: "(http.request.uri.path wildcard r\"/api/*\")",
 *       action: "block",
 *       ratelimit: {
 *         characteristics: ["ip.src"],
 *         period: 60,
 *         requests_per_period: 100,
 *         mitigation_timeout: 600
 *       }
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a custom firewall ruleset
 * const firewall = await Ruleset("custom-firewall", {
 *   zone: myZone,
 *   phase: "http_request_firewall_custom",
 *   rules: [
 *     {
 *       description: "Block bad IPs",
 *       expression: "ip.src in {1.2.3.4 1.2.3.5}",
 *       action: "block"
 *     },
 *     {
 *       description: "Challenge suspicious requests",
 *       expression: "cf.threat_score > 50",
 *       action: "challenge"
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a transform ruleset for request headers
 * const transforms = await Ruleset("header-transforms", {
 *   zone: "example.com",
 *   phase: "http_request_transform",
 *   rules: [
 *     {
 *       description: "Add custom header",
 *       expression: "true",
 *       action: "rewrite",
 *       action_parameters: {
 *         headers: {
 *           "X-Custom-Header": { value: "my-value" }
 *         }
 *       }
 *     }
 *   ]
 * });
 */
export declare const Ruleset: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | (<Phase extends RulePhase>(this: Context<Ruleset<Phase>>, id: string, props: RulesetProps<Phase>) => Promise<Ruleset<Phase>>);
interface CloudflareApiRuleset {
    /** Unique ID of the ruleset (versioned under the hood). */
    id: string;
    /** ISO datetime last updated. */
    last_updated: string;
    /** Version string of the ruleset. */
    version: string;
    /** Kind of ruleset. */
    kind: Kind;
    /** Human-readable name. */
    name: string;
    /** Phase this ruleset runs in. */
    phase: RulePhase;
    /** Optional description. */
    description?: string;
    /** The list of rules in the ruleset. */
    rules?: Rule[];
}
/**
 * Update a ruleset for a specific zone and phase
 * Ensures consistent error handling on non-2xx responses
 */
export declare function updateRuleset(api: CloudflareApi, zoneId: string, 
/** Phase of the ruleset */
phase: RulePhase, body: {
    /** Human-readable name of the ruleset */
    name?: string;
    /** Informative description of the ruleset */
    description?: string;
    /** Kind of the ruleset (managed, custom, root, etc.) */
    kind?: Kind;
    /** The list of rules in the ruleset */
    rules: Array<Rule>;
}): Promise<CloudflareApiRuleset>;
export declare function getRuleset(api: CloudflareApi, zoneId: string, phase: RulePhase): Promise<CloudflareApiRuleset>;
export {};
//# sourceMappingURL=ruleset.d.ts.map