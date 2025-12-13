import { type CloudflareApiOptions } from "../cloudflare/api.ts";
import type { Scope } from "../scope.ts";
import type { State, StateStore } from "../state.ts";
/**
 * Options for CloudflareR2StateStore
 */
export interface CloudflareR2StateStoreOptions extends CloudflareApiOptions {
    /**
     * The prefix to use for object keys in the R2 bucket
     * This allows multiple state stores to use the same R2 bucket
     */
    prefix?: string;
    /**
     * The R2 bucket name to use
     * Required - the bucket must already exist
     */
    bucketName?: string;
}
/**
 * State store implementation using Cloudflare R2 API
 * Uses R2 for immediate consistency compared to KV's eventual consistency
 *
 * @deprecated Use `CloudflareStateStore` from `alchemy/state` instead.
 */
export declare class R2RestStateStore implements StateStore {
    readonly scope: Scope;
    private readonly options;
    private api;
    private prefix;
    private bucketName;
    private initialized;
    /**
     * Create a new CloudflareR2StateStore
     *
     * @param scope The scope this store belongs to
     * @param options Options for the state store
     */
    constructor(scope: Scope, options?: CloudflareR2StateStoreOptions);
    /**
     * Initialize the R2 client
     */
    init(): Promise<void>;
    /**
     * R2 buckets cannot be deleted programmatically via this method
     */
    deinit(): Promise<void>;
    /**
     * List all resources in the state store
     */
    list(): Promise<string[]>;
    /**
     * Count the number of items in the state store
     */
    count(): Promise<number>;
    /**
     * Get a state by key
     *
     * @param key The key to look up
     * @returns The state or undefined if not found
     */
    get(key: string): Promise<State | undefined>;
    /**
     * Get multiple states by their keys
     *
     * @param ids Array of keys to fetch
     * @returns Record mapping keys to their states
     */
    getBatch(ids: string[]): Promise<Record<string, State>>;
    /**
     * Get all states in the store
     *
     * @returns Record mapping all keys to their states
     */
    all(): Promise<Record<string, State>>;
    /**
     * Set a state for a key
     *
     * @param key The key to set
     * @param value The state to store
     */
    set(key: string, value: State): Promise<void>;
    /**
     * Delete a state by key
     *
     * @param key The key to delete
     */
    delete(key: string): Promise<void>;
    /**
     * Convert key for storage by replacing slashes with colons
     * since R2 treats slashes as directory separators
     *
     * @param key The original key
     * @returns Key with slashes replaced by colons
     */
    private convertKeyForStorage;
    /**
     * Convert key from storage by replacing colons with slashes
     *
     * @param key The storage key
     * @returns Key with colons replaced by slashes
     */
    private convertKeyFromStorage;
    /**
     * Get the full object key for storage
     *
     * @param key The original key
     * @returns The key with prefix for use in the R2 bucket
     */
    private getObjectKey;
    /**
     * Ensure the store is initialized before operations
     */
    private ensureInitialized;
}
export declare function isRetryableError(error: any): boolean;
//# sourceMappingURL=r2-rest-state-store.d.ts.map