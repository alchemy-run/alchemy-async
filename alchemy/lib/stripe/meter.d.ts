import type Stripe from "stripe";
import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a Stripe Meter.
 * Note: Nested objects like defaultAggregation, customerMapping, valueSettings
 * use camelCase for keys here (e.g., eventPayloadKey), and the resource
 * implementation will map them to snake_case for Stripe API calls.
 */
export interface MeterProps {
    displayName: string;
    eventName: string;
    status?: "active" | "inactive";
    defaultAggregation: {
        formula: Stripe.Billing.MeterCreateParams.DefaultAggregation.Formula;
    };
    customerMapping: {
        eventPayloadKey: string;
        type: Stripe.Billing.MeterCreateParams.CustomerMapping["type"];
    };
    valueSettings: {
        eventPayloadKey: string;
    };
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
 * Output returned after Stripe Meter creation/update.
 */
export interface Meter {
    id: string;
    object: "billing.meter";
    displayName: string;
    eventName: string;
    defaultAggregation: {
        formula: Stripe.Billing.Meter.DefaultAggregation["formula"];
    };
    customerMapping: {
        eventPayloadKey: string;
        type: Stripe.Billing.Meter.CustomerMapping["type"];
    };
    valueSettings: {
        eventPayloadKey: string;
    };
    status: "active" | "inactive";
    createdAt: number;
    updatedAt: number;
    livemode: boolean;
    statusTransitions?: {
        deactivatedAt: number | null;
    };
}
/**
 * Manages Stripe Billing Meters. Meters allow you to define how usage of a product
 * is measured and aggregated for billing purposes. You can track events and their
 * values, and Stripe will calculate the usage based on the meter's configuration.
 *
 * Stripe Meters have several properties that are immutable after creation:
 * `displayName`, `eventName`, `defaultAggregation`, `customerMapping`, and
 * `valueSettings`. Attempting to update these will result in an error.
 * The `status` of a meter (active/inactive) can be updated.
 *
 * @example
 * // Create a new active meter to track API calls, summing the 'count' field from events.
 * const apiCallMeter = await Meter("apiUsageMeter", {
 *  displayName: "API Call Usage",
 *  eventName: "api.call.recorded", // The event name Stripe will listen for
 *  defaultAggregation: {
 *    formula: "sum" // Sum up the values of events
 *  },
 *  customerMapping: {
 *    eventPayloadKey: "customer_id", // Field in the event payload that identifies the Stripe Customer
 *    type: "by_id"
 *  },
 *  valueSettings: {
 *    eventPayloadKey: "count" // Field in the event payload that represents the value to aggregate
 *  }
 *  // status defaults to 'active' if not specified
 * });
 *
 * @example
 * // Create a new meter for data storage, initially inactive.
 * // This meter will take the last reported 'gb_used' value within a billing period.
 * const dataStorageMeterInactive = await Meter("dataStorageMeter", {
 *  displayName: "Data Storage GB",
 *  eventName: "data.storage.reported",
 *  status: "inactive", // Explicitly set to inactive
 *  defaultAggregation: {
 *    formula: "last_during_period"
 *  },
 *  customerMapping: {
 *    eventPayloadKey: "user_stripe_id",
 *    type: "by_id"
 *  },
 *  valueSettings: {
 *    eventPayloadKey: "gb_used"
 *  }
 * });
 *
 * @example
 * // (Scenario: Assuming 'dataStorageMeterInactive' from the previous example was created
 * // and its ID is available, e.g., via `dataStorageMeterInactive.id`) *
 * // If dataStorageMeterInactive was previously defined and we want to activate it:
 * const activatedStorageMeter = await Meter("dataStorageMeter", { // Same logicalId
 *  displayName: "Data Storage GB", // Immutable, must match existing
 *  eventName: "data.storage.reported", // Immutable, must match existing
 *  status: "active", // Update: change status to active
 *  defaultAggregation: { // Immutable, must match existing
 *    formula: "last_during_period"
 *  },
 *  customerMapping: { // Immutable, must match existing
 *    eventPayloadKey: "user_stripe_id",
 *    type: "by_id"
 *  },
 *  valueSettings: { // Immutable, must match existing
 *    eventPayloadKey: "gb_used"
 *  }
 * });
 *
 * @example
 * // To deactivate an existing active meter (e.g. 'apiCallMeter' from first example):
 * const deactivatedApiMeter = await Meter("apiUsageMeter", { // Same logicalId
 *  displayName: "API Call Usage", // Immutable, must match existing
 *  eventName: "api.call.recorded", // Immutable, must match existing
 *  status: "inactive", // Update: change status to inactive
 *  defaultAggregation: { // Immutable, must match existing
 *    formula: "sum"
 *  },
 *  customerMapping: { // Immutable, must match existing
 *    eventPayloadKey: "customer_id",
 *    type: "by_id"
 *  },
 *  valueSettings: { // Immutable, must match existing
 *    eventPayloadKey: "count"
 *  }
 * });
 */
export declare const Meter: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Meter>, _logicalId: string, props: MeterProps) => Promise<Meter>);
//# sourceMappingURL=meter.d.ts.map