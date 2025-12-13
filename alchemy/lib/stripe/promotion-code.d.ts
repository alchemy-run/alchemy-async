import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Restrictions for promotion code usage
 */
export interface PromotionCodeRestrictions {
    /**
     * Promotion codes defined with this restriction will only work for Checkout Sessions in payment mode
     */
    firstTimeTransaction?: boolean;
    /**
     * Minimum amount required to redeem this promotion code into a coupon
     */
    minimumAmount?: number;
    /**
     * Three-letter ISO code for minimum_amount
     */
    minimumAmountCurrency?: string;
}
/**
 * Properties for creating a Stripe promotion code
 */
export interface PromotionCodeProps {
    /**
     * The coupon for this promotion code
     */
    coupon: string;
    /**
     * The customer-facing code. Regardless of case, this code must be unique across all active promotion codes for a specific customer
     */
    code?: string;
    /**
     * Whether the promotion code is currently active
     */
    active?: boolean;
    /**
     * The customer that this promotion code can be used by
     */
    customer?: string;
    /**
     * The timestamp at which this promotion code will expire
     */
    expiresAt?: number;
    /**
     * The maximum number of times this promotion code can be redeemed
     */
    maxRedemptions?: number;
    /**
     * Set of key-value pairs that you can attach to an object
     */
    metadata?: Record<string, string>;
    /**
     * Settings that restrict the redemption of the promotion code
     */
    restrictions?: PromotionCodeRestrictions;
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
 * Output from the Stripe promotion code
 */
export interface PromotionCode extends PromotionCodeProps {
    /**
     * The ID of the promotion code
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "promotion_code";
    /**
     * Time at which the object was created
     */
    created: number;
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
    /**
     * Number of times this promotion code has been used
     */
    timesRedeemed: number;
}
/**
 * Create and manage Stripe promotion codes for coupons
 *
 * @example
 * // Create a basic promotion code
 * const basicPromoCode = await PromotionCode("summer-promo", {
 *   coupon: "SUMMER25",
 *   code: "SAVE25NOW",
 *   active: true,
 *   metadata: {
 *     campaign: "summer_sale",
 *     channel: "email"
 *   }
 * });
 *
 * @example
 * // Create a customer-specific promotion code
 * const customerPromoCode = await PromotionCode("vip-discount", {
 *   coupon: "VIP15",
 *   code: "VIP15OFF",
 *   customer: "cus_xyz123",
 *   maxRedemptions: 1,
 *   expiresAt: Math.floor(Date.now() / 1000) + 86400 * 30,
 *   metadata: {
 *     type: "vip_exclusive",
 *     tier: "gold"
 *   }
 * });
 *
 * @example
 * // Create a promotion code with restrictions
 * const restrictedPromoCode = await PromotionCode("first-time-buyer", {
 *   coupon: "WELCOME10",
 *   code: "FIRSTTIME10",
 *   restrictions: {
 *     firstTimeTransaction: true,
 *     minimumAmount: 5000,
 *     minimumAmountCurrency: "usd"
 *   },
 *   maxRedemptions: 1000,
 *   metadata: {
 *     campaign: "new_customer_acquisition",
 *     minimum_order: "50_usd"
 *   }
 * });
 */
export declare const PromotionCode: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<PromotionCode>, _id: string, props: PromotionCodeProps) => Promise<PromotionCode>);
//# sourceMappingURL=promotion-code.d.ts.map