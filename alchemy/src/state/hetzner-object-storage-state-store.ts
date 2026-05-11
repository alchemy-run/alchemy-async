import { AwsClient } from "aws4fetch";
import { XMLParser } from "fast-xml-parser";
import { ResourceScope } from "../resource.ts";
import type { Scope } from "../scope.ts";
import { deserialize, serialize } from "../serde.ts";
import { Secret } from "../secret.ts";
import type { State, StateStore } from "../state.ts";
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
 * Uses `aws4fetch` (already bundled with Alchemy) to make signed S3 requests
 * directly to Hetzner's Object Storage endpoint — no peer dependencies required.
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
  private client: AwsClient;
  private endpoint: string;
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
    this.endpoint = `https://${options.region}.your-objectstorage.com`;

    const accessKeyId =
      Secret.unwrap(options.accessKeyId) ?? process.env.HETZNER_ACCESS_KEY_ID;
    const secretAccessKey =
      Secret.unwrap(options.secretAccessKey) ??
      process.env.HETZNER_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "Hetzner credentials missing. Set HETZNER_ACCESS_KEY_ID and HETZNER_SECRET_ACCESS_KEY environment variables or provide accessKeyId/secretAccessKey options.",
      );
    }

    this.client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: options.region,
    });
  }

  async init(): Promise<void> {
    if (this.initialized) return;

    // Verify bucket access by listing with MaxKeys=1
    await retry(() => this.listObjects({ maxKeys: 1 }));
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
      const page = await retry(() =>
        this.listObjects({
          prefix: this.prefix,
          continuationToken,
        }),
      );

      if (page.keys) {
        keys.push(
          ...page.keys.map((k) =>
            this.convertKeyFromStorage(k.slice(this.prefix.length)),
          ),
        );
      }
      continuationToken = page.nextToken;
    } while (continuationToken);

    return keys;
  }

  async count(): Promise<number> {
    const keys = await this.list();
    return keys.length;
  }

  async get(key: string): Promise<State | undefined> {
    await this.ensureInitialized();

    const url = `${this.endpoint}/${this.bucketName}/${this.getObjectKey(key)}`;
    const res = await retry(() => this.client.fetch(url, { method: "GET" }));

    if (res.status === 404) return undefined;
    if (!res.ok) {
      throw new Error(
        `Failed to get state key "${key}": ${res.status} ${res.statusText}`,
      );
    }

    const content = await res.text();
    const state = (await deserialize(this.scope, JSON.parse(content))) as State;

    return {
      ...state,
      output: {
        ...(state.output || {}),
        [ResourceScope]: this.scope,
      },
    };
  }

  async getBatch(ids: string[]): Promise<Record<string, State>> {
    const result: Record<string, State> = {};
    await Promise.all(
      ids.map(async (id) => {
        const state = await this.get(id);
        if (state) result[id] = state;
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

    const url = `${this.endpoint}/${this.bucketName}/${this.getObjectKey(key)}`;
    const body = JSON.stringify(await serialize(this.scope, value), null, 2);

    const res = await retry(() =>
      this.client.fetch(url, {
        method: "PUT",
        body,
        headers: { "Content-Type": "application/json" },
      }),
    );

    if (!res.ok) {
      throw new Error(
        `Failed to set state key "${key}": ${res.status} ${res.statusText}`,
      );
    }
  }

  async delete(key: string): Promise<void> {
    await this.ensureInitialized();

    const url = `${this.endpoint}/${this.bucketName}/${this.getObjectKey(key)}`;
    const res = await retry(() => this.client.fetch(url, { method: "DELETE" }));

    if (!res.ok && res.status !== 404) {
      throw new Error(
        `Failed to delete state key "${key}": ${res.status} ${res.statusText}`,
      );
    }
  }

  private async listObjects(opts: {
    prefix?: string;
    maxKeys?: number;
    continuationToken?: string;
  }): Promise<{ keys?: string[]; nextToken?: string }> {
    const params = new URLSearchParams({ "list-type": "2" });
    if (opts.prefix) params.set("prefix", opts.prefix);
    if (opts.maxKeys) params.set("max-keys", String(opts.maxKeys));
    if (opts.continuationToken)
      params.set("continuation-token", opts.continuationToken);

    const url = `${this.endpoint}/${this.bucketName}?${params}`;
    const res = await this.client.fetch(url, { method: "GET" });

    if (!res.ok) {
      throw new Error(
        `Failed to list objects: ${res.status} ${res.statusText}`,
      );
    }

    const xml = await res.text();
    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const result = parsed.ListBucketResult;

    if (!result) return {};

    const contents = result.Contents
      ? Array.isArray(result.Contents)
        ? result.Contents
        : [result.Contents]
      : [];

    return {
      keys: contents.map((c: any) => c.Key as string),
      nextToken: result.NextContinuationToken,
    };
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
