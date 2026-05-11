import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { ignore } from "../util/ignore.ts";
import { importPeer } from "../util/peer.ts";
import { retry } from "./retry.ts";

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
export const Bucket = Resource(
  "s3::Bucket",
  async function (this: Context<Bucket>, id: string, props: BucketProps) {
    const {
      CreateBucketCommand,
      DeleteBucketCommand,
      GetBucketAclCommand,
      GetBucketLocationCommand,
      GetBucketTaggingCommand,
      GetBucketVersioningCommand,
      HeadBucketCommand,
      NoSuchBucket,
      PutBucketTaggingCommand,
      S3Client,
    } = await importPeer(import("@aws-sdk/client-s3"), "s3::Bucket");
    const client = new S3Client({});

    const bucketName =
      props.bucketName ??
      this.output?.bucketName ??
      this.scope.createPhysicalName(id);

    if (this.phase === "update" && this.output.bucketName !== bucketName) {
      this.replace();
    }

    if (this.phase === "delete") {
      await ignore(NoSuchBucket.name, () =>
        retry(() =>
          client.send(
            new DeleteBucketCommand({
              Bucket: bucketName,
            }),
          ),
        ),
      );
      return this.destroy();
    }
    try {
      // Check if bucket exists
      await retry(() =>
        client.send(
          new HeadBucketCommand({
            Bucket: bucketName,
          }),
        ),
      );

      // Update tags if they changed and bucket exists
      if (this.phase === "update" && props.tags) {
        await retry(() =>
          client.send(
            new PutBucketTaggingCommand({
              Bucket: bucketName,
              Tagging: {
                TagSet: Object.entries(props.tags!).map(([Key, Value]) => ({
                  Key,
                  Value,
                })),
              },
            }),
          ),
        );
      }
    } catch (error: any) {
      if (error.name === "NotFound") {
        // Create bucket if it doesn't exist
        await retry(() =>
          client.send(
            new CreateBucketCommand({
              Bucket: bucketName,
              // Add tags during creation if specified
              ...(props.tags && {
                Tagging: {
                  TagSet: Object.entries(props.tags).map(([Key, Value]) => ({
                    Key,
                    Value,
                  })),
                },
              }),
            }),
          ),
        );
      } else {
        throw error;
      }
    }

    // Get bucket details
    const [locationResponse, versioningResponse, aclResponse] =
      await Promise.all([
        retry(() =>
          client.send(new GetBucketLocationCommand({ Bucket: bucketName })),
        ),
        retry(() =>
          client.send(new GetBucketVersioningCommand({ Bucket: bucketName })),
        ),
        retry(() =>
          client.send(new GetBucketAclCommand({ Bucket: bucketName })),
        ),
      ]);

    const region = locationResponse.LocationConstraint || "us-east-1";

    // Get tags if they exist
    let tags = props.tags;
    if (!tags) {
      try {
        const taggingResponse = await retry(() =>
          client.send(new GetBucketTaggingCommand({ Bucket: bucketName })),
        );
        tags = Object.fromEntries(
          taggingResponse.TagSet?.map(({ Key, Value }) => [Key, Value]) || [],
        );
      } catch (error: any) {
        if (error.name !== "NoSuchTagSet") {
          throw error;
        }
      }
    }

    return {
      bucketName: bucketName,
      arn: `arn:aws:s3:::${bucketName}`,
      bucketDomainName: `${bucketName}.s3.amazonaws.com`,
      bucketRegionalDomainName: `${bucketName}.s3.${region}.amazonaws.com`,
      region,
      hostedZoneId: getHostedZoneId(region),
      versioningEnabled: versioningResponse.Status === "Enabled",
      acl: aclResponse.Grants?.[0]?.Permission?.toLowerCase(),
      ...(tags && { tags }),
    };
  },
);

/**
 * Helper function to get S3 hosted zone IDs by region
 *
 * Returns the S3 hosted zone ID for a given AWS region. These IDs are used when
 * configuring Route 53 DNS records that point to S3 buckets. If the region is not
 * found in the mapping, defaults to the us-east-1 hosted zone ID.
 *
 * @param region - The AWS region code (e.g., us-east-1, eu-west-1)
 * @returns The S3 hosted zone ID for the region
 */
function getHostedZoneId(region: string): string {
  const hostedZoneIds: Record<string, string> = {
    "us-east-1": "Z3AQBSTGFYJSTF",
    "us-east-2": "Z2O1EMRO9K5GLX",
    "us-west-1": "Z2F56UZL2M1ACD",
    "us-west-2": "Z3BJ6K6RIION7M",
    "af-south-1": "Z11KHD8FBVPUYU",
    "ap-east-1": "ZNB98KWMFR0R6",
    "ap-south-1": "Z11RGJOFQNVJUP",
    "ap-northeast-1": "Z2M4EHUR26P7ZW",
    "ap-northeast-2": "Z3W03O7B5YMIYP",
    "ap-northeast-3": "Z2YQB5RD63NC85",
    "ap-southeast-1": "Z3O0J2DXBE1FTB",
    "ap-southeast-2": "Z1WCIGYICN2BYD",
    "ca-central-1": "Z1QDHH18159H29",
    "eu-central-1": "Z21DNDUVLTQW6Q",
    "eu-west-1": "Z1BKCTXD74EZPE",
    "eu-west-2": "Z3GKZC51ZF0DB4",
    "eu-west-3": "Z3R1K369G5AVDG",
    "eu-north-1": "Z3BAZG2TWCNX0D",
    "eu-south-1": "Z30OZKI7KPW7MI",
    "me-south-1": "Z1MPMWCPA7YB62",
    "sa-east-1": "Z7KQH4QJS55SO",
  };
  return hostedZoneIds[region] || "Z3AQBSTGFYJSTF"; // Default to us-east-1 if region not found
}
