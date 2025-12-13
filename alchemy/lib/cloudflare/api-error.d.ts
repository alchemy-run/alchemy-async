/**
 * Custom error class for Cloudflare API errors
 * Includes HTTP status information from the Response
 */
export declare class CloudflareApiError extends Error {
    /**
     * HTTP status code
     */
    status: number;
    /**
     * HTTP status text
     */
    statusText: string;
    /**
     * Raw error data from the API
     */
    errorData?: any;
    /**
     * Create a new CloudflareApiError
     */
    constructor(message: string, response: Response, errorData?: any);
}
export declare function handleApiError(response: Response, action: string, resourceType: string, resourceName?: string): Promise<never>;
//# sourceMappingURL=api-error.d.ts.map