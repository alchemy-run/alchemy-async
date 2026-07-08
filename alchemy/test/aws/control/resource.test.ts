import { describe, expect } from "vitest";
import { alchemy } from "../../../src/alchemy.js";
import { createCloudControlClient } from "../../../src/aws/control/client.js";
import { CloudControlResource } from "../../../src/aws/control/resource.js";
import { destroy } from "../../../src/destroy.js";
import { BRANCH_PREFIX } from "../../util.js";
import { waitForStableDeletion } from "./test-utils.js";
// must import this or else alchemy.test won't exist
import "../../../src/test/vitest.js";

const client = await createCloudControlClient();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  quiet: true,
});

describe("CloudControlResource", () => {
  const testId = `${BRANCH_PREFIX}-test-bucket-resource`;

  test("create, update, and delete S3 bucket", async (scope) => {
    let resource: CloudControlResource | undefined;
    try {
      // Create a test S3 bucket
      resource = await CloudControlResource(testId, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: testId,
          VersioningConfiguration: {
            Status: "Enabled",
          },
        },
        adopt: true,
      });

      expect(resource.id).toBeTruthy();
      expect(resource.typeName).toEqual("AWS::S3::Bucket");

      // Verify bucket was created by querying the API directly
      const getResponse = (await client.getResource(
        "AWS::S3::Bucket",
        resource.id,
      ))!;
      expect(getResponse.BucketName).toEqual(testId);
      expect(getResponse.VersioningConfiguration.Status).toEqual("Enabled");

      // Update the bucket configuration
      resource = await CloudControlResource(testId, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: testId,
          VersioningConfiguration: {
            Status: "Suspended",
          },
        },
      });

      expect(resource.id).toBeTruthy();

      // Verify bucket was updated
      const getUpdatedResponse = (await client.getResource(
        "AWS::S3::Bucket",
        resource.id,
      ))!;
      expect(getUpdatedResponse.VersioningConfiguration.Status).toEqual(
        "Suspended",
      );
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify bucket was deleted with stable check
      if (resource?.id) {
        await waitForStableDeletion("AWS::S3::Bucket", resource.id);
      }
    }
  });

  test("adopt existing resource with different ID", async (scope) => {
    const bucketName = `${testId}-adopt-test`;
    const firstId = `${testId}-adopt-first`;
    const secondId = `${testId}-adopt-second`;

    let firstResource: CloudControlResource | undefined;
    let secondResource: CloudControlResource | undefined;

    try {
      // Create first bucket
      firstResource = await CloudControlResource(firstId, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: bucketName,
          VersioningConfiguration: {
            Status: "Enabled",
          },
        },
        adopt: true,
      });

      expect(firstResource.id).toBeTruthy();
      expect(firstResource.typeName).toEqual("AWS::S3::Bucket");

      // Verify first bucket was created
      const getFirstResponse = (await client.getResource(
        "AWS::S3::Bucket",
        firstResource.id,
      ))!;
      expect(getFirstResponse.BucketName).toEqual(bucketName);
      expect(getFirstResponse.VersioningConfiguration.Status).toEqual(
        "Enabled",
      );

      // Try to create second bucket with same name but different ID - should adopt the existing one
      secondResource = await CloudControlResource(secondId, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: bucketName, // Same bucket name
          VersioningConfiguration: {
            Status: "Suspended", // Different config
          },
        },
        adopt: true, // Enable adoption
      });

      expect(secondResource.id).toBeTruthy();
      expect(secondResource.id).toEqual(firstResource.id); // Should have same underlying resource ID
      expect(secondResource.typeName).toEqual("AWS::S3::Bucket");

      // Verify the bucket was updated with new configuration
      const getSecondResponse = (await client.getResource(
        "AWS::S3::Bucket",
        secondResource.id,
      ))!;
      expect(getSecondResponse.BucketName).toEqual(bucketName);
      expect(getSecondResponse.VersioningConfiguration.Status).toEqual(
        "Suspended",
      );
    } finally {
      // Clean up
      await destroy(scope);

      // Verify bucket was deleted with stable check
      if (firstResource?.id) {
        await waitForStableDeletion("AWS::S3::Bucket", firstResource.id);
      }
    }
  });

  test("replace resource when immutable property changes", async (scope) => {
    const testBucketName = `${testId}-immutable-test`;
    let resource: CloudControlResource | undefined;

    try {
      // Create a test S3 bucket with initial configuration
      resource = await CloudControlResource(testBucketName, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: testBucketName,
          VersioningConfiguration: {
            Status: "Enabled",
          },
        },
        adopt: true,
      });

      expect(resource.id).toBeTruthy();
      const originalId = resource.id;

      // Verify bucket was created
      const getResponse = (await client.getResource(
        "AWS::S3::Bucket",
        resource.id,
      ))!;
      expect(getResponse.BucketName).toEqual(testBucketName);

      // Try to change the bucket name (which is immutable)
      // This should trigger a replacement
      const newBucketName = `${testBucketName}-replaced`;
      resource = await CloudControlResource(testBucketName, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: newBucketName, // Changing bucket name (immutable)
          VersioningConfiguration: {
            Status: "Enabled",
          },
        },
      });

      expect(resource.id).toBeTruthy();
      // The resource ID should be different because it was replaced
      expect(resource.id).not.toEqual(originalId);

      // Verify the new bucket has the correct name
      const getNewResponse = (await client.getResource(
        "AWS::S3::Bucket",
        resource.id,
      ))!;
      expect(getNewResponse.BucketName).toEqual(newBucketName);

      await scope.finalize();

      // Verify the old bucket no longer exists
      const oldBucketExists = await client.getResource(
        "AWS::S3::Bucket",
        originalId,
      );
      expect(oldBucketExists).toBeUndefined();
    } finally {
      // Always clean up
      await destroy(scope);

      // Verify bucket was deleted
      if (resource?.id) {
        await waitForStableDeletion("AWS::S3::Bucket", resource.id);
      }
    }
  });

  test("replace resource when it no longer exists on update", async (scope) => {
    const testBucketName = `${testId}-gone-test`;
    let resource: CloudControlResource | undefined;

    try {
      // Create a test S3 bucket
      resource = await CloudControlResource(testBucketName, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: testBucketName,
          VersioningConfiguration: {
            Status: "Enabled",
          },
        },
        adopt: true,
      });

      expect(resource.id).toBeTruthy();

      // Delete the bucket out-of-band (outside of alchemy)
      await client.deleteResource("AWS::S3::Bucket", resource.id);
      await waitForStableDeletion("AWS::S3::Bucket", resource.id);

      // Update the resource - the empty read-back should trigger a replacement
      // instead of falling through to UpdateResource against a missing resource
      resource = await CloudControlResource(testBucketName, {
        typeName: "AWS::S3::Bucket",
        desiredState: {
          BucketName: testBucketName,
          VersioningConfiguration: {
            Status: "Suspended",
          },
        },
      });

      expect(resource.id).toBeTruthy();

      // Verify the bucket was recreated with the new configuration.
      // The replacement is forced (delete-before-create), so the recreated
      // bucket must still exist even though it reuses the same identifier.
      const getResponse = (await client.getResource(
        "AWS::S3::Bucket",
        resource.id,
      ))!;
      expect(getResponse.BucketName).toEqual(testBucketName);
      expect(getResponse.VersioningConfiguration.Status).toEqual("Suspended");
    } finally {
      // Always clean up
      await destroy(scope);

      // Verify bucket was deleted
      if (resource?.id) {
        await waitForStableDeletion("AWS::S3::Bucket", resource.id);
      }
    }
  });

  test("wildcard deletion handler", async (scope) => {
    const bucketIds = [`${testId}-wildcard-1`, `${testId}-wildcard-2`];
    const resources: CloudControlResource[] = [];

    try {
      // Create multiple test buckets
      for (const bucketId of bucketIds) {
        const resource = await CloudControlResource(bucketId, {
          typeName: "AWS::S3::Bucket",
          desiredState: {
            BucketName: bucketId,
          },
          adopt: true,
        });
        resources.push(resource);
      }

      // Verify buckets were created
      for (const resource of resources) {
        const getResponse = await client.getResource(
          "AWS::S3::Bucket",
          resource.id,
        );
        expect(getResponse?.BucketName).toBeTruthy();
      }

      // Trigger wildcard deletion
      await destroy(scope);

      // Verify all buckets were deleted with stable checks
      for (const resource of resources) {
        await waitForStableDeletion("AWS::S3::Bucket", resource.id);
      }
    } finally {
      // Clean up in case any test assertions failed
      await destroy(scope);
    }
  });
});
