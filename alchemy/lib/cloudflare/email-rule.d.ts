import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
/**
 * Email routing matcher - defines what emails to match
 */
export interface EmailMatcher {
    /**
     * Type of matcher
     * - "literal": Exact string match
     * - "all": Matches all emails
     */
    type: "literal" | "all";
    /**
     * Field to match against (required for literal matchers)
     */
    field?: "to" | "from" | "subject";
    /**
     * Value to match (required for literal matchers)
     */
    value?: string;
}
/**
 * Email routing action - defines what to do with matched emails
 */
export interface EmailAction {
    /**
     * Type of action to take
     * - "forward": Forward email to destination addresses
     * - "worker": Process email with a Cloudflare Worker
     * - "drop": Drop/reject the email
     */
    type: "forward" | "worker" | "drop";
    /**
     * Action configuration
     * - For "forward": Array of destination email addresses
     * - For "worker": Worker script name
     * - For "drop": Not used
     */
    value?: string[];
}
/**
 * Properties for creating an email routing rule
 */
export interface EmailRuleProps extends CloudflareApiOptions {
    /**
     * Zone ID or Zone resource where the rule will be created
     */
    zone: string | Zone;
    /**
     * Name for the email routing rule
     */
    name?: string;
    /**
     * Whether the rule is enabled
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Rule priority - lower numbers have higher priority
     * Rules are evaluated in priority order
     *
     * @default 0
     */
    priority?: number;
    /**
     * Array of matchers that define which emails this rule applies to
     */
    matchers: EmailMatcher[];
    /**
     * Array of actions to take when emails match this rule
     */
    actions: EmailAction[];
}
/**
 * An email routing rule for a Cloudflare zone
 */
export interface EmailRule {
    /**
     * Zone ID where the rule is created
     */
    zoneId: string;
    /**
     * Rule ID
     */
    ruleId: string;
    /**
     * Rule name
     */
    name: string;
    /**
     * Whether the rule is enabled
     */
    enabled: boolean;
    /**
     * Rule priority
     */
    priority: number;
    /**
     * Matchers for this rule
     */
    matchers: EmailMatcher[];
    /**
     * Actions for this rule
     */
    actions: EmailAction[];
    /**
     * Rule tag
     */
    tag: string;
}
/**
 * Creates email routing rules that define how emails sent to your domain are processed.
 * Rules are evaluated in priority order (lower number = higher priority).
 *
 * @example
 * ## Forward emails to a specific address
 *
 * Forward all emails sent to info@example.com to a destination address.
 *
 * ```ts
 * const infoRule = await EmailRule("info-forwarding", {
 *   zone: "example.com",
 *   name: "Forward info emails",
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "info@example.com"
 *     }
 *   ],
 *   actions: [
 *     {
 *       type: "forward",
 *       value: ["admin@company.com"]
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Process emails with a Worker
 *
 * Route emails to a Cloudflare Worker for custom processing.
 *
 * ```ts
 * const workerRule = await EmailRule("worker-processing", {
 *   zone: "example.com",
 *   name: "Process with Worker",
 *   priority: 1,
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "webhook@example.com"
 *     }
 *   ],
 *   actions: [
 *     {
 *       type: "worker",
 *       value: ["email-processor"]
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Multiple matchers and actions
 *
 * Create a rule with multiple conditions and actions.
 *
 * ```ts
 * const complexRule = await EmailRule("support-routing", {
 *   zone: "example.com",
 *   name: "Support email routing",
 *   priority: 2,
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "support@example.com"
 *     }
 *   ],
 *   actions: [
 *     {
 *       type: "forward",
 *       value: ["support@company.com", "backup@company.com"]
 *     }
 *   ]
 * });
 * ```
 */
export declare const EmailRule: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EmailRule>, _id: string, props: EmailRuleProps) => Promise<EmailRule>);
//# sourceMappingURL=email-rule.d.ts.map