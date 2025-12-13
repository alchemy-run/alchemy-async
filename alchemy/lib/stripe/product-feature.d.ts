import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating a Stripe product feature
 */
export interface ProductFeatureProps {
    /**
     * The ID of the product that this feature will be attached to
     */
    product: string;
    /**
     * The ID of the entitlements feature to attach to the product
     */
    entitlementFeature: string;
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
 * Output from the Stripe product feature
 */
export interface ProductFeature extends ProductFeatureProps {
    /**
     * The ID of the product feature
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "product_feature";
    /**
     * The entitlement feature object attached to this product
     */
    entitlementFeatureObject?: {
        id: string;
        name: string;
        lookupKey?: string;
        metadata?: Record<string, string>;
    };
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
}
/**
 * Create and manage Stripe product features
 *
 * @example
 * // Attach an API access feature to a product
 * const productApiFeature = await ProductFeature("product-api-access", {
 *   product: "prod_xyz123",
 *   entitlementFeature: "feat_abc456"
 * });
 *
 * @example
 * // Attach analytics feature to a premium product
 * const productAnalytics = await ProductFeature("premium-analytics", {
 *   product: "prod_premium789",
 *   entitlementFeature: "feat_analytics123"
 * });
 *
 * @example
 * // Attach custom integrations to enterprise product
 * const enterpriseIntegrations = await ProductFeature("enterprise-integrations", {
 *   product: "prod_enterprise456",
 *   entitlementFeature: "feat_integrations789"
 * });
 */
export declare const ProductFeature: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<ProductFeature>, _id: string, props: ProductFeatureProps) => Promise<ProductFeature>);
//# sourceMappingURL=product-feature.d.ts.map