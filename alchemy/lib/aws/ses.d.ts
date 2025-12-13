import type { DeliveryOptions, ReputationOptions, SendingOptions, SuppressionOptions, TrackingOptions } from "@aws-sdk/client-sesv2";
import type { Context } from "../context.ts";
/**
 * Properties for configuring AWS SES resources
 */
export interface SESProps {
    /**
     * Name of the configuration set
     * Used to group email sending and tracking settings
     */
    configurationSetName?: string;
    /**
     * Email identity to verify (email address or domain)
     * For domains, use the format "example.com"
     * For email addresses, use the format "user@example.com"
     */
    emailIdentity?: string;
    /**
     * Whether to enable DKIM signing for the email identity
     * DKIM helps prevent email spoofing by verifying sender authenticity
     */
    enableDkim?: boolean;
    /**
     * Sending options for the configuration set
     * Controls whether email sending is enabled and related settings
     */
    sendingOptions?: SendingOptions;
    /**
     * Reputation options for the configuration set
     * Controls reputation tracking and metrics collection
     */
    reputationOptions?: ReputationOptions;
    /**
     * Tracking options for the configuration set
     * Controls open and click tracking with optional custom domains
     */
    trackingOptions?: TrackingOptions;
    /**
     * Suppression options for the configuration set
     * Controls how bounces and complaints are handled
     */
    suppressionOptions?: SuppressionOptions;
    /**
     * Delivery options for the configuration set
     * Controls TLS settings and sending pool configuration
     */
    deliveryOptions?: DeliveryOptions;
    /**
     * Tags to apply to the SES resources
     * Key-value pairs for resource organization
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after SES resource creation/update
 */
export interface SES extends SESProps {
    /**
     * ARN of the configuration set if created
     * Format: arn:aws:ses:region:account-id:configuration-set/name
     */
    configurationSetArn?: string;
    /**
     * Email identity verification status if an identity was created
     * Can be "PENDING" or "VERIFIED"
     */
    emailIdentityVerificationStatus?: string;
    /**
     * DKIM verification status if DKIM was enabled
     * Can be "PENDING", "SUCCESS", "FAILED", "TEMPORARY_FAILURE", or "NOT_STARTED"
     */
    dkimVerificationStatus?: string;
    /**
     * Email identity ARN if an identity was created
     * Format: arn:aws:ses:region:account-id:identity/name
     */
    emailIdentityArn?: string;
}
/**
 * AWS SES Resource
 *
 * Creates and manages Amazon Simple Email Service (SES) configuration sets and email identities.
 * Supports email sending configuration, DKIM signing, and identity verification.
 *
 * @example
 * // Create a configuration set with sending options
 * const configSet = await SES("email-config", {
 *   configurationSetName: "my-email-config",
 *   sendingOptions: {
 *     SendingEnabled: true
 *   },
 *   tags: {
 *     Environment: "production",
 *     Project: "notifications"
 *   }
 * });
 *
 * @example
 * // Create and verify a domain identity with DKIM
 * const domainIdentity = await SES("domain-identity", {
 *   emailIdentity: "example.com",
 *   enableDkim: true,
 *   tags: {
 *     Environment: "production",
 *     Project: "transactional-emails"
 *   }
 * });
 *
 * @example
 * // Update configuration set sending options
 * const updatedConfig = await SES("email-config", {
 *   configurationSetName: "my-email-config",
 *   sendingOptions: {
 *     SendingEnabled: false
 *   },
 *   tags: {
 *     Environment: "production",
 *     Project: "notifications",
 *     Updated: "true"
 *   }
 * });
 */
export declare const SES: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<SES>, _id: string, props: SESProps) => Promise<SES>);
//# sourceMappingURL=ses.d.ts.map