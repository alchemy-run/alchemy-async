import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating a Stripe tax rate
 */
export interface TaxRateProps {
    /**
     * The display name of the tax rate, which will be shown to users
     */
    displayName: string;
    /**
     * This represents the tax rate percent out of 100
     */
    percentage: number;
    /**
     * This specifies if the tax rate is inclusive or exclusive
     */
    inclusive: boolean;
    /**
     * Flag determining whether the tax rate is active or inactive
     */
    active?: boolean;
    /**
     * Two-letter country code (ISO 3166-1 alpha-2)
     */
    country?: string;
    /**
     * An arbitrary string attached to the tax rate for your internal use only
     */
    description?: string;
    /**
     * The jurisdiction for the tax rate
     */
    jurisdiction?: string;
    /**
     * Set of key-value pairs that you can attach to an object
     */
    metadata?: Record<string, string>;
    /**
     * ISO 3166-2 subdivision code, without country prefix
     */
    state?: string;
    /**
     * The high-level tax type, such as vat or sales_tax
     */
    taxType?: Stripe.TaxRateCreateParams.TaxType;
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
 * Output from the Stripe tax rate
 */
export interface TaxRate extends TaxRateProps {
    /**
     * The ID of the tax rate
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "tax_rate";
    /**
     * Time at which the object was created
     */
    created: number;
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
}
/**
 * Create and manage Stripe tax rates
 *
 * @example
 * // Create a basic sales tax rate
 * const salesTax = await TaxRate("ca-sales-tax", {
 *   displayName: "CA Sales Tax",
 *   percentage: 8.5,
 *   inclusive: false,
 *   active: true,
 *   country: "US",
 *   state: "CA",
 *   description: "California sales tax",
 *   taxType: "sales_tax"
 * });
 *
 * @example
 * // Create a VAT tax rate
 * const vatTax = await TaxRate("uk-vat", {
 *   displayName: "UK VAT",
 *   percentage: 20.0,
 *   inclusive: true,
 *   active: true,
 *   country: "GB",
 *   description: "United Kingdom Value Added Tax",
 *   taxType: "vat",
 *   metadata: {
 *     region: "europe",
 *     tax_authority: "hmrc"
 *   }
 * });
 *
 * @example
 * // Create a city tax rate
 * const cityTax = await TaxRate("nyc-tax", {
 *   displayName: "NYC Local Tax",
 *   percentage: 4.5,
 *   inclusive: false,
 *   active: true,
 *   country: "US",
 *   state: "NY",
 *   jurisdiction: "New York City",
 *   description: "New York City local sales tax",
 *   taxType: "sales_tax",
 *   metadata: {
 *     locality: "nyc",
 *     tax_level: "city"
 *   }
 * });
 */
export declare const TaxRate: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<TaxRate>, _id: string, props: TaxRateProps) => Promise<TaxRate>);
//# sourceMappingURL=tax-rate.d.ts.map