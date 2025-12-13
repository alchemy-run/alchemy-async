export declare class Lock {
    private path;
    constructor(key: string);
    /**
     * Acquires the lock.
     * @returns A function to release the lock, or null if the lock is already acquired.
     */
    acquire(): Promise<(() => Promise<void>) | null>;
    /**
     * Checks if the lock is active.
     * @returns True if the lock is active, false otherwise.
     */
    check(): Promise<boolean>;
    /**
     * Waits for the lock to be released.
     * @param interval The interval to wait between checks.
     */
    wait(interval?: number): Promise<void>;
}
//# sourceMappingURL=lock.d.ts.map