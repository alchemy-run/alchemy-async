import type { Context } from "../context.ts";
/**
 * Properties for creating or updating an SQS queue
 */
export interface QueueProps {
    /**
     * Name of the queue
     * For FIFO queues, the name must end with the .fifo suffix
     *
     * @default ${app}-${stage}-${id}?.fifo
     */
    queueName?: string;
    /**
     * Whether this is a FIFO queue.
     * If true, the queueName must end with .fifo suffix
     */
    fifo?: boolean;
    /**
     * The length of time (in seconds) that a message received from a queue will be invisible to other receiving components
     * Default: 30 seconds
     */
    visibilityTimeout?: number;
    /**
     * The length of time (in seconds) for which Amazon SQS retains a message
     * Default: 345600 seconds (4 days)
     */
    messageRetentionPeriod?: number;
    /**
     * The limit of how many bytes a message can contain before Amazon SQS rejects it
     * Default: 262144 bytes (256 KB)
     */
    maximumMessageSize?: number;
    /**
     * The time in seconds that the delivery of all messages in the queue will be delayed
     * Default: 0 seconds
     */
    delaySeconds?: number;
    /**
     * The length of time (in seconds) for which a ReceiveMessage action waits for a message to arrive
     * Default: 0 seconds
     */
    receiveMessageWaitTimeSeconds?: number;
    /**
     * Enables content-based deduplication for FIFO queues.
     * Only applicable when fifo is true.
     */
    contentBasedDeduplication?: boolean;
    /**
     * Specifies whether message deduplication occurs at the message group or queue level
     * Only applicable when fifo is true
     */
    deduplicationScope?: "messageGroup" | "queue";
    /**
     * Specifies whether the FIFO queue throughput quota applies to the entire queue or per message group
     * Only applicable when fifo is true
     */
    fifoThroughputLimit?: "perQueue" | "perMessageGroupId";
    /**
     * Resource tags for the queue
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after SQS queue creation/update
 */
export interface Queue extends QueueProps {
    /**
     * ARN of the queue
     */
    arn: string;
    /**
     * Name of the Queue
     */
    queueName: string;
    /**
     * URL of the queue
     */
    url: string;
}
/**
 * AWS SQS Queue Resource
 *
 * Creates and manages Amazon SQS queues with support for both standard and FIFO queues.
 * Handles queue creation, attribute configuration, and automatic cleanup of deleted queues.
 *
 * @example
 * // Create a standard queue with custom visibility timeout
 * const standardQueue = await Queue("my-queue", {
 *   queueName: "my-queue",
 *   visibilityTimeout: 30,
 *   tags: {
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a FIFO queue with content-based deduplication
 * const fifoQueue = await Queue("orders-queue", {
 *   queueName: "orders-queue.fifo",
 *   fifo: true,
 *   contentBasedDeduplication: true,
 *   visibilityTimeout: 30,
 *   tags: {
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a queue with custom message retention and size
 * const customQueue = await Queue("large-messages", {
 *   queueName: "large-messages",
 *   messageRetentionPeriod: 345600,  // 4 days
 *   maximumMessageSize: 262144,      // 256 KB
 *   visibilityTimeout: 60,
 *   delaySeconds: 5,
 *   receiveMessageWaitTimeSeconds: 20
 * });
 */
export declare const Queue: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Queue>, id: string, props: QueueProps) => Promise<Queue>);
//# sourceMappingURL=queue.d.ts.map