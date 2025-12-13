type AsyncReturnType<T> = T extends (...args: any[]) => Promise<infer R> ? R : T;
export declare function memoize<F extends (...args: any[]) => Promise<any>>(fn: F, keyFn?: (...args: Parameters<F>) => string): (...args: Parameters<F>) => Promise<AsyncReturnType<F>>;
/**
 * Single flight memoization.
 * Ensures only one instance of the function is executed at a time.
 * If another instance is already executing, returns the in-flight promise.
 */
export declare function singleFlight<F extends (...args: any[]) => Promise<any>>(fn: F, keyFn?: (...args: Parameters<F>) => string): (...args: Parameters<F>) => Promise<AsyncReturnType<F>>;
export declare function defaultKeyFn(...args: any[]): string;
export {};
//# sourceMappingURL=memoize.d.ts.map