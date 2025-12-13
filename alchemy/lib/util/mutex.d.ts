/**
 * Simple async mutex that ensures only one async operation executes at a time
 */
export declare class AsyncMutex {
    private locked;
    private queue;
    lock<T>(operation: () => Promise<T>): Promise<T>;
}
//# sourceMappingURL=mutex.d.ts.map