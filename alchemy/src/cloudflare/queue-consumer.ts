import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { Queue } from "./queue.ts";

/**
 * Settings for configuring a Queue Consumer
 */
export interface QueueConsumerSettings {
  /**
   * Number of messages to deliver in a batch
   * @default 10
   */
  batchSize?: number;

  /**
   * Maximum number of concurrent consumer worker invocations
   * @default 2
   */
  maxConcurrency?: number;

  /**
   * Maximum number of retries for each message
   * @default 3
   */
  maxRetries?: number;

  /**
   * Maximum time in milliseconds to wait for batch to fill
   * @default 500
   */
  maxWaitTimeMs?: number;

  /**
   * Time in seconds to delay retry after a failure
   * @default 30
   */
  retryDelay?: number;

  /**
   * Dead letter queue for messages that exceed max retries
   * Can be either a queue name (string) or a Queue object
   */
  deadLetterQueue?: string | Queue;
}

/**
 * Properties for creating or updating a Queue Consumer
 */
export interface QueueConsumerProps extends CloudflareApiOptions {
  /**
   * The {@link Queue} or Queue ID to consume
   */
  queue: string | Queue;

  /**
   * Name of the worker script that will consume the queue
   */
  scriptName: string;

  /**
   * Settings for the consumer
   */
  settings?: QueueConsumerSettings;

  /**
   * Whether to delete the consumer.
   * If set to false, the consumer will remain but the resource will be removed from state
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to adopt an existing consumer.
   * If set to true, the consumer will be updated if it already exists.
   * @default false
   */
  adopt?: boolean;

  /**
   * If true, the queue consumer will not be created, but will be retained if it already exists.
   * This is used for local development.
   *
   * @default `false`
   * @internal
   */
  dev?: boolean;
}

/**
 * Output returned after Queue Consumer creation/update
 */
export interface QueueConsumer extends QueueConsumerProps {
  /**
   * Unique ID for the consumer
   */
  id: string;

  /**
   * Type identifier for Cloudflare Queue Consumer
   */
  type: "worker";

  /**
   * ID of the queue being consumed
   */
  queueId: string;

  /**
   * Time when the consumer was created
   */
  createdOn?: string;
}

/**
 * Creates a consumer for a Cloudflare Queue that processes messages using a Worker.
 *
 * @example
 * // Create a queue consumer with default settings
 * const queue = await Queue("notifications", {
 *   name: "notifications"
 * });
 *
 * const consumer = await QueueConsumer("notification-processor", {
 *   queue,
 *   scriptName: "notification-worker"
 * });
 *
 * @example
 * // Create a consumer with custom settings
 * const batchConsumer = await QueueConsumer("batch-processor", {
 *   queue,
 *   scriptName: "batch-worker",
 *   settings: {
 *     batchSize: 50,         // Process 50 messages at once
 *     maxConcurrency: 10,    // Allow 10 concurrent invocations
 *     maxRetries: 5,         // Retry failed messages up to 5 times
 *     maxWaitTimeMs: 2000,   // Wait up to 2 seconds to fill a batch
 *     retryDelay: 60         // Wait 60 seconds before retrying failed messages
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/queues/platform/consumers/
 */
export const QueueConsumer = Resource(
  "cloudflare::QueueConsumer",
  async function (
    this: Context<QueueConsumer>,
    _id: string,
    props: QueueConsumerProps,
  ): Promise<QueueConsumer> {
    // Get queueId from either props.queue or props.queueId
    const queueId =
      typeof props.queue === "string" ? props.queue : props.queue.id;

    if (this.scope.local && props.dev) {
      return {
        id: this.output?.id ?? "",
        queueId,
        queue: props.queue,
        type: "worker",
        scriptName: props.scriptName,
        settings: props.settings,
        accountId: this.output?.accountId ?? "",
      };
    }

    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      logger.log(`Deleting Queue Consumer for queue ${queueId}`);
      if (props.delete !== false && this.output?.id) {
        // Delete the consumer
        await deleteQueueConsumer(api, queueId, this.output.id);
      }

      // Return void (a deleted consumer has no content)
      return this.destroy();
    }

    if (!queueId) {
      throw new Error("Either queue or queueId must be provided");
    }

    let consumerData: CloudflareQueueConsumerResponse;

    if (this.phase === "create" || !this.output?.id) {
      try {
        consumerData = await createQueueConsumer(api, queueId, props);
      } catch (err) {
        if (
          err instanceof CloudflareApiError &&
          err.status === 400 &&
          err.message.includes("already has a consumer") &&
          (props.adopt ?? this.scope.adopt)
        ) {
          const consumerId = await findQueueConsumerId(
            api,
            props.scriptName,
            queueId,
          );
          if (!consumerId) {
            throw new Error(
              `Consumer for worker ${props.scriptName} and queue ${queueId} not found`,
            );
          }
          consumerData = await updateQueueConsumer(
            api,
            queueId,
            consumerId,
            props,
          );
        } else {
          throw err;
        }
      }
    } else {
      consumerData = await updateQueueConsumer(
        api,
        queueId,
        this.output.id,
        props,
      );
    }

    return {
      id: consumerData.result.consumer_id,
      queueId,
      queue: props.queue,
      type: "worker",
      scriptName: props.scriptName,
      settings: consumerData.result.settings
        ? {
            batchSize: consumerData.result.settings.batch_size,
            maxConcurrency: consumerData.result.settings.max_concurrency,
            maxRetries: consumerData.result.settings.max_retries,
            maxWaitTimeMs: consumerData.result.settings.max_wait_time_ms,
            retryDelay: consumerData.result.settings.retry_delay,
            deadLetterQueue: consumerData.result.settings.dead_letter_queue,
          }
        : undefined,
      createdOn: consumerData.result.created_on,
      accountId: api.accountId,
    };
  },
);

/**
 * Response from Cloudflare API for Queue Consumer operations
 */
interface CloudflareQueueConsumerResponse {
  result: {
    consumer_id: string;
    script_name: string;
    settings?: {
      batch_size?: number;
      max_concurrency?: number;
      max_retries?: number;
      max_wait_time_ms?: number;
      retry_delay?: number;
      dead_letter_queue?: string;
    };
    type: "worker";
    queue_id?: string;
    created_on?: string;
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

/**
 * Create a new Queue Consumer
 */
export async function createQueueConsumer(
  api: CloudflareApi,
  queueId: string,
  props: QueueConsumerProps,
): Promise<CloudflareQueueConsumerResponse> {
  // Prepare the create payload
  const createPayload: any = {
    script_name: props.scriptName,
    type: "worker",
  };

  // Add settings if provided
  if (props.settings) {
    createPayload.settings = {};

    if (props.settings.batchSize !== undefined) {
      createPayload.settings.batch_size = props.settings.batchSize;
    }

    if (props.settings.maxConcurrency !== undefined) {
      createPayload.settings.max_concurrency = props.settings.maxConcurrency;
    }

    if (props.settings.maxRetries !== undefined) {
      createPayload.settings.max_retries = props.settings.maxRetries;
    }

    if (props.settings.maxWaitTimeMs !== undefined) {
      createPayload.settings.max_wait_time_ms = props.settings.maxWaitTimeMs;
    }

    if (props.settings.retryDelay !== undefined) {
      createPayload.settings.retry_delay = props.settings.retryDelay;
    }

    if (props.settings.deadLetterQueue !== undefined) {
      const dlqName =
        typeof props.settings.deadLetterQueue === "string"
          ? props.settings.deadLetterQueue
          : props.settings.deadLetterQueue.name;
      createPayload.dead_letter_queue = dlqName;
    }
  }

  const createResponse = await api.post(
    `/accounts/${api.accountId}/queues/${queueId}/consumers`,
    createPayload,
  );

  if (!createResponse.ok) {
    return await handleApiError(
      createResponse,
      "creating",
      "Queue Consumer",
      `for queue ${queueId}`,
    );
  }

  return (await createResponse.json()) as CloudflareQueueConsumerResponse;
}

/**
 * Delete a Queue Consumer
 */
export async function deleteQueueConsumer(
  api: CloudflareApi,
  queueId: string,
  consumerId: string,
): Promise<void> {
  const deleteResponse = await api.delete(
    `/accounts/${api.accountId}/queues/${queueId}/consumers/${consumerId}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    await handleApiError(
      deleteResponse,
      "deleting",
      "Queue Consumer",
      consumerId,
    );
  }
}

/**
 * Update a Queue Consumer
 */
async function updateQueueConsumer(
  api: CloudflareApi,
  queueId: string,
  consumerId: string,
  props: QueueConsumerProps,
): Promise<CloudflareQueueConsumerResponse> {
  // Prepare the update payload
  const updatePayload: any = {
    script_name: props.scriptName,
    type: "worker",
  };

  // Add settings if provided
  if (props.settings) {
    updatePayload.settings = {};

    if (props.settings.batchSize !== undefined) {
      updatePayload.settings.batch_size = props.settings.batchSize;
    }

    if (props.settings.maxConcurrency !== undefined) {
      updatePayload.settings.max_concurrency = props.settings.maxConcurrency;
    }

    if (props.settings.maxRetries !== undefined) {
      updatePayload.settings.max_retries = props.settings.maxRetries;
    }

    if (props.settings.maxWaitTimeMs !== undefined) {
      updatePayload.settings.max_wait_time_ms = props.settings.maxWaitTimeMs;
    }

    if (props.settings.retryDelay !== undefined) {
      updatePayload.settings.retry_delay = props.settings.retryDelay;
    }

    if (props.settings.deadLetterQueue !== undefined) {
      const dlqName =
        typeof props.settings.deadLetterQueue === "string"
          ? props.settings.deadLetterQueue
          : props.settings.deadLetterQueue.name;
      updatePayload.dead_letter_queue = dlqName;
    }
  }

  // Use PUT to update the consumer
  const updateResponse = await api.put(
    `/accounts/${api.accountId}/queues/${queueId}/consumers/${consumerId}`,
    updatePayload,
  );

  if (!updateResponse.ok) {
    return await handleApiError(
      updateResponse,
      "updating",
      "Queue Consumer",
      consumerId,
    );
  }

  return (await updateResponse.json()) as CloudflareQueueConsumerResponse;
}

export interface ListQueueConsumersResponse {
  id: string;
  scriptName: string;
  queueId: string;
  queueName: string;
  createdOn: string;
  settings?: QueueConsumerSettings;
}
/**
 * List all consumers for a queue
 */
export async function listQueueConsumers(
  api: CloudflareApi,
  queueId: string,
): Promise<ListQueueConsumersResponse[]> {
  const response = await api.get(
    `/accounts/${api.accountId}/queues/${queueId}/consumers`,
  );

  if (!response.ok) {
    throw new CloudflareApiError(
      `Failed to list queue consumers: ${response.statusText}`,
      response,
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    errors?: Array<{ code: number; message: string }>;
    result?: Array<{
      consumer_id: string;
      script: string;
      queue_id: string;
      queue_name: string;
      created_on: string;
      settings?: {
        batch_size?: number;
        max_concurrency?: number;
        max_retries?: number;
        max_wait_time_ms?: number;
        retry_delay?: number;
        dead_letter_queue?: string;
      };
    }>;
  };

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || "Unknown error";
    throw new Error(`Failed to list queue consumers: ${errorMessage}`);
  }

  // Transform API response
  return (data.result || []).map((consumer) => ({
    id: consumer.consumer_id,
    scriptName: consumer.script,
    queueId: consumer.queue_id,
    queueName: consumer.queue_name,
    createdOn: consumer.created_on,
    settings: consumer.settings
      ? {
          batchSize: consumer.settings.batch_size,
          maxConcurrency: consumer.settings.max_concurrency,
          maxRetries: consumer.settings.max_retries,
          maxWaitTimeMs: consumer.settings.max_wait_time_ms,
          retryDelay: consumer.settings.retry_delay,
          deadLetterQueue: consumer.settings.dead_letter_queue,
        }
      : undefined,
  }));
}

export async function findQueueConsumerId(
  api: CloudflareApi,
  workerName: string,
  queueId: string,
): Promise<string | undefined> {
  const consumers = await listQueueConsumersForWorker(api, workerName);
  const consumer = consumers.find((c) => c.queueId === queueId);
  return consumer?.consumerId;
}

export async function listQueueConsumersForWorker(
  api: CloudflareApi,
  workerName: string,
) {
  const response = await api.get(
    `/accounts/${api.accountId}/workers/scripts/${workerName}/queue-consumers?perPage=100`,
  );

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    return await handleApiError(
      response,
      "list",
      "QueueConsumer",
      `for worker ${workerName}`,
    );
  }

  const data = (await response.json()) as {
    result: Array<{
      script: string;
      settings?: {
        batch_size?: number;
        max_retries?: number;
        max_wait_time_ms?: number;
        retry_delay?: number;
        dead_letter_queue?: string;
      };
      type: string;
      queue_name: string;
      queue_id: string;
      consumer_id: string;
      created_on: string;
    }>;
    success: boolean;
    errors: any[] | null;
    messages: any[] | null;
    result_info: {
      page: number;
      per_page: number;
      count: number;
      total_count: number;
      total_pages: number;
    };
  };

  return data.result.map((consumer) => ({
    queueName: consumer.queue_name,
    queueId: consumer.queue_id,
    consumerId: consumer.consumer_id,
    createdOn: consumer.created_on,
    settings: consumer.settings,
  }));
}
