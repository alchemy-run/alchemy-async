import {
  HeadBucketCommand,
  ListBucketsCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { Bucket } from "../../src/hetzner/bucket.ts";
import { Secret } from "../../src/secret.ts";
import { BRANCH_PREFIX } from "../util.ts";

// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

/**
 * Creates an S3 client pointed at Hetzner Object Storage for the given region.
 * Reads credentials from environment variables.
 */
function createHetznerS3Client(region: string): S3Client {
  return new S3Client({
    region,
    endpoint: `https://${region}.your-objectstorage.com`,
    credentials: {
      accessKeyId: process.env.HETZNER_ACCESS_KEY_ID!,
      secretAccessKey: process.env.HETZNER_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

/**
 * Verify that a bucket does NOT exist via the S3 API.
 * Uses HeadBucket — expects a 404 / NotFound error.
 */
async function assertBucketDeleted(
  bucketName: string,
  region: string,
): Promise<void> {
  const client = createHetznerS3Client(region);
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucketName }));
    throw new Error(`Bucket "${bucketName}" still exists after destroy`);
  } catch (error: any) {
    // S3 SDK throws with $metadata.httpStatusCode 404 or name NotFound / NoSuchBucket
    const status = error?.$metadata?.httpStatusCode;
    const name = error?.name;
    if (
      status === 404 ||
      name === "NotFound" ||
      name === "NoSuchBucket" ||
      name === "404"
    ) {
      return; // expected — bucket is gone
    }
    throw error;
  }
}

/**
 * Verify that a bucket exists via the S3 API using ListBuckets.
 */
async function assertBucketExists(
  bucketName: string,
  region: string,
): Promise<void> {
  const client = createHetznerS3Client(region);
  const { Buckets } = await client.send(new ListBucketsCommand({}));
  const found = (Buckets ?? []).some((b) => b.Name === bucketName);
  if (!found) {
    throw new Error(`Bucket "${bucketName}" not found in region ${region}`);
  }
}

describe("Hetzner Bucket Resource", () => {
  const testId = `${BRANCH_PREFIX.toLowerCase()}-hetzner-bucket`;

  test("create, verify, update (no-op), verify, and delete bucket", async (scope) => {
    let bucket: Bucket | undefined;

    try {
      // --- CREATE ---
      bucket = await Bucket(testId, {
        region: "fsn1",
      });

      expect(bucket.name).toBeTruthy();
      expect(bucket.region).toBe("fsn1");
      expect(bucket.endpoint).toBe("https://fsn1.your-objectstorage.com");
      expect(bucket.bucketDomainName).toBe(
        `${bucket.name}.fsn1.your-objectstorage.com`,
      );

      // Verify bucket exists via API
      await assertBucketExists(bucket.name, "fsn1");

      const originalName = bucket.name;

      // --- UPDATE (no-op: name and region are immutable) ---
      bucket = await Bucket(testId, {
        region: "fsn1",
      });

      // Name must be stable across a no-op update
      expect(bucket.name).toBe(originalName);
      expect(bucket.region).toBe("fsn1");
      expect(bucket.endpoint).toBe("https://fsn1.your-objectstorage.com");
      expect(bucket.bucketDomainName).toBe(
        `${originalName}.fsn1.your-objectstorage.com`,
      );

      // Verify the bucket still exists and its name didn't change
      await assertBucketExists(bucket.name, "fsn1");
    } finally {
      await destroy(scope);

      // Verify bucket was deleted via the S3 API
      if (bucket) {
        await assertBucketDeleted(bucket.name, "fsn1");
      }
    }
  });

  test("explicit name is preserved across create and update", async (scope) => {
    const explicitName = `${testId}-named`;
    let bucket: Bucket | undefined;

    try {
      bucket = await Bucket(`${testId}-named-id`, {
        name: explicitName,
        region: "nbg1",
      });

      expect(bucket.name).toBe(explicitName);
      expect(bucket.region).toBe("nbg1");
      expect(bucket.endpoint).toBe("https://nbg1.your-objectstorage.com");
      expect(bucket.bucketDomainName).toBe(
        `${explicitName}.nbg1.your-objectstorage.com`,
      );

      await assertBucketExists(bucket.name, "nbg1");

      // Re-apply — name should be stable
      bucket = await Bucket(`${testId}-named-id`, {
        name: explicitName,
        region: "nbg1",
      });

      expect(bucket.name).toBe(explicitName);
    } finally {
      await destroy(scope);

      if (bucket) {
        await assertBucketDeleted(bucket.name, "nbg1");
      }
    }
  });

  test("delete: false retains bucket on destroy", async (scope) => {
    const retainId = `${testId}-retain`;
    let bucket: Bucket | undefined;
    const s3Client = createHetznerS3Client("hel1");

    try {
      bucket = await Bucket(retainId, {
        region: "hel1",
        delete: false,
      });

      expect(bucket.delete).toBe(false);
      expect(bucket.region).toBe("hel1");
      expect(bucket.endpoint).toBe("https://hel1.your-objectstorage.com");
      expect(bucket.bucketDomainName).toBe(
        `${bucket.name}.hel1.your-objectstorage.com`,
      );

      await assertBucketExists(bucket.name, "hel1");
    } finally {
      // Alchemy destroy should NOT delete the S3 bucket when delete: false
      await destroy(scope);

      if (bucket) {
        // Bucket should still exist in Hetzner Object Storage
        await assertBucketExists(bucket.name, "hel1");

        // Clean up manually so we don't litter test buckets
        const { DeleteBucketCommand } = await import("@aws-sdk/client-s3");
        await s3Client.send(new DeleteBucketCommand({ Bucket: bucket.name }));

        // Now it should be gone
        await assertBucketDeleted(bucket.name, "hel1");
      }
    }
  });

  test("explicit credentials override environment variables", async (scope) => {
    let bucket: Bucket | undefined;

    try {
      bucket = await Bucket(`${testId}-creds`, {
        region: "fsn1",
        accessKeyId: Secret.wrap(process.env.HETZNER_ACCESS_KEY_ID ?? ""),
        secretAccessKey: Secret.wrap(
          process.env.HETZNER_SECRET_ACCESS_KEY ?? "",
        ),
      });

      expect(bucket.name).toBeTruthy();
      expect(bucket.region).toBe("fsn1");

      await assertBucketExists(bucket.name, "fsn1");
    } finally {
      await destroy(scope);

      if (bucket) {
        await assertBucketDeleted(bucket.name, "fsn1");
      }
    }
  });
});
