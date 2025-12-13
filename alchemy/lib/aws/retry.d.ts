/**
 * Retry function with standardized parameters for AWS throttling
 */
export declare function retry<T>(operation: () => Promise<T>, extraIsRetryableError?: (error: any) => boolean): Promise<T>;
//# sourceMappingURL=retry.d.ts.map