/**
 * Timeout configuration interface
 */
export interface TimeoutConfig {
    maxAttempts: number;
    delayMs: number;
}
/**
 * Resource timeout error class
 */
export declare class ResourceTimeoutError extends Error {
    constructor(resourceType: string, resourceId: string, timeoutMs: number, operation: string);
}
/**
 * Validate timeout configuration
 */
export declare function validateTimeoutConfig(config: TimeoutConfig): void;
/**
 * Merge default timeout configuration with optional overrides
 */
export declare function mergeTimeoutConfig(defaultConfig: TimeoutConfig, override?: Partial<TimeoutConfig>): TimeoutConfig;
/**
 * Wait for a resource to reach a desired state with configurable timeout
 */
export declare function waitForResourceState<T>(checkFunction: () => Promise<T>, isReady: (result: T) => boolean, config: TimeoutConfig, resourceId: string, resourceType: string, operation?: string): Promise<void>;
/**
 * Generic function to wait for an operation to complete
 * This is the most flexible version that can handle any type of operation
 */
export declare function waitForOperation<T>(checkFunction: () => Promise<T>, isComplete: (result: T) => boolean, config: TimeoutConfig, resourceId: string, resourceType: string, operation?: string, onError?: (error: any, attempt: number, maxAttempts: number) => boolean): Promise<void>;
//# sourceMappingURL=timeout.d.ts.map