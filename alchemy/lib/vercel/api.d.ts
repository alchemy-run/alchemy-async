import type { Secret } from "../secret.ts";
/**
 * Options for Vercel API requests
 */
export interface VercelApiOptions {
    /**
     * Base URL for API
     */
    baseUrl: string;
    /**
     * API access token to use (overrides environment variable)
     */
    accessToken?: Secret;
}
/**
 * Creates a VercelApi instance with automatic token validation
 *
 * @param options API options
 * @returns Promise resolving to a VercelApi instance
 */
export declare function createVercelApi(options: VercelApiOptions): Promise<VercelApi>;
/**
 * Vercel API client using raw fetch
 */
export declare class VercelApi {
    /** Base URL for API */
    readonly baseUrl: string;
    /** API access token */
    readonly accessToken: Secret;
    /**
     * Create a new API client
     * Use createVercelApi factory function instead of direct constructor
     * for automatic token validation.
     *
     * @param options API options
     */
    constructor(options: VercelApiOptions & {
        accessToken: Secret;
    });
    /**
     * Make a request to the API
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
     * Helper for POST requests
     */
    post(path: string, body: any, init?: RequestInit): Promise<Response>;
    /**
     * Helper for PUT requests
     */
    put(path: string, body: any, init?: RequestInit): Promise<Response>;
    /**
     * Helper for PATCH requests
     */
    patch(path: string, body: any, init?: RequestInit): Promise<Response>;
    /**
     * Helper for DELETE requests
     */
    delete(path: string, init?: RequestInit): Promise<Response>;
}
//# sourceMappingURL=api.d.ts.map