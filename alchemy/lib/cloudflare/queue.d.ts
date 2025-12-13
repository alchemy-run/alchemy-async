import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Settings for a Cloudflare Queue
 */
export interface QueueSettings {
    /**
     * Delay in seconds before message delivery
     * Queue will not deliver messages until this time has elapsed
     */
    deliveryDelay?: number;
    /**
     * Whether delivery is paused
     * If true, the queue will not deliver messages to consumers
     */
    deliveryPaused?: boolean;
    /**
     * Period in seconds to retain messages
     * Messages will be automatically deleted after this time
     */
    messageRetentionPeriod?: number;
}
/**
 * Properties for creating or updating a Cloudflare Queue
 */
export interface QueueProps extends CloudflareApiOptions {
    /**
     * Name of the queue
     * Required during creation
     * Cannot be changed after creation
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Settings for the queue
     * These can be updated after queue creation
     */
    settings?: QueueSettings;
    /**
     * Dead letter queue for failed messages
     * Can be either a queue name (string) or a Queue object
     */
    dlq?: string | Queue;
    /**
     * Whether to delete the queue.
     * If set to false, the queue will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to adopt an existing queue with the same name if it exists
     * If true, during creation, if a queue with the same name exists, it will be adopted instead of creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to emulate the queue locally when Alchemy is running in watch mode.
     */
    dev?: {
        /**
         * Whether to run the queue remotely instead of locally
         * @default false
         */
        remote?: boolean;
        /**
         * Set when `Scope.local` is true to force update to the queue even if it was already deployed live.
         * @internal
         */
        force?: boolean;
    };
}
export declare function isQueue(eventSource: any): eventSource is Queue;
/**
 * Output returned after Cloudflare Queue creation/update
 */
export type Queue<Body = unknown> = Omit<QueueProps, "dev"> & {
    /**
     * Type identifier for Cloudflare Queue
     */
    type: "queue";
    /**
     * The unique ID of the queue
     */
    id: string;
    /**
     * The name of the queue
     */
    name: string;
    /**
     * Time when the queue was created
     */
    createdOn: string;
    /**
     * Modified timestamp
     */
    modifiedOn: string;
    /**
     * Phantom property to allow type inference
     */
    Body: Body;
    Batch: MessageBatch<Body>;
    /**
     * Development mode properties
     * @internal
     */
    dev: {
        /**
         * The ID of the queue in development mode
         */
        id: string;
        /**
         * Whether the queue is running remotely
         */
        remote: boolean;
    };
};
/**
 * Creates and manages Cloudflare Queues.
 *
 * Queues provide a managed queue system for reliable message delivery
 * between workers and other systems.
 *
 * @example
 * // Create a basic queue with default settings
 * const basicQueue = await Queue("my-app-queue", {
 *   name: "my-app-queue"
 * });
 *
 * @example
 * // Create a queue with custom settings
 * const customQueue = await Queue("delayed-queue", {
 *   name: "delayed-queue",
 *   settings: {
 *     deliveryDelay: 30, // 30 second delay before message delivery
 *     messageRetentionPeriod: 86400 // Store messages for 1 day
 *   }
 * });
 *
 * @example
 * // Create a paused queue for later activation
 * const pausedQueue = await Queue("paused-queue", {
 *   name: "paused-queue",
 *   settings: {
 *     deliveryPaused: true
 *   }
 * });
 *
 * @example
 * // Create a queue with a dead letter queue using string reference
 * const dlqQueue = await Queue("dlq-queue", {
 *   name: "dlq-queue"
 * });
 *
 * const mainQueue = await Queue("main-queue", {
 *   name: "main-queue",
 *   dlq: "dlq-queue"
 * });
 *
 * @example
 * // Create a queue with a dead letter queue using Queue object
 * const dlqQueue = await Queue("dlq-queue", {
 *   name: "dlq-queue"
 * });
 *
 * const mainQueue = await Queue("main-queue", {
 *   name: "main-queue",
 *   dlq: dlqQueue
 * });
 *
 * @example
 * // Create a queue and configure Worker consumer with custom settings
 * const processingQueue = await Queue("processing-queue", {
 *   name: "processing-queue"
 * });
 *
 * const processingWorker = await Worker("processor", {
 *   entrypoint: "./src/processor.ts",
 *   bindings: {
 *     QUEUE: processingQueue  // Producer: bind queue for sending messages
 *   },
 *   eventSources: [{  // Consumer: configure processing settings
 *     queue: processingQueue,
 *     settings: {
 *       batchSize: 25,           // Process 25 messages at once
 *       maxConcurrency: 5,       // Allow 5 concurrent invocations
 *       maxRetries: 3,           // Retry failed messages up to 3 times
 *       maxWaitTimeMs: 1500,     // Wait up to 1.5 seconds to fill a batch
 *       retryDelay: 45,          // Wait 45 seconds before retrying failed messages
 *       deadLetterQueue: "failed-processing" // Send failed messages to DLQ
 *     }
 *   }]
 * });
 *
 * @see https://developers.cloudflare.com/queues/
 */
export declare function Queue<T = unknown>(id: string, props?: QueueProps): Promise<Queue<T>>;
interface CloudflareQueueResponse {
    result: {
        queue_id?: string;
        queue_name: string;
        created_on?: string;
        modified_on?: string;
        settings?: {
            delivery_delay?: number;
            delivery_paused?: boolean;
            message_retention_period?: number;
        };
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Create a new Cloudflare Queue
 */
export declare function createQueue(api: CloudflareApi, queueName: string, props: QueueProps): Promise<CloudflareQueueResponse>;
/**
 * Get a Cloudflare Queue
 */
export declare function getQueue(api: CloudflareApi, queueId: string): Promise<CloudflareQueueResponse>;
/**
 * Delete a Cloudflare Queue
 */
export declare function deleteQueue(api: CloudflareApi, queueId: string): Promise<void>;
/**
 * Update a Cloudflare Queue
 *
 * Note: According to Cloudflare API, the queue name cannot be changed after creation.
 * Only the settings can be updated.
 */
export declare function updateQueue(api: CloudflareApi, queueId: string, props: QueueProps & {
    name: string;
}): Promise<CloudflareQueueResponse>;
export declare function listQueues(api: CloudflareApi): Promise<{
    name: string;
    id: string;
}[]>;
/**
 * Find a Cloudflare Queue by name
 */
export declare function findQueueByName(api: CloudflareApi, queueName: string): Promise<CloudflareQueueResponse | null>;
export {};
//# sourceMappingURL=queue.d.ts.map