import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
/**
 * Properties for configuring email routing on a zone
 */
export interface EmailRoutingProps extends CloudflareApiOptions {
    /**
     * Zone ID or Zone resource where email routing will be configured
     */
    zone: string | Zone;
    /**
     * Whether email routing should be enabled
     *
     * @default true
     */
    enabled?: boolean;
    /**
     * Skip the DNS setup wizard when enabling email routing
     *
     * @default false
     */
    skipWizard?: boolean;
}
/**
 * Email routing configuration for a Cloudflare zone
 */
export interface EmailRouting {
    /**
     * Zone ID where email routing is configured
     */
    zoneId: string;
    /**
     * Whether email routing is enabled
     */
    enabled: boolean;
    /**
     * Zone name
     */
    name: string;
    /**
     * When email routing was created
     */
    created: string;
    /**
     * When email routing was last modified
     */
    modified: string;
    /**
     * Zone tag
     */
    tag: string;
}
/**
 * Configures email routing for a Cloudflare zone, allowing emails sent to the zone's domain
 * to be routed according to defined rules.
 *
 * @example
 * ## Enable email routing for a zone
 *
 * Enable email routing for your domain to start receiving and routing emails.
 *
 * ```ts
 * const emailRouting = await EmailRouting("example.com-routing", {
 *   zone: "example.com",
 *   enabled: true
 * });
 * ```
 *
 * @example
 * ## Use with existing Zone resource
 *
 * Configure email routing using an existing Zone resource reference.
 *
 * ```ts
 * const zone = await Zone("my-zone", {
 *   name: "example.com"
 * });
 *
 * const emailRouting = await EmailRouting("example.com-routing", {
 *   zone: zone,
 *   enabled: true,
 *   skipWizard: true
 * });
 * ```
 */
export declare const EmailRouting: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EmailRouting>, _id: string, props: EmailRoutingProps) => Promise<EmailRouting>);
//# sourceMappingURL=email-routing.d.ts.map