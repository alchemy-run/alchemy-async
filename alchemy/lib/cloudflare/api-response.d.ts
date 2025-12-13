/**
 * Cloudflare API response format
 */
export interface CloudflareApiResponse<T> {
    /**
     * API response result
     */
    result: T;
    /**
     * Success status
     */
    success: boolean;
    /**
     * Error details if success is false
     */
    errors: CloudflareApiErrorPayload[];
    /**
     * Response messages
     */
    messages: string[];
    /**
     * Result information (typically for paginated results)
     */
    result_info?: {
        page: number;
        per_page: number;
        total_pages: number;
        count: number;
        total_count: number;
    };
}
/**
 * Cloudflare API list response format
 */
export interface CloudflareApiListResponse<T> extends CloudflareApiResponse<T[]> {
    /**
     * List of results
     */
    result: T[];
    /**
     * Pagination information (always present for list responses)
     */
    result_info: {
        page: number;
        per_page: number;
        total_pages: number;
        count: number;
        total_count: number;
    };
}
/**
 * Cloudflare API error format
 */
export interface CloudflareApiErrorPayload {
    /**
     * Error code
     */
    code: number;
    /**
     * Error message
     */
    message: string;
    /**
     * Error documentation URL
     */
    documentation_url?: string;
}
/**
 * Helper to extract and handle Cloudflare API errors
 *
 * @param response Fetch response object
 * @returns Formatted error message
 */
export declare function extractCloudflareError(response: Response): Promise<string>;
export declare function extractCloudflareResult<T>(label: string, promise: Promise<Response>): Promise<T>;
//# sourceMappingURL=api-response.d.ts.map