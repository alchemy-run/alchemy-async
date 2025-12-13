import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating a Stripe entitlements feature
 */
export interface EntitlementsFeatureProps {
    /**
     * The feature's name, for your own purpose, not meant to be displayable to the customer
     */
    name: string;
    /**
     * A unique key you provide as your own system identifier. This may be up to 80 characters
     */
    lookupKey?: string;
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
 * Output from the Stripe entitlements feature
 */
export interface EntitlementsFeature extends EntitlementsFeatureProps {
    /**
     * The ID of the feature
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "entitlements.feature";
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
}
/**
 * Create and manage Stripe entitlements features
 *
 * @example
 * // Create a basic feature for API access
 * const apiFeature = await EntitlementsFeature("api-access", {
 *   name: "API Access",
 *   lookupKey: "api_access_v1",
 *   metadata: {
 *     tier: "premium",
 *     category: "api"
 *   }
 * });
 *
 * @example
 * // Create a feature for advanced analytics
 * const analyticsFeature = await EntitlementsFeature("advanced-analytics", {
 *   name: "Advanced Analytics",
 *   lookupKey: "analytics_advanced",
 *   metadata: {
 *     tier: "enterprise",
 *     category: "analytics"
 *   }
 * });
 *
 * @example
 * // Create a feature for custom integrations
 * const integrationsFeature = await EntitlementsFeature("custom-integrations", {
 *   name: "Custom Integrations",
 *   lookupKey: "integrations_custom",
 *   metadata: {
 *     tier: "enterprise",
 *     category: "integrations",
 *     limit: "unlimited"
 *   }
 * });
 */
export declare const EntitlementsFeature: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EntitlementsFeature>, _id: string, props: EntitlementsFeatureProps) => Promise<EntitlementsFeature>);
//# sourceMappingURL=entitlements-feature.d.ts.map