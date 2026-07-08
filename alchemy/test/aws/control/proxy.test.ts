import { describe, expect } from "vitest";
import { alchemy } from "../../../src/alchemy.js";
import AWS from "../../../src/aws/control/index.js";
import { destroy } from "../../../src/destroy.js";
import { BRANCH_PREFIX } from "../../util.js";
import { waitForStableDeletion } from "./test-utils.js";
// must import this or else alchemy.test won't exist
import { ValidationException } from "../../../src/aws/control/error.js";
import "../../../src/test/vitest.js";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const FIVE_MINUTES = 5 * 60 * 1000;

describe("AWS Cloud Control Proxy", () => {
  // see the note on testId in resource.test.ts: this base name must never
  // collide with a bucket name owned by another AWS account
  const testId = `${BRANCH_PREFIX}-cc-proxy-test`;

  test(
    "create, update, and delete S3 bucket using proxy interface",
    async (scope) => {
      let bucket: any;
      try {
        // Create a test S3 bucket using the proxy interface
        bucket = await AWS.S3.Bucket(testId, {
          BucketName: testId,
          VersioningConfiguration: {
            Status: "Enabled",
          },
          adopt: true,
        });

        expect(bucket.BucketName).toEqual(testId);
        expect(bucket.VersioningConfiguration.Status).toEqual("Enabled");

        // Update the bucket configuration
        bucket = await AWS.S3.Bucket(testId, {
          BucketName: testId,
          VersioningConfiguration: {
            Status: "Suspended",
          },
        });

        expect(bucket.BucketName).toEqual(testId);
        expect(bucket.VersioningConfiguration.Status).toEqual("Suspended");
      } finally {
        // Clean up
        await destroy(scope);

        // Verify bucket was deleted with stable check
        if (bucket?.BucketName) {
          await waitForStableDeletion("AWS::S3::Bucket", bucket.BucketName);
        }
      }
    },
    FIVE_MINUTES,
  );

  test(
    "adopt existing resource with different ID using proxy",
    async (scope) => {
      const bucketName = `${testId}-adopt-proxy-test`;
      const firstId = `${testId}-proxy-first`;
      const secondId = `${testId}-proxy-second`;

      let firstBucket: any;
      let secondBucket: any;

      try {
        // Create first bucket using proxy interface
        firstBucket = await AWS.S3.Bucket(firstId, {
          BucketName: bucketName,
          VersioningConfiguration: {
            Status: "Enabled",
          },
          adopt: true,
        });

        expect(firstBucket.BucketName).toEqual(bucketName);
        expect(firstBucket.VersioningConfiguration.Status).toEqual("Enabled");

        // Try to create second bucket with same name but different ID - should adopt the existing one
        secondBucket = await AWS.S3.Bucket(secondId, {
          BucketName: bucketName, // Same bucket name
          VersioningConfiguration: {
            Status: "Suspended", // Different config
          },
          adopt: true, // Enable adoption
        });

        expect(secondBucket.BucketName).toEqual(bucketName);
        expect(secondBucket.VersioningConfiguration.Status).toEqual(
          "Suspended",
        );

        // Both should reference the same underlying AWS resource
        // Note: We can't directly compare IDs here since the proxy interface
        // doesn't expose the internal resource ID, but we can verify the
        // bucket name and that the configuration was updated
      } finally {
        // Clean up
        await destroy(scope);

        // Verify bucket was deleted with stable check
        if (firstBucket?.BucketName) {
          await waitForStableDeletion(
            "AWS::S3::Bucket",
            firstBucket.BucketName,
          );
        }
      }
    },
    FIVE_MINUTES,
  );

  test(
    "proxy constructs correct type names",
    async (scope) => {
      const testRoleId = `${BRANCH_PREFIX}-test-role`;
      try {
        const role = await AWS.IAM.Role(testRoleId, {
          RoleName: testRoleId,
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "lambda.amazonaws.com",
                },
                Action: "sts:AssumeRole",
              },
            ],
          },
          adopt: true,
        });

        expect(role.RoleName).toEqual(testRoleId);
      } finally {
        await destroy(scope);
      }
    },
    FIVE_MINUTES,
  );

  test(
    "handles invalid bucket configuration",
    async (scope) => {
      try {
        // Attempt to create a bucket with invalid configuration
        await AWS.S3.Bucket("bucket", {
          BucketName: "invalid/bucket/name", // Invalid character in bucket name
          VersioningConfiguration: {
            Status: "InvalidStatus", // Invalid versioning status
          },
          adopt: true,
        });
        throw new Error("Should have thrown an error");
      } catch (error: any) {
        expect(error).toBeInstanceOf(ValidationException);
      } finally {
        await destroy(scope);
      }
    },
    FIVE_MINUTES,
  );

  test(
    "create and delete DynamoDB table",
    async (scope) => {
      const tableId = `${BRANCH_PREFIX}-test-table`;
      try {
        const table = await AWS.DynamoDB.Table(tableId, {
          TableName: tableId,
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            } as const,
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            } as const,
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
          adopt: true,
        });

        expect(table.TableName).toEqual(tableId);
        expect(table.KeySchema).toHaveLength(1);
        expect(table.KeySchema[0].AttributeName).toEqual("id");
      } finally {
        await destroy(scope);
      }
    },
    FIVE_MINUTES,
  );

  test(
    "create and delete Lambda function",
    async (scope) => {
      const functionId = `${BRANCH_PREFIX}-test-function`;
      const roleId = `${BRANCH_PREFIX}-test-function-role`;

      try {
        // Create execution role for Lambda
        const role = await AWS.IAM.Role(roleId, {
          RoleName: roleId,
          AssumeRolePolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  Service: "lambda.amazonaws.com",
                },
                Action: "sts:AssumeRole",
              },
            ],
          },
          ManagedPolicyArns: [
            "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          ],
          adopt: true,
        });

        // Create Lambda function after ensuring role exists
        const func = await AWS.Lambda.Function(functionId, {
          FunctionName: functionId,
          Role: role.Arn!,
          Code: {
            ZipFile: "exports.handler = async () => ({ statusCode: 200 });",
          },
          Handler: "index.handler",
          Runtime: "nodejs20.x",
          adopt: true,
        });

        expect(func.FunctionName).toEqual(functionId);
        expect(func.Runtime).toEqual("nodejs20.x");
      } finally {
        await destroy(scope);
      }
    },
    FIVE_MINUTES,
  );
});
