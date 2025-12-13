import type { R2PutOptions } from "@cloudflare/workers-types/experimental/index.ts";
import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { type R2BucketCustomDomainOptions } from "./bucket-custom-domain.ts";
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
     * @deprecated Use `devDomain` instead
     */
    allowPublicAccess?: boolean;
    /**
     * Whether to allow public access through the r2.dev subdomain
     * Only for development purposes - use custom domains for production
     */
    devDomain?: boolean;
    /**
     * The custom domain(s) to attach to the bucket.
     */
    domains?: string | R2BucketCustomDomainOptions | string[] | R2BucketCustomDomainOptions[];
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
        condition: {
            maxAge: number;
            type: "Age";
        } | {
            date: string;
            type: "Date";
        };
    };
    /**
     * Transition to change the storage class of objects.
     */
    storageClassTransitions?: {
        /**
         * Condition for lifecycle transitions to apply after an object reaches an age in seconds.
         */
        condition: {
            maxAge: number;
            type: "Age";
        } | {
            date: string;
            type: "Date";
        };
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
    condition: {
        maxAgeSeconds: number;
        type: "Age";
    } | {
        date: string;
        type: "Date";
    } | {
        type: "Indefinite";
    };
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
} & ({
    truncated: true;
    cursor: string;
} | {
    truncated: false;
    cursor?: never;
});
export type R2Bucket = _R2Bucket & {
    head(key: string): Promise<R2ObjectMetadata | null>;
    get(key: string): Promise<R2ObjectContent | null>;
    put(key: string, value: ReadableStream | ArrayBuffer | ArrayBufferView | string | null | Blob, options?: Pick<R2PutOptions, "httpMetadata">): Promise<PutR2ObjectResponse>;
    delete(key: string): Promise<Response>;
    list(options?: R2ListOptions): Promise<R2Objects>;
};
/**
 * Output returned after R2 Bucket creation/update
 */
type _R2Bucket = Omit<BucketProps, "delete" | "dev" | "domains" | "devDomain"> & {
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
     * @deprecated Use `devDomain` instead
     */
    domain?: string;
    /**
     * The `r2.dev` subdomain for the bucket, if `devDomain` is true
     */
    devDomain: string | undefined;
    /**
     * The custom domains for the bucket, if applicable
     */
    domains: string[] | undefined;
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
export declare function isBucket(resource: any): resource is R2Bucket;
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
export declare function R2Bucket(id: string, props?: BucketProps): Promise<R2Bucket>;
declare const _R2Bucket: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<_R2Bucket>, id: string, props?: BucketProps) => Promise<_R2Bucket>);
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
export declare function withJurisdiction(props: {
    jurisdiction?: string;
}, headers?: Record<string, string>): Record<string, string>;
/**
 * Get a bucket
 */
export declare function getBucket(api: CloudflareApi, bucketName: string, props?: BucketProps): Promise<R2BucketResult>;
/**
 * Create a new bucket
 */
export declare function createBucket(api: CloudflareApi, bucketName: string, props?: BucketProps): Promise<R2BucketResult>;
/**
 * Delete a bucket
 */
export declare function deleteBucket(api: CloudflareApi, bucketName: string, props: BucketProps): Promise<void>;
/**
 * Update the managed domain setting for a bucket
 */
export declare function putManagedDomain(api: CloudflareApi, bucketName: string, enabled: boolean, jurisdiction?: string): Promise<string | undefined>;
/**
 * Lists objects in a bucket.
 */
export declare function listObjects(api: CloudflareApi, bucketName: string, props: R2ListOptions & {
    jurisdiction?: string;
}): Promise<R2Objects>;
/**
 * List all R2 buckets in an account
 *
 * @param api CloudflareApi instance
 * @param options Optional listing options
 * @returns Array of bucket information
 */
export declare function listBuckets(api: CloudflareApi, options?: {
    nameContains?: string;
    perPage?: number;
    cursor?: string;
    direction?: "asc" | "desc";
    jurisdiction?: string;
}): Promise<{
    name: string;
    creation_date: string;
}[]>;
export declare function putBucketCORS(api: CloudflareApi, bucketName: string, props: BucketProps): Promise<void>;
export declare function putBucketLifecycleRules(api: CloudflareApi, bucketName: string, props: BucketProps): Promise<void>;
/**
 * Get lifecycle rules for a bucket
 */
export declare function getBucketLifecycleRules(api: CloudflareApi, bucketName: string, props: {
    jurisdiction?: string;
}): Promise<R2BucketLifecycleRule[]>;
export declare function putBucketLockRules(api: CloudflareApi, bucketName: string, props: BucketProps): Promise<void>;
/**
 * Get lock rules for a bucket
 */
export declare function getBucketLockRules(api: CloudflareApi, bucketName: string, props: {
    jurisdiction?: R2BucketJurisdiction;
}): Promise<R2BucketLockRule[]>;
export declare function headObject(api: CloudflareApi, { bucketName, key }: {
    bucketName: string;
    key: string;
}): Promise<R2ObjectMetadata | null>;
export declare function getObject(api: CloudflareApi, { bucketName, key }: {
    bucketName: string;
    key: string;
}): Promise<Response>;
export type PutObjectObject = ReadableStream | ArrayBuffer | ArrayBufferView | Uint8Array | string | Buffer | Blob;
export declare function putObject(api: CloudflareApi, { bucketName, key, object, options }: {
    bucketName: string;
    key: string;
    object: PutObjectObject;
    options?: Pick<R2PutOptions, "httpMetadata">;
}): Promise<Response>;
export declare function deleteObject(api: CloudflareApi, { bucketName, key }: {
    bucketName: string;
    key: string;
}): Promise<Response>;
export declare function enableDataCatalog(api: CloudflareApi, bucketName: string): Promise<{
    id: string;
    name: string;
    host: string;
}>;
export declare function disableDataCatalog(api: CloudflareApi, bucketName: string): Promise<void>;
export {};
//# sourceMappingURL=bucket.d.ts.map