import { CloudflareApiError, handleApiError } from "../cloudflare/api-error.ts";
import {
  type CloudflareApi,
  type CloudflareApiOptions,
  createCloudflareApi,
} from "../cloudflare/api.ts";
import { deleteObject, getObject, putObject } from "../cloudflare/bucket.ts";
import { ResourceScope } from "../resource.ts";
import type { Scope } from "../scope.ts";
import { deserialize, serialize } from "../serde.ts";
import type { State, StateStore } from "../state.ts";
import { withExponentialBackoff } from "../util/retry.ts";

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
export class R2RestStateStore implements StateStore {
  private api: CloudflareApi;
  private prefix: string;
  private bucketName: string;
  private initialized = false;

  /**
   * Create a new CloudflareR2StateStore
   *
   * @param scope The scope this store belongs to
   * @param options Options for the state store
   */
  constructor(
    public readonly scope: Scope,
    private readonly options: CloudflareR2StateStoreOptions = {},
  ) {
    // Use the scope's chain to build the prefix, similar to how FileSystemStateStore builds its directory
    const scopePath = scope.chain.join("/");
    this.prefix = options.prefix
      ? `${options.prefix}${scopePath}/`
      : `alchemy/${scopePath}/`;

    this.bucketName = options.bucketName ?? "alchemy-state";

    // We'll initialize the API in init() to allow for async creation
    this.api = null as any;
  }

  /**
   * Initialize the R2 client
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    const { createBucket, getBucket } = await import("../cloudflare/bucket.ts");

    // Create Cloudflare API client with automatic account discovery
    this.api = await createCloudflareApi(this.options);

    // Check if the alchemy state bucket exists
    try {
      await withExponentialBackoff(
        () => getBucket(this.api, this.bucketName),
        isRetryableError,
        5,
        1000,
      );
    } catch (error) {
      // If not, create the alchemy state bucket
      if (error instanceof CloudflareApiError && error.status === 404) {
        try {
          await withExponentialBackoff(
            () => createBucket(this.api, this.bucketName),
            isRetryableError,
            5,
            1000,
          );
        } catch (error) {
          // this can happen when the bucket is being created in parallel
          if (error instanceof CloudflareApiError && error.status === 409) {
            // Bucket already exists, continue
          } else {
            throw error;
          }
        }
      }
    }

    this.initialized = true;
  }

  /**
   * R2 buckets cannot be deleted programmatically via this method
   */
  async deinit(): Promise<void> {
    // We don't delete the bucket here, only via explicit resource deletion
  }

  /**
   * List all resources in the state store
   */
  async list(): Promise<string[]> {
    await this.ensureInitialized();

    // Using pagination to get all objects
    let keys: string[] = [];
    let cursor: string | null = null;

    do {
      const params = new URLSearchParams({
        prefix: this.prefix,
        limit: "1000",
        delimiter: "/",
      });

      if (cursor) {
        params.append("cursor", cursor);
      }

      const listPath = `/accounts/${this.api.accountId}/r2/buckets/${this.bucketName}/objects?${params.toString()}`;

      const response = await withExponentialBackoff(
        async () => {
          const response = await this.api.get(listPath);

          if (!response.ok) {
            await handleApiError(response, "list", "bucket", this.bucketName);
          }

          return response;
        },
        // Retry on transient errors
        isRetryableError,
        5, // 5 retry attempts
        1000, // Start with 1 second delay
      );

      const data = (await response.json()) as any;

      // The result structure may be under "result" key in Cloudflare's API
      const result = data.result || data;
      const objects = result.objects || result;

      // Add keys to our list, removing the prefix and converting from storage format
      keys = keys.concat(
        objects.map((obj: any) => {
          const keyName = obj.key || obj.name;
          return this.convertKeyFromStorage(keyName.slice(this.prefix.length));
        }),
      );

      // Update cursor for next page if available
      cursor =
        result.truncated || result.cursor_pagination
          ? result.cursor || null
          : null;
    } while (cursor);

    return keys;
  }

  /**
   * Count the number of items in the state store
   */
  async count(): Promise<number> {
    const keys = await this.list();
    return keys.length;
  }

  /**
   * Get a state by key
   *
   * @param key The key to look up
   * @returns The state or undefined if not found
   */
  async get(key: string): Promise<State | undefined> {
    await this.ensureInitialized();

    try {
      const response = await getObject(this.api, {
        bucketName: this.bucketName,
        key: this.getObjectKey(key),
      });

      if (response.status === 404) {
        return undefined;
      }

      // Parse and deserialize the state data
      const state = (await deserialize(
        this.scope,
        JSON.parse(await response.text()),
      )) as State;

      // Create a new state object with proper output
      return {
        ...state,
        output: {
          ...state.output,
          [ResourceScope]: this.scope,
        },
      };
    } catch (error: any) {
      if (error.message?.includes("404")) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Get multiple states by their keys
   *
   * @param ids Array of keys to fetch
   * @returns Record mapping keys to their states
   */
  async getBatch(ids: string[]): Promise<Record<string, State>> {
    const result: Record<string, State> = {};

    // R2 REST API doesn't have a batch get operation, so we need to make multiple requests
    const promises = ids.map(async (id) => {
      const state = await this.get(id);
      if (state) {
        result[id] = state;
      }
    });

    await Promise.all(promises);
    return result;
  }

  /**
   * Get all states in the store
   *
   * @returns Record mapping all keys to their states
   */
  async all(): Promise<Record<string, State>> {
    const keys = await this.list();
    return this.getBatch(keys);
  }

  /**
   * Set a state for a key
   *
   * @param key The key to set
   * @param value The state to store
   */
  async set(key: string, value: State): Promise<void> {
    await this.ensureInitialized();

    const objectKey = this.getObjectKey(key);

    // Serialize the state to handle cyclic structures
    const serializedData = await serialize(this.scope, value);

    await putObject(this.api, {
      bucketName: this.bucketName,
      key: objectKey,
      object: serializedData,
    });
  }

  /**
   * Delete a state by key
   *
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    await deleteObject(this.api, {
      bucketName: this.bucketName,
      key: this.getObjectKey(key),
    });
  }

  /**
   * Convert key for storage by replacing slashes with colons
   * since R2 treats slashes as directory separators
   *
   * @param key The original key
   * @returns Key with slashes replaced by colons
   */
  private convertKeyForStorage(key: string): string {
    return key.replaceAll("/", ":");
  }

  /**
   * Convert key from storage by replacing colons with slashes
   *
   * @param key The storage key
   * @returns Key with colons replaced by slashes
   */
  private convertKeyFromStorage(key: string): string {
    return key.replaceAll(":", "/");
  }

  /**
   * Get the full object key for storage
   *
   * @param key The original key
   * @returns The key with prefix for use in the R2 bucket
   */
  private getObjectKey(key: string): string {
    return `${this.prefix}${this.convertKeyForStorage(key)}`;
  }

  /**
   * Ensure the store is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}

export function isRetryableError(error: any): boolean {
  if (error instanceof CloudflareApiError) {
    return (
      error.status === 500 ||
      error.status === 502 ||
      error.status === 503 ||
      error.message.includes("timeout") ||
      error.message.includes("internal error")
    );
  }
  return false;
}
