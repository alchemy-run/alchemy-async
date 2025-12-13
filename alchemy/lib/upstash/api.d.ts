import type { Secret } from "../secret.ts";
/**
 * Options for Upstash API requests
 */
export interface UpstashApiOptions {
    /**
     * API key to use (overrides environment variable)
     */
    apiKey?: Secret;
    /**
     * Email to use (overrides environment variable)
     */
    email?: string;
}
/**
 * Minimal API client using raw fetch
 */
export declare class UpstashApi {
    /** Base URL for API */
    readonly baseUrl: string;
    /** API key */
    readonly apiKey: string;
    /** Email */
    readonly email: string;
    /**
     * Create a new API client
     *
     * @param options API options
     */
    constructor(options?: UpstashApiOptions);
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
     * Helper for DELETE requests
     */
    delete(path: string, init?: RequestInit): Promise<Response>;
}
//# sourceMappingURL=api.d.ts.map