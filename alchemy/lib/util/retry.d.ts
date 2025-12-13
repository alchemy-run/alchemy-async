/**
 * Utility function for exponential backoff retry
 * Retries an operation with exponential backoff when a retryable error occurs
 *
 * @param operation The async operation to execute and potentially retry
 * @param isRetryable Function to determine if an error should trigger a retry
 * @param maxAttempts Maximum number of attempts before giving up
 * @param initialDelayMs Initial delay in milliseconds before first retry
 * @returns Result of the operation
 * @throws The last error encountered if all retries fail
 */
export declare function withExponentialBackoff<T>(operation: () => Promise<T>, isRetryable: (error: any) => any, maxAttempts?: number, initialDelayMs?: number, maxDelayMs?: number): Promise<T>;
//# sourceMappingURL=retry.d.ts.map