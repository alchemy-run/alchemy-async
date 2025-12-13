import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
type ProductType = Stripe.Product.Type;
/**
 * Properties for creating a Stripe product
 */
export interface ProductProps {
    /**
     * The product's name
     */
    name: string;
    /**
     * The product's description
     */
    description?: string;
    /**
     * Whether the product is active
     */
    active?: boolean;
    /**
     * A list of up to 8 URLs of images for this product
     */
    images?: string[];
    /**
     * A URL of the product's thumbnail
     */
    url?: string;
    /**
     * Whether this product is shipped (physical goods)
     */
    shippable?: boolean;
    /**
     * Product type: good, service
     */
    type?: ProductType;
    /**
     * Unit label to use on invoices
     */
    unitLabel?: string;
    /**
     * A label for the product to be displayed on Checkout
     */
    statementDescriptor?: string;
    /**
     * Set of key-value pairs for this product
     */
    metadata?: Record<string, string>;
    /**
     * Default tax code for the product
     */
    taxCode?: string;
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
 * Output from the Stripe product
 */
export interface Product extends ProductProps {
    /**
     * The ID of the product
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
     * Time at which the object was last updated
     */
    updatedAt: number;
    /**
     * Whether this product can be used for Checkout/Payment Links
     */
    packageDimensions?: {
        height: number;
        length: number;
        weight: number;
        width: number;
    };
}
/**
 * Create and manage Stripe products
 *
 * @example
 * // Create a basic digital product
 * const digitalProduct = await Product("basic-software", {
 *   name: "Basic Software License",
 *   description: "Single-user license for basic software package",
 *   metadata: {
 *     type: "digital",
 *     features: "basic"
 *   }
 * });
 *
 * @example
 * // Create a physical product with shipping details
 * const physicalProduct = await Product("premium-hardware", {
 *   name: "Premium Hardware Kit",
 *   description: "Complete hardware kit with premium components",
 *   shippable: true,
 *   images: ["https://example.com/hardware-kit.jpg"],
 *   unitLabel: "kit",
 *   statementDescriptor: "PREMIUM HW KIT"
 * });
 *
 * @example
 * // Create a service product with tax code
 * const serviceProduct = await Product("consulting", {
 *   name: "Professional Consulting",
 *   description: "Expert consulting services",
 *   type: "service",
 *   taxCode: "txcd_10000000",
 *   metadata: {
 *     industry: "technology",
 *     expertise: "cloud"
 *   }
 * });
 */
export declare const Product: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Product>, _id: string, props: ProductProps) => Promise<Product>);
export {};
//# sourceMappingURL=product.d.ts.map