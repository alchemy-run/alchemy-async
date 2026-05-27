import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { R2Object } from "../../src/cloudflare/bucket-object.ts";
import { R2Bucket } from "../../src/cloudflare/bucket.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("R2Object Resource", async () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testBucketName = `${BRANCH_PREFIX.toLowerCase()}-test-bucket-objects`;

  test("create, update, and delete object", async (scope) => {
    let bucket: R2Bucket | undefined;

    try {
      // Create a test bucket first
      bucket = await R2Bucket("test-bucket", {
        name: testBucketName,
        adopt: true,
        empty: true,
      });

      // Create a simple text object
      await verify("test-file.txt", "Hello, R2Object!");
      await verify("test-file.txt", "Updated content!");
      await verify("new-test-file.txt", "New test file content!");
      await scope.finalize(); // force replacements to flush
      await expect(bucket.head("test-file.txt")).resolves.toBeNull();

      async function verify(key: string, content: string) {
        const object = await R2Object("test-object", {
          bucket: bucket!,
          key,
          content,
        });
        expect(object.id).toEqual("test-object");
        expect(object.key).toEqual(key);

        // Verify object exists in bucket
        const headResult = await bucket!.head(key);
        expect(headResult).toBeDefined();
        expect(headResult?.size).toBeGreaterThan(0);

        // Get and verify content
        const getResult = await bucket!.get(key);
        expect(await getResult?.text()).toEqual(content);
      }
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      // Clean up - destroy will handle both object and bucket deletion
      await alchemy.destroy(scope);

      // Verify object was deleted
      if (bucket) {
        const deletedResult = await bucket.head("test-file.txt");
        expect(deletedResult).toBeNull();
      }
    }
  });

  test("object with JSON content", async (scope) => {
    let bucket: R2Bucket | undefined;

    try {
      bucket = await R2Bucket("json-bucket", {
        name: `${testBucketName}-json`,
        adopt: true,
        empty: true,
      });

      const configData = { version: "1.0.0", debug: true, features: ["auth"] };
      const jsonObject = await R2Object("config", {
        bucket: bucket,
        key: "config/app.json",
        content: JSON.stringify(configData),
      });

      expect(jsonObject.key).toEqual("config/app.json");

      // Verify JSON content
      const result = await bucket.get("config/app.json");
      const retrievedData = JSON.parse((await result?.text()) || "{}");
      expect(retrievedData).toEqual(configData);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("object in eu jurisdiction bucket", async (scope) => {
    let bucket: R2Bucket | undefined;

    try {
      bucket = await R2Bucket("eu-bucket", {
        name: `${testBucketName}-eu`,
        jurisdiction: "eu",
        adopt: true,
        empty: true,
      });
      expect(bucket.jurisdiction).toEqual("eu");

      const key = "eu/hello.txt";
      const content = "Bonjour from the EU jurisdiction!";

      const object = await R2Object("eu-object", {
        bucket,
        key,
        content,
      });
      expect(object.key).toEqual(key);

      const headResult = await bucket.head(key);
      expect(headResult).toBeDefined();
      expect(headResult?.size).toBeGreaterThan(0);

      const getResult = await bucket.get(key);
      expect(await getResult?.text()).toEqual(content);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      await alchemy.destroy(scope);

      if (bucket) {
        const deletedResult = await bucket.head("eu/hello.txt");
        expect(deletedResult).toBeNull();
      }
    }
  });

  test("object with binary content", async (scope) => {
    let bucket: R2Bucket | undefined;

    try {
      bucket = await R2Bucket("binary-bucket", {
        name: `${testBucketName}-binary`,
        adopt: true,
        empty: true,
      });

      const key = "data/binary.bin2";

      const binaryObject = await R2Object("binary-file", {
        bucket,
        key,
        content: createBuf(42),
      });

      expect(binaryObject.key).toEqual(key);

      // Verify binary content
      await testBinary(bucket, key, 42);

      await R2Object("binary-file", {
        bucket,
        key,
        content: createBuf(24),
      });

      await testBinary(bucket, key, 24);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      await alchemy.destroy(scope);
    }
  });
});

function createBuf(value: number) {
  const binaryData = new ArrayBuffer(1024);
  const view = new Uint8Array(binaryData);
  view.fill(Math.floor(value)); // Fill with some test data

  return binaryData;
}

async function testBinary(bucket: R2Bucket, key: string, value: number) {
  const result = await bucket.get(key);
  const retrievedBuffer = await result?.arrayBuffer();
  expect(retrievedBuffer?.byteLength).toEqual(1024);

  const retrievedView = new Uint8Array(retrievedBuffer!);
  expect(retrievedView[0]).toEqual(value);
  expect(retrievedView[500]).toEqual(value);
}
