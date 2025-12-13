import type { R2PutOptions } from "@cloudflare/workers-types/experimental/index.ts";
import type { Context } from "../context.ts";
import { type CloudflareApiOptions } from "./api.ts";
import { type PutObjectObject, type R2Bucket } from "./bucket.ts";
/**
 * Properties for creating or updating an R2 Object
 */
export interface R2ObjectProps extends CloudflareApiOptions {
    /**
     * The R2 bucket where the object will be stored
     */
    bucket: R2Bucket;
    /**
     * The key (path/name) of the object within the bucket
     * Must be a valid object key as defined by R2 storage requirements
     */
    key: string;
    /**
     * The content to store in the object
     * Supports various data types including streams, buffers, strings, and blobs
     */
    content: PutObjectObject;
    /**
     * The options to use for the object
     */
    options?: Pick<R2PutOptions, "httpMetadata">;
}
/**
 * Output returned after R2 Object creation/update
 */
export interface R2Object {
    /**
     * The resource identifier
     */
    id: string;
    /**
     * The key (path/name) of the object within the bucket
     */
    key: string;
    /**
     * The etag of the object
     */
    etag: string;
}
/**
 * Creates and manages objects within Cloudflare R2 Buckets.
 *
 * R2 Objects represent individual files or data stored within an R2 bucket.
 * This resource provides lifecycle management for object creation, updates, and deletion.
 *
 * @example
 * // Create a simple text object in a bucket
 * const textObject = await R2Object("readme", {
 *   bucket: myBucket,
 *   key: "docs/README.txt",
 *   content: "Welcome to our application!"
 * });
 *
 * @example
 * // Store JSON data as an object
 * const configObject = await R2Object("app-config", {
 *   bucket: configBucket,
 *   key: "config/app.json",
 *   content: JSON.stringify({ version: "1.0.0", debug: false })
 * });
 *
 * @example
 * // Store binary data from a buffer
 * const imageObject = await R2Object("user-avatar", {
 *   bucket: assetsBucket,
 *   key: "avatars/user-123.png",
 *   content: imageBuffer
 * });
 *
 * @example
 * // Store data from a readable stream
 * const streamObject = await R2Object("upload", {
 *   bucket: uploadsBucket,
 *   key: "uploads/file.dat",
 *   content: readableStream
 * });
 *
 * @see https://developers.cloudflare.com/r2/api/workers/workers-api-reference/
 */
export declare const R2Object: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<R2Object>, id: string, props: R2ObjectProps) => Promise<R2Object>);
//# sourceMappingURL=bucket-object.d.ts.map