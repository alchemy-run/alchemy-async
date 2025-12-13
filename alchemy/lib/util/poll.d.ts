/**
 * Polls a function until it returns a result that satisfies the predicate.
 */
export declare function poll<T>(input: {
    /**
     * A description of the operation being polled.
     */
    description: string;
    /**
     * The function to poll.
     */
    fn: () => Promise<T>;
    /**
     * A predicate that determines if the operation has completed.
     */
    predicate: (result: T) => boolean;
    /**
     * The initial delay between polls.
     * @default 250ms
     */
    initialDelay?: number;
    /**
     * The maximum delay between polls.
     * @default 2_500ms (2.5 seconds)
     */
    maxDelay?: number;
    /**
     * The timeout for the poll in milliseconds.
     * @default 1_000_000 (~16 minutes)
     */
    timeout?: number;
}): Promise<T>;
//# sourceMappingURL=poll.d.ts.map