import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating a Stripe card
 */
export interface CardProps {
    /**
     * The ID of the customer to attach the card to
     */
    customer: string;
    /**
     * A token or source to attach to the customer
     */
    source?: string;
    /**
     * The card number, as a string without any separators
     */
    number?: string;
    /**
     * Two-digit number representing the card's expiration month
     */
    expMonth?: number;
    /**
     * Four-digit number representing the card's expiration year
     */
    expYear?: number;
    /**
     * Card security code
     */
    cvc?: string;
    /**
     * Cardholder's full name
     */
    name?: string;
    /**
     * City/District/Suburb/Town/Village
     */
    addressCity?: string;
    /**
     * Billing address country, if provided when creating card
     */
    addressCountry?: string;
    /**
     * Address line 1 (Street address/PO Box/Company name)
     */
    addressLine1?: string;
    /**
     * Address line 2 (Apartment/Suite/Unit/Building)
     */
    addressLine2?: string;
    /**
     * State/County/Province/Region
     */
    addressState?: string;
    /**
     * ZIP or postal code
     */
    addressZip?: string;
    /**
     * Required when adding a card to an account (not applicable to customers or recipients)
     */
    currency?: string;
    /**
     * Only applicable on accounts (not customers or recipients)
     */
    defaultForCurrency?: boolean;
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
 * Output from the Stripe card
 */
export interface Card extends CardProps {
    /**
     * The ID of the card
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "card";
    /**
     * Card brand (Visa, American Express, MasterCard, Discover, JCB, Diners Club, or Unknown)
     */
    brand: string;
    /**
     * Two-letter ISO code representing the country of the card
     */
    country?: string;
    /**
     * The last four digits of the device account number
     */
    dynamicLast4?: string;
    /**
     * Uniquely identifies this particular card number
     */
    fingerprint?: string;
    /**
     * Card funding type (credit, debit, prepaid, or unknown)
     */
    funding: string;
    /**
     * The last four digits of the card
     */
    last4: string;
    /**
     * If the card number is tokenized, this is the method that was used
     */
    tokenizationMethod?: string;
}
/**
 * Create and manage Stripe cards attached to customers
 *
 * @example
 * // Create a card using raw card details
 * const customerCard = await Card("customer-card", {
 *   customer: "cus_xyz123",
 *   number: "4242424242424242",
 *   expMonth: 12,
 *   expYear: 2025,
 *   cvc: "123",
 *   name: "John Doe",
 *   addressLine1: "123 Main St",
 *   addressCity: "San Francisco",
 *   addressState: "CA",
 *   addressZip: "94105",
 *   addressCountry: "US"
 * });
 *
 * @example
 * // Create a card using a token
 * const tokenCard = await Card("token-card", {
 *   customer: "cus_xyz123",
 *   source: "tok_visa",
 *   metadata: {
 *     type: "primary",
 *     source: "mobile_app"
 *   }
 * });
 *
 * @example
 * // Create a card for international customer
 * const internationalCard = await Card("international-card", {
 *   customer: "cus_international456",
 *   number: "4000000000000002",
 *   expMonth: 6,
 *   expYear: 2026,
 *   name: "Maria Garcia",
 *   addressLine1: "Calle Principal 123",
 *   addressCity: "Madrid",
 *   addressCountry: "ES",
 *   addressZip: "28001",
 *   metadata: {
 *     region: "europe",
 *     currency_preference: "eur"
 *   }
 * });
 */
export declare const Card: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Card>, _id: string, props: CardProps) => Promise<Card>);
//# sourceMappingURL=card.d.ts.map