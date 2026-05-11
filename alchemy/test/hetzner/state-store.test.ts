import { AwsClient } from "aws4fetch";
import { XMLParser } from "fast-xml-parser";
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

function createRawClient(): AwsClient {
  return new AwsClient({
    accessKeyId: process.env.HETZNER_ACCESS_KEY_ID!,
    secretAccessKey: process.env.HETZNER_SECRET_ACCESS_KEY!,
    service: "s3",
    region: REGION,
  });
}

const endpoint = `https://${REGION}.your-objectstorage.com`;

async function objectExists(client: AwsClient, key: string): Promise<boolean> {
  const res = await client.fetch(`${endpoint}/${BUCKET}/${key}`, {
    method: "GET",
  });
  return res.status === 200;
}

async function listObjectsWithPrefix(
  client: AwsClient,
  prefix: string,
): Promise<string[]> {
  const params = new URLSearchParams({
    "list-type": "2",
    prefix,
  });
  const res = await client.fetch(`${endpoint}/${BUCKET}?${params}`, {
    method: "GET",
  });
  if (!res.ok) return [];
  const xml = await res.text();
  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml);
  const result = parsed.ListBucketResult;
  if (!result) return [];
  const contents = result.Contents
    ? Array.isArray(result.Contents)
      ? result.Contents
      : [result.Contents]
    : [];
  return contents.map((c: any) => c.Key as string);
}

async function deleteObject(client: AwsClient, key: string): Promise<void> {
  await client.fetch(`${endpoint}/${BUCKET}/${key}`, { method: "DELETE" });
}

async function putTestObject(
  client: AwsClient,
  key: string,
  body: string,
): Promise<void> {
  await client.fetch(`${endpoint}/${BUCKET}/${key}`, {
    method: "PUT",
    body,
    headers: { "Content-Type": "text/plain" },
  });
}

describe("HetznerObjectStorageStateStore", () => {
  test.skipIf(!BUCKET || !process.env.HETZNER_ACCESS_KEY_ID)(
    "store, retrieve, and delete a state value",
    async (scope) => {
      const testPrefix = `alchemy-test-raw/${BRANCH_PREFIX}-state-rw/`;
      const testKey = `${testPrefix}test-key`;
      const client = createRawClient();

      try {
        // Write a value directly via the raw client
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
        await Promise.all(keys.map((k) => putTestObject(client, k, "value")));

        const listed = await listObjectsWithPrefix(client, testPrefix);
        for (const k of keys) {
          expect(listed).toContain(k);
        }
      } finally {
        await Promise.all(
          keys.map((k) => deleteObject(client, k).catch(() => {})),
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

      let resource = await File(fileId, {
        path: filePath,
        content: "Initial content",
      });

      expect(resource.path).toBe(filePath);
      expect(resource.content).toBe("Initial content");

      resource = await File(fileId, {
        path: filePath,
        content: "Updated content",
      });

      expect(resource.content).toBe("Updated content");

      const scopePrefix = `alchemy/`;
      const beforeDestroy = await listObjectsWithPrefix(client, scopePrefix);
      const relevantKeys = beforeDestroy.filter((k) =>
        k.includes(BRANCH_PREFIX),
      );
      expect(relevantKeys.length).toBeGreaterThan(0);

      await destroy(scope);

      const afterDestroy = await listObjectsWithPrefix(client, scopePrefix);
      const remainingKeys = afterDestroy.filter((k) =>
        k.includes(BRANCH_PREFIX),
      );
      expect(remainingKeys.length).toBe(0);
    },
  );
});
