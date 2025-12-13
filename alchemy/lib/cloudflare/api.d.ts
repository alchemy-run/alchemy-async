import { type Credentials } from "../auth.ts";
import type { Secret } from "../secret.ts";
/**
 * Options for Cloudflare API requests
 */
export interface CloudflareApiOptions {
    /**
     * Base URL for Cloudflare API
     *
     * @default https://api.cloudflare.com/client/v4
     */
    baseUrl?: string;
    /**
     * The Alchemy profile to use for Cloudflare credentials. Defaults to:
     * - `process.env.CLOUDFLARE_PROFILE`
     * - `process.env.ALCHEMY_PROFILE`
     * - `"default"`
     *
     * If an API key or token is provided in these options or in the environment,
     * the profile will be ignored.
     */
    profile?: string;
    /**
     * API Key to use (overrides CLOUDFLARE_API_KEY env var)
     */
    apiKey?: Secret;
    /**
     * API Token to use (overrides CLOUDFLARE_API_TOKEN env var)
     */
    apiToken?: Secret;
    /**
     * Account ID to use (overrides CLOUDFLARE_ACCOUNT_ID env var)
     * If not provided, will be automatically retrieved from the Cloudflare API
     */
    accountId?: string;
    /**
     * Email to use with API Key authentication
     * If not provided, will attempt to discover from Cloudflare API
     */
    email?: string;
}
/**
 * Creates a CloudflareApi instance with automatic account ID discovery if not provided
 *
 * @param options API options
 * @returns Promise resolving to a CloudflareApi instance
 */
export declare const createCloudflareApi: (options?: CloudflareApiOptions | undefined) => Promise<CloudflareApi>;
/**
 * Cloudflare API client using raw fetch
 */
export declare class CloudflareApi {
    readonly baseUrl: string;
    readonly accountId: string;
    readonly credentials: Credentials;
    readonly profile: string | undefined;
    /**
     * Create a new Cloudflare API client
     * Use createCloudflareApi factory function instead of direct constructor
     * for automatic account ID discovery.
     *
     * @param options API options
     */
    constructor(options: {
        baseUrl?: string;
        accountId: string;
        credentials: Credentials;
        profile?: string;
    });
    /**
     * Make a fetch request to the Cloudflare API
     *
     * @param path API path (without base URL)
     * @param init Fetch init options
     * @returns Raw Response object from fetch
     */
    fetch(path: string, init?: RequestInit): Promise<Response>;
    /**
     * Helper for GET requests
     */
    get(path: string, init?: RequestInit): Promise<Response>;
    /**
     * Helper for HEAD requests
     */
    head(path: string, init?: RequestInit): Promise<Response>;
    /**
     * Helper for POST requests
     */
    post(path: string, body: any, init?: RequestInit): Promise<Response>;
    /**
     * Helper for PUT requests
     */
    put(path: string, body: any, init?: RequestInit): Promise<Response>;
    toBody(body: BodyInit): Promise<BodyInit>;
    /**
     * Helper for PATCH requests
     */
    patch(path: string, body: any, init?: RequestInit): Promise<Response>;
    /**
     * Helper for DELETE requests
     */
    delete(path: string, init?: RequestInit): Promise<Response>;
}
/**
 * Cloudflare scope extensions - adds Cloudflare credential support to scope options.
 * This uses TypeScript module augmentation to extend the ProviderCredentials interface.
 * Since ScopeOptions and RunOptions both extend ProviderCredentials,
 * they automatically inherit these properties.
 *
 * NOTE: These scope credentials are not currently being used by createCloudflareApi.
 * See TODO above in createCloudflareApi function for implementation needed.
 */
declare module "../scope.ts" {
    interface ProviderCredentials {
        /**
         * Cloudflare credentials configuration for this scope.
         * All Cloudflare resources created within this scope will inherit these credentials
         * unless overridden at the resource level.
         */
        cloudflare?: CloudflareApiOptions;
    }
}
//# sourceMappingURL=api.d.ts.map