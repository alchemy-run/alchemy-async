/**
 * Custom error class for Upstash API errors
 */
export declare class UpstashError extends Error {
    /**
     * HTTP status code
     */
    statusCode: number;
    /**
     * Original response object
     */
    response: Response;
    /**
     * Create a new Upstash error
     *
     * @param message Error message
     * @param statusCode HTTP status code
     * @param response Original response object
     */
    constructor(message: string, statusCode: number, response: Response);
}
//# sourceMappingURL=error.d.ts.map