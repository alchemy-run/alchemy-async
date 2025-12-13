import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import type { Meter } from "./meter.ts";
/**
 * Properties for price recurring configuration
 */
export type PriceRecurring = {
    /**
     * Specifies billing frequency. Either 'day', 'week', 'month' or 'year'.
     */
    interval: Stripe.PriceCreateParams.Recurring.Interval;
    /**
     * The number of intervals between subscription billings. For example, interval=month and interval_count=3 bills every 3 months.
     */
    intervalCount?: number;
    /**
     * Configures how the quantity per period should be determined, can be either 'metered' or 'licensed'.
     * 'metered' will aggregate the total usage based on usage records.
     */
    usageType: "metered";
    /**
     * The ID of the billing meter this price is associated with.
     * Required when usageType = 'metered'.
     */
    meter: string | Meter;
} | {
    /**
     * Specifies billing frequency. Either 'day', 'week', 'month' or 'year'.
     */
    interval: Stripe.PriceCreateParams.Recurring.Interval;
    /**
     * The number of intervals between subscription billings. For example, interval=month and interval_count=3 bills every 3 months.
     */
    intervalCount?: number;
    /**
     * Configures how the quantity per period should be determined, can be either 'metered' or 'licensed'.
     * 'licensed' will automatically bill the quantity set for a plan when adding it to a subscription.
     */
    usageType?: "licensed" | undefined;
    /**
     * The ID of the billing meter this price is associated with.
     * Not applicable when usageType is not 'metered'.
     */
    meter?: never;
};
type TaxBehavior = Stripe.PriceCreateParams.TaxBehavior;
type BillingScheme = Stripe.PriceCreateParams.BillingScheme;
/**
 * Properties for price tier configuration
 */
export interface PriceTier {
    /**
     * The flat billing amount for an entire tier, regardless of the number of units in the tier
     */
    flatAmount?: number;
    /**
     * Same as flat_amount, but accepts a decimal string with at most 12 decimal places
     */
    flatAmountDecimal?: string;
    /**
     * The per-unit amount to charge for units within this tier
     */
    unitAmount?: number;
    /**
     * Same as unit_amount, but accepts a decimal string with at most 12 decimal places
     */
    unitAmountDecimal?: string;
    /**
     * Specifies the upper bound of the tier. Can be a number or 'inf' for infinity.
     * The last tier should have up_to set to 'inf'.
     */
    upTo: number | "inf";
}
/**
 * Properties for creating a Stripe price
 */
export interface PriceProps {
    /**
     * The ID of the product that this price will belong to
     */
    product: string;
    /**
     * Three-letter ISO currency code, in lowercase. Must be a supported currency.
     */
    currency: string;
    /**
     * A positive integer in cents (or local equivalent) representing how much to charge (e.g., 999 for $9.99).
     * Alternatively, use unit_amount_decimal to specify a precise amount.
     */
    unitAmount?: number;
    /**
     * Same as unit_amount, but accepts a decimal string (e.g., '9.99') with at most 12 decimal places.
     * Only one of unit_amount and unit_amount_decimal can be set.
     */
    unitAmountDecimal?: string;
    /**
     * Whether the price can be used for new purchases
     */
    active?: boolean;
    /**
     * Describes how to compute the price per period. Either `per_unit` or `tiered`.
     * `per_unit` indicates that the fixed amount (specified in `unit_amount` or `unit_amount_decimal`)
     * will be charged per unit in `quantity`.
     * `tiered` indicates that the unit pricing will be computed using a tiering strategy.
     */
    billingScheme?: BillingScheme;
    /**
     * A brief description of the price, hidden from customers.
     */
    nickname?: string;
    /**
     * The recurring components of a price such as `interval` and `interval_count`.
     */
    recurring?: PriceRecurring;
    /**
     * Set of key-value pairs that you can attach to an object.
     */
    metadata?: Record<string, string>;
    /**
     * Specifies whether the price is considered inclusive of taxes or exclusive of taxes.
     * One of inclusive, exclusive, or unspecified.
     */
    taxBehavior?: TaxBehavior;
    /**
     * A lookup key to uniquely identify this price.
     * This key can be used to retrieve the price object without needing its ID.
     * It must be unique across all prices in your Stripe account, otherwise creation will fail.
     * If you want to transfer the lookup key from another price, set `transferLookupKey` to true
     */
    lookupKey?: string;
    /**
     * If set to true, will atomically transfer the lookup key from an existing price to this price.
     */
    transferLookupKey?: boolean;
    /**
     * API key to use (overrides environment variable)
     */
    apiKey?: Secret;
    /**
     * If true, adopt existing resource if creation fails due to conflict
     */
    adopt?: boolean;
    /**
     * Each element represents a pricing tier. This parameter requires `billingScheme` to be set to `tiered`.
     * An array of up to 250 tiers. Each tier has an upper bound and a price.
     */
    tiers?: PriceTier[];
    /**
     * Defines if the tiering price should be `graduated` or `volume` based.
     * In `volume`-based tiering, the maximum quantity within a period determines the per unit price.
     * In `graduated` tiering, pricing can change as the quantity grows.
     */
    tiersMode?: "graduated" | "volume" | undefined;
    /**
     * Apply a transformation to the reported usage or set quantity before computing the amount billed
     */
    transformQuantity?: {
        /**
         * Divide usage by this number
         */
        divideBy: number;
        /**
         * After dividing usage, either round the result `up` or `down`
         */
        round: "up" | "down";
    } | undefined;
}
/**
 * Output from the Stripe price
 */
export interface Price extends PriceProps {
    /**
     * The ID of the price
     */
    id: string;
    /**
     * Time at which the object was created
     */
    createdAt: number;
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
    /**
     * The type of the price - either 'one_time' or 'recurring'
     */
    type: Stripe.Price.Type;
    /**
     * The lookup key (if any) used by the customer to identify this price object
     */
    lookupKey?: string;
    /**
     * The pricing tiers (if using tiered billing scheme)
     */
    tiers?: PriceTier[];
    /**
     * The tiering mode (graduated or volume)
     */
    tiersMode?: "graduated" | "volume" | undefined;
    /**
     * Transform quantity configuration
     */
    transformQuantity?: {
        divideBy: number;
        round: "up" | "down";
    } | undefined;
}
/**
 * Create and manage Stripe prices for products
 *
 * @example
 * // Create a one-time fixed price for a product
 * const oneTimePrice = await Price("basic-license", {
 *   currency: "usd",
 *   unitAmount: 2999, // $29.99
 *   product: "prod_xyz"
 * });
 *
 * @example
 * // Create a recurring subscription price with fixed monthly billing
 * const subscriptionPrice = await Price("pro-monthly", {
 *   currency: "usd",
 *   unitAmount: 1499, // $14.99/month
 *   product: "prod_xyz",
 *   recurring: {
 *     interval: "month",
 *     usageType: "licensed"
 *   }
 * });
 *
 * @example
 * // Create a graduated tiered price with usage-based billing
 * const tieredPrice = await Price("api-usage", {
 *   currency: "usd",
 *   product: "prod_xyz",
 *   billingScheme: "tiered",
 *   tiersMode: "graduated",
 *   recurring: {
 *     interval: "month",
 *     usageType: "metered"
 *   },
 *   tiers: [
 *     {
 *       upTo: 10000,
 *       unitAmount: 0 // First 10k API calls free
 *     },
 *     {
 *       upTo: 50000,
 *       unitAmount: 2 // $0.02 per call up to 50k
 *     },
 *     {
 *       upTo: "inf",
 *       unitAmount: 1 // $0.01 per call beyond 50k
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a volume-based tiered price with overage cap
 * const volumePrice = await Price("storage", {
 *   currency: "usd",
 *   product: "prod_xyz",
 *   billingScheme: "tiered",
 *   tiersMode: "volume",
 *   recurring: {
 *     interval: "month"
 *   },
 *   tiers: [
 *     {
 *       upTo: 100,
 *       unitAmount: 500 // $5 per GB for up to 100GB
 *     },
 *     {
 *       upTo: 1000,
 *       unitAmount: 400 // $4 per GB for 101-1000GB
 *     },
 *     {
 *       upTo: "inf",
 *       flatAmount: 300000 // Cap at $3000 for unlimited storage
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a metered price with billing meter for API usage tracking
 * const meteredPrice = await Price("api-usage-price", {
 *   product: "prod_xyz",
 *   currency: "usd",
 *   billingScheme: "tiered",
 *   tiersMode: "graduated",
 *   recurring: {
 *     interval: "month",
 *     usageType: "metered",
 *     meter: "meter_123abc" // Associate with billing meter
 *   },
 *   tiers: [
 *     { upTo: 10000, unitAmountDecimal: "0" },
 *     { upTo: 25000, unitAmountDecimal: "0.002" },
 *     { upTo: "inf", flatAmountDecimal: "3000" }
 *   ]
 * });
 */
export declare const Price: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Price>, _id: string, props: PriceProps) => Promise<Price>);
export {};
//# sourceMappingURL=price.d.ts.map