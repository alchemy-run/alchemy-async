import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { withJurisdiction, type R2Bucket } from "./bucket.ts";
import { findQueueByName, type Queue } from "./queue.ts";

/**
 * Event types that can trigger R2 bucket notifications
 */
export type R2BucketNotificationEventType = "object-create" | "object-delete";

/**
 * Message payload sent to a Queue when an R2 bucket notification is triggered
 *
 * @see https://developers.cloudflare.com/r2/buckets/event-notifications/#message-format
 */
export interface R2BucketNotificationMessage {
  /**
   * The Cloudflare account ID that the event is associated with
   */
  account: string;

  /**
   * The type of action that triggered the event notification
   * Example actions include: PutObject, CopyObject, CompleteMultipartUpload, DeleteObject
   */
  action: string;

  /**
   * The name of the bucket where the event occurred
   */
  bucket: string;

  /**
   * Details about the object involved in the event
   */
  object: {
    /**
     * The key (or name) of the object within the bucket
     */
    key: string;

    /**
     * The size of the object in bytes (not present for object-delete events)
     */
    size?: number;

    /**
     * The entity tag (eTag) of the object (not present for object-delete events)
     */
    eTag?: string;
  };

  /**
   * The time when the action that triggered the event occurred (ISO 8601 format)
   */
  eventTime: string;

  /**
   * Details about the source of a copied object (only present for CopyObject events)
   */
  copySource?: {
    /**
     * The bucket that contained the source object
     */
    bucket: string;

    /**
     * The name of the source object
     */
    object: string;
  };
}

/**
 * Base properties shared by all R2 Bucket Notification configurations
 */
interface R2BucketNotificationBaseProps extends CloudflareApiOptions {
  /**
   * The R2 bucket to attach the notification rule to.
   * Can be either a bucket name (string) or an R2Bucket resource.
   */
  bucket: string | R2Bucket;

  /**
   * The queue that will receive notification messages.
   * Can be either a queue name (string) or a Queue resource.
   */
  queue: string | Queue;

  /**
   * The type of events that will trigger notifications.
   * - "object-create": Triggered when objects are created or overwritten (PutObject, CompleteMultipartUpload)
   * - "object-delete": Triggered when objects are deleted (DeleteObject, CopyObject, LifecycleDeletion)
   */
  eventTypes: R2BucketNotificationEventType[];

  /**
   * Optional description for the notification rule to help identify it.
   */
  description?: string;

  /**
   * The jurisdiction where the bucket exists.
   * Required for EU or FedRAMP jurisdictions.
   */
  jurisdiction?: "default" | "eu" | "fedramp";

  /**
   * Whether to delete the notification rule when the resource is removed from Alchemy.
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to adopt an existing notification rule if one already exists with the same configuration.
   * @default false
   */
  adopt?: boolean;
}

/**
 * Props with single prefix and suffix (creates one rule)
 */
interface R2BucketNotificationSingleProps extends R2BucketNotificationBaseProps {
  /**
   * Optional prefix filter - only objects with keys starting with this prefix will trigger notifications.
   */
  prefix?: string;

  /**
   * Optional suffix filter - only objects with keys ending with this suffix will trigger notifications.
   */
  suffix?: string;
}

/**
 * Props with multiple prefixes (creates one rule per prefix)
 */
interface R2BucketNotificationMultiplePrefixProps extends R2BucketNotificationBaseProps {
  /**
   * Array of prefix filters - creates one notification rule per prefix.
   */
  prefix: string[];

  /**
   * Optional suffix filter applied to all rules.
   */
  suffix?: string;
}

/**
 * Props with multiple suffixes (creates one rule per suffix)
 */
interface R2BucketNotificationMultipleSuffixProps extends R2BucketNotificationBaseProps {
  /**
   * Optional prefix filter applied to all rules.
   */
  prefix?: string;

  /**
   * Array of suffix filters - creates one notification rule per suffix.
   */
  suffix: string[];
}

/**
 * Properties for creating or updating R2 Bucket Notification rules.
 *
 * Either prefix OR suffix can be an array (creating multiple rules), but not both.
 */
export type R2BucketNotificationProps =
  | R2BucketNotificationSingleProps
  | R2BucketNotificationMultiplePrefixProps
  | R2BucketNotificationMultipleSuffixProps;

/**
 * Output returned after R2 Bucket Notification rule creation/update
 */
export type R2BucketNotification = Omit<
  R2BucketNotificationBaseProps,
  "bucket" | "queue" | "delete" | "adopt"
> & {
  /**
   * Resource type identifier
   */
  type: "r2_bucket_notification";

  /**
   * The Cloudflare-assigned rule ID(s) for this notification.
   * When prefix or suffix is an array, this contains multiple rule IDs.
   */
  ruleId: string | string[];

  /**
   * The name of the bucket this notification is attached to
   */
  bucketName: string;

  /**
   * The name of the queue that receives notification messages
   */
  queueName: string;

  /**
   * Prefix filter(s) - normalized to always be a string or array matching input
   */
  prefix?: string | string[];

  /**
   * Suffix filter(s) - normalized to always be a string or array matching input
   */
  suffix?: string | string[];

  /**
   * Time when the notification rule was created
   */
  createdAt?: string;
};

/**
 * Type guard to check if a resource is an R2BucketNotification
 */
export function isR2BucketNotification(
  resource: any,
): resource is R2BucketNotification {
  return resource?.[ResourceKind] === "cloudflare::R2BucketNotification";
}

async function resolveQueueId(
  api: CloudflareApi,
  queue: string | Queue,
): Promise<string> {
  if (typeof queue !== "string" && queue.id) {
    return queue.id;
  }

  const queueName = typeof queue === "string" ? queue : queue.name;

  return await withExponentialBackoff(
    async () => {
      const queueId = (await findQueueByName(api, queueName))?.result?.queue_id;
      if (!queueId) {
        throw new Error(`Queue "${queueName}" not found`);
      }
      return queueId;
    },
    (error) => error instanceof Error && error.message.includes("not found"),
    5,
    1000,
  );
}

/**
 * Creates an event notification rule for an R2 bucket that sends messages to a Queue.
 *
 * Event notifications allow you to trigger automated workflows when objects are created,
 * modified, or deleted in your R2 bucket. Messages are delivered to a Cloudflare Queue
 * where they can be processed by a consumer Worker.
 *
 * @example
 * ## Basic object-create notification
 *
 * Send notifications to a queue when objects are created in a bucket:
 *
 * ```ts
 * import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";
 *
 * const bucket = await R2Bucket("uploads");
 * const queue = await Queue("upload-events");
 *
 * await R2BucketNotification("upload-notifications", {
 *   bucket,
 *   queue,
 *   eventTypes: ["object-create"],
 * });
 * ```
 *
 * @example
 * ## Filtered notifications with prefix and suffix
 *
 * Only trigger notifications for specific object patterns:
 *
 * ```ts
 * import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";
 *
 * const bucket = await R2Bucket("documents");
 * const queue = await Queue("pdf-processing");
 *
 * await R2BucketNotification("pdf-uploads", {
 *   bucket,
 *   queue,
 *   eventTypes: ["object-create"],
 *   prefix: "incoming/",
 *   suffix: ".pdf",
 *   description: "Process newly uploaded PDF files",
 * });
 * ```
 *
 * @example
 * ## Multiple suffixes for different file types
 *
 * Create rules for multiple file extensions at once:
 *
 * ```ts
 * import { R2Bucket, Queue, R2BucketNotification } from "alchemy/cloudflare";
 *
 * const bucket = await R2Bucket("media");
 * const queue = await Queue("audio-processing");
 *
 * await R2BucketNotification("audio-uploads", {
 *   bucket,
 *   queue,
 *   eventTypes: ["object-create"],
 *   prefix: "audio/",
 *   suffix: [".mp3", ".wav", ".flac"],
 * });
 * ```
 *
 * @example
 * ## Multiple event types with typed queue
 *
 * Listen for both create and delete events with type-safe message handling:
 *
 * ```ts
 * import { R2Bucket, Queue, R2BucketNotification, R2BucketNotificationMessage } from "alchemy/cloudflare";
 *
 * const bucket = await R2Bucket("assets");
 * const queue = await Queue<R2BucketNotificationMessage>("asset-events");
 *
 * await R2BucketNotification("asset-notifications", {
 *   bucket,
 *   queue,
 *   eventTypes: ["object-create", "object-delete"],
 * });
 * ```
 *
 * @example
 * ## Process notifications with a Worker
 *
 * Complete example showing bucket notifications processed by a Worker:
 *
 * ```ts
 * import { R2Bucket, Queue, R2BucketNotification, Worker, R2BucketNotificationMessage } from "alchemy/cloudflare";
 *
 * const bucket = await R2Bucket("uploads");
 * const queue = await Queue<R2BucketNotificationMessage>("upload-events");
 *
 * await R2BucketNotification("upload-notifications", {
 *   bucket,
 *   queue,
 *   eventTypes: ["object-create"],
 * });
 *
 * await Worker("processor", {
 *   entrypoint: "./src/processor.ts",
 *   eventSources: [queue],
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/r2/buckets/event-notifications/
 */
export const R2BucketNotification = Resource(
  "cloudflare::R2BucketNotification",
  async function (
    this: Context<R2BucketNotification>,
    _id: string,
    props: R2BucketNotificationProps,
  ): Promise<R2BucketNotification> {
    const prefixIsArray = Array.isArray(props.prefix);
    const suffixIsArray = Array.isArray(props.suffix);

    if (prefixIsArray && suffixIsArray) {
      throw new Error(
        "Cannot specify both prefix and suffix as arrays. Only one can be an array at a time.",
      );
    }

    const bucketName =
      typeof props.bucket === "string" ? props.bucket : props.bucket.name;
    const queueName =
      typeof props.queue === "string" ? props.queue : props.queue.name;
    const jurisdiction =
      typeof props.bucket === "string"
        ? props.jurisdiction
        : (props.bucket.jurisdiction ?? props.jurisdiction);
    const adopt = props.adopt ?? this.scope.adopt;

    const api = await createCloudflareApi(props);

    const queueId = await resolveQueueId(api, props.queue);

    const ruleConfigs: Array<{ prefix?: string; suffix?: string }> = [];

    if (prefixIsArray) {
      const prefixArray = props.prefix as string[];
      const singleSuffix =
        typeof props.suffix === "string" ? props.suffix : undefined;
      for (const prefix of prefixArray) {
        ruleConfigs.push({ prefix, suffix: singleSuffix });
      }
    } else if (suffixIsArray) {
      const suffixArray = props.suffix as string[];
      const singlePrefix =
        typeof props.prefix === "string" ? props.prefix : undefined;
      for (const suffix of suffixArray) {
        ruleConfigs.push({ prefix: singlePrefix, suffix });
      }
    } else {
      const singlePrefix =
        typeof props.prefix === "string" ? props.prefix : undefined;
      const singleSuffix =
        typeof props.suffix === "string" ? props.suffix : undefined;
      ruleConfigs.push({ prefix: singlePrefix, suffix: singleSuffix });
    }

    if (this.scope.local) {
      const mockRuleIds = ruleConfigs.map((_, i) =>
        Array.isArray(this.output?.ruleId)
          ? (this.output.ruleId[i] ?? "")
          : (this.output?.ruleId ?? ""),
      );
      return {
        type: "r2_bucket_notification",
        ruleId: ruleConfigs.length === 1 ? mockRuleIds[0] : mockRuleIds,
        bucketName,
        queueName,
        eventTypes: props.eventTypes,
        prefix: props.prefix,
        suffix: props.suffix,
        description: props.description,
        jurisdiction,
        accountId: this.output?.accountId ?? "",
      };
    }

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.ruleId) {
        const ruleIds = Array.isArray(this.output.ruleId)
          ? this.output.ruleId
          : [this.output.ruleId];
        await Promise.all(
          ruleIds.map((ruleId) =>
            deleteNotificationRule(api, bucketName, queueId, ruleId, {
              jurisdiction,
            }),
          ),
        );
      }
      return this.destroy();
    }

    const existingRuleIds: string[] = Array.isArray(this.output?.ruleId)
      ? this.output.ruleId
      : this.output?.ruleId
        ? [this.output.ruleId]
        : [];

    if (this.phase === "update" && existingRuleIds.length > 0) {
      const existingRules = await listNotificationRules(api, bucketName, {
        jurisdiction,
      });

      for (const existingRuleId of existingRuleIds) {
        const existingRule = existingRules.find(
          (r) => r.ruleId === existingRuleId,
        );
        if (existingRule) {
          await deleteNotificationRule(
            api,
            bucketName,
            existingRule.queueId,
            existingRuleId,
            { jurisdiction },
          );
        }
      }
    }

    const createdRuleIds: string[] = [];

    for (const config of ruleConfigs) {
      try {
        const result = await createNotificationRule(api, bucketName, {
          queueId,
          queueName,
          eventTypes: props.eventTypes,
          prefix: config.prefix,
          suffix: config.suffix,
          description: props.description,
          jurisdiction,
        });
        createdRuleIds.push(result.ruleId);
      } catch (err) {
        const isConflictError =
          err instanceof CloudflareApiError &&
          (err.status === 409 ||
            (err.status === 400 &&
              err.errorData?.some(
                (e: { code: number; message: string }) => e.code === 11020,
              )));

        if (isConflictError && adopt) {
          const matchingRule = await withExponentialBackoff(
            async () => {
              const existingRules = await listNotificationRules(
                api,
                bucketName,
                {
                  jurisdiction,
                },
              );
              const match = existingRules.find((r) =>
                matchesNotificationRule(r, {
                  queueId,
                  queueName,
                  eventTypes: props.eventTypes,
                  prefix: config.prefix,
                  suffix: config.suffix,
                }),
              );
              if (!match) {
                throw new Error(
                  `Failed to find existing notification rule for bucket ${bucketName} and queue ${queueName}`,
                );
              }
              return match;
            },
            (error) =>
              error instanceof Error &&
              error.message.includes(
                "Failed to find existing notification rule",
              ),
            5,
            1000,
          );
          if (matchingRule) {
            createdRuleIds.push(matchingRule.ruleId);
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }
    }

    return {
      type: "r2_bucket_notification",
      ruleId: createdRuleIds.length === 1 ? createdRuleIds[0] : createdRuleIds,
      bucketName,
      queueName,
      eventTypes: props.eventTypes,
      prefix: props.prefix,
      suffix: props.suffix,
      description: props.description,
      jurisdiction,
      accountId: api.accountId,
    };
  },
);

interface NotificationRuleInfo {
  ruleId: string;
  queueId: string;
  queueName: string;
  actions: string[];
  prefix: string;
  suffix: string;
  createdAt?: string;
}

interface CreateNotificationRuleOptions {
  queueId: string;
  queueName: string;
  eventTypes: R2BucketNotificationEventType[];
  prefix?: string;
  suffix?: string;
  description?: string;
  jurisdiction?: string;
}

function mapEventTypesToActions(
  eventTypes: R2BucketNotificationEventType[],
): string[] {
  const actions: string[] = [];
  for (const eventType of eventTypes) {
    if (eventType === "object-create") {
      actions.push("PutObject", "CompleteMultipartUpload", "CopyObject");
    } else if (eventType === "object-delete") {
      actions.push("DeleteObject", "LifecycleDeletion");
    }
  }
  return [...new Set(actions)].sort();
}

function arraysEqual(a: string[], b: string[]): boolean {
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return (
    sortedA.length === sortedB.length &&
    sortedA.every((v, i) => v === sortedB[i])
  );
}

function normalizeRuleFilter(value?: string): string {
  return value ?? "";
}

function normalizeQueueId(queueId: string): string {
  return queueId.replaceAll("-", "");
}

function matchesNotificationRule(
  rule: NotificationRuleInfo,
  options: {
    queueId: string;
    queueName?: string;
    eventTypes: R2BucketNotificationEventType[];
    prefix?: string;
    suffix?: string;
  },
): boolean {
  return (
    (normalizeQueueId(rule.queueId) === normalizeQueueId(options.queueId) ||
      (options.queueName !== undefined &&
        rule.queueName === options.queueName)) &&
    arraysEqual(rule.actions, mapEventTypesToActions(options.eventTypes)) &&
    rule.prefix === normalizeRuleFilter(options.prefix) &&
    rule.suffix === normalizeRuleFilter(options.suffix)
  );
}

async function createNotificationRule(
  api: CloudflareApi,
  bucketName: string,
  options: CreateNotificationRuleOptions,
): Promise<{ ruleId: string }> {
  const payload: any = {
    rules: [
      {
        actions: mapEventTypesToActions(options.eventTypes),
        prefix: options.prefix ?? "",
        suffix: options.suffix ?? "",
      },
    ],
  };

  const response = await api.put(
    `/accounts/${api.accountId}/event_notifications/r2/${bucketName}/configuration/queues/${options.queueId}`,
    payload,
    {
      headers: withJurisdiction({ jurisdiction: options.jurisdiction }),
    },
  );

  if (!response.ok) {
    return await handleApiError(
      response,
      "creating",
      "R2 Bucket Notification",
      `for bucket ${bucketName}`,
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    result?: { event_notification_detail_id?: string };
    errors?: Array<{ code: number; message: string }>;
  };

  if (data.result?.event_notification_detail_id) {
    return { ruleId: data.result.event_notification_detail_id };
  }

  const createdRule = await withExponentialBackoff(
    async () => {
      const rules = await listNotificationRules(api, bucketName, {
        jurisdiction: options.jurisdiction,
      });
      const match = rules.find((r) => matchesNotificationRule(r, options));
      if (!match) {
        throw new Error(
          `Failed to find created notification rule for bucket ${bucketName} and queue ${options.queueName}`,
        );
      }
      return match;
    },
    (error) =>
      error instanceof Error && error.message.includes("Failed to find"),
    5,
    1000,
  );

  if (!createdRule) {
    throw new Error(
      `Failed to find created notification rule for bucket ${bucketName} and queue ${options.queueName}`,
    );
  }

  return { ruleId: createdRule.ruleId };
}

async function listNotificationRules(
  api: CloudflareApi,
  bucketName: string,
  options: { jurisdiction?: string } = {},
): Promise<NotificationRuleInfo[]> {
  const response = await api.get(
    `/accounts/${api.accountId}/event_notifications/r2/${bucketName}/configuration`,
    {
      headers: withJurisdiction(options),
    },
  );

  if (!response.ok) {
    if (response.status === 404) {
      return [];
    }
    return await handleApiError(
      response,
      "listing",
      "R2 Bucket Notifications",
      `for bucket ${bucketName}`,
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    result?: {
      bucketName?: string;
      queues?: Array<{
        queueId: string;
        queueName: string;
        rules: Array<{
          ruleId: string;
          prefix: string;
          suffix: string;
          actions: string[];
          createdAt?: string;
        }>;
      }>;
    };
    errors?: Array<{ code: number; message: string }>;
  };

  if (!data.success || !data.result?.queues) {
    return [];
  }

  const rules: NotificationRuleInfo[] = [];
  for (const queue of data.result.queues) {
    for (const rule of queue.rules) {
      rules.push({
        ruleId: rule.ruleId,
        queueId: queue.queueId,
        queueName: queue.queueName,
        actions: rule.actions,
        prefix: rule.prefix,
        suffix: rule.suffix,
        createdAt: rule.createdAt,
      });
    }
  }

  return rules;
}

async function deleteNotificationRule(
  api: CloudflareApi,
  bucketName: string,
  queueId: string,
  ruleId: string,
  options: { jurisdiction?: string } = {},
): Promise<void> {
  const response = await api.delete(
    `/accounts/${api.accountId}/event_notifications/r2/${bucketName}/configuration/queues/${queueId}`,
    {
      headers: withJurisdiction(options),
      body: JSON.stringify({ ruleIds: [ruleId] }),
    },
  );

  if (!response.ok && response.status !== 404) {
    await handleApiError(
      response,
      "deleting",
      "R2 Bucket Notification",
      `rule ${ruleId} for bucket ${bucketName}`,
    );
  }
}

/**
 * List all notification rules for an R2 bucket
 */
export async function listR2BucketNotifications(
  api: CloudflareApi,
  bucketName: string,
  options: { jurisdiction?: string } = {},
): Promise<NotificationRuleInfo[]> {
  return listNotificationRules(api, bucketName, options);
}
