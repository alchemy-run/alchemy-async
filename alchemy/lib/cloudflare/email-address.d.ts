import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating an email destination address
 */
export interface EmailAddressProps extends CloudflareApiOptions {
    /**
     * Destination email address for routing
     */
    email: string;
    /**
     * Whether to automatically verify the email address if possible
     * Note: Verification typically requires email confirmation by the recipient
     *
     * @default false
     */
    verified?: boolean;
}
/**
 * A destination email address for Cloudflare email routing
 */
export interface EmailAddress {
    /**
     * The email address
     */
    email: string;
    /**
     * Whether the email address has been verified
     */
    verified: boolean;
    /**
     * When the email address was created
     */
    created: string;
    /**
     * When the email address was last modified
     */
    modified: string;
    /**
     * Email address tag
     */
    tag: string;
}
/**
 * Manages destination email addresses for Cloudflare email routing.
 * These addresses can be used as targets in email routing rules.
 *
 * @example
 * ## Add a destination email address
 *
 * Add an email address that can receive routed emails.
 *
 * ```ts
 * const emailAddress = await EmailAddress("admin-email", {
 *   email: "admin@company.com"
 * });
 *
 * // Note: The email address will need to be verified before it can receive emails
 * console.log(`Verified: ${emailAddress.verified}`);
 * ```
 *
 * @example
 * ## Add multiple destination addresses
 *
 * Create multiple destination addresses for different routing purposes.
 *
 * ```ts
 * const supportEmail = await EmailAddress("support-email", {
 *   email: "support@company.com"
 * });
 *
 * const salesEmail = await EmailAddress("sales-email", {
 *   email: "sales@company.com"
 * });
 * ```
 */
export declare const EmailAddress: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EmailAddress>, _id: string, props: EmailAddressProps) => Promise<EmailAddress>);
//# sourceMappingURL=email-address.d.ts.map