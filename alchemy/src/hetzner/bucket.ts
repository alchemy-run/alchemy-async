import { AwsClient } from "aws4fetch";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { Secret } from "../secret.ts";

export type HetznerObjectStorageRegion = "fsn1" | "nbg1" | "hel1";

export interface BucketProps {
  /**
   * The name of the bucket.
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * The Hetzner Object Storage region.
   */
  region: HetznerObjectStorageRegion;

  /**
   * S3-compatible access key ID.
   * Defaults to the HETZNER_ACCESS_KEY_ID environment variable.
   */
  accessKeyId?: Secret;

  /**
   * S3-compatible secret access key.
   * Defaults to the HETZNER_SECRET_ACCESS_KEY environment variable.
   */
  secretAccessKey?: Secret;

  /**
   * Whether to delete the bucket when removed from Alchemy.
   * @default true
   */
  delete?: boolean;
}

export type Bucket = Omit<BucketProps, "accessKeyId" | "secretAccessKey"> & {
  /**
   * The name of the bucket.
   */
  name: string;

  /**
   * The Hetzner Object Storage region.
   */
  region: HetznerObjectStorageRegion;

  /**
   * The S3-compatible endpoint URL for this region.
   * Format: https://{region}.your-objectstorage.com
   */
  endpoint: string;

  /**
   * The bucket domain name.
   * Format: {name}.{region}.your-objectstorage.com
   */
  bucketDomainName: string;
};

/**
 * Hetzner Object Storage Bucket
 *
 * Creates and manages Hetzner Object Storage buckets using the S3-compatible API.
 * Uses `aws4fetch` (already bundled with Alchemy) to make signed S3 requests
 * directly to Hetzner's Object Storage endpoint — no peer dependencies required.
 *
 * @example
 * ## Create a bucket in Frankfurt
 *
 * ```ts
 * import { Bucket } from "alchemy/hetzner";
 *
 * const bucket = await Bucket("assets", {
 *   region: "fsn1",
 * });
 *
 * console.log(bucket.endpoint);       // https://fsn1.your-objectstorage.com
 * console.log(bucket.bucketDomainName); // assets-...-fsn1.your-objectstorage.com
 * ```
 *
 * @example
 * ## Create a bucket with explicit credentials
 *
 * ```ts
 * import { Bucket } from "alchemy/hetzner";
 *
 * const bucket = await Bucket("backups", {
 *   region: "nbg1",
 *   name: "my-backups",
 *   accessKeyId: alchemy.secret.env.HETZNER_ACCESS_KEY_ID,
 *   secretAccessKey: alchemy.secret.env.HETZNER_SECRET_ACCESS_KEY,
 * });
 * ```
 *
 * @example
 * ## Create a bucket that is retained on destroy
 *
 * ```ts
 * const bucket = await Bucket("long-lived", {
 *   region: "hel1",
 *   delete: false,
 * });
 * ```
 */
export const Bucket = Resource(
  "hetzner::Bucket",
  async function (
    this: Context<Bucket>,
    id: string,
    props: BucketProps,
  ): Promise<Bucket> {
    const name =
      props.name ??
      this.output?.name ??
      this.scope.createPhysicalName(id, "-", 63);
    const endpoint = `https://${props.region}.your-objectstorage.com`;

    if (this.phase === "update" && this.output.name !== name) {
      return this.replace();
    }

    if (this.scope.local) {
      return {
        name,
        region: props.region,
        endpoint,
        bucketDomainName: `${name}.${props.region}.your-objectstorage.com`,
        delete: props.delete,
      };
    }

    const accessKeyId =
      Secret.unwrap(props.accessKeyId) ?? process.env.HETZNER_ACCESS_KEY_ID;
    const secretAccessKey =
      Secret.unwrap(props.secretAccessKey) ??
      process.env.HETZNER_SECRET_ACCESS_KEY;

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "Hetzner credentials missing. Provide accessKeyId / secretAccessKey props or set HETZNER_ACCESS_KEY_ID and HETZNER_SECRET_ACCESS_KEY environment variables.",
      );
    }

    const client = new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: props.region,
    });

    const bucketUrl = `${endpoint}/${name}`;

    if (this.phase === "delete") {
      if (props.delete !== false) {
        const res = await client.fetch(bucketUrl, { method: "DELETE" });
        if (!res.ok && res.status !== 404) {
          throw new Error(
            `Failed to delete bucket "${name}": ${res.status} ${res.statusText}`,
          );
        }
      }
      return this.destroy();
    }

    if (this.phase === "create") {
      const res = await client.fetch(bucketUrl, { method: "PUT" });
      if (!res.ok) {
        throw new Error(
          `Failed to create bucket "${name}": ${res.status} ${res.statusText}`,
        );
      }
    }
    // update is a no-op — buckets have no mutable configuration

    return {
      name,
      region: props.region,
      endpoint,
      bucketDomainName: `${name}.${props.region}.your-objectstorage.com`,
      delete: props.delete,
    };
  },
);
