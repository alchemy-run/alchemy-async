import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { R2Bucket } from "../../src/cloudflare/bucket.ts";
import { Queue } from "../../src/cloudflare/queue.ts";
import {
  listR2BucketNotifications,
  R2BucketNotification,
  type R2BucketNotificationMessage,
} from "../../src/cloudflare/r2-bucket-notification.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi({});

describe("R2BucketNotification Resource", () => {
  const testId = `${BRANCH_PREFIX.toLowerCase()}-r2-notif`;

  test("create and delete notification rule", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-bucket`, {
        name: `${testId}-bucket`,
        adopt: true,
      });

      expect(bucket.name).toBeTruthy();

      queue = await Queue<R2BucketNotificationMessage>(`${testId}-queue`, {
        name: `${testId}-queue`,
        adopt: true,
      });

      expect(queue.name).toBeTruthy();

      notification = await R2BucketNotification(`${testId}-notification`, {
        bucket,
        queue,
        eventTypes: ["object-create"],
        adopt: true,
      });

      expect(notification.ruleId).toBeTruthy();
      expect(notification.bucketName).toEqual(bucket.name);
      expect(notification.queueName).toEqual(queue.name);
      expect(notification.eventTypes).toContain("object-create");

      const rules = await listR2BucketNotifications(api, bucket.name);
      const foundRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(foundRule).toBeTruthy();
      expect(foundRule?.queueName).toEqual(queue.name);
    } catch (err) {
      console.error("Create notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("create notification with prefix and suffix filters", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-filter-bucket`, {
        name: `${testId}-filter-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-filter-queue`,
        {
          name: `${testId}-filter-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-filter-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: "uploads/",
          suffix: ".json",
          description: "Test filtered notification",
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.prefix).toEqual("uploads/");
      expect(notification.suffix).toEqual(".json");

      const rules = await listR2BucketNotifications(api, bucket.name);
      const foundRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(foundRule).toBeTruthy();
      expect(foundRule?.prefix).toEqual("uploads/");
      expect(foundRule?.suffix).toEqual(".json");
    } catch (err) {
      console.error("Filter notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("create notification with multiple event types", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-multi-bucket`, {
        name: `${testId}-multi-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-multi-queue`,
        {
          name: `${testId}-multi-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-multi-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create", "object-delete"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.eventTypes).toContain("object-create");
      expect(notification.eventTypes).toContain("object-delete");

      const rules = await listR2BucketNotifications(api, bucket.name);
      const foundRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(foundRule).toBeTruthy();
      expect(foundRule?.actions).toContain("PutObject");
      expect(foundRule?.actions).toContain("DeleteObject");
    } catch (err) {
      console.error("Multi event type notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("update notification rule by reconciliation", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-update-bucket`, {
        name: `${testId}-update-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-update-queue`,
        {
          name: `${testId}-update-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-update-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      const originalRuleId = notification.ruleId;

      notification = await R2BucketNotification(
        `${testId}-update-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: "new-prefix/",
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.ruleId).not.toEqual(originalRuleId);
      expect(notification.prefix).toEqual("new-prefix/");

      const rules = await listR2BucketNotifications(api, bucket.name);
      const oldRule = rules.find((r) => r.ruleId === originalRuleId);
      expect(oldRule).toBeUndefined();

      const newRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(newRule).toBeTruthy();
      expect(newRule?.prefix).toEqual("new-prefix/");
    } catch (err) {
      console.error("Update notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("update notification event types by reconciliation", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-update-events-bucket`, {
        name: `${testId}-update-events-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-update-events-queue`,
        {
          name: `${testId}-update-events-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-update-events-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.eventTypes).toContain("object-create");
      expect(notification.eventTypes).not.toContain("object-delete");
      const originalRuleId = notification.ruleId;

      notification = await R2BucketNotification(
        `${testId}-update-events-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create", "object-delete"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.ruleId).not.toEqual(originalRuleId);
      expect(notification.eventTypes).toContain("object-create");
      expect(notification.eventTypes).toContain("object-delete");

      const rules = await listR2BucketNotifications(api, bucket.name);
      const oldRule = rules.find((r) => r.ruleId === originalRuleId);
      expect(oldRule).toBeUndefined();

      const newRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(newRule).toBeTruthy();
      expect(newRule?.actions).toContain("PutObject");
      expect(newRule?.actions).toContain("DeleteObject");
    } catch (err) {
      console.error("Update event types notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("adopt existing notification rule", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification1: R2BucketNotification | undefined;
    let notification2: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-adopt-bucket`, {
        name: `${testId}-adopt-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-adopt-queue`,
        {
          name: `${testId}-adopt-queue`,
          adopt: true,
        },
      );

      notification1 = await R2BucketNotification(
        `${testId}-adopt-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: "test/",
          adopt: true,
        },
      );

      expect(notification1.ruleId).toBeTruthy();

      notification2 = await R2BucketNotification(
        `${testId}-adopt-notification-2`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: "test/",
          adopt: true,
        },
      );

      expect(notification2.ruleId).toEqual(notification1.ruleId);
    } catch (err) {
      console.error("Adopt notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("notification with string bucket and queue names", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-string-bucket`, {
        name: `${testId}-string-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-string-queue`,
        {
          name: `${testId}-string-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-string-notification`,
        {
          bucket: bucket.name,
          queue: queue.name,
          eventTypes: ["object-delete"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(notification.bucketName).toEqual(bucket.name);
      expect(notification.queueName).toEqual(queue.name);

      const rules = await listR2BucketNotifications(api, bucket.name);
      const foundRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(foundRule).toBeTruthy();
    } catch (err) {
      console.error("String names notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("notification with EU jurisdiction bucket", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-eu-bucket`, {
        name: `${testId}-eu-bucket`,
        jurisdiction: "eu",
        adopt: true,
      });

      expect(bucket.jurisdiction).toEqual("eu");

      queue = await Queue<R2BucketNotificationMessage>(`${testId}-eu-queue`, {
        name: `${testId}-eu-queue`,
        adopt: true,
      });

      notification = await R2BucketNotification(`${testId}-eu-notification`, {
        bucket,
        queue,
        eventTypes: ["object-create"],
        adopt: true,
      });

      expect(notification.ruleId).toBeTruthy();
      expect(notification.bucketName).toEqual(bucket.name);
      expect(notification.jurisdiction).toEqual("eu");

      const rules = await listR2BucketNotifications(api, bucket.name, {
        jurisdiction: "eu",
      });
      const foundRule = rules.find((r) => r.ruleId === notification!.ruleId);
      expect(foundRule).toBeTruthy();
    } catch (err) {
      console.error("EU jurisdiction notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("notification with multiple suffixes creates multiple rules", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-multi-suffix-bucket`, {
        name: `${testId}-multi-suffix-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-multi-suffix-queue`,
        {
          name: `${testId}-multi-suffix-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-multi-suffix-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: "audio/",
          suffix: [".mp3", ".wav", ".flac"],
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(Array.isArray(notification.ruleId)).toBe(true);
      expect((notification.ruleId as string[]).length).toBe(3);
      expect(notification.suffix).toEqual([".mp3", ".wav", ".flac"]);

      const rules = await listR2BucketNotifications(api, bucket.name);
      const ruleIds = notification.ruleId as string[];

      const ourRules = rules.filter((r) => ruleIds.includes(r.ruleId));
      expect(ourRules.length).toBe(3);

      for (const ruleId of ruleIds) {
        const foundRule = rules.find((r) => r.ruleId === ruleId);
        expect(foundRule).toBeTruthy();
        expect(foundRule?.prefix).toEqual("audio/");
      }

      const suffixes = ourRules.map((r) => r.suffix);
      expect(suffixes).toContain(".mp3");
      expect(suffixes).toContain(".wav");
      expect(suffixes).toContain(".flac");
    } catch (err) {
      console.error("Multi suffix notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });

  test("notification with multiple prefixes creates multiple rules", async (scope) => {
    let bucket: R2Bucket | undefined;
    let queue: Queue | undefined;
    let notification: R2BucketNotification | undefined;

    try {
      bucket = await R2Bucket(`${testId}-multi-prefix-bucket`, {
        name: `${testId}-multi-prefix-bucket`,
        adopt: true,
      });

      queue = await Queue<R2BucketNotificationMessage>(
        `${testId}-multi-prefix-queue`,
        {
          name: `${testId}-multi-prefix-queue`,
          adopt: true,
        },
      );

      notification = await R2BucketNotification(
        `${testId}-multi-prefix-notification`,
        {
          bucket,
          queue,
          eventTypes: ["object-create"],
          prefix: ["uploads/", "imports/", "temp/"],
          suffix: ".json",
          adopt: true,
        },
      );

      expect(notification.ruleId).toBeTruthy();
      expect(Array.isArray(notification.ruleId)).toBe(true);
      expect((notification.ruleId as string[]).length).toBe(3);
      expect(notification.prefix).toEqual(["uploads/", "imports/", "temp/"]);

      const rules = await listR2BucketNotifications(api, bucket.name);
      const ruleIds = notification.ruleId as string[];

      const ourRules = rules.filter((r) => ruleIds.includes(r.ruleId));
      expect(ourRules.length).toBe(3);

      for (const ruleId of ruleIds) {
        const foundRule = rules.find((r) => r.ruleId === ruleId);
        expect(foundRule).toBeTruthy();
        expect(foundRule?.suffix).toEqual(".json");
      }

      const prefixes = ourRules.map((r) => r.prefix);
      expect(prefixes).toContain("uploads/");
      expect(prefixes).toContain("imports/");
      expect(prefixes).toContain("temp/");
    } catch (err) {
      console.error("Multi prefix notification test error:", err);
      throw err;
    } finally {
      await destroy(scope);
    }
  });
});
