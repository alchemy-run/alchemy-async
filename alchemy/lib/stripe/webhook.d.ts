import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
export type EnabledEvent = Stripe.WebhookEndpointUpdateParams.EnabledEvent;
/**
 * Properties for creating a Stripe webhook endpoint
 */
export interface WebhookEndpointProps {
    /**
     * The URL of the webhook endpoint
     */
    url: string;
    /**
     * The list of events to enable for this endpoint
     */
    enabledEvents: EnabledEvent[];
    /**
     * Description of the webhook
     */
    description?: string;
    /**
     * Whether the webhook is active
     */
    active?: boolean;
    /**
     * The API version events are rendered as for this webhook
     */
    apiVersion?: string;
    /**
     * Whether to include mounted endpoint events automatically
     */
    connect?: boolean;
    /**
     * Webhook endpoint metadata
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
 * Output from the Stripe webhook endpoint
 */
export interface WebhookEndpoint extends WebhookEndpointProps {
    /**
     * The ID of the webhook
     */
    id: string;
    /**
     * The webhook endpoint's secret key, used to verify signatures on received events
     */
    secret: string;
    /**
     * The webhook endpoint's application
     */
    application?: string;
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
     * The status of the webhook
     */
    status: string;
}
/**
 * Create and manage Stripe webhook endpoints
 *
 * @example
 * // Create a basic webhook for payment events
 * const paymentWebhook = await WebhookEndpoint("payment-webhook", {
 *   url: "https://api.example.com/stripe/payments",
 *   enabledEvents: [
 *     "payment_intent.succeeded",
 *     "payment_intent.payment_failed"
 *   ],
 *   description: "Webhook for payment notifications"
 * });
 *
 * @example
 * // Create a webhook for subscription management
 * const subscriptionWebhook = await WebhookEndpoint("subscription-webhook", {
 *   url: "https://api.example.com/stripe/subscriptions",
 *   enabledEvents: [
 *     "customer.subscription.created",
 *     "customer.subscription.updated",
 *     "customer.subscription.deleted",
 *     "invoice.payment_succeeded",
 *     "invoice.payment_failed"
 *   ],
 *   description: "Webhook for subscription lifecycle events"
 * });
 *
 * @example
 * // Create a webhook for Connect platform events
 * const connectWebhook = await WebhookEndpoint("connect-webhook", {
 *   url: "https://api.example.com/stripe/connect",
 *   enabledEvents: [
 *     "account.updated",
 *     "account.application.deauthorized",
 *     "payout.created",
 *     "payout.failed"
 *   ],
 *   connect: true,
 *   metadata: {
 *     platform: "connect",
 *     environment: "production"
 *   }
 * });
 */
export declare const WebhookEndpoint: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<WebhookEndpoint>, _id: string, props: WebhookEndpointProps) => Promise<{
    id: string;
    url: string;
    enabledEvents: EnabledEvent[];
    description: string | undefined;
    active: boolean;
    apiVersion: string | undefined;
    metadata: Stripe.Metadata;
    secret: string;
    application: string | undefined;
    createdAt: number;
    livemode: boolean;
    updatedAt: number;
    status: string;
}>);
//# sourceMappingURL=webhook.d.ts.map