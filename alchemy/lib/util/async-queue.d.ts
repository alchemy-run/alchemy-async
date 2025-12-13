export declare class AsyncQueue {
    readonly concurrency: number;
    private queue;
    private running;
    constructor(concurrency?: number);
    /**
     * Add a task to the queue
     */
    add<T>(task: () => Promise<T>): Promise<T>;
    /**
     * Process the next task in the queue if we have capacity
     */
    private process;
    /**
     * Get the current queue size
     */
    get size(): number;
    /**
     * Get the number of currently running tasks
     */
    get pending(): number;
    /**
     * Check if the queue is idle (no running or queued tasks)
     */
    get idle(): boolean;
    /**
     * Wait for all current tasks to complete
     */
    onIdle(): Promise<void>;
    /**
     * Clear all queued tasks (doesn't affect running tasks)
     */
    clear(): void;
}
//# sourceMappingURL=async-queue.d.ts.map