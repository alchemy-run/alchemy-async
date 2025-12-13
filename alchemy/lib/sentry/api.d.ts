import type { Secret } from "../secret.ts";
/**
 * Options for Sentry API requests
 */
export interface SentryApiOptions {
    /**
     * Auth token to use (overrides environment variable)
     */
    authToken?: Secret;
}
/**
 * Minimal API client using raw fetch
 */
export declare class SentryApi {
    /** Base URL for API */
    readonly baseUrl: string;
    /** Auth token */
    readonly authToken: Secret;
    /**
     * Create a new API client
     *
     * @param options API options
     */
    constructor(options?: SentryApiOptions);
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
     * Helper for DELETE requests
     */
    delete(path: string, init?: RequestInit): Promise<Response>;
}
//# sourceMappingURL=api.d.ts.map