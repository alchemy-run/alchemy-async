import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a CustomDomain
 */
export interface CustomDomainProps extends CloudflareApiOptions {
    /**
     * The domain name to bind to the worker
     */
    name: string;
    /**
     * Cloudflare Zone ID for the domain
     *
     * @default - inferred from the domain name
     */
    zoneId?: string;
    /**
     * Name of the worker to bind to the domain
     */
    workerName: string;
    /**
     * Worker environment (defaults to production)
     * @default "production"
     */
    environment?: string;
    /**
     * If true, adopt an existing custom domain binding during creation.
     * If false and the domain already exists, creation will fail.
     * This only applies during the create phase.
     * @default false
     */
    adopt?: boolean;
    /**
     * If true, the custom domain will not be created, but will be retained if it already exists.
     * This is used for local development.
     *
     * @default `Scope.local`
     * @internal
     */
    dev?: boolean;
}
/**
 * Output returned after CustomDomain creation/update
 */
export interface CustomDomain extends CustomDomainProps {
    /**
     * The unique identifier for the Cloudflare domain binding.
     */
    id: string;
    /**
     * Time at which the domain binding was created (approximated if not returned by API)
     */
    createdAt: number;
    /**
     * Time at which the domain binding was last updated
     */
    updatedAt: number;
}
/**
 * Configure custom domain for a Cloudflare Worker using the Cloudflare Custom Domains API
 * This attaches a worker to a specific hostname within a zone.
 *
 * @example
 * // Bind a domain to a standard Cloudflare Worker
 * const apiWorker = await Worker("api", {
 *   name: "my-api-worker",
 *   entrypoint: "./src/api-worker.ts"
 * });
 *
 * const apiDomain = await CustomDomain("api-domain-binding", {
 *   name: "api.example.com",
 *   zoneId: "YOUR_ZONE_ID", // Replace with actual Zone ID
 *   workerName: apiWorker.name // Use the name from the Worker resource
 * });
 *
 * @example
 * // Adopt an existing domain binding during creation
 * const existingDomain = await CustomDomain("api-domain", {
 *   name: "api.example.com",
 *   zoneId: "YOUR_ZONE_ID",
 *   workerName: "my-api-worker",
 *   adopt: true  // If domain already exists, adopt it instead of failing
 * });
 *
 * @see https://developers.cloudflare.com/api/resources/workers/subresources/domains/
 */
export declare const CustomDomain: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<CustomDomain>, logicalId: string, props: CustomDomainProps) => Promise<CustomDomain>);
//# sourceMappingURL=custom-domain.d.ts.map