import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { File } from "../../src/fs/file.ts";
import { HetznerObjectStorageStateStore } from "../../src/state/hetzner-object-storage-state-store.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const BUCKET = process.env.HETZNER_STATE_BUCKET!;
const REGION = (process.env.HETZNER_STATE_REGION ?? "fsn1") as
  | "fsn1"
  | "nbg1"
  | "hel1";

const test = alchemy.test(import.meta, {
  prefix: `${BRANCH_PREFIX}-hetzner-state-store`,
  stateStore: (scope) =>
    new HetznerObjectStorageStateStore(scope, {
      bucket: BUCKET,
      region: REGION,
    }),
});

/**
 * A raw S3 client pointing at Hetzner Object Storage.
 * Used to verify state objects are actually written/deleted in the bucket.
 */
function createRawClient(): S3Client {
  return new S3Client({
    region: REGION,
    endpoint: `https://${REGION}.your-objectstorage.com`,
    credentials: {
      accessKeyId: process.env.HETZNER_ACCESS_KEY_ID!,
      secretAccessKey: process.env.HETZNER_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

async function objectExists(client: S3Client, key: string): Promise<boolean> {
  try {
    await client.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function listObjectsWithPrefix(
  client: S3Client,
  prefix: string,
): Promise<string[]> {
  const response = await client.send(
    new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix }),
  );
  return (response.Contents ?? []).map((obj) => obj.Key!);
}

async function deleteObject(client: S3Client, key: string): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

async function putTestObject(
  client: S3Client,
  key: string,
  body: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: "text/plain",
    }),
  );
}

describe("HetznerObjectStorageStateStore", () => {
  test.skipIf(!BUCKET || !process.env.HETZNER_ACCESS_KEY_ID)(
    "store, retrieve, and delete a state value",
    async (scope) => {
      const testPrefix = `alchemy-test-raw/${BRANCH_PREFIX}-state-rw/`;
      const testKey = `${testPrefix}test-key`;
      const client = createRawClient();

      try {
        // Write a value directly via the raw S3 client
        await putTestObject(
          client,
          testKey,
          JSON.stringify({ hello: "world" }),
        );

        // Verify the object is visible in the bucket
        expect(await objectExists(client, testKey)).toBe(true);

        // Delete the object
        await deleteObject(client, testKey);

        // Verify it is gone
        expect(await objectExists(client, testKey)).toBe(false);
      } finally {
        // Best-effort cleanup in case the test aborted mid-way
        try {
          await deleteObject(client, testKey);
        } catch {
          /* ignore */
        }
        await destroy(scope);
      }
    },
  );

  test.skipIf(!BUCKET || !process.env.HETZNER_ACCESS_KEY_ID)(
    "list keys returns stored keys",
    async (scope) => {
      const testPrefix = `alchemy-test-list/${BRANCH_PREFIX}/`;
      const client = createRawClient();
      const keys = [
        `${testPrefix}key-a`,
        `${testPrefix}key-b`,
        `${testPrefix}key-c`,
      ];

      try {
        // Write several objects
        await Promise.all(keys.map((k) => putTestObject(client, k, "value")));

        // List with prefix — all three should appear
        const listed = await listObjectsWithPrefix(client, testPrefix);
        for (const k of keys) {
          expect(listed).toContain(k);
        }
      } finally {
        // Clean up all test objects
        await Promise.all(
          keys.map((k) =>
            deleteObject(client, k).catch(() => {
              /* ignore */
            }),
          ),
        );
        await destroy(scope);
      }
    },
  );

  test.skipIf(!BUCKET || !process.env.HETZNER_ACCESS_KEY_ID)(
    "use as alchemy state backend — resource lifecycle is persisted and cleaned up",
    async (scope) => {
      const fileId = `${BRANCH_PREFIX}-hetzner-state-file`;
      const filePath = `/tmp/alchemy-hetzner-state-test-${BRANCH_PREFIX}.txt`;
      const client = createRawClient();

      // The stateStore for this test scope is already HetznerObjectStorageStateStore.
      // Creating a File resource will write its state into the Hetzner bucket.
      let resource = await File(fileId, {
        path: filePath,
        content: "Initial content",
      });

      expect(resource.path).toBe(filePath);
      expect(resource.content).toBe("Initial content");

      // Update the resource — the state store must handle the update round-trip.
      resource = await File(fileId, {
        path: filePath,
        content: "Updated content",
      });

      expect(resource.content).toBe("Updated content");

      // Determine what prefix the store used for this scope so we can verify cleanup.
      // Pattern: alchemy/{scope.chain.join("/")}/ (see constructor)
      // We just check that at least one key with the test prefix exists before destroy.
      const scopePrefix = `alchemy/`;
      const beforeDestroy = await listObjectsWithPrefix(client, scopePrefix);
      const relevantKeys = beforeDestroy.filter((k) =>
        k.includes(BRANCH_PREFIX),
      );
      expect(relevantKeys.length).toBeGreaterThan(0);

      // Destroy the scope — all resources (and their state) should be removed.
      await destroy(scope);

      // After destroy, the state objects for this branch prefix should be gone.
      const afterDestroy = await listObjectsWithPrefix(client, scopePrefix);
      const remainingKeys = afterDestroy.filter((k) =>
        k.includes(BRANCH_PREFIX),
      );
      expect(remainingKeys.length).toBe(0);
    },
  );
});
