import type { Context } from "../context.ts";
/**
 * Properties for creating or updating an S3 bucket
 */
export interface BucketProps {
    /**
     * The name of the bucket. Must be globally unique across all AWS accounts.
     * Should be lowercase alphanumeric characters or hyphens.
     *
     * @default ${app}-${stage}-${id}
     */
    bucketName?: string;
    /**
     * Optional tags to apply to the bucket for organization and cost tracking.
     * Each tag is a key-value pair.
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after S3 bucket creation/update
 */
export interface Bucket extends BucketProps {
    /**
     * The ARN (Amazon Resource Name) of the bucket
     * Format: arn:aws:s3:::bucket-name
     */
    arn: string;
    /**
     * Name of the Bucket.
     */
    bucketName: string;
    /**
     * The global domain name for the bucket
     * Format: bucket-name.s3.amazonaws.com
     */
    bucketDomainName: string;
    /**
     * The regional domain name for the bucket
     * Format: bucket-name.s3.region.amazonaws.com
     */
    bucketRegionalDomainName?: string;
    /**
     * The S3 hosted zone ID for the region where the bucket resides
     * Used for DNS configuration with Route 53
     */
    hostedZoneId?: string;
    /**
     * The AWS region where the bucket is located
     */
    region?: string;
    /**
     * The website endpoint URL if static website hosting is enabled
     * Format: http://bucket-name.s3-website-region.amazonaws.com
     */
    websiteEndpoint?: string;
    /**
     * The website domain if static website hosting is enabled
     * Format: bucket-name.s3-website-region.amazonaws.com
     */
    websiteDomain?: string;
    /**
     * Whether versioning is enabled for the bucket
     */
    versioningEnabled?: boolean;
    /**
     * The canned ACL applied to the bucket
     * Common values: private, public-read, public-read-write, authenticated-read
     */
    acl?: string;
}
/**
 * AWS S3 Bucket Resource
 *
 * Creates and manages Amazon S3 buckets with support for versioning, tags, and regional configuration.
 * S3 buckets provide scalable object storage for any type of data, with features like versioning,
 * lifecycle policies, and fine-grained access control.
 *
 * @example
 * // Create a basic S3 bucket with default settings
 * const basicBucket = await Bucket("my-app-storage", {
 *   bucketName: "my-app-storage",
 *   tags: {
 *     Environment: "production",
 *     Project: "my-app"
 *   }
 * });
 *
 * @example
 * // Create a bucket with versioning enabled and specific tags
 * const versionedBucket = await Bucket("document-archive", {
 *   bucketName: "document-archive",
 *   tags: {
 *     Environment: "production",
 *     Purpose: "document-storage",
 *     Versioning: "enabled"
 *   }
 * });
 *
 * @example
 * // Create a development bucket with minimal configuration
 * const devBucket = await Bucket("dev-testing", {
 *   bucketName: "dev-testing",
 *   tags: {
 *     Environment: "development",
 *     Temporary: "true"
 *   }
 * });
 */
export declare const Bucket: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Bucket>, id: string, props: BucketProps) => Promise<{
    tags?: Record<string, string> | undefined;
    bucketName: string;
    arn: string;
    bucketDomainName: string;
    bucketRegionalDomainName: string;
    region: string;
    hostedZoneId: string;
    versioningEnabled: boolean;
    acl: string | undefined;
}>);
//# sourceMappingURL=bucket.d.ts.map