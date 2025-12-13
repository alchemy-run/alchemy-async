import { AwsClient } from "aws4fetch";
/**
 * Status of a Cloud Control API operation
 */
export type OperationStatus = "PENDING" | "IN_PROGRESS" | "SUCCESS" | "FAILED" | "CANCEL_IN_PROGRESS" | "CANCEL_COMPLETE";
/**
 * Progress event from a Cloud Control API operation
 */
export interface ProgressEvent {
    /**
     * Error code if the operation failed
     */
    ErrorCode?: string;
    /**
     * Time when the event occurred
     */
    EventTime?: number;
    /**
     * Token for hooks associated with the request
     */
    HooksRequestToken?: string;
    /**
     * Resource identifier
     */
    Identifier: string;
    /**
     * Operation being performed (CREATE, READ, UPDATE, DELETE)
     */
    Operation?: string;
    /**
     * Current status of the operation
     */
    OperationStatus: OperationStatus;
    /**
     * Token that identifies the request
     */
    RequestToken: string;
    /**
     * JSON string representation of the resource model
     */
    ResourceModel?: string;
    /**
     * Number of seconds to wait before retrying
     */
    RetryAfter?: number;
    /**
     * Status message providing details about the operation
     */
    StatusMessage: string;
    /**
     * Type name of the resource
     */
    TypeName?: string;
}
/**
 * Options for Cloud Control API requests
 */
export interface CloudControlOptions {
    /**
     * AWS region to use (defaults to us-east-1)
     */
    region?: string;
    /**
     * AWS access key ID (overrides environment variable)
     */
    accessKeyId?: string;
    /**
     * AWS secret access key (overrides environment variable)
     */
    secretAccessKey?: string;
    /**
     * AWS session token for temporary credentials
     */
    sessionToken?: string;
    /**
     * Initial delay in milliseconds between polling attempts
     */
    initialPollingDelay?: number;
    /**
     * Maximum delay in milliseconds between polling attempts
     */
    maxPollingDelay?: number;
    /**
     * Maximum number of retries for retryable errors
     */
    maxRetries?: number;
}
/**
 * Create a Cloud Control API client
 */
export declare function createCloudControlClient(options?: CloudControlOptions): Promise<CloudControlClient>;
export declare class CloudControlClient {
    private readonly client;
    private region;
    private initialPollingDelay;
    private maxPollingDelay;
    private maxRetries;
    constructor(client: AwsClient, options: CloudControlOptions);
    /**
     * Create a new resource
     */
    createResource(typeName: string, desiredState: Record<string, any>): Promise<ProgressEvent>;
    /**
     * Get a resource's current state
     */
    getResource(typeName: string, identifier: string): Promise<Record<string, any> | undefined>;
    /**
     * Update a resource
     */
    updateResource(typeName: string, identifier: string, patchDocument: Record<string, any>): Promise<ProgressEvent>;
    /**
     * Delete a resource
     */
    deleteResource(typeName: string, identifier: string): Promise<ProgressEvent>;
    /**
     * List resources of a given type
     */
    listResources(typeName: string, nextToken?: string): Promise<{
        ResourceDescriptions: Array<{
            Identifier: string;
            Properties: Record<string, any>;
        }>;
        NextToken?: string;
    }>;
    /**
     * Poll an operation until it completes
     */
    poll(requestToken: string, action?: "CreateResource" | "UpdateResource" | "DeleteResource"): Promise<ProgressEvent>;
    sync(action: "CreateResource" | "UpdateResource" | "DeleteResource", props?: any): Promise<ProgressEvent>;
    fetch<T>(action: string, params?: any, options?: {
        maxRetries?: number;
    }): Promise<T>;
}
//# sourceMappingURL=client.d.ts.map