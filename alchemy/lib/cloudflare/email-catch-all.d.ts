import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
import type { EmailAction, EmailMatcher } from "./email-rule.ts";
import type { Zone } from "./zone.ts";
/**
 * Properties for configuring the catch-all email rule
 */
export interface EmailCatchAllProps extends CloudflareApiOptions {
    /**
     * Zone ID or Zone resource where the catch-all rule will be configured
     */
    zone: string | Zone;
    /**
     * Whether the catch-all rule is enabled
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Name for the catch-all rule
     *
     * @default "Catch All"
     */
    name?: string;
    /**
     * Matchers for the catch-all rule (typically matches all emails)
     * If not provided, defaults to matching all emails
     */
    matchers?: EmailMatcher[];
    /**
     * Actions to take for emails that don't match other rules
     */
    actions: EmailAction[];
}
/**
 * A catch-all email routing rule for a Cloudflare zone
 */
export interface EmailCatchAll {
    /**
     * Zone ID where the catch-all rule is configured
     */
    zoneId: string;
    /**
     * Whether the catch-all rule is enabled
     */
    enabled: boolean;
    /**
     * Rule name
     */
    name: string;
    /**
     * Matchers for the catch-all rule
     */
    matchers: EmailMatcher[];
    /**
     * Actions for the catch-all rule
     */
    actions: EmailAction[];
    /**
     * Rule tag
     */
    tag: string;
}
/**
 * Configures a catch-all email routing rule that handles emails not matched by other rules.
 * This rule is processed last and typically matches all emails that haven't been handled.
 *
 * @example
 * ## Forward all unmatched emails
 *
 * Set up a catch-all rule to forward any unmatched emails to an admin address.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("default-catchall", {
 *   zone: "example.com",
 *   enabled: true,
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
 * ## Drop unmatched emails
 *
 * Configure catch-all to drop any emails that don't match specific rules.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("drop-catchall", {
 *   zone: "example.com",
 *   enabled: true,
 *   actions: [
 *     {
 *       type: "drop"
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Process with Worker
 *
 * Use a Worker to handle all unmatched emails for custom processing.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("worker-catchall", {
 *   zone: "example.com",
 *   enabled: true,
 *   actions: [
 *     {
 *       type: "worker",
 *       value: ["email-processor"]
 *     }
 *   ]
 * });
 * ```
 */
export declare const EmailCatchAll: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EmailCatchAll>, _id: string, props: EmailCatchAllProps) => Promise<EmailCatchAll>);
//# sourceMappingURL=email-catch-all.d.ts.map