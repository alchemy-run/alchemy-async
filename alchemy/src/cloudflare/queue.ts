import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";

/**
 * Settings for a Cloudflare Queue
 */
export interface QueueSettings {
  /**
   * Delay in seconds before message delivery
   * Queue will not deliver messages until this time has elapsed
   */
  deliveryDelay?: number;

  /**
   * Whether delivery is paused
   * If true, the queue will not deliver messages to consumers
   */
  deliveryPaused?: boolean;

  /**
   * Period in seconds to retain messages
   * Messages will be automatically deleted after this time
   */
  messageRetentionPeriod?: number;
}

/**
 * Properties for creating or updating a Cloudflare Queue
 */
export interface QueueProps extends CloudflareApiOptions {
  /**
   * Name of the queue
   * Required during creation
   * Cannot be changed after creation
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Settings for the queue
   * These can be updated after queue creation
   */
  settings?: QueueSettings;

  /**
   * Dead letter queue for failed messages
   * Can be either a queue name (string) or a Queue object
   */
  dlq?: string | Queue;

  /**
   * Whether to delete the queue.
   * If set to false, the queue will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to adopt an existing queue with the same name if it exists
   * If true, during creation, if a queue with the same name exists, it will be adopted instead of creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to emulate the queue locally when Alchemy is running in watch mode.
   */
  dev?: {
    /**
     * Whether to run the queue remotely instead of locally
     * @default false
     */
    remote?: boolean;

    /**
     * Set when `Scope.local` is true to force update to the queue even if it was already deployed live.
     * @internal
     */
    force?: boolean;
  };
}

export function isQueue(eventSource: any): eventSource is Queue {
  return (
    ResourceKind in eventSource &&
    eventSource[ResourceKind] === "cloudflare::Queue"
  );
}

/**
 * Output returned after Cloudflare Queue creation/update
 */
export type Queue<Body = unknown> = Omit<QueueProps, "dev"> & {
  /**
   * Type identifier for Cloudflare Queue
   */
  type: "queue";

  /**
   * The unique ID of the queue
   */
  id: string;

  /**
   * The name of the queue
   */
  name: string;

  /**
   * Time when the queue was created
   */
  createdOn: string;

  /**
   * Modified timestamp
   */
  modifiedOn: string;

  /**
   * Phantom property to allow type inference
   */
  Body: Body;

  Batch: MessageBatch<Body>;

  /**
   * Development mode properties
   * @internal
   */
  dev: {
    /**
     * The ID of the queue in development mode
     */
    id: string;

    /**
     * Whether the queue is running remotely
     */
    remote: boolean;
  };
};

/**
 * Creates and manages Cloudflare Queues.
 *
 * Queues provide a managed queue system for reliable message delivery
 * between workers and other systems.
 *
 * @example
 * // Create a basic queue with default settings
 * const basicQueue = await Queue("my-app-queue", {
 *   name: "my-app-queue"
 * });
 *
 * @example
 * // Create a queue with custom settings
 * const customQueue = await Queue("delayed-queue", {
 *   name: "delayed-queue",
 *   settings: {
 *     deliveryDelay: 30, // 30 second delay before message delivery
 *     messageRetentionPeriod: 86400 // Store messages for 1 day
 *   }
 * });
 *
 * @example
 * // Create a paused queue for later activation
 * const pausedQueue = await Queue("paused-queue", {
 *   name: "paused-queue",
 *   settings: {
 *     deliveryPaused: true
 *   }
 * });
 *
 * @example
 * // Create a queue with a dead letter queue using string reference
 * const dlqQueue = await Queue("dlq-queue", {
 *   name: "dlq-queue"
 * });
 *
 * const mainQueue = await Queue("main-queue", {
 *   name: "main-queue",
 *   dlq: "dlq-queue"
 * });
 *
 * @example
 * // Create a queue with a dead letter queue using Queue object
 * const dlqQueue = await Queue("dlq-queue", {
 *   name: "dlq-queue"
 * });
 *
 * const mainQueue = await Queue("main-queue", {
 *   name: "main-queue",
 *   dlq: dlqQueue
 * });
 *
 * @example
 * // Create a queue and configure Worker consumer with custom settings
 * const processingQueue = await Queue("processing-queue", {
 *   name: "processing-queue"
 * });
 *
 * const processingWorker = await Worker("processor", {
 *   entrypoint: "./src/processor.ts",
 *   bindings: {
 *     QUEUE: processingQueue  // Producer: bind queue for sending messages
 *   },
 *   eventSources: [{  // Consumer: configure processing settings
 *     queue: processingQueue,
 *     settings: {
 *       batchSize: 25,           // Process 25 messages at once
 *       maxConcurrency: 5,       // Allow 5 concurrent invocations
 *       maxRetries: 3,           // Retry failed messages up to 3 times
 *       maxWaitTimeMs: 1500,     // Wait up to 1.5 seconds to fill a batch
 *       retryDelay: 45,          // Wait 45 seconds before retrying failed messages
 *       deadLetterQueue: "failed-processing" // Send failed messages to DLQ
 *     }
 *   }]
 * });
 *
 * @see https://developers.cloudflare.com/queues/
 */
export async function Queue<T = unknown>(
  id: string,
  props: QueueProps = {},
): Promise<Queue<T>> {
  return await _Queue(id, {
    ...props,
    dev: {
      ...(props.dev ?? {}),
      force: Scope.current.local,
    },
  });
}

const _Queue = Resource("cloudflare::Queue", async function <
  T = unknown,
>(this: Context<Queue<T>>, id: string, props: QueueProps = {}): Promise<
  Queue<T>
> {
  const queueName =
    props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

  const dev = {
    id: this.output?.dev?.id ?? this.output?.id ?? id,
    remote: props.dev?.remote ?? false,
  };
  if (this.scope.local && !props.dev?.remote) {
    return {
      type: "queue",
      id: this.output?.id ?? "",
      name: queueName,
      dev,
      createdOn: this.output?.createdOn ?? new Date().toISOString(),
      modifiedOn: this.output?.modifiedOn ?? new Date().toISOString(),
      Body: undefined as T,
      Batch: undefined! as MessageBatch<T>,
    };
  }

  const api = await createCloudflareApi(props);

  if (this.phase === "delete") {
    if (props.delete !== false && this.output?.id) {
      // Delete Queue
      await deleteQueue(api, this.output.id);
    }

    // Return void (a deleted queue has no content)
    return this.destroy();
  }

  let queueData: CloudflareQueueResponse;

  if (this.phase === "create" || !this.output?.id) {
    try {
      queueData = await createQueue(api, queueName, props);
    } catch (error) {
      if (error instanceof CloudflareApiError && error.status === 409) {
        if (!(props.adopt ?? this.scope.adopt)) {
          throw error;
        }
        // Queue already exists, try to find it by name
        const existingQueue = await findQueueByName(api, queueName);
        if (!existingQueue) {
          throw new Error(
            `Queue with name ${queueName} not found despite 409 conflict`,
          );
        }
        queueData = existingQueue;
        queueData = await updateQueue(api, queueData.result.queue_id!, {
          ...props,
          name: queueName,
        });
      } else {
        throw error;
      }
    }
  } else {
    // Update operation
    if (this.output?.id) {
      // Update the queue with new settings
      queueData = await updateQueue(api, this.output.id, {
        ...props,
        name: queueName,
      });
    } else {
      // If no ID exists, fall back to creating a new queue
      queueData = await createQueue(api, queueName, props);
    }
  }

  return {
    type: "queue",
    id: queueData.result.queue_id || "",
    name: queueName,
    settings: queueData.result.settings
      ? {
          deliveryDelay: queueData.result.settings.delivery_delay,
          deliveryPaused: queueData.result.settings.delivery_paused,
          messageRetentionPeriod:
            queueData.result.settings.message_retention_period,
        }
      : undefined,
    dlq: props.dlq,
    createdOn: queueData.result.created_on || new Date().toISOString(),
    modifiedOn: queueData.result.modified_on || new Date().toISOString(),
    accountId: api.accountId,
    dev,
    // phantom properties
    Body: undefined as T,
    Batch: undefined! as MessageBatch<T>,
  };
});

interface CloudflareQueueResponse {
  result: {
    queue_id?: string;
    queue_name: string;
    created_on?: string;
    modified_on?: string;
    settings?: {
      delivery_delay?: number;
      delivery_paused?: boolean;
      message_retention_period?: number;
    };
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

/**
 * Create a new Cloudflare Queue
 */
export async function createQueue(
  api: CloudflareApi,
  queueName: string,
  props: QueueProps,
): Promise<CloudflareQueueResponse> {
  // Prepare the create payload
  const createPayload: any = {
    queue_name: queueName,
  };

  // Add settings if provided
  if (props.settings) {
    createPayload.settings = {};

    if (props.settings.deliveryDelay !== undefined) {
      createPayload.settings.delivery_delay = props.settings.deliveryDelay;
    }

    if (props.settings.deliveryPaused !== undefined) {
      createPayload.settings.delivery_paused = props.settings.deliveryPaused;
    }

    if (props.settings.messageRetentionPeriod !== undefined) {
      createPayload.settings.message_retention_period =
        props.settings.messageRetentionPeriod;
    }
  }

  const createResponse = await api.post(
    `/accounts/${api.accountId}/queues`,
    createPayload,
  );

  if (!createResponse.ok) {
    return await handleApiError(createResponse, "creating", "Queue", queueName);
  }

  return (await createResponse.json()) as CloudflareQueueResponse;
}

/**
 * Get a Cloudflare Queue
 */
export async function getQueue(
  api: CloudflareApi,
  queueId: string,
): Promise<CloudflareQueueResponse> {
  const response = await api.get(
    `/accounts/${api.accountId}/queues/${queueId}`,
  );

  if (!response.ok) {
    return await handleApiError(response, "getting", "Queue", queueId);
  }

  return (await response.json()) as CloudflareQueueResponse;
}

/**
 * Delete a Cloudflare Queue
 */
export async function deleteQueue(
  api: CloudflareApi,
  queueId: string,
): Promise<void> {
  // Delete Queue
  const deleteResponse = await api.delete(
    `/accounts/${api.accountId}/queues/${queueId}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorData: any = await deleteResponse.json().catch(() => ({
      errors: [{ message: deleteResponse.statusText }],
    }));
    throw new CloudflareApiError(
      `Error deleting Cloudflare Queue '${queueId}': ${errorData.errors?.[0]?.message || deleteResponse.statusText}`,
      deleteResponse,
    );
  }
}

/**
 * Update a Cloudflare Queue
 *
 * Note: According to Cloudflare API, the queue name cannot be changed after creation.
 * Only the settings can be updated.
 */
export async function updateQueue(
  api: CloudflareApi,
  queueId: string,
  props: QueueProps & {
    name: string;
  },
): Promise<CloudflareQueueResponse> {
  // Prepare the update payload - only include settings
  const updatePayload: {
    queue_name?: string;
    settings?: {
      delivery_delay?: number;
      delivery_paused?: boolean;
      message_retention_period?: number;
    };
  } = {
    queue_name: props.name,
  };

  // Add settings if provided
  if (props.settings) {
    updatePayload.settings = {};

    if (props.settings.deliveryDelay !== undefined) {
      updatePayload.settings.delivery_delay = props.settings.deliveryDelay;
    }

    if (props.settings.deliveryPaused !== undefined) {
      updatePayload.settings.delivery_paused = props.settings.deliveryPaused;
    }

    if (props.settings.messageRetentionPeriod !== undefined) {
      updatePayload.settings.message_retention_period =
        props.settings.messageRetentionPeriod;
    }
  }

  // Use PATCH for partial updates (only settings can be updated)
  const updateResponse = await api.patch(
    `/accounts/${api.accountId}/queues/${queueId}`,
    updatePayload,
  );

  if (!updateResponse.ok) {
    return await handleApiError(updateResponse, "updating", "Queue", queueId);
  }

  return (await updateResponse.json()) as CloudflareQueueResponse;
}

/**
 * List all Cloudflare Queues in an account
 */
type CloudflareQueueListItem = {
  queue_name: string;
  queue_id: string;
  created_on?: string;
  modified_on?: string;
  settings?: {
    delivery_delay?: number;
    delivery_paused?: boolean;
    message_retention_period?: number;
  };
};

type CloudflareQueueListResponse = {
  success: boolean;
  errors?: Array<{ code: number; message: string }>;
  result?: CloudflareQueueListItem[];
  result_info?: {
    per_page?: number;
    total_pages?: number;
  };
};

const CLOUDFLARE_QUEUE_PAGE_SIZE = 100;

async function fetchQueuePage(
  api: CloudflareApi,
  page: number,
  perPage = CLOUDFLARE_QUEUE_PAGE_SIZE,
): Promise<CloudflareQueueListResponse> {
  const searchParams = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  const response = await api.get(
    `/accounts/${api.accountId}/queues?${searchParams.toString()}`,
  );

  if (!response.ok) {
    return await handleApiError(response, "listing", "Queues", "");
  }

  const data = (await response.json()) as CloudflareQueueListResponse;

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || "Unknown error";
    throw new Error(`Failed to list queues: ${errorMessage}`);
  }

  return data;
}

function hasMoreQueuePages(
  data: CloudflareQueueListResponse,
  currentPage: number,
  perPage: number,
): boolean {
  if (data.result_info?.total_pages !== undefined) {
    return currentPage < data.result_info.total_pages;
  }

  const pageSize = data.result_info?.per_page ?? perPage;
  const currentCount = data.result?.length ?? 0;

  return currentCount > 0 && currentCount >= pageSize;
}

export async function listQueues(
  api: CloudflareApi,
): Promise<{ name: string; id: string }[]> {
  const queues: CloudflareQueueListItem[] = [];
  let page = 1;

  // Paginate through all queues to ensure nothing is missed on later pages
  while (true) {
    const data = await fetchQueuePage(api, page);
    queues.push(...(data.result ?? []));

    if (!hasMoreQueuePages(data, page, CLOUDFLARE_QUEUE_PAGE_SIZE)) {
      break;
    }

    page += 1;
  }

  // Transform API response
  return queues.map((queue) => ({
    name: queue.queue_name,
    id: queue.queue_id,
  }));
}

/**
 * Find a Cloudflare Queue by name
 */
export async function findQueueByName(
  api: CloudflareApi,
  queueName: string,
): Promise<CloudflareQueueResponse | null> {
  let page = 1;

  while (true) {
    const data = await fetchQueuePage(api, page);
    const queue = data.result?.find((q) => q.queue_name === queueName);

    if (queue) {
      return {
        result: {
          queue_id: queue.queue_id,
          queue_name: queue.queue_name,
          created_on: queue.created_on,
          modified_on: queue.modified_on,
          settings: queue.settings,
        },
        success: true,
        errors: [],
        messages: [],
      };
    }

    if (!hasMoreQueuePages(data, page, CLOUDFLARE_QUEUE_PAGE_SIZE)) {
      return null;
    }

    page += 1;
  }
}
