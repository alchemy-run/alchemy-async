/**
 * Interface for the return type of promiseWithResolvers
 */
export interface PromiseWithResolvers<T> {
    promise: Promise<T>;
    resolve: (value: T | PromiseLike<T>) => void;
    reject: (reason?: any) => void;
}
/**
 * Node 20+ compatible implementation of Promise.withResolvers()
 * Falls back to native Promise.withResolvers when available (Node 22+)
 */
export declare function promiseWithResolvers<T>(): PromiseWithResolvers<T>;
//# sourceMappingURL=promise-with-resolvers.d.ts.map