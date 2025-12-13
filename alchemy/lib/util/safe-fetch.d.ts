export declare function safeFetch(url: string | URL | Request, options?: RequestInit, retries?: number): Promise<Response>;
/**
 * Fetch with exponential backoff retry logic for 404 responses, expecting 200 OK.
 * This is a convenience wrapper around fetchAndExpectStatus with expectedStatus=200.
 *
 * @param input URL or Request object
 * @param init RequestInit options
 * @param maxAttempts Maximum number of retry attempts (default: 10)
 * @param maxWaitTime Maximum total wait time in milliseconds (default: 30000)
 * @returns The successful Response
 */
export declare function fetchAndExpectOK(input: string | URL | Request, init?: RequestInit, maxAttempts?: number, maxWaitTime?: number): Promise<Response>;
/**
 * Fetch and expect a specific status code with retry logic.
 * Cloudflare's control plane is eventually consistent, so resources may
 * return 404 immediately after creation before becoming available.
 *
 * @param input URL or Request object
 * @param init RequestInit options
 * @param expectedStatus Expected HTTP status code (default: 200)
 * @param maxAttempts Maximum number of retry attempts (default: 10)
 * @param maxWaitTime Maximum total wait time in milliseconds (default: 30000)
 * @returns The successful Response
 */
export declare function fetchAndExpectStatus(input: string | URL | Request, init?: RequestInit, expectedStatus?: number, maxAttempts?: number, maxWaitTime?: number): Promise<Response>;
//# sourceMappingURL=safe-fetch.d.ts.map