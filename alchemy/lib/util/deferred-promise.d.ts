export declare class DeferredPromise<T> {
    private promise;
    status: "pending" | "fulfilled" | "rejected";
    get value(): Promise<T>;
    resolve(value: T): void;
    reject(reason?: any): void;
}
//# sourceMappingURL=deferred-promise.d.ts.map