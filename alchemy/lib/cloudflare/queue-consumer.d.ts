import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Queue } from "./queue.ts";
/**
 * Settings for configuring a Queue Consumer
 */
export interface QueueConsumerSettings {
    /**
     * Number of messages to deliver in a batch
     * @default 10
     */
    batchSize?: number;
    /**
     * Maximum number of concurrent consumer worker invocations
     * @default 2
     */
    maxConcurrency?: number;
    /**
     * Maximum number of retries for each message
     * @default 3
     */
    maxRetries?: number;
    /**
     * Maximum time in milliseconds to wait for batch to fill
     * @default 500
     */
    maxWaitTimeMs?: number;
    /**
     * Time in seconds to delay retry after a failure
     * @default 30
     */
    retryDelay?: number;
    /**
     * Dead letter queue for messages that exceed max retries
     * Can be either a queue name (string) or a Queue object
     */
    deadLetterQueue?: string | Queue;
}
/**
 * Properties for creating or updating a Queue Consumer
 */
export interface QueueConsumerProps extends CloudflareApiOptions {
    /**
     * The {@link Queue} or Queue ID to consume
     */
    queue: string | Queue;
    /**
     * Name of the worker script that will consume the queue
     */
    scriptName: string;
    /**
     * Settings for the consumer
     */
    settings?: QueueConsumerSettings;
    /**
     * Whether to delete the consumer.
     * If set to false, the consumer will remain but the resource will be removed from state
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to adopt an existing consumer.
     * If set to true, the consumer will be updated if it already exists.
     * @default false
     */
    adopt?: boolean;
    /**
     * If true, the queue consumer will not be created, but will be retained if it already exists.
     * This is used for local development.
     *
     * @default `false`
     * @internal
     */
    dev?: boolean;
}
/**
 * Output returned after Queue Consumer creation/update
 */
export interface QueueConsumer extends QueueConsumerProps {
    /**
     * Unique ID for the consumer
     */
    id: string;
    /**
     * Type identifier for Cloudflare Queue Consumer
     */
    type: "worker";
    /**
     * ID of the queue being consumed
     */
    queueId: string;
    /**
     * Time when the consumer was created
     */
    createdOn?: string;
}
/**
 * Creates a consumer for a Cloudflare Queue that processes messages using a Worker.
 *
 * @example
 * // Create a queue consumer with default settings
 * const queue = await Queue("notifications", {
 *   name: "notifications"
 * });
 *
 * const consumer = await QueueConsumer("notification-processor", {
 *   queue,
 *   scriptName: "notification-worker"
 * });
 *
 * @example
 * // Create a consumer with custom settings
 * const batchConsumer = await QueueConsumer("batch-processor", {
 *   queue,
 *   scriptName: "batch-worker",
 *   settings: {
 *     batchSize: 50,         // Process 50 messages at once
 *     maxConcurrency: 10,    // Allow 10 concurrent invocations
 *     maxRetries: 5,         // Retry failed messages up to 5 times
 *     maxWaitTimeMs: 2000,   // Wait up to 2 seconds to fill a batch
 *     retryDelay: 60         // Wait 60 seconds before retrying failed messages
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/queues/platform/consumers/
 */
export declare const QueueConsumer: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<QueueConsumer>, _id: string, props: QueueConsumerProps) => Promise<QueueConsumer>);
/**
 * Response from Cloudflare API for Queue Consumer operations
 */
interface CloudflareQueueConsumerResponse {
    result: {
        consumer_id: string;
        script_name: string;
        dead_letter_queue?: string;
        settings?: {
            batch_size?: number;
            max_concurrency?: number;
            max_retries?: number;
            max_wait_time_ms?: number;
            retry_delay?: number;
        };
        type: "worker";
        queue_id?: string;
        created_on?: string;
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Create a new Queue Consumer
 */
export declare function createQueueConsumer(api: CloudflareApi, queueId: string, props: QueueConsumerProps): Promise<CloudflareQueueConsumerResponse>;
/**
 * Delete a Queue Consumer
 */
export declare function deleteQueueConsumer(api: CloudflareApi, queueId: string, consumerId: string): Promise<void>;
export interface ListQueueConsumersResponse {
    id: string;
    scriptName: string;
    queueId: string;
    queueName: string;
    createdOn: string;
    settings?: QueueConsumerSettings;
}
/**
 * List all consumers for a queue
 */
export declare function listQueueConsumers(api: CloudflareApi, queueId: string): Promise<ListQueueConsumersResponse[]>;
export declare function findQueueConsumerId(api: CloudflareApi, workerName: string, queueId: string): Promise<string | undefined>;
export declare function listQueueConsumersForWorker(api: CloudflareApi, workerName: string): Promise<{
    queueName: string;
    queueId: string;
    consumerId: string;
    createdOn: string;
    settings: {
        deadLetterQueue: string | undefined;
        batch_size?: number;
        max_retries?: number;
        max_wait_time_ms?: number;
        retry_delay?: number;
    } | undefined;
}[]>;
export {};
//# sourceMappingURL=queue-consumer.d.ts.map