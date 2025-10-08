import type { R2PutOptions } from "@cloudflare/workers-types/experimental/index.ts";
import * as mf from "miniflare";
import { isDeepStrictEqual } from "node:util";
import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { streamToBuffer } from "../serde.ts";
import { isRetryableError } from "../state/r2-rest-state-store.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  extractCloudflareResult,
  type CloudflareApiErrorPayload,
} from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { deleteMiniflareBinding } from "./miniflare/delete.ts";
import { getDefaultPersistPath } from "./miniflare/paths.ts";

export type R2BucketJurisdiction = "default" | "eu" | "fedramp";

/**
 * Properties for creating or updating an R2 Bucket
 */
export interface BucketProps extends CloudflareApiOptions {
  /**
   * Name of the bucket
   * Names can only contain lowercase letters (a-z), numbers (0-9), and hyphens (-)
   * Cannot begin or end with a hyphen
   *
   * @default ${app.name}-${app.stage}-${id}
   */
  name?: string;

  /**
   * Optional location hint for the bucket
   * Indicates the primary geographical location data will be accessed from
   */
  locationHint?: string;

  /**
   * Optional storage class for the bucket
   * Indicates the storage class for the bucket
   */
  storageClass?: "Standard" | "InfrequentAccess";

  /**
   * Optional jurisdiction for the bucket
   * Determines the regulatory jurisdiction the bucket data falls under
   */
  jurisdiction?: R2BucketJurisdiction;

  /**
   * Whether to allow public access through the r2.dev subdomain
   * Only for development purposes - use custom domains for production
   */
  allowPublicAccess?: boolean;

  /**
   * Whether to delete the bucket.
   * If set to false, the bucket will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to empty the bucket and delete all objects during resource deletion
   * @default false
   */
  empty?: boolean;

  /**
   * Whether to adopt an existing bucket
   */
  adopt?: boolean;

  /**
   * CORS rules for the bucket
   */
  cors?: R2BucketCORSRule[];

  /**
   * Lifecycle rules for the bucket
   */
  lifecycle?: R2BucketLifecycleRule[];

  /**
   * Lock rules for the bucket
   */
  lock?: R2BucketLockRule[];

  /**
   * Enable data catalog for bucket
   */
  dataCatalog?: boolean;

  /**
   * Whether to emulate the bucket locally when Alchemy is running in watch mode.
   */
  dev?: {
    /**
     * Whether to run the bucket remotely instead of locally
     * @default false
     */
    remote?: boolean;

    /**
     * Set when `Scope.local` is true to force update to the bucket even if it was already deployed live.
     * @internal
     */
    force?: boolean;
  };
}

interface R2BucketLifecycleRule {
  /**
   * Unique identifier for this rule.
   */
  id?: string;

  /**
   * Conditions that apply to all transitions of this rule.
   */
  conditions?: {
    /**
     * Transitions will only apply to objects/uploads in the bucket that start with the given prefix, an empty prefix can be provided to scope rule to all objects/uploads.
     */
    prefix: string;
  };

  /**
   * Whether or not this rule is in effect.
   * @default true
   */
  enabled?: boolean;

  /**
   * Transition to abort ongoing multipart uploads.
   */
  abortMultipartUploadsTransition?: {
    /**
     * Condition for lifecycle transitions to apply after an object reaches an age in   seconds.
     */
    condition: {
      /**
       
      /**
       * Maximum age of the object in seconds.
       */
      maxAge: number;

      /**
       * Type of condition.
       */
      type: "Age";
    };
  };

  /**
   * Transition to delete objects.
   */
  deleteObjectsTransition?: {
    /**
     * Condition for lifecycle transitions to apply after an object reaches an age in seconds.
     */
    condition: { maxAge: number; type: "Age" } | { date: string; type: "Date" };
  };

  /**
   * Transition to change the storage class of objects.
   */
  storageClassTransitions?: {
    /**
     * Condition for lifecycle transitions to apply after an object reaches an age in seconds.
     */
    condition: { maxAge: number; type: "Age" } | { date: string; type: "Date" };

    /**
     * Storage class for the bucket.
     */
    storageClass: "InfrequentAccess";
  }[];
}

interface R2BucketLockRule {
  /**
   * Unique identifier for this rule.
   */
  id?: string;

  /**
   * Condition to apply a lock rule to an object for how long in seconds.
   */
  condition:
    | { maxAgeSeconds: number; type: "Age" }
    | { date: string; type: "Date" }
    | { type: "Indefinite" };

  /**
   * Whether or not this rule is in effect.
   * @default true
   */
  enabled?: boolean;

  /**
   * Rule will only apply to objects/uploads in the bucket that start with the given prefix, an empty prefix can be provided to scope rule to all objects/uploads.
   */
  prefix?: string;
}

interface R2BucketCORSRule {
  /**
   * Identifier for this rule.
   */
  id?: string;

  /**
   * Object specifying allowed origins, methods and headers for this CORS rule.
   */
  allowed: {
    /**
     * Specifies the value for the Access-Control-Allow-Methods header R2 sets when requesting objects in a bucket from a browser.
     */
    methods: ("GET" | "PUT" | "POST" | "DELETE" | "HEAD")[];

    /**
     * Specifies the value for the Access-Control-Allow-Origin header R2 sets when requesting objects in a bucket from a browser.
     */
    origins: string[];

    /**
     * Specifies the value for the Access-Control-Allow-Headers header R2 sets when requesting objects in this bucket from a browser. Cross-origin requests that include custom headers (e.g. x-user-id) should specify these headers as AllowedHeaders.
     */
    headers?: string[];
  };

  /**
   * Specifies the headers that can be exposed back, and accessed by, the JavaScript making the cross-origin request. If you need to access headers beyond the safelisted response headers, such as Content-Encoding or cf-cache-status, you must specify it here.
   */
  exposeHeaders?: string[];

  /**
   * Specifies the amount of time (in seconds) browsers are allowed to cache CORS preflight responses. Browsers may limit this to 2 hours or less, even if the maximum value (86400) is specified.
   */
  maxAgeSeconds?: number;
}

export type R2ObjectMetadata = {
  key: string;
  etag: string;
  uploaded: Date;
  size: number;
  httpMetadata?: R2HTTPMetadata;
};

export type R2ObjectContent = R2ObjectMetadata & {
  arrayBuffer(): Promise<ArrayBuffer>;
  bytes(): Promise<Uint8Array>;
  text(): Promise<string>;
  json<T>(): Promise<T>;
  blob(): Promise<Blob>;
};

export type PutR2ObjectResponse = {
  key: string;
  etag: string;
  uploaded: Date;
  version: string;
  size: number;
};

export type R2Objects = {
  objects: Omit<R2ObjectMetadata, "httpMetadata">[];
} & (
  | {
      truncated: true;
      cursor: string;
    }
  | {
      truncated: false;
      cursor?: never;
    }
);

export type R2Bucket = _R2Bucket & {
  head(key: string): Promise<R2ObjectMetadata | null>;
  get(key: string): Promise<R2ObjectContent | null>;
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: Pick<R2PutOptions, "httpMetadata">,
  ): Promise<PutR2ObjectResponse>;
  delete(key: string): Promise<Response>;
  list(options?: R2ListOptions): Promise<R2Objects>;
};

/**
 * Output returned after R2 Bucket creation/update
 */
type _R2Bucket = Omit<BucketProps, "delete" | "dev"> & {
  /**
   * Resource type identifier
   */
  type: "r2_bucket";

  /**
   * The name of the bucket
   */
  name: string;

  /**
   * Location of the bucket
   */
  location: string;

  /**
   * Time at which the bucket was created
   */
  creationDate: Date;

  /**
   * The `r2.dev` subdomain for the bucket, if `allowPublicAccess` is true
   */
  domain: string | undefined;

  /**
   * Development mode properties
   * @internal
   */
  dev: {
    /**
     * The ID of the bucket in development mode
     */
    id: string;

    /**
     * Whether the bucket is running remotely
     */
    remote: boolean;
  };

  /**
   * Data catalog for the bucket
   */
  catalog?: {
    /**
     * ID of the data catalog
     */
    id: string;
    /**
     * Name of the data catalog
     */
    name: string;
    /**
     * Host of the data catalog
     */
    host: string;
  };
};

export function isBucket(resource: any): resource is R2Bucket {
  return resource?.[ResourceKind] === "cloudflare::R2Bucket";
}

/**
 * Creates and manages Cloudflare R2 Buckets for object storage.
 *
 * R2 Buckets provide S3-compatible object storage with automatic data replication
 * across multiple regions for high availability and durability.
 *
 * @example
 * // Create a basic R2 bucket with default settings
 * const basicBucket = await R2Bucket("my-app-data", {
 *   name: "my-app-data"
 * });
 *
 * @example
 * // Create a bucket with location hint for optimal performance
 * const euBucket = await R2Bucket("eu-user-data", {
 *   name: "eu-user-data",
 *   locationHint: "eu",
 *   jurisdiction: "eu"
 * });
 *
 * @example
 * // Create a development bucket with public access enabled
 * const publicBucket = await R2Bucket("public-assets", {
 *   name: "public-assets",
 *   allowPublicAccess: true
 * });
 *
 * @example
 * // Create a FedRAMP compliant bucket for government workloads
 * const fedRampBucket = await R2Bucket("gov-data", {
 *   name: "gov-data",
 *   jurisdiction: "fedramp"
 * });
 *
 * @example
 * // Create a bucket that will be automatically emptied when deleted
 * // This will delete all objects in the bucket before deleting the bucket itself
 * const temporaryBucket = await R2Bucket("temp-storage", {
 *   name: "temp-storage",
 *   empty: true  // All objects will be deleted when this resource is destroyed
 * });
 *
 * @see https://developers.cloudflare.com/r2/buckets/
 */
export async function R2Bucket(
  id: string,
  props: BucketProps = {},
): Promise<R2Bucket> {
  const scope = Scope.current;
  const isLocal = scope.local && props.dev?.remote !== true;
  const api = await createCloudflareApi(props);
  const bucket = await _R2Bucket(id, {
    ...props,
    dev: {
      ...(props.dev ?? {}),
      force: Scope.current.local,
    },
  });

  let _miniflare: mf.Miniflare | undefined;
  const miniflare = () => {
    if (_miniflare) {
      return _miniflare;
    }
    _miniflare = new mf.Miniflare({
      script: "",
      modules: true,
      defaultPersistRoot: getDefaultPersistPath(scope.rootDir),
      r2Buckets: [bucket.dev.id],
      log: process.env.DEBUG ? new mf.Log(mf.LogLevel.DEBUG) : undefined,
    });
    scope.onCleanup(async () => _miniflare?.dispose());
    return _miniflare;
  };
  const localBucket = () => miniflare().getR2Bucket(bucket.dev.id);

  return {
    ...bucket,
    head: async (key: string) => {
      if (isLocal) {
        const result = await (await localBucket()).head(key);
        if (result) {
          return {
            key: result.key,
            etag: result.etag,
            uploaded: result.uploaded,
            size: result.size,
            httpMetadata: result.httpMetadata,
          } as R2ObjectMetadata;
        }
        return null;
      }
      return headObject(api, {
        bucketName: bucket.name,
        key,
      });
    },
    get: async (key: string) => {
      if (isLocal) {
        const result = await (await localBucket()).get(key);
        if (result) {
          // cast because workers vs node built-ins
          return result as unknown as R2ObjectContent;
        }
        return null;
      }
      const response = await getObject(api, {
        bucketName: bucket.name,
        key,
      });
      if (response.ok) {
        return parseR2Object(key, response);
      } else if (response.status === 404) {
        return null;
      } else {
        throw await handleApiError(response, "get", "object", key);
      }
    },
    list: async (options?: R2ListOptions): Promise<R2Objects> => {
      if (isLocal) {
        return (await localBucket()).list(options);
      }
      return listObjects(api, bucket.name, {
        ...options,
        jurisdiction: bucket.jurisdiction,
      });
    },
    put: async (
      key: string,
      value: PutObjectObject,
      options?: Pick<R2PutOptions, "httpMetadata">,
    ): Promise<PutR2ObjectResponse> => {
      if (isLocal) {
        return await (await localBucket()).put(
          key,
          typeof value === "string"
            ? value
            : Buffer.isBuffer(value) ||
                value instanceof Uint8Array ||
                value instanceof ArrayBuffer
              ? new Uint8Array(value)
              : value instanceof Blob
                ? new Uint8Array(await value.arrayBuffer())
                : value instanceof ReadableStream
                  ? new Uint8Array(await streamToBuffer(value))
                  : value,
          options,
        );
      }
      const response = await putObject(api, {
        bucketName: bucket.name,
        key: key,
        object: value,
        options: options,
      });
      const body = (await response.json()) as {
        result: {
          key: string;
          etag: string;
          uploaded: string;
          version: string;
          size: string;
        };
      };
      return {
        key: body.result.key,
        etag: body.result.etag,
        uploaded: new Date(body.result.uploaded),
        version: body.result.version,
        size: Number(body.result.size),
      };
    },
    delete: async (key: string) => {
      if (isLocal) {
        await (await localBucket()).delete(key);
      }
      return deleteObject(api, {
        bucketName: bucket.name,
        key: key,
      });
    },
  };
}

const parseR2Object = (key: string, response: Response): R2ObjectContent => ({
  etag: response.headers.get("ETag")!,
  uploaded: parseDate(response.headers),
  key,
  size: Number(response.headers.get("Content-Length")),
  httpMetadata: mapHeadersToHttpMetadata(response.headers),
  arrayBuffer: () => response.arrayBuffer(),
  bytes: () => response.bytes(),
  text: () => response.text(),
  json: () => response.json(),
  blob: () => response.blob(),
});

const parseDate = (headers: Headers) =>
  new Date(headers.get("Last-Modified") ?? headers.get("Date")!);

const _R2Bucket = Resource(
  "cloudflare::R2Bucket",
  async function (
    this: Context<_R2Bucket>,
    id: string,
    props: BucketProps = {},
  ): Promise<_R2Bucket> {
    const bucketName =
      props.name ?? (this.output?.name || this.scope.createPhysicalName(id));

    if (this.phase === "update" && this.output?.name !== bucketName) {
      this.replace();
    }

    const allowPublicAccess = props.allowPublicAccess === true;
    const dev = {
      id: this.output?.dev?.id ?? bucketName,
      remote: props.dev?.remote ?? false,
    };
    const adopt = props.adopt ?? this.scope.adopt;

    if (this.scope.local && !props.dev?.remote) {
      return {
        name: bucketName,
        location: this.output?.location ?? "",
        creationDate: this.output?.creationDate ?? new Date(),
        jurisdiction: this.output?.jurisdiction ?? "default",
        allowPublicAccess,
        domain: this.output?.domain,
        type: "r2_bucket",
        accountId: this.output?.accountId ?? "",
        cors: props.cors,
        dev,
      };
    }

    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      if (props.delete !== false) {
        if (this.output?.catalog) {
          await disableDataCatalog(api, bucketName);
        }
        if (this.output.dev?.id) {
          await deleteMiniflareBinding(this.scope, "r2", this.output.dev.id);
        }
        if (props.empty) {
          await emptyBucket(api, bucketName, props);
        }
        await deleteBucket(api, bucketName, props);
      }
      return this.destroy();
    }

    if (this.phase === "create" || !this.output?.name) {
      const bucket = await createBucket(api, bucketName, props).catch(
        async (err) => {
          if (
            err instanceof CloudflareApiError &&
            err.status === 409 &&
            adopt
          ) {
            return await getBucket(api, bucketName, props);
          }
          throw err;
        },
      );
      const domain = await putManagedDomain(
        api,
        bucketName,
        allowPublicAccess,
        props.jurisdiction,
      );
      if (props.cors?.length) {
        await putBucketCORS(api, bucketName, props);
      }
      if (props.lifecycle?.length) {
        await putBucketLifecycleRules(api, bucketName, props);
      }
      if (props.lock?.length) {
        await putBucketLockRules(api, bucketName, props);
      }
      let dataCatalog:
        | {
            id: string;
            name: string;
            host: string;
          }
        | undefined;
      if (props.dataCatalog) {
        dataCatalog = await enableDataCatalog(api, bucketName);
      }
      return {
        name: bucketName,
        location: bucket.location,
        creationDate: new Date(bucket.creation_date),
        jurisdiction: bucket.jurisdiction,
        allowPublicAccess,
        domain,
        type: "r2_bucket",
        accountId: api.accountId,
        lifecycle: props.lifecycle,
        lock: props.lock,
        cors: props.cors,
        dev,
        catalog: dataCatalog,
      };
    } else {
      if (bucketName !== this.output.name) {
        throw new Error(
          `Cannot update R2Bucket name after creation. Bucket name is immutable. Before: ${this.output.name}, After: ${bucketName}`,
        );
      }
      if (this.output?.catalog && !props.dataCatalog) {
        await disableDataCatalog(api, bucketName);
        this.output.catalog = undefined;
      }
      if (!this.output.catalog && props.dataCatalog) {
        this.output.catalog = await enableDataCatalog(api, bucketName);
      }
      let domain = this.output.domain;
      if (!!domain !== allowPublicAccess) {
        domain = await putManagedDomain(
          api,
          bucketName,
          allowPublicAccess,
          props.jurisdiction,
        );
      }
      if (!isDeepStrictEqual(this.output.cors ?? [], props.cors ?? [])) {
        await putBucketCORS(api, bucketName, props);
      }
      if (
        !isDeepStrictEqual(this.output.lifecycle ?? [], props.lifecycle ?? [])
      ) {
        await putBucketLifecycleRules(api, bucketName, props);
      }
      if (!isDeepStrictEqual(this.output.lock ?? [], props.lock ?? [])) {
        await putBucketLockRules(api, bucketName, props);
      }
      return {
        ...this.output,
        allowPublicAccess,
        dev,
        cors: props.cors,
        lifecycle: props.lifecycle,
        lock: props.lock,
        domain,
      };
    }
  },
);

/**
 * The bucket information returned from the Cloudflare REST API
 * @see https://developers.cloudflare.com/api/node/resources/r2/subresources/buckets/models/bucket/#(schema)
 */
interface R2BucketResult {
  creation_date: string;
  location: "apac" | "eeur" | "enam" | "weur" | "wnam" | "oc";
  name: string;
  storage_class: "Standard" | "InfrequentAccess";
  jurisdiction: "default" | "eu" | "fedramp";
}

/**
 * Adds jurisdiction header to the headers object if specified in props
 *
 * @param headers Headers object to modify
 * @param props Props or jurisdiction string
 * @returns Modified headers object
 */
export function withJurisdiction(
  props: { jurisdiction?: string },
  headers: Record<string, string> = {},
): Record<string, string> {
  if (props.jurisdiction && props.jurisdiction !== "default") {
    headers["cf-r2-jurisdiction"] = props.jurisdiction;
  }

  return headers;
}

/**
 * Get a bucket
 */
export async function getBucket(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps = {},
): Promise<R2BucketResult> {
  return await extractCloudflareResult<R2BucketResult>(
    `get R2 bucket "${bucketName}"`,
    api.get(`/accounts/${api.accountId}/r2/buckets/${bucketName}`, {
      headers: withJurisdiction(props),
    }),
  );
}

/**
 * Create a new bucket
 */
export async function createBucket(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps = {},
): Promise<R2BucketResult> {
  return await extractCloudflareResult<R2BucketResult>(
    `create R2 bucket "${bucketName}"`,
    api.post(
      `/accounts/${api.accountId}/r2/buckets`,
      {
        name: bucketName,
        locationHint: props.locationHint,
        storageClass: props.storageClass,
      },
      {
        headers: withJurisdiction(props),
      },
    ),
  );
}

/**
 * Delete a bucket
 */
export async function deleteBucket(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  try {
    await extractCloudflareResult(
      `delete R2 bucket "${bucketName}"`,
      api.delete(`/accounts/${api.accountId}/r2/buckets/${bucketName}`, {
        headers: withJurisdiction(props),
      }),
    );
  } catch (error) {
    if (error instanceof CloudflareApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

/**
 * Update the managed domain setting for a bucket
 */
export async function putManagedDomain(
  api: CloudflareApi,
  bucketName: string,
  enabled: boolean,
  jurisdiction?: string,
) {
  return await withExponentialBackoff(
    async () => {
      const result = await extractCloudflareResult<{
        bucketId: string;
        domain: string;
        enabled: boolean;
      }>(
        `put R2 bucket managed domain for "${bucketName}"`,
        api.put(
          `/accounts/${api.accountId}/r2/buckets/${bucketName}/domains/managed`,
          { enabled },
          { headers: withJurisdiction({ jurisdiction }) },
        ),
      );
      return result.enabled ? result.domain : undefined;
    },
    (err) => err.status === 404,
    10,
    1000,
  );
}

/**
 * Delete all objects in a bucket
 */
async function emptyBucket(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  let cursor: string | undefined;
  while (true) {
    const result = await listObjects(api, bucketName, {
      jurisdiction: props.jurisdiction,
      cursor,
    });
    if (result.objects.length) {
      // Another undocumented API! But it lets us delete multiple objects at once instead of one by one.
      await extractCloudflareResult(
        `delete ${result.objects.length} objects from bucket "${bucketName}"`,
        api.delete(
          `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects`,
          {
            headers: withJurisdiction(props),
            method: "DELETE",
            body: JSON.stringify(result.objects.map((object) => object.key)),
          },
        ),
      );
      if (result.cursor) {
        cursor = result.cursor;
        continue;
      }
    }
    break;
  }
}

/**
 * Lists objects in a bucket.
 */
export async function listObjects(
  api: CloudflareApi,
  bucketName: string,
  props: R2ListOptions & {
    jurisdiction?: string;
  },
): Promise<R2Objects> {
  const params = new URLSearchParams({
    per_page: "1000",
  });
  if (props.cursor) {
    params.set("cursor", props.cursor);
  }
  if (props.delimiter) {
    params.set("delimiter", props.delimiter);
  }
  if (props.prefix) {
    params.set("prefix", props.prefix);
  }
  if (props.startAfter) {
    params.set("start_after", props.startAfter);
  }
  if (props.limit) {
    params.set("limit", props.limit.toString());
  }
  const response = await api.get(
    `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects?${params.toString()}`,
    { headers: withJurisdiction(props) },
  );
  const json: {
    result: {
      key: string;
      etag: string;
      last_modified: string;
      size: number;
    }[];
    result_info?: {
      cursor: string;
      is_truncated: boolean;
      per_page: number;
    };
    success: boolean;
    errors: CloudflareApiErrorPayload[];
  } = await response.json();
  if (!json.success) {
    // 10006 indicates that the bucket does not exist, so there are no objects to list
    if (json.errors.some((e) => e.code === 10006)) {
      return {
        objects: [],
        cursor: undefined,
        truncated: false,
      };
    }
    throw new CloudflareApiError(
      `Failed to list objects in bucket "${bucketName}": ${json.errors.map((e) => `- [${e.code}] ${e.message}${e.documentation_url ? ` (${e.documentation_url})` : ""}`).join("\n")}`,
      response,
      json.errors,
    );
  }
  return {
    // keys: json.result.map((object) => object.key),
    objects: json.result.map((object) => ({
      key: object.key,
      etag: object.etag,
      uploaded: new Date(object.last_modified),
      size: object.size,
    })),
    delimitedPrefixes: [],
    cursor: json.result_info?.cursor,
    truncated: json.result_info?.is_truncated ?? false,
  } as R2Objects;
}

/**
 * List all R2 buckets in an account
 *
 * @param api CloudflareApi instance
 * @param options Optional listing options
 * @returns Array of bucket information
 */
export async function listBuckets(
  api: CloudflareApi,
  options: {
    nameContains?: string;
    perPage?: number;
    cursor?: string;
    direction?: "asc" | "desc";
    jurisdiction?: string;
  } = {},
) {
  // Build query parameters
  const params = new URLSearchParams();

  if (options.nameContains) {
    params.append("name_contains", options.nameContains);
  }

  if (options.perPage) {
    params.append("per_page", options.perPage.toString());
  }

  if (options.cursor) {
    params.append("cursor", options.cursor);
  }

  if (options.direction) {
    params.append("direction", options.direction);
  }

  // Build URL with query parameters
  const path = `/accounts/${api.accountId}/r2/buckets${params.toString() ? `?${params.toString()}` : ""}`;

  // Make the API request
  const result = await extractCloudflareResult<{
    buckets: { name: string; creation_date: string }[];
  }>(
    "list R2 buckets",
    api.get(path, {
      headers: withJurisdiction(options),
    }),
  );
  return result.buckets;
}

export async function putBucketCORS(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  let request: RequestInit;
  if (props.cors?.length) {
    request = {
      method: "PUT",
      body: JSON.stringify({ rules: props.cors }),
      headers: withJurisdiction(props, {
        "Content-Type": "application/json",
      }),
    };
  } else {
    request = {
      method: "DELETE",
      headers: withJurisdiction(props),
    };
  }
  await extractCloudflareResult(
    `${request.method} R2 bucket CORS rules for "${bucketName}"`,
    api.fetch(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/cors`,
      request,
    ),
  );
}

export async function putBucketLifecycleRules(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  const rulesBody = Array.isArray(props.lifecycle)
    ? props.lifecycle.length === 0
      ? { rules: [] }
      : {
          rules: props.lifecycle.map((rule) => ({
            ...rule,
            // Required by the API; empty prefix means all objects/uploads
            conditions: rule.conditions ?? { prefix: "" },
            // Required by the API
            enabled: rule.enabled ?? true,
          })),
        }
    : {};

  await extractCloudflareResult(
    `put R2 bucket lifecycle rules for "${bucketName}"`,
    api.put(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/lifecycle`,
      rulesBody,
      { headers: withJurisdiction(props) },
    ),
  );
}

/**
 * Get lifecycle rules for a bucket
 */
export async function getBucketLifecycleRules(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps = {},
): Promise<R2BucketLifecycleRule[]> {
  const res = await api.get(
    `/accounts/${api.accountId}/r2/buckets/${bucketName}/lifecycle`,
    { headers: withJurisdiction(props) },
  );
  const json: any = await res.json();
  if (!json?.success) {
    throw new CloudflareApiError(
      `Failed to get R2 bucket lifecycle rules for "${bucketName}": ${res.status} ${res.statusText}`,
      res,
      json?.errors,
    );
  }
  const rules: any[] = Array.isArray(json.result)
    ? json.result
    : (json.result?.rules ?? []);
  return rules as R2BucketLifecycleRule[];
}

export async function putBucketLockRules(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  const rulesBody = Array.isArray(props.lock)
    ? props.lock.length === 0
      ? { rules: [] }
      : {
          rules: props.lock.map((rule) => ({
            ...rule,
            // Required by the API
            enabled: rule.enabled ?? true,
          })),
        }
    : {};

  await extractCloudflareResult(
    `put R2 bucket lock rules for "${bucketName}"`,
    api.put(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/lock`,
      rulesBody,
      { headers: withJurisdiction(props) },
    ),
  );
}

/**
 * Get lock rules for a bucket
 */
export async function getBucketLockRules(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps = {},
): Promise<R2BucketLockRule[]> {
  const res = await api.get(
    `/accounts/${api.accountId}/r2/buckets/${bucketName}/lock`,
    { headers: withJurisdiction(props) },
  );
  const json: any = await res.json();
  if (!json?.success) {
    throw new CloudflareApiError(
      `Failed to get R2 bucket lock rules for "${bucketName}": ${res.status} ${res.statusText}`,
      res,
      json?.errors,
    );
  }
  const rules: any[] = Array.isArray(json.result)
    ? json.result
    : (json.result?.rules ?? []);
  return rules as R2BucketLockRule[];
}

export async function headObject(
  api: CloudflareApi,
  { bucketName, key }: { bucketName: string; key: string },
): Promise<R2ObjectMetadata | null> {
  const response = await withRetries(
    async () =>
      await api.get(
        `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}`,
      ),
  );
  // for some reason HEAD returns 404 for keys that exist, this is the best we can do without using S3 API
  response.body?.cancel();
  if (response.status === 404) {
    return null;
  } else if (!response.ok) {
    throw await handleApiError(response, "head", "object", key);
  }
  return {
    key,
    etag: response.headers.get("ETag")?.replace(/"/g, "")!,
    uploaded: parseDate(response.headers),
    size: Number(response.headers.get("Content-Length")),
    httpMetadata: mapHeadersToHttpMetadata(response.headers),
  };
}

const withRetries = (f: () => Promise<Response>) => {
  return withExponentialBackoff(f, isRetryableError, 5, 1000);
};

export async function getObject(
  api: CloudflareApi,
  { bucketName, key }: { bucketName: string; key: string },
) {
  return await withRetries(async () => {
    const response = await api.get(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}`,
      {
        headers: {
          "Content-Type": "application/octet-stream",
          Accept: "application/octet-stream",
        },
      },
    );
    if (!response.ok && response.status !== 404) {
      throw await handleApiError(response, "get", "object", key);
    }
    return response;
  });
}

export type PutObjectObject =
  | ReadableStream
  | ArrayBuffer
  | ArrayBufferView
  | Uint8Array
  | string
  | Buffer
  | Blob;

function mapHttpMetadataToHeaders(
  httpMetadata: R2PutOptions["httpMetadata"],
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (httpMetadata instanceof Headers) {
    httpMetadata.forEach((value, key) => {
      headers[key] = value;
    });
  } else {
    const {
      contentType,
      contentLanguage,
      contentDisposition,
      contentEncoding,
      cacheControl,
      cacheExpiry,
    } = httpMetadata as R2HTTPMetadata;
    if (contentType) headers["Content-Type"] = contentType;
    if (contentLanguage) headers["Content-Language"] = contentLanguage;
    if (contentDisposition) headers["Content-Disposition"] = contentDisposition;
    if (contentEncoding) headers["Content-Encoding"] = contentEncoding;
    if (cacheControl) headers["Cache-Control"] = cacheControl;
    if (cacheExpiry) headers.Expires = cacheExpiry.toUTCString();
  }

  return headers;
}

function mapHeadersToHttpMetadata(headers: Headers): R2HTTPMetadata {
  return {
    contentType: headers.get("Content-Type") ?? undefined,
    contentLanguage: headers.get("Content-Language") ?? undefined,
    contentDisposition: headers.get("Content-Disposition") ?? undefined,
    contentEncoding: headers.get("Content-Encoding") ?? undefined,
    cacheControl: headers.get("Cache-Control") ?? undefined,
    cacheExpiry: headers.get("Expires")
      ? new Date(headers.get("Expires")!)
      : undefined,
  };
}

export async function putObject(
  api: CloudflareApi,
  {
    bucketName,
    key,
    object,
    options,
  }: {
    bucketName: string;
    key: string;
    object: PutObjectObject;
    options?: Pick<R2PutOptions, "httpMetadata">;
  },
): Promise<Response> {
  // Using withExponentialBackoff for reliability
  return await withRetries(async () => {
    const headers: Record<string, string> = {
      "Content-Type": "application/octet-stream",
      ...(options?.httpMetadata
        ? mapHttpMetadataToHeaders(options?.httpMetadata)
        : {}),
    };

    const response = await api.put(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}`,
      object,
      {
        headers,
      },
    );
    if (!response.ok) {
      await handleApiError(response, "put", "object", key);
    }
    return response;
  });
}

export async function deleteObject(
  api: CloudflareApi,
  { bucketName, key }: { bucketName: string; key: string },
) {
  return await withRetries(async () => {
    const response = await api.delete(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects/${key}`,
    );

    if (!response.ok && response.status !== 404) {
      await handleApiError(response, "delete", "object", key);
    }

    return response;
  });
}

export async function enableDataCatalog(
  api: CloudflareApi,
  bucketName: string,
) {
  const response = await extractCloudflareResult<{
    id: string;
    name: string;
  }>(
    `enable data catalog for bucket "${bucketName}"`,
    api.post(`/accounts/${api.accountId}/r2-catalog/${bucketName}/enable`, {}),
  );
  return {
    id: response.id,
    name: response.name,
    host: `https://catalog.cloudflarestorage.com/${response.name.replace("_", "/")}`,
  };
}

export async function disableDataCatalog(
  api: CloudflareApi,
  bucketName: string,
) {
  await api.post(
    `/accounts/${api.accountId}/r2-catalog/${bucketName}/disable`,
    {},
  );
}
