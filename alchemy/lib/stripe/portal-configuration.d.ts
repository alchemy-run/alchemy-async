import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Business profile information for the portal
 */
export interface PortalConfigurationBusinessProfile {
    /**
     * The messaging shown to customers in the portal
     */
    headline?: string;
    /**
     * A link to the business's publicly available privacy policy
     */
    privacyPolicyUrl?: string;
    /**
     * A link to the business's publicly available terms of service
     */
    termsOfServiceUrl?: string;
}
/**
 * Customer update feature configuration
 */
export interface PortalCustomerUpdateFeature {
    /**
     * The types of customer update that are supported
     */
    allowedUpdates?: Array<Stripe.BillingPortal.ConfigurationCreateParams.Features.CustomerUpdate.AllowedUpdate>;
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
}
/**
 * Invoice history feature configuration
 */
export interface PortalInvoiceHistoryFeature {
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
}
/**
 * Payment method update feature configuration
 */
export interface PortalPaymentMethodUpdateFeature {
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
}
/**
 * Subscription cancellation reason configuration
 */
export interface PortalSubscriptionCancellationReason {
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
    /**
     * Which cancellation reasons will be given as options to the customer
     */
    options?: Array<Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionCancel.CancellationReason.Option>;
}
/**
 * Subscription cancel feature configuration
 */
export interface PortalSubscriptionCancelFeature {
    /**
     * Cancellation reason configuration
     */
    cancellationReason?: PortalSubscriptionCancellationReason;
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
    /**
     * Whether to cancel subscriptions immediately or at the end of the billing period
     */
    mode?: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionCancel.Mode;
    /**
     * Whether to create prorations when canceling subscriptions
     */
    prorationBehavior?: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionCancel.ProrationBehavior;
}
/**
 * Subscription pause feature configuration
 */
export interface PortalSubscriptionPauseFeature {
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
}
/**
 * Subscription update product configuration
 */
export interface PortalSubscriptionUpdateProduct {
    product: string;
    prices?: string[];
}
/**
 * Subscription update feature configuration
 */
export interface PortalSubscriptionUpdateFeature {
    /**
     * The types of subscription updates that are supported for items
     */
    defaultAllowedUpdates?: Array<Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.DefaultAllowedUpdate>;
    /**
     * Whether the feature is enabled
     */
    enabled?: boolean;
    /**
     * The list of products that support subscription updates
     */
    products?: Array<PortalSubscriptionUpdateProduct>;
    /**
     * Determines how to handle prorations resulting from subscription updates
     */
    prorationBehavior?: Stripe.BillingPortal.ConfigurationCreateParams.Features.SubscriptionUpdate.ProrationBehavior;
}
/**
 * Features available in the customer portal
 */
export interface PortalConfigurationFeatures {
    /**
     * Information about updating the customer details in the portal
     */
    customerUpdate?: PortalCustomerUpdateFeature;
    /**
     * Information about showing the billing history in the portal
     */
    invoiceHistory?: PortalInvoiceHistoryFeature;
    /**
     * Information about updating payment methods in the portal
     */
    paymentMethodUpdate?: PortalPaymentMethodUpdateFeature;
    /**
     * Information about canceling subscriptions in the portal
     */
    subscriptionCancel?: PortalSubscriptionCancelFeature;
    /**
     * Information about pausing subscriptions in the portal
     */
    subscriptionPause?: PortalSubscriptionPauseFeature;
    /**
     * Information about updating subscriptions in the portal
     */
    subscriptionUpdate?: PortalSubscriptionUpdateFeature;
}
/**
 * Properties for creating a Stripe portal configuration
 */
export interface PortalConfigurationProps {
    /**
     * The business information shown to customers in the portal
     */
    businessProfile?: PortalConfigurationBusinessProfile;
    /**
     * The default URL to redirect customers to when they click on the portal's link to return to your website
     */
    defaultReturnUrl?: string;
    /**
     * Information about the features available in the portal
     */
    features?: PortalConfigurationFeatures;
    /**
     * Set of key-value pairs that you can attach to an object
     */
    metadata?: Record<string, string>;
    /**
     * API key to use (overrides environment variable)
     */
    apiKey?: Secret;
    /**
     * If true, adopt existing resource if creation fails due to conflict
     */
    adopt?: boolean;
}
/**
 * Output from the Stripe portal configuration
 */
export interface PortalConfiguration extends PortalConfigurationProps {
    /**
     * The ID of the configuration
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "billing_portal.configuration";
    /**
     * Whether the configuration is active and can be used to create portal sessions
     */
    active: boolean;
    /**
     * ID of the Connect Application that created the configuration
     */
    application?: string;
    /**
     * Time at which the object was created
     */
    created: number;
    /**
     * Whether the configuration is the default
     */
    isDefault: boolean;
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
    /**
     * Time at which the object was last updated
     */
    updated: number;
}
/**
 * Create and manage Stripe customer portal configurations
 *
 * @example
 * // Create a basic portal configuration
 * const basicPortal = await PortalConfiguration("basic-portal", {
 *   businessProfile: {
 *     headline: "Manage your subscription",
 *     privacyPolicyUrl: "https://example.com/privacy",
 *     termsOfServiceUrl: "https://example.com/terms"
 *   },
 *   features: {
 *     invoiceHistory: { enabled: true },
 *     paymentMethodUpdate: { enabled: true }
 *   }
 * });
 *
 * @example
 * // Create a portal with subscription management
 * const subscriptionPortal = await PortalConfiguration("subscription-portal", {
 *   defaultReturnUrl: "https://example.com/account",
 *   features: {
 *     subscriptionCancel: {
 *       enabled: true,
 *       mode: "at_period_end",
 *       prorationBehavior: "none"
 *     },
 *     subscriptionUpdate: {
 *       enabled: true,
 *       defaultAllowedUpdates: ["price", "quantity"],
 *       prorationBehavior: "create_prorations"
 *     }
 *   }
 * });
 *
 * @example
 * // Create a comprehensive portal configuration
 * const fullPortal = await PortalConfiguration("full-portal", {
 *   businessProfile: {
 *     headline: "Manage your Acme Corp subscription",
 *     privacyPolicyUrl: "https://acme.com/privacy",
 *     termsOfServiceUrl: "https://acme.com/terms"
 *   },
 *   defaultReturnUrl: "https://acme.com/dashboard",
 *   features: {
 *     customerUpdate: {
 *       enabled: true,
 *       allowedUpdates: ["email", "address", "shipping", "phone", "tax_id"]
 *     },
 *     invoiceHistory: { enabled: true },
 *     paymentMethodUpdate: { enabled: true },
 *     subscriptionCancel: {
 *       enabled: true,
 *       mode: "immediately",
 *       cancellationReason: {
 *         enabled: true,
 *         options: ["too_expensive", "missing_features", "switched_service"]
 *       }
 *     }
 *   },
 *   metadata: {
 *     environment: "production",
 *     version: "v2"
 *   }
 * });
 */
export declare const PortalConfiguration: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<PortalConfiguration>, _id: string, props: PortalConfigurationProps) => Promise<PortalConfiguration>);
//# sourceMappingURL=portal-configuration.d.ts.map