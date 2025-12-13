import type { ProgressEvent } from "./client.ts";
/**
 * Error thrown by Cloud Control API operations
 */
export declare class CloudControlError extends Error {
    readonly message: string;
    readonly response?: Response | undefined;
    constructor(message: string, response?: Response | undefined);
}
export declare class NetworkError extends CloudControlError {
}
export declare class RequestError extends CloudControlError {
    readonly data: any;
    constructor(response: Response, data: any);
}
export declare class UpdateFailedError extends CloudControlError {
    readonly progressEvent: ProgressEvent;
    constructor(progressEvent: ProgressEvent);
}
export declare class AlreadyExistsError extends CloudControlError {
    readonly progressEvent: ProgressEvent;
    constructor(progressEvent: ProgressEvent);
}
export declare class NotFoundError extends CloudControlError {
    readonly progressEvent: ProgressEvent;
    constructor(progressEvent: ProgressEvent);
}
export declare class ResourceNotFoundException extends CloudControlError {
    readonly response: Response;
    constructor(response: Response);
}
export declare class TimeoutError extends CloudControlError {
}
/**
 * Rate limit exceeded error - should be retried with exponential backoff
 */
export declare class ThrottlingException extends CloudControlError {
    readonly response: Response;
    readonly data: any;
    constructor(response: Response, data: any);
}
/**
 * Model validation failed error - indicates invalid resource properties
 */
export declare class ValidationException extends CloudControlError {
    readonly response: Response;
    readonly data: any;
    constructor(response: Response, data: any);
}
/**
 * A previous Cloud Control API request is still running for the same
 * resource. These are transient and should be retried after a short delay.
 */
export declare class ConcurrentOperationError extends CloudControlError {
    readonly message: string;
    readonly requestToken: string;
    /**
     * The request token of the in-flight operation from the AWS error message.
     * (e.g. "Concurrent operation found … with RequestToken 1234…")
     */
    constructor(message: string, requestToken: string);
}
//# sourceMappingURL=error.d.ts.map