import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { ResourceScope } from "../resource.ts";
import type { Scope } from "../scope.ts";
import { deserialize, serialize } from "../serde.ts";
import { Secret } from "../secret.ts";
import type { State, StateStore } from "../state.ts";
import { ignore } from "../util/ignore.ts";
import { withExponentialBackoff } from "../util/retry.ts";

/**
 * Hetzner Object Storage regions
 */
export type HetznerObjectStorageRegion = "fsn1" | "nbg1" | "hel1";

/**
 * Options for HetznerObjectStorageStateStore
 */
export interface HetznerObjectStorageStateStoreOptions {
  /**
   * The bucket name to use for storing state
   * Required - the bucket must already exist
   */
  bucket: string;

  /**
   * Hetzner Object Storage region
   */
  region: HetznerObjectStorageRegion;

  /**
   * Hetzner Object Storage access key ID
   * Overrides the HETZNER_ACCESS_KEY_ID environment variable
   */
  accessKeyId?: Secret<string>;

  /**
   * Hetzner Object Storage secret access key
   * Overrides the HETZNER_SECRET_ACCESS_KEY environment variable
   */
  secretAccessKey?: Secret<string>;

  /**
   * Key prefix in the bucket
   * Allows multiple state stores to share the same bucket
   */
  prefix?: string;
}

/**
 * State store backed by Hetzner Object Storage (S3-compatible).
 * Suitable for CI/CD pipelines and team deployments.
 *
 * @example
 * ```ts
 * const app = await alchemy("my-app", {
 *   stateStore: (scope) =>
 *     new HetznerObjectStorageStateStore(scope, {
 *       bucket: "my-alchemy-state",
 *       region: "fsn1",
 *       accessKeyId: alchemy.secret.env.HETZNER_ACCESS_KEY_ID,
 *       secretAccessKey: alchemy.secret.env.HETZNER_SECRET_ACCESS_KEY,
 *     }),
 * });
 * ```
 */
export class HetznerObjectStorageStateStore implements StateStore {
  private client: S3Client;
  private prefix: string;
  private bucketName: string;
  private initialized = false;

  constructor(
    public readonly scope: Scope,
    private readonly options: HetznerObjectStorageStateStoreOptions,
  ) {
    const scopePath = scope.chain.join("/");
    this.prefix = options.prefix
      ? `${options.prefix}${scopePath}/`
      : `alchemy/${scopePath}/`;

    this.bucketName = options.bucket;

    this.client = new S3Client({
      region: options.region,
      endpoint: `https://${options.region}.your-objectstorage.com`,
      credentials: {
        accessKeyId:
          Secret.unwrap(options.accessKeyId) ??
          process.env.HETZNER_ACCESS_KEY_ID!,
        secretAccessKey:
          Secret.unwrap(options.secretAccessKey) ??
          process.env.HETZNER_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    await retry(() =>
      this.client.send(
        new ListObjectsV2Command({
          Bucket: this.bucketName,
          MaxKeys: 1,
        }),
      ),
    );

    this.initialized = true;
  }

  async deinit(): Promise<void> {
    // Bucket lifecycle is managed externally
  }

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

  async count(): Promise<number> {
    const keys = await this.list();
    return keys.length;
  }

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

      const content = await response.Body.transformToString();
      const state = (await deserialize(
        this.scope,
        JSON.parse(content),
      )) as State;

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

  async getBatch(ids: string[]): Promise<Record<string, State>> {
    const result: Record<string, State> = {};

    await Promise.all(
      ids.map(async (id) => {
        const state = await this.get(id);
        if (state) {
          result[id] = state;
        }
      }),
    );

    return result;
  }

  async all(): Promise<Record<string, State>> {
    const keys = await this.list();
    return this.getBatch(keys);
  }

  async set(key: string, value: State): Promise<void> {
    await this.ensureInitialized();

    const objectKey = this.getObjectKey(key);
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

  private convertKeyForStorage(key: string): string {
    return key.replaceAll("/", ":");
  }

  private convertKeyFromStorage(key: string): string {
    return key.replaceAll(":", "/");
  }

  private getObjectKey(key: string): string {
    return `${this.prefix}${this.convertKeyForStorage(key)}`;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.init();
    }
  }
}

function isRetryableError(error: any): boolean {
  if (!error) return false;
  const code = error.name || error.code || "";
  const msg = error.message || "";
  return (
    code === "Throttling" ||
    code === "ThrottlingException" ||
    code === "TooManyRequestsException" ||
    msg.includes("throttling") ||
    msg.includes("Internal server error")
  );
}

function retry<T>(operation: () => Promise<T>): Promise<T> {
  return withExponentialBackoff(operation, isRetryableError, 10, 1000);
}
