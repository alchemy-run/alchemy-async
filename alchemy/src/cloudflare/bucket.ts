import type {
  Headers as CloudflareHeaders,
  R2Checksums,
  R2HTTPMetadata,
  R2ListOptions,
  R2MultipartOptions,
  R2MultipartUpload,
  R2Object,
  R2ObjectBody,
  R2PutOptions,
  R2StringChecksums,
  R2UploadedPart,
} from "@cloudflare/workers-types/experimental/index.ts";
import { XMLParser } from "fast-xml-parser";
import * as mf from "miniflare";
import { Buffer } from "node:buffer";
import { Readable } from "node:stream";
import { isDeepStrictEqual } from "node:util";
import { alchemy } from "../alchemy.ts";
import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { streamToBuffer } from "../serde.ts";
import { isRetryableError } from "../state/r2-rest-state-store.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  type CloudflareApiErrorPayload,
  extractCloudflareResult,
} from "./api-response.ts";
import {
  type CloudflareApi,
  type CloudflareApiOptions,
  createCloudflareApi,
} from "./api.ts";
import { deleteMiniflareBinding } from "./miniflare/delete.ts";
import { getDefaultPersistPath } from "./miniflare/paths.ts";
import { createR2S3Client, type R2S3Client } from "./r2-s3-client.ts";

const xmlParser = new XMLParser({
  ignoreDeclaration: true,
  ignoreAttributes: false,
});

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

export interface R2UploadPartOptions {
  /**
   * Server-side encryption key (SSEC)
   */
  ssecKey?: ArrayBuffer | string;

  /**
   * Size of the part in bytes.
   *
   * **Note:** Node.js `Readable` streams (e.g., `fs.createReadStream()`) are always
   * buffered into memory before upload due to fetch API limitations with Content-Length headers.
   * For true streaming without buffering, use `Blob` or `File` objects with known sizes.
   *
   * **When to provide this:**
   * - **Optional** but recommended for all stream types to avoid size calculation overhead
   * - **Required** for Web API `ReadableStream` if you want to avoid buffering
   *
   * @example
   * ```ts
   * // Upload using fs.createReadStream (will be buffered)
   * import fs from "node:fs";
   * const stream = fs.createReadStream(filePath);
   * await upload.uploadPart(1, stream);
   * ```
   *
   * @example
   * ```ts
   * // Upload using Blob for efficient streaming
   * const file = Bun.file(filePath);
   * const blob = file.slice(start, end);
   * await upload.uploadPart(1, blob); // Uses blob.size automatically
   * ```
   */
  size?: number;
}

export type R2Bucket = _R2Bucket & {
  head(key: string): Promise<R2Object | null>;
  get(key: string): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value:
      | ReadableStream
      | ArrayBuffer
      | ArrayBufferView
      | string
      | null
      | Blob,
    options?: R2PutOptions,
  ): Promise<R2Object | null>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
  createMultipartUpload(
    key: string,
    options?: R2MultipartOptions,
  ): Promise<
    R2MultipartUpload & {
      /**
       * Upload a part in a multipart upload.
       *
       * **Note:** Node.js `Readable` streams (e.g., `fs.createReadStream()`) are buffered
       * into memory before upload due to fetch API limitations. Use `Blob` for efficient
       * streaming of large files.
       */
      uploadPart(
        partNumber: number,
        value:
          | ReadableStream
          | Readable
          | ArrayBuffer
          | ArrayBufferView
          | string
          | Blob,
        options?: R2UploadPartOptions,
      ): Promise<R2UploadedPart>;
    }
  >;
  resumeMultipartUpload(
    key: string,
    uploadId: string,
  ): R2MultipartUpload & {
    /**
     * Upload a part in a resumed multipart upload.
     *
     * **Note:** Node.js `Readable` streams are buffered into memory before upload.
     */
    uploadPart(
      partNumber: number,
      value:
        | ReadableStream
        | Readable
        | ArrayBuffer
        | ArrayBufferView
        | string
        | Blob,
      options?: R2UploadPartOptions,
    ): Promise<R2UploadedPart>;
  };
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

    /**
     * Whether the bucket has been deployed
     *
     * @internal
     */
    isDeployed?: boolean;
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
 * Resolve R2 credentials with environment variable defaults
 * @internal
 */
function resolveR2Credentials(props: BucketProps) {
  return {
    accessKeyId:
      props.accessKeyId ??
      (process.env.R2_ACCESS_KEY_ID
        ? alchemy.secret(process.env.R2_ACCESS_KEY_ID)
        : undefined),
    secretAccessKey:
      props.secretAccessKey ??
      (process.env.R2_SECRET_ACCESS_KEY
        ? alchemy.secret(process.env.R2_SECRET_ACCESS_KEY)
        : undefined),
    sessionToken:
      props.sessionToken ??
      (process.env.R2_SESSION_TOKEN
        ? alchemy.secret(process.env.R2_SESSION_TOKEN)
        : undefined),
  };
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

  let s3Client: R2S3Client | null = null;
  const ensureS3Client = (): R2S3Client => {
    if (s3Client) {
      return s3Client;
    }
    const r2Creds = resolveR2Credentials(props);
    s3Client = createR2S3Client({
      accountId: api.accountId,
      ...r2Creds,
      profile: props.profile,
    });
    return s3Client;
  };

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

  const createMultipartUploadObject = (
    key: string,
    uploadId: string,
  ): R2MultipartUpload => {
    // Extended implementation that supports Node.js Readable streams
    // Cast to any to bypass type checking for the extended signature
    return {
      key,
      uploadId,
      uploadPart: async (
        partNumber: number,
        value:
          | ReadableStream
          | Readable
          | ArrayBuffer
          | ArrayBufferView
          | string
          | Blob,
        options?: R2UploadPartOptions,
      ) => {
        const s3 = ensureS3Client();
        return uploadPartApi(api, s3, {
          bucketName: bucket.name,
          key,
          uploadId,
          partNumber,
          value,
          options,
        });
      },
      abort: async () => {
        const s3 = ensureS3Client();
        await abortMultipartUploadApi(api, s3, {
          bucketName: bucket.name,
          key,
          uploadId,
        });
      },
      complete: async (parts: R2UploadedPart[]) => {
        const s3 = ensureS3Client();
        return await completeMultipartUploadApi(api, s3, {
          bucketName: bucket.name,
          key,
          uploadId,
          parts,
        });
      },
    } as any;
  };

  return {
    ...bucket,
    head: async (key: string) => {
      if (isLocal) {
        // Miniflare returns a proper R2Object, so we can return it directly
        return await (await localBucket()).head(key);
      }
      return headObject(api, {
        bucketName: bucket.name,
        key,
      });
    },
    get: async (key: string): Promise<R2ObjectBody | null> => {
      if (isLocal) {
        const result = await (await localBucket()).get(key);
        if (result) {
          // Miniflare returns R2ObjectBody directly, cast for type compatibility
          return result as unknown as R2ObjectBody;
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
    ): Promise<R2Object | null> => {
      if (isLocal) {
        return await (
          await localBucket()
        ).put(
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
      const etag = body.result.etag;
      const httpEtag = etag.startsWith('"') ? etag : `"${etag}"`;
      return {
        key: body.result.key,
        version: body.result.version,
        size: Number(body.result.size),
        etag: etag.replace(/"/g, ""),
        httpEtag,
        checksums: createEmptyR2Checksums(),
        uploaded: new Date(body.result.uploaded),
        storageClass: "Standard",
        writeHttpMetadata(_headers: CloudflareHeaders): void {
          // No httpMetadata available from put response
        },
      };
    },
    delete: async (keys: string | string[]): Promise<void> => {
      const keysArray = Array.isArray(keys) ? keys : [keys];

      if (isLocal) {
        await (await localBucket()).delete(keysArray);
        return;
      }

      if (keysArray.length === 1) {
        // Single key deletion
        await deleteObject(api, {
          bucketName: bucket.name,
          key: keysArray[0],
        });
      } else {
        // Multiple keys deletion using bulk delete endpoint
        // Note: This uses an undocumented API endpoint, same as emptyBucket
        const response = await withRetries(async () =>
          api.delete(
            `/accounts/${api.accountId}/r2/buckets/${bucket.name}/objects`,
            {
              headers: withJurisdiction({ jurisdiction: bucket.jurisdiction }),
              method: "DELETE",
              body: JSON.stringify(keysArray),
            },
          ),
        );

        // Handle response - 204 No Content means success, otherwise try to parse JSON for errors
        if (response.status === 204) {
          // 204 No Content - successful deletion
          return;
        } else if (!response.ok) {
          // Error response - try to extract error details
          await extractCloudflareResult(
            `delete ${keysArray.length} objects from bucket "${bucket.name}"`,
            Promise.resolve(response),
          );
        } else {
          // 200-203 status - try to parse as JSON response (some endpoints return JSON)
          try {
            await extractCloudflareResult(
              `delete ${keysArray.length} objects from bucket "${bucket.name}"`,
              Promise.resolve(response),
            );
          } catch {
            // If JSON parsing fails but status is ok, assume success
            // (some endpoints might return empty body on success)
          }
        }
      }
    },
    createMultipartUpload: async (
      key: string,
      options?: R2MultipartOptions,
    ) => {
      if (isLocal) {
        const mfBucket = await localBucket();
        const upload = await mfBucket.createMultipartUpload(
          key,
          normalizeMultipartOptionsForMiniflare(options),
        );

        // Extended implementation with Node.js Readable support
        return {
          key: upload.key,
          uploadId: upload.uploadId,
          uploadPart: async (
            partNumber: number,
            value:
              | ReadableStream
              | Readable
              | ArrayBuffer
              | ArrayBufferView
              | string
              | Blob,
            partOptions?: R2UploadPartOptions,
          ) => {
            const normalizedValue = await normalizeMultipartPartValue(value);
            return await upload.uploadPart(
              partNumber,
              normalizedValue,
              partOptions,
            );
          },
          abort: async () => await upload.abort(),
          complete: async (parts: R2UploadedPart[]) => {
            const result = await upload.complete(parts);
            return result;
          },
        } as any;
      }

      const s3 = ensureS3Client();
      const result = await createMultipartUploadApi(api, s3, {
        bucketName: bucket.name,
        key,
        options,
      });
      return createMultipartUploadObject(result.key, result.uploadId);
    },
    resumeMultipartUpload: (key: string, uploadId: string) =>
      createMultipartUploadObject(key, uploadId),
  };
}

const parseR2Object = (key: string, response: Response): R2ObjectBody => {
  // Clone the response so we can read the body multiple times
  const clonedResponse = response.clone();
  let bodyUsed = false;

  // Extract metadata from headers using shared helper
  const metadata = extractR2ObjectMetadata(key, response.headers);

  // Create a getter for body that marks it as used
  const getBody = () => {
    bodyUsed = true;
    return clonedResponse.body!;
  };

  return {
    ...metadata,
    get body() {
      return getBody();
    },
    get bodyUsed() {
      return bodyUsed;
    },
    arrayBuffer: () => {
      bodyUsed = true;
      return clonedResponse.arrayBuffer();
    },
    bytes: () => {
      bodyUsed = true;
      return clonedResponse.bytes();
    },
    text: () => {
      bodyUsed = true;
      return clonedResponse.text();
    },
    json: <T>() => {
      bodyUsed = true;
      return clonedResponse.json<T>();
    },
    blob: () => {
      bodyUsed = true;
      return clonedResponse.blob();
    },
  };
};

const parseDate = (headers: Headers) =>
  new Date(headers.get("Last-Modified") ?? headers.get("Date")!);

/**
 * Extract R2Object metadata from response headers
 */
const extractR2ObjectMetadata = (key: string, headers: Headers) => {
  const etag = headers.get("ETag")?.replace(/"/g, "") || "";
  const httpEtag = headers.get("ETag") || `"${etag}"`;
  const version = headers.get("x-r2-version") || "";
  const storageClass = headers.get("cf-r2-storage-class") || "Standard";
  const httpMetadata = mapHeadersToHttpMetadata(headers);

  return {
    key,
    version,
    size: Number(headers.get("Content-Length") || 0),
    etag,
    httpEtag,
    checksums: createEmptyR2Checksums(),
    uploaded: parseDate(headers),
    httpMetadata,
    storageClass,
    writeHttpMetadata: (headers: CloudflareHeaders): void => {
      if (httpMetadata) {
        if (httpMetadata.contentType) {
          headers.set("Content-Type", httpMetadata.contentType);
        }
        if (httpMetadata.contentLanguage) {
          headers.set("Content-Language", httpMetadata.contentLanguage);
        }
        if (httpMetadata.contentDisposition) {
          headers.set("Content-Disposition", httpMetadata.contentDisposition);
        }
        if (httpMetadata.contentEncoding) {
          headers.set("Content-Encoding", httpMetadata.contentEncoding);
        }
        if (httpMetadata.cacheControl) {
          headers.set("Cache-Control", httpMetadata.cacheControl);
        }
        if (httpMetadata.cacheExpiry) {
          headers.set("Expires", httpMetadata.cacheExpiry.toUTCString());
        }
      }
    },
  };
};

/**
 * Creates an empty R2Checksums object with toJSON method
 */
function createEmptyR2Checksums(): R2Checksums {
  return {
    toJSON(): R2StringChecksums {
      return {};
    },
  };
}

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
    const isLocal = this.scope.local && !props.dev?.remote;
    const dev = {
      id: this.output?.dev?.id ?? bucketName,
      remote: props.dev?.remote ?? false,
      isDeployed: this.output?.dev?.isDeployed || !isLocal,
    } satisfies _R2Bucket["dev"];
    const adopt = props.adopt ?? this.scope.adopt;

    if (isLocal) {
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

    if (this.phase === "create" || !this.output?.dev?.isDeployed) {
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
      const response = await withRetries(async () =>
        api.delete(
          `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects`,
          {
            headers: withJurisdiction(props),
            method: "DELETE",
            body: JSON.stringify(result.objects.map((object) => object.key)),
          },
        ),
      );
      await extractCloudflareResult(
        `delete ${result.objects.length} objects from bucket "${bucketName}"`,
        Promise.resolve(response),
      );
      if (result.cursor) {
        cursor = result.cursor;
        continue;
      }
    }
    break;
  }

  await abortOutstandingMultipartUploads(api, bucketName, props);
}

async function abortOutstandingMultipartUploads(
  api: CloudflareApi,
  bucketName: string,
  props: BucketProps,
) {
  const credentials = resolveR2Credentials(props);

  if (!credentials.accessKeyId || !credentials.secretAccessKey) {
    // Without S3 credentials we cannot manage multipart uploads; skip cleanup.
    return;
  }

  let s3: R2S3Client;
  try {
    s3 = createR2S3Client({
      accountId: api.accountId,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
      profile: props.profile,
    });
  } catch {
    // If we cannot create the S3 client, there is nothing else we can do here.
    return;
  }

  let keyMarker: string | undefined;
  let uploadIdMarker: string | undefined;

  while (true) {
    const { uploads, truncated, nextKeyMarker, nextUploadIdMarker } =
      await listMultipartUploadsApi(api, s3, {
        bucketName,
        keyMarker,
        uploadIdMarker,
      });

    if (uploads.length) {
      await Promise.all(
        uploads.map((upload) =>
          abortMultipartUploadApi(api, s3, {
            bucketName,
            key: upload.key,
            uploadId: upload.uploadId,
          }),
        ),
      );
    }

    if (!truncated) {
      break;
    }

    keyMarker = nextKeyMarker;
    uploadIdMarker = nextUploadIdMarker;
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
  // Wrap API call with retries to catch both transport and API error responses
  const response = await withRetries(async () => {
    return await api.get(
      `/accounts/${api.accountId}/r2/buckets/${bucketName}/objects?${params.toString()}`,
      { headers: withJurisdiction(props) },
    );
  });

  // Parse and transform response after retry logic completes
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
    throw new CloudflareApiError(
      `Failed to list objects in bucket "${bucketName}": ${json.errors
        .map(
          (e) =>
            `- [${e.code}] ${e.message}${
              e.documentation_url ? ` (${e.documentation_url})` : ""
            }`,
        )
        .join("\n")}`,
      response,
      json.errors,
    );
  }
  return {
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
  const path = `/accounts/${api.accountId}/r2/buckets${
    params.toString() ? `?${params.toString()}` : ""
  }`;

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
): Promise<R2Object | null> {
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

  // Extract metadata from headers using shared helper
  return extractR2ObjectMetadata(key, response.headers);
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

interface HeadersLike {
  forEach(callback: (value: string, key: string) => void): void;
  get(name: string): string | null;
}

interface BlobLike {
  arrayBuffer(): Promise<ArrayBuffer>;
}

interface ReadableStreamLike<T = unknown> {
  getReader(): ReadableStreamDefaultReader<T>;
}

function isHeadersLike(value: unknown): value is HeadersLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as HeadersLike).forEach === "function" &&
    typeof (value as HeadersLike).get === "function"
  );
}

function isBlobLike(value: unknown): value is BlobLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BlobLike).arrayBuffer === "function"
  );
}

function isReadableStreamLike(value: unknown): value is ReadableStreamLike {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ReadableStreamLike).getReader === "function"
  );
}

function normalizeMultipartOptionsForMiniflare(
  options?: R2MultipartOptions,
): R2MultipartOptions {
  if (!options) {
    return {};
  }

  const normalized: R2MultipartOptions = { ...options };

  if (
    normalized.httpMetadata !== undefined &&
    isHeadersLike(normalized.httpMetadata)
  ) {
    const headers =
      normalized.httpMetadata instanceof Headers
        ? normalized.httpMetadata
        : new Headers(normalized.httpMetadata as unknown as HeadersInit);
    normalized.httpMetadata = mapHeadersToHttpMetadata(headers);
  }

  return normalized;
}

async function normalizeMultipartPartValue(
  value:
    | ReadableStream
    | Readable
    | ArrayBuffer
    | ArrayBufferView
    | string
    | Blob,
): Promise<string | ArrayBuffer | ArrayBufferView> {
  if (value instanceof Readable) {
    const buffer = await streamToBuffer(
      Readable.toWeb(value) as unknown as ReadableStream<Uint8Array>,
    );
    return new Uint8Array(buffer);
  }

  if (isBlobLike(value)) {
    const buffer = await value.arrayBuffer();
    return new Uint8Array(buffer);
  }

  if (isReadableStreamLike(value)) {
    const buffer = await streamToBuffer(
      value as unknown as ReadableStream<Uint8Array>,
    );
    return new Uint8Array(buffer);
  }

  return value as string | ArrayBuffer | ArrayBufferView;
}

function mapHttpMetadataToHeaders(
  httpMetadata: unknown,
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (!httpMetadata) {
    return headers;
  }

  if (isHeadersLike(httpMetadata)) {
    const headersInstance =
      httpMetadata instanceof Headers
        ? httpMetadata
        : new Headers(httpMetadata as HeadersInit);
    headersInstance.forEach((value, key) => {
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

export async function createMultipartUploadApi(
  _api: CloudflareApi,
  s3: R2S3Client,
  {
    bucketName,
    key,
    options = {},
  }: {
    bucketName: string;
    key: string;
    options?: R2MultipartOptions;
  },
): Promise<{ key: string; uploadId: string }> {
  return await withExponentialBackoff(
    async () => {
      const headers = buildCreateMultipartHeaders(options);
      const url = buildMultipartBaseUrl(s3.endpoint, bucketName, key);
      url.search = "?uploads";

      const response = await s3.client.fetch(url.toString(), {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        await handleApiError(
          response,
          "create multipart upload",
          "object",
          key,
        );
      }

      const xml = await response.text();
      const parsed = parseXml<{
        InitiateMultipartUploadResult?: {
          UploadId?: string;
          Key?: string;
        };
      }>(xml);
      const result = parsed.InitiateMultipartUploadResult;
      const uploadId = result?.UploadId;
      if (!uploadId || !result?.Key) {
        throw new Error(
          `Failed to parse upload ID when creating multipart upload for "${key}".`,
        );
      }

      const responseKey = result.Key ?? key;
      return {
        key: responseKey || key,
        uploadId,
      };
    },
    isRetryableS3Error,
    5,
    1000,
  );
}

export async function uploadPartApi(
  _api: CloudflareApi,
  s3: R2S3Client,
  {
    bucketName,
    key,
    uploadId,
    partNumber,
    value,
    options = {},
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
    partNumber: number;
    value:
      | ReadableStream
      | Readable
      | ArrayBuffer
      | ArrayBufferView
      | string
      | Blob;
    options?: R2UploadPartOptions;
  },
): Promise<R2UploadedPart> {
  if (partNumber < 1 || partNumber > 10000) {
    throw new Error(
      `Part number must be between 1 and 10000, got ${partNumber}`,
    );
  }

  return await withExponentialBackoff(
    async () => {
      // Pass size hint to enable streaming without buffering
      const { body, size } = await toS3Body(value, options.size);
      const headers: Record<string, string> = {
        "Content-Type": "application/octet-stream",
      };

      if (size !== undefined) {
        headers["Content-Length"] = size.toString();
      }

      if (options.ssecKey) {
        headers["x-amz-server-side-encryption-customer-algorithm"] = "AES256";
      }

      const url = buildMultipartBaseUrl(s3.endpoint, bucketName, key);
      url.searchParams.set("partNumber", String(partNumber));
      url.searchParams.set("uploadId", uploadId);

      const response = await s3.client.fetch(url.toString(), {
        method: "PUT",
        headers,
        body,
      });

      if (!response.ok) {
        await handleApiError(
          response,
          "upload part",
          `object ${key} part ${partNumber}`,
          key,
        );
      }

      const etag = response.headers.get("ETag")?.replace(/"/g, "");
      if (!etag) {
        throw new Error(`No ETag returned for part ${partNumber}`);
      }

      return {
        partNumber,
        etag,
      };
    },
    isRetryableS3Error,
    5,
    1000,
  );
}

export async function completeMultipartUploadApi(
  api: CloudflareApi,
  s3: R2S3Client,
  {
    bucketName,
    key,
    uploadId,
    parts,
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
    parts: R2UploadedPart[];
  },
): Promise<R2Object> {
  if (parts.length === 0) {
    throw new Error(
      `Multipart upload for "${key}" requires at least one uploaded part.`,
    );
  }

  const sortedParts = [...parts].sort((a, b) => a.partNumber - b.partNumber);
  const xmlBody = `<CompleteMultipartUpload>${sortedParts
    .map(
      (part) =>
        `<Part><PartNumber>${part.partNumber}</PartNumber><ETag>"${part.etag}"</ETag></Part>`,
    )
    .join("")}</CompleteMultipartUpload>`;

  return await withExponentialBackoff(
    async () => {
      const url = buildMultipartBaseUrl(s3.endpoint, bucketName, key);
      url.searchParams.set("uploadId", uploadId);

      const response = await s3.client.fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/xml",
        },
        body: xmlBody,
      });

      if (!response.ok) {
        await handleApiError(
          response,
          "complete multipart upload",
          "object",
          key,
        );
      }

      const xmlResponse = await response.text();
      const parsed = parseXml<{
        CompleteMultipartUploadResult?: {
          ETag?: string;
        };
      }>(xmlResponse);

      const etag = parsed.CompleteMultipartUploadResult?.ETag;
      if (!etag) {
        throw new Error(
          `Failed to complete multipart upload for "${key}": missing ETag in response.`,
        );
      }

      const objectResponse = await getObject(api, {
        bucketName,
        key,
      });

      if (!objectResponse.ok) {
        await handleApiError(objectResponse, "get", "object", key);
      }

      return parseR2Object(key, objectResponse);
    },
    isRetryableS3Error,
    5,
    1000,
  );
}

export async function abortMultipartUploadApi(
  _api: CloudflareApi,
  s3: R2S3Client,
  {
    bucketName,
    key,
    uploadId,
  }: {
    bucketName: string;
    key: string;
    uploadId: string;
  },
): Promise<void> {
  await withExponentialBackoff(
    async () => {
      const url = buildMultipartBaseUrl(s3.endpoint, bucketName, key);
      url.searchParams.set("uploadId", uploadId);

      const response = await s3.client.fetch(url.toString(), {
        method: "DELETE",
      });

      if (!response.ok && response.status !== 404) {
        await handleApiError(response, "abort multipart upload", "object", key);
      }
    },
    isRetryableS3Error,
    5,
    1000,
  );
}

export async function listMultipartUploadsApi(
  _api: CloudflareApi,
  s3: R2S3Client,
  {
    bucketName,
    keyMarker,
    uploadIdMarker,
  }: {
    bucketName: string;
    keyMarker?: string;
    uploadIdMarker?: string;
  },
): Promise<{
  uploads: { key: string; uploadId: string }[];
  truncated: boolean;
  nextKeyMarker?: string;
  nextUploadIdMarker?: string;
}> {
  return await withExponentialBackoff(
    async () => {
      const url = buildBucketUrl(s3.endpoint, bucketName);
      url.search = "?uploads";

      if (keyMarker) {
        url.searchParams.set("key-marker", keyMarker);
      }

      if (uploadIdMarker) {
        url.searchParams.set("upload-id-marker", uploadIdMarker);
      }

      const response = await s3.client.fetch(url.toString(), {
        method: "GET",
      });

      if (response.status === 404) {
        // Bucket already deleted or not yet consistent; treat as no uploads.
        return {
          uploads: [],
          truncated: false,
          nextKeyMarker: undefined,
          nextUploadIdMarker: undefined,
        };
      }

      if (!response.ok) {
        await handleApiError(
          response,
          "list multipart uploads",
          "bucket",
          bucketName,
        );
      }

      const xml = await response.text();
      const parsed = parseXml<ListMultipartUploadsXml>(xml);
      const result = parsed.ListMultipartUploadsResult ?? {};
      const uploads = normalizeToArray(result.Upload)
        .map((upload) => ({
          key: upload.Key ?? "",
          uploadId: upload.UploadId ?? "",
        }))
        .filter((upload) => upload.key && upload.uploadId);

      return {
        uploads,
        truncated: parseBoolean(result.IsTruncated),
        nextKeyMarker: result.NextKeyMarker,
        nextUploadIdMarker: result.NextUploadIdMarker,
      };
    },
    isRetryableS3Error,
    5,
    1000,
  );
}

interface MultipartUploadXmlItem {
  Key?: string;
  UploadId?: string;
}

interface ListMultipartUploadsXml {
  ListMultipartUploadsResult?: {
    Upload?: MultipartUploadXmlItem | MultipartUploadXmlItem[];
    IsTruncated?: string | boolean;
    NextKeyMarker?: string;
    NextUploadIdMarker?: string;
  };
}

function buildBucketUrl(endpoint: string, bucketName: string): URL {
  const url = new URL(endpoint);
  const basePath = url.pathname.endsWith("/")
    ? url.pathname.slice(0, -1)
    : url.pathname;
  url.pathname = `${basePath}/${encodeURIComponent(bucketName)}`;
  return url;
}

function buildMultipartBaseUrl(
  endpoint: string,
  bucketName: string,
  key: string,
): URL {
  const url = buildBucketUrl(endpoint, bucketName);
  url.pathname = `${url.pathname}/${encodeR2ObjectKey(key)}`;
  return url;
}

function encodeR2ObjectKey(key: string): string {
  return key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function normalizeToArray<T>(value: T | T[] | undefined): T[] {
  if (!value) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

function parseBoolean(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1";
  }
  return false;
}

function isRetryableS3Error(error: unknown): boolean {
  if (isRetryableError(error)) {
    return true;
  }
  if (error instanceof CloudflareApiError) {
    if (error.status === 404) {
      // Buckets and uploads can take a moment to propagate; retry a few times.
      return (
        error.message.includes("NoSuchBucket") ||
        error.message.includes("NoSuchUpload") ||
        error.message.includes("NoSuchKey")
      );
    }
    if (error.status === 409) {
      return true;
    }
  }
  if (error instanceof TypeError) {
    // Bun/undici throw TypeError for network transport failures.
    const cause: any = error.cause;
    const code = cause?.code ?? cause?.errno ?? cause;
    if (typeof cause === "object") {
      if (
        cause?.code === "EPIPE" ||
        cause?.code === "ECONNRESET" ||
        cause?.code === "ETIMEDOUT"
      ) {
        return true;
      }
      if (
        cause?.errno === -32 ||
        cause?.errno === -104 ||
        cause?.errno === -110
      ) {
        return true;
      }
    }
    if (typeof code === "string") {
      const normalized = code.toUpperCase();
      if (["EPIPE", "ECONNRESET", "ETIMEDOUT"].includes(normalized)) {
        return true;
      }
    }
    const message = String(error.message || "").toLowerCase();
    if (
      message.includes("fetch failed") ||
      message.includes("socket hang up") ||
      message.includes("timed out")
    ) {
      return true;
    }
  }
  return false;
}

function buildCreateMultipartHeaders(
  options: R2MultipartOptions = {},
): Record<string, string> {
  const headers: Record<string, string> = {};

  if (options.httpMetadata !== undefined) {
    Object.assign(headers, mapHttpMetadataToHeaders(options.httpMetadata));
  }

  if (options.customMetadata) {
    for (const [key, value] of Object.entries(options.customMetadata)) {
      headers[`x-amz-meta-${key}`] = value;
    }
  }

  if (options.storageClass) {
    headers["x-amz-storage-class"] = options.storageClass;
  }

  if (options.ssecKey) {
    headers["x-amz-server-side-encryption-customer-algorithm"] = "AES256";
  }

  return headers;
}

async function toS3Body(
  value:
    | ReadableStream
    | Readable
    | ArrayBuffer
    | ArrayBufferView
    | string
    | Blob,
  sizeHint?: number,
): Promise<{ body: BodyInit; size: number | undefined }> {
  if (typeof Blob !== "undefined" && value instanceof Blob) {
    return { body: value, size: value.size };
  }

  if (value instanceof Buffer) {
    return { body: value, size: value.byteLength };
  }

  if (value instanceof ArrayBuffer) {
    const uint8 = new Uint8Array(value);
    return { body: uint8, size: uint8.byteLength };
  }

  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    const uint8 = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    return { body: uint8 as BodyInit, size: uint8.byteLength };
  }

  if (typeof value === "string") {
    const buffer = Buffer.from(value);
    return { body: buffer, size: buffer.byteLength };
  }

  if (value instanceof Readable) {
    // Convert Node.js Readable to Web API ReadableStream
    const webStream = Readable.toWeb(
      value,
    ) as unknown as ReadableStream<Uint8Array>;

    // Always buffer the stream to ensure fetch can send Content-Length header
    // fetch implementations may ignore Content-Length when body is a ReadableStream
    const buffer = await streamToBuffer(webStream);
    return { body: new Uint8Array(buffer), size: buffer.length };
  }

  if (value instanceof ReadableStream) {
    if (sizeHint !== undefined) {
      return { body: value, size: sizeHint };
    }
    const buffer = await streamToBuffer(value);
    return { body: new Uint8Array(buffer), size: buffer.length };
  }

  throw new Error("Unsupported body type for multipart upload");
}

function parseXml<T>(xml: string): T {
  return xmlParser.parse(xml) as T;
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
