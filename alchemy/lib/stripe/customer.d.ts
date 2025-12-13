import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Customer address information
 */
export interface CustomerAddress {
    /**
     * City, district, suburb, town, or village
     */
    city?: string;
    /**
     * Two-letter country code (ISO 3166-1 alpha-2)
     */
    country?: string;
    /**
     * Address line 1 (e.g., street, PO Box, or company name)
     */
    line1?: string;
    /**
     * Address line 2 (e.g., apartment, suite, unit, or building)
     */
    line2?: string;
    /**
     * ZIP or postal code
     */
    postalCode?: string;
    /**
     * State, county, province, or region
     */
    state?: string;
}
/**
 * Customer shipping information
 */
export interface CustomerShipping {
    /**
     * Customer's shipping address
     */
    address?: CustomerAddress;
    /**
     * Customer name
     */
    name?: string;
    /**
     * Customer phone number
     */
    phone?: string;
}
/**
 * Customer invoice settings
 */
export interface CustomerInvoiceSettings {
    /**
     * Default custom fields to be displayed on invoices for this customer
     */
    customFields?: Array<{
        name: string;
        value: string;
    }>;
    /**
     * ID of a payment method that's attached to the customer, to be used as the customer's default payment method for subscriptions and invoices
     */
    defaultPaymentMethod?: string;
    /**
     * Default footer to be displayed on invoices for this customer
     */
    footer?: string;
    /**
     * Default options for invoice PDF rendering for this customer
     */
    renderingOptions?: {
        amountTaxDisplay?: Stripe.CustomerCreateParams.InvoiceSettings.RenderingOptions.AmountTaxDisplay;
    };
}
/**
 * Properties for creating a Stripe customer
 */
export interface CustomerProps {
    /**
     * The customer's address
     */
    address?: CustomerAddress;
    /**
     * An integer amount in cents that represents the customer's current balance
     */
    balance?: number;
    /**
     * An arbitrary string attached to the object
     */
    description?: string;
    /**
     * Customer's email address
     */
    email?: string;
    /**
     * The prefix for the customer used to generate unique invoice numbers
     */
    invoicePrefix?: string;
    /**
     * Default invoice settings for this customer
     */
    invoiceSettings?: CustomerInvoiceSettings;
    /**
     * Set of key-value pairs that you can attach to an object
     */
    metadata?: Record<string, string>;
    /**
     * The customer's full name or business name
     */
    name?: string;
    /**
     * The sequence to be used on the customer's next invoice
     */
    nextInvoiceSequence?: number;
    /**
     * The ID of the PaymentMethod to attach to the customer
     */
    paymentMethod?: string;
    /**
     * The customer's phone number
     */
    phone?: string;
    /**
     * Customer's preferred languages, ordered by preference
     */
    preferredLocales?: string[];
    /**
     * The customer's shipping information
     */
    shipping?: CustomerShipping;
    /**
     * When using a card as a source, you can pass the card information
     */
    source?: string;
    /**
     * The customer's tax exemption status
     */
    taxExempt?: Stripe.CustomerCreateParams.TaxExempt;
    /**
     * ID of the test clock to attach to the customer
     */
    testClock?: string;
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
 * Output from the Stripe customer
 */
export interface Customer extends CustomerProps {
    /**
     * The ID of the customer
     */
    id: string;
    /**
     * String representing the object's type
     */
    object: "customer";
    /**
     * Time at which the object was created
     */
    created: number;
    /**
     * Three-letter ISO code for the currency the customer can be charged in for recurring billing purposes
     */
    currency?: string;
    /**
     * ID of the default payment source for the customer
     */
    defaultSource?: string;
    /**
     * Whether or not the customer is currently delinquent
     */
    delinquent?: boolean;
    /**
     * Describes the current discount active on the customer, if there is one
     */
    discount?: any;
    /**
     * Has the value true if the object exists in live mode or the value false if the object exists in test mode
     */
    livemode: boolean;
    /**
     * The customer's payment sources, if any
     */
    sources?: any;
    /**
     * The customer's current subscriptions, if any
     */
    subscriptions?: any;
    /**
     * The customer's tax IDs, if any
     */
    taxIds?: any;
}
/**
 * Create and manage Stripe customers
 *
 * @example
 * // Create a basic customer
 * const basicCustomer = await Customer("basic-customer", {
 *   email: "john@example.com",
 *   name: "John Doe",
 *   description: "Premium customer",
 *   metadata: {
 *     tier: "premium",
 *     source: "website"
 *   }
 * });
 *
 * @example
 * // Create a customer with full address information
 * const customerWithAddress = await Customer("customer-with-address", {
 *   email: "jane@example.com",
 *   name: "Jane Smith",
 *   phone: "+1-555-123-4567",
 *   address: {
 *     line1: "123 Main St",
 *     line2: "Apt 4B",
 *     city: "San Francisco",
 *     state: "CA",
 *     postalCode: "94105",
 *     country: "US"
 *   },
 *   shipping: {
 *     name: "Jane Smith",
 *     address: {
 *       line1: "456 Oak Ave",
 *       city: "Oakland",
 *       state: "CA",
 *       postalCode: "94612",
 *       country: "US"
 *     }
 *   }
 * });
 *
 * @example
 * // Create a business customer with tax exemption
 * const businessCustomer = await Customer("business-customer", {
 *   email: "billing@acmecorp.com",
 *   name: "Acme Corporation",
 *   description: "Enterprise customer",
 *   taxExempt: "exempt",
 *   invoicePrefix: "ACME",
 *   preferredLocales: ["en"],
 *   metadata: {
 *     type: "business",
 *     industry: "technology",
 *     employees: "500+"
 *   }
 * });
 */
export declare const Customer: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Customer>, _id: string, props: CustomerProps) => Promise<Customer>);
//# sourceMappingURL=customer.d.ts.map