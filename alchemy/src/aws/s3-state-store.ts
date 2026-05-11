import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchBucket,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ResourceScope } from "../resource.ts";
import type { Scope } from "../scope.ts";
import { deserialize, serialize } from "../serde.ts";
import type { State, StateStore } from "../state.ts";
import { ignore } from "../util/ignore.ts";
import { retry } from "./retry.ts";

/**
 * Options for S3StateStore
 */
export interface S3StateStoreOptions {
  /**
   * The prefix to use for object keys in the S3 bucket
   * This allows multiple state stores to use the same S3 bucket
   */
  prefix?: string;

  /**
   * The S3 bucket name to use
   * Required - the bucket must already exist
   */
  bucketName?: string;

  /**
   * AWS region for the S3 client
   * If not provided, uses the default AWS region configuration
   */
  region?: string;
}

/**
 * State store implementation using AWS S3
 * Provides reliable, scalable state storage with eventual consistency
 */
export class S3StateStore implements StateStore {
  private client: S3Client;
  private prefix: string;
  private bucketName: string;
  private initialized = false;

  /**
   * Create a new S3StateStore
   *
   * @param scope The scope this store belongs to
   * @param options Options for the state store
   */
  constructor(
    public readonly scope: Scope,
    options: S3StateStoreOptions = {},
  ) {
    // Use the scope's chain to build the prefix, similar to how FileSystemStateStore builds its directory
    const scopePath = scope.chain.join("/");
    this.prefix = options.prefix
      ? `${options.prefix}${scopePath}/`
      : `alchemy/${scopePath}/`;

    this.bucketName = options.bucketName ?? "alchemy-state";

    this.client = new S3Client({
      region: options.region,
    });
  }

  /**
   * Initialize the S3 client and verify bucket access
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Verify bucket exists and is accessible
    try {
      await retry(() =>
        this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            MaxKeys: 1,
          }),
        ),
      );
    } catch (error: any) {
      if (error.name === NoSuchBucket.name) {
        throw new Error(
          `S3 bucket '${this.bucketName}' does not exist. Please create the bucket first.`,
        );
      }
      throw error;
    }

    this.initialized = true;
  }

  /**
   * S3 buckets cannot be deleted programmatically via this method
   */
  async deinit(): Promise<void> {
    // We don't delete the bucket here, only via explicit resource deletion
  }

  /**
   * List all resources in the state store
   */
  async list(): Promise<string[]> {
    await this.ensureInitialized();

    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
      const response = await retry(() =>
        this.client.send(
          new ListObjectsV2Command({
            Bucket: this.bucketName,
            Prefix: this.prefix,
            ContinuationToken: continuationToken,
          }),
        ),
      );

      if (response.Contents) {
        keys.push(
          ...response.Contents.map((obj) => {
            const key = obj.Key!.slice(this.prefix.length);
            return this.convertKeyFromStorage(key);
          }),
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

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
      const response = await retry(() =>
        this.client.send(
          new GetObjectCommand({
            Bucket: this.bucketName,
            Key: this.getObjectKey(key),
          }),
        ),
      );

      if (!response.Body) {
        return undefined;
      }

      // Read the stream into a string
      const content = await response.Body.transformToString();

      // Parse and deserialize the state data
      const state = (await deserialize(
        this.scope,
        JSON.parse(content),
      )) as State;

      // Create a new state object with proper output
      return {
        ...state,
        output: {
          ...(state.output || {}),
          [ResourceScope]: this.scope,
        },
      };
    } catch (error: any) {
      if (error.name === NoSuchKey.name) {
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

    // S3 doesn't have a batch get operation, so we need to make multiple requests
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
    const serializedData = JSON.stringify(
      await serialize(this.scope, value),
      null,
      2,
    );

    await retry(() =>
      this.client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: objectKey,
          Body: serializedData,
          ContentType: "application/json",
        }),
      ),
    );
  }

  /**
   * Delete a state by key
   *
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    await ignore(NoSuchKey.name, () =>
      retry(() =>
        this.client.send(
          new DeleteObjectCommand({
            Bucket: this.bucketName,
            Key: this.getObjectKey(key),
          }),
        ),
      ),
    );
  }

  /**
   * Convert key for storage by replacing slashes with colons
   * since S3 treats slashes as directory separators
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
   * @returns The key with prefix for use in the S3 bucket
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
