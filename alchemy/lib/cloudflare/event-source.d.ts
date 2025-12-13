import type { QueueConsumerSettings } from "./queue-consumer.ts";
import type { Queue } from "./queue.ts";
/**
 * Base interface for event sources that can be bound to a Worker
 */
export type EventSource = QueueEventSource | Queue;
/**
 * Configuration for a Queue as an event source for a Worker
 */
export interface QueueEventSource {
    /**
     * The queue to consume messages from
     */
    readonly queue: Queue;
    /**
     * Optional settings for configuring how the Worker consumes the queue
     */
    readonly settings?: QueueConsumerSettings;
}
/**
 * Checks if an event source is a QueueEventSource
 * @param eventSource - The event source to check
 * @returns true if the event source is a QueueEventSource, false otherwise
 */
export declare function isQueueEventSource(eventSource: any): eventSource is QueueEventSource;
//# sourceMappingURL=event-source.d.ts.map