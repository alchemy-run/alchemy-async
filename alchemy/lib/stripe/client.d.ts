import type Stripe from "stripe";
import type { Secret } from "../secret.ts";
export interface StripeClientOptions {
    apiKey?: Secret | string;
}
export declare function createStripeClient(options?: StripeClientOptions): Promise<Stripe>;
export declare function handleStripeDeleteError(error: any, resourceType: string, resourceId?: string): void;
export declare function isStripeConflictError(error: any): boolean;
//# sourceMappingURL=client.d.ts.map