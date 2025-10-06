import path from "pathe";
import type { Context } from "../context.ts";
import type { BundleProps } from "../esbuild/bundle.ts";
import { Resource, ResourceKind } from "../resource.ts";
import type { type } from "../type.ts";
import { DeferredPromise } from "../util/deferred-promise.ts";
import { logger } from "../util/logger.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  type CloudflareApi,
  type CloudflareApiOptions,
  createCloudflareApi,
} from "./api.ts";
import type { Assets } from "./assets.ts";
import type {
  Bindings,
  Self,
  WorkerBindingDurableObjectNamespace,
  WorkerBindingSpec,
} from "./bindings.ts";
import type { Bound } from "./bound.ts";
import { DEFAULT_COMPATIBILITY_DATE } from "./compatibility-date.gen.ts";
import {
  type CompatibilityPreset,
  unionCompatibilityFlags,
} from "./compatibility-presets.ts";
import { type Container, ContainerApplication } from "./container.ts";
import { CustomDomain } from "./custom-domain.ts";
import type { DispatchNamespace } from "./dispatch-namespace.ts";
import {
  DurableObjectNamespace,
  isDurableObjectNamespace,
} from "./durable-object-namespace.ts";
import { type EventSource, isQueueEventSource } from "./event-source.ts";
import { deleteMiniflareWorkerData } from "./miniflare/delete.ts";
import {
  QueueConsumer,
  deleteQueueConsumer,
  listQueueConsumersForWorker,
} from "./queue-consumer.ts";
import { isQueue } from "./queue.ts";
import { Route } from "./route.ts";
import { type AssetUploadResult, uploadAssets } from "./worker-assets.ts";
import {
  WorkerBundle,
  type WorkerBundleSource,
  normalizeWorkerBundle,
} from "./worker-bundle.ts";
import {
  type WorkerScriptMetadata,
  bumpMigrationTagVersion,
  prepareWorkerMetadata,
} from "./worker-metadata.ts";
import { WorkerSubdomain, disableWorkerSubdomain } from "./worker-subdomain.ts";
import { createTail } from "./worker-tail.ts";
import { Workflow, isWorkflow, upsertWorkflow } from "./workflow.ts";

// Previous versions of `Worker` used the `Bundle` resource.
// This import is here to avoid errors when destroying the `Bundle` resource.
import "../esbuild/bundle.ts";
import { Scope } from "../scope.ts";
import type { WorkerRef } from "./worker-ref.ts";
import { createEmptyWorker, exists } from "./worker-stub.ts";

/**
 * Configuration options for static assets
 */
export interface AssetsConfig {
  /**
   * The contents of a _headers file (used to attach custom headers on asset responses)
   */
  _headers?: string;

  /**
   * The contents of a _redirects file (used to apply redirects or proxy paths ahead of asset serving)
   */
  _redirects?: string;

  /**
   * Determines the redirects and rewrites of requests for HTML content
   *
   * @default auto-trailing-slash
   */
  html_handling?:
    | "auto-trailing-slash"
    | "force-trailing-slash"
    | "drop-trailing-slash"
    | "none";

  /**
   * Determines the response when a request does not match a static asset, and there is no Worker script
   *
   * @default none
   */
  not_found_handling?: "none" | "404-page" | "single-page-application";

  /**
   * When true, requests will always invoke the Worker script.
   * If an array is passed, the worker will be invoked for matching requests.
   * Otherwise, attempt to serve an asset matching the request, falling back to the Worker script.
   *
   * @default false
   */
  run_worker_first?: boolean | string[];
}

export interface BaseWorkerProps<
  B extends Bindings | undefined = undefined,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> extends CloudflareApiOptions {
  /**
   * Bundle options when using entryPoint
   *
   * Ignored if bundle is provided
   */
  bundle?: Omit<BundleProps, "entryPoint">;

  /**
   * The root directory of the project
   */
  cwd?: string;

  /**
   * The root directory of the project
   * @deprecated Use `cwd` instead
   */
  projectRoot?: string;

  /**
   * Module format for the worker script
   * - 'esm' - ECMAScript modules (default)
   * - 'cjs' - CommonJS modules
   * @default 'esm'
   */
  format?: "esm" | "cjs";

  /**
   * Name for the worker
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Bindings to attach to the worker
   */
  bindings?: B;

  /**
   * Environment variables to attach to the worker
   *
   * These will be converted to plain_text bindings
   *
   * @deprecated - use `bindings` instead
   */
  env?: {
    [key: string]: string;
  };

  /**
   * Whether to enable a workers.dev URL for this worker
   *
   * If true, the worker will be available at {name}.{subdomain}.workers.dev
   * @default false
   */
  url?: boolean;

  /**
   * Specify the observability behavior of the Worker.
   *
   * @see https://developers.cloudflare.com/workers/wrangler/configuration/#observability
   * @default - `enabled: true`
   */
  observability?: WorkerObservability;

  /**
   * Enable Workers Logpush to export trace events (request/response metadata,
   * console logs, and exceptions) to external destinations.
   *
   * Requires a separate Logpush job configuration via the Cloudflare API.
   *
   * @see https://developers.cloudflare.com/workers/observability/logging/logpush
   * @default false
   */
  logpush?: boolean;

  /**
   * Whether to adopt the Worker if it already exists when creating
   */
  adopt?: boolean;

  /**
   * The compatibility date for the worker
   * @default DEFAULT_WORKER_COMPATIBILITY_DATE - automatically pinned to the latest Workers release
   */
  compatibilityDate?: string;

  /**
   * The compatibility flags for the worker
   */
  compatibilityFlags?: string[];

  /**
   * Compatibility preset to automatically include common compatibility flags
   *
   * - "node": Includes nodejs_compat flag for Node.js compatibility
   *
   * @default undefined (no preset)
   */
  compatibility?: CompatibilityPreset;

  /**
   * Configuration for static assets
   */
  assets?: AssetsConfig;

  /**
   * Cron expressions for the trigger.
   *
   * Uses standard cron syntax (e.g. "0 0 * * *" for daily at midnight)
   *
   * To clear all cron triggers, pass an empty array.
   *
   * @see https://developers.cloudflare.com/workers/configuration/cron-triggers/#examples
   */
  crons?: string[];

  /**
   * Event sources that this worker will consume.
   *
   * Can include queues, streams, or other event sources.
   */
  eventSources?: EventSource[];

  /**
   * Routes to create for this worker.
   *
   * Each route maps a URL pattern to this worker script.
   *
   * @example
   * await Worker("my-worker", {
   *   routes: [
   *     "sub.example.com/*",
   *     { pattern: "sub.example.com/*", zoneId: "1234567890" },
   *   ],
   * });
   */
  routes?: (
    | string
    | {
        /**
         * URL pattern for the route
         * @example "sub.example.com/*"
         */
        pattern: string;
        /**
         * Zone ID for the route. If not provided, will be automatically inferred from the route pattern.
         */
        zoneId?: string;
        /**
         * Whether to adopt an existing route with the same pattern if it exists
         * @default false
         */
        adopt?: boolean;
      }
  )[];

  /**
   * Custom domains to bind to the worker
   *
   * @example
   * await Worker("my-worker", {
   *   domains: [
   *     "example.com",
   *     { name: "example.com", zoneId: "1234567890" },
   *   ],
   * });
   */
  domains?: (
    | string
    | {
        /**
         * The domain name to bind to the worker
         */
        domainName: string;
        /**
         * Zone ID for the domain.
         *
         * @default - If not provided, will be automatically inferred from the domain name.
         */
        zoneId?: string;
        /**
         * Whether to adopt an existing domain if it exists
         * @default false
         */
        adopt?: boolean;
      }
  )[];

  /**
   * The RPC class to use for the worker.
   *
   * This is only used when using the rpc property.
   */
  rpc?: (new (...args: any[]) => RPC) | type<RPC>;

  /**
   * Deploy this worker to a dispatch namespace
   *
   * This allows workers to be routed to via dispatch namespace routing rules
   */
  namespace?: string | DispatchNamespace;

  /**
   * Version label for this worker deployment
   *
   * When specified, the worker will be published as a version with this label
   * instead of updating the live deployment. This creates a preview URL that
   * can be tested before promoting to production.
   *
   * @example "pr-123"
   */
  version?: string;

  /**
   * Configuration for local development. By default, when Alchemy is running in development mode,
   * the worker will be emulated locally and available at a randomly selected port.
   */
  dev?:
    | {
        /**
         * Port to use for local development.
         */
        port?: number;
        /**
         * Whether to run the worker remotely instead of locally.
         *
         * @default false
         */
        remote?: boolean;
        /**
         * Whether to expose the worker via a Cloudflare Tunnel.
         *
         * @default false
         */
        tunnel?: boolean;
        url?: undefined;
      }
    | {
        url: string;
        remote?: undefined;
        tunnel?: undefined;
        port?: undefined;
      };

  /**
   * Smart placement configuration for the worker.
   *
   * Controls how Cloudflare places the worker across its network for optimal performance.
   *
   * When omitted, smart placement is disabled (default behavior).
   */
  placement?: {
    /**
     * The placement mode for the worker.
     *
     * - "smart": Automatically optimize placement based on performance metrics
     *
     * @default undefined (smart placement disabled)
     */
    mode: "smart";
  };

  limits?: {
    /**
     * The maximum CPU time in milliseconds that the worker can use.
     *
     * @see https://developers.cloudflare.com/workers/platform/limits/#cpu-time
     * @default 30_000 (30 seconds)
     */
    cpu_ms?: number;
  };

  /**
   * Tail consumers that will receive execution logs from this worker
   */
  tailConsumers?: Array<Worker | { service: string }>;
}

export interface WorkerObservability {
  /**
   * If observability is enabled for this Worker
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * A number between 0 and 1, where 0 indicates zero out of one hundred requests are logged, and 1 indicates every request is logged.
   * If head_sampling_rate is unspecified, it is configured to a default value of 1 (100%).
   * @see https://developers.cloudflare.com/workers/observability/logs/workers-logs/#head-based-sampling
   * @default 1
   */
  headSamplingRate?: number;

  /**
   * Configuration for worker logs
   */
  logs?: {
    /**
     * Whether logs are enabled
     * @default true
     */
    enabled?: boolean;

    /**
     * The sampling rate for logs
     */
    headSamplingRate?: number;

    /**
     * Set to false to disable invocation logs
     * @default true
     */
    invocationLogs?: boolean;

    /**
     * If logs should be persisted to the Cloudflare observability platform where they can be queried in the dashboard.
     * @default true
     */
    persist?: boolean;

    /**
     * What destinations logs emitted from the Worker should be sent to.
     * @default []
     */
    destinations?: string[];
  };

  /**
   * Configuration for worker traces
   */
  traces?: {
    /**
     * Whether traces are enabled
     * @default true
     */
    enabled?: boolean;

    /**
     * The sampling rate for traces
     */
    headSamplingRate?: number;

    /**
     * If traces should be persisted to the Cloudflare observability platform where they can be queried in the dashboard.
     * @default true
     */
    persist?: boolean;

    /**
     * What destinations traces emitted from the Worker should be sent to.
     * @default []
     */
    destinations?: string[];
  };
}

export interface InlineWorkerProps<
  B extends Bindings | undefined = Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> extends BaseWorkerProps<B, RPC> {
  script: string;
  entrypoint?: undefined;
  noBundle?: false;
}

export interface EntrypointWorkerProps<
  B extends Bindings | undefined = Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> extends BaseWorkerProps<B, RPC> {
  script?: undefined;
  /**
   * The entrypoint for the worker script.
   */
  entrypoint: string;

  /**
   * Whether to disable bundling of the worker script.
   *
   * If true, the worker script and any files it imports will be deployed in the Worker.
   *
   * @default false
   */
  noBundle?: boolean;

  /**
   * Whether to upload source maps for the worker script.
   *
   * @default true
   */
  sourceMap?: boolean;

  /**
   * Rules for adding additional files to the bundle.
   *
   * If {@link noBundle} is false | undefined, this will be ignored.
   *
   * @default - all .js, .mjs, and .wasm files under the entrypoint directory
   */
  rules?: {
    globs: string[];
  }[];
}

/**
 * Properties for creating or updating a Worker
 */
export type WorkerProps<
  B extends Bindings | undefined = Bindings,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> = InlineWorkerProps<B, RPC> | EntrypointWorkerProps<B, RPC>;

export function isWorker(resource: any): resource is Worker<any> {
  return resource?.[ResourceKind] === "cloudflare::Worker";
}

/**
 * Output returned after Worker creation/update
 */
export type Worker<
  B extends Bindings | undefined = Bindings | undefined,
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> = Omit<WorkerProps<B>, "url" | "script" | "routes" | "domains"> & {
  /** @internal phantom property */
  __rpc__?: RPC;

  type: "service";

  /**
   * The ID of the worker
   */
  id: string;

  /**
   * The name of the worker
   */
  name: string;

  /**
   * The root directory of the project
   * @default process.cwd()
   */
  cwd: string;

  /**
   * Time at which the worker was created
   */
  createdAt: number;

  /**
   * Time at which the worker was last updated
   */
  updatedAt: number;

  /**
   * The worker's URL if enabled
   * Format: {name}.{subdomain}.workers.dev
   *
   * @default true
   */
  url?: string;

  /**
   * The bindings that were created
   */
  bindings: B;

  /**
   * Configuration for static assets
   */
  assets?: AssetsConfig;

  /**
   * The routes that were created for this worker
   */
  routes?: Route[];

  /**
   * The custom domains that were created for this worker
   */
  domains?: CustomDomain[];

  // phantom property (for typeof myWorker.Env)
  Env: B extends Bindings
    ? {
        [bindingName in keyof B]: Bound<B[bindingName]>;
      }
    : undefined;

  /**
   * The compatibility date for the worker
   */
  compatibilityDate: string;

  /**
   * The compatibility flags for the worker
   */
  compatibilityFlags: string[];

  /**
   * The dispatch namespace this worker is deployed to
   */
  namespace?: string | DispatchNamespace;

  /**
   * Version label for this worker deployment
   */
  version?: string;

  /**
   * Smart placement configuration for the worker
   */
  placement?: {
    mode: "smart";
  };

  /**
   * Whether the worker has a remote deployment
   * @internal
   */
  dev?: {
    hasRemote: boolean;
  };
};

/**
 * A Cloudflare Worker is a serverless function that can be deployed to the Cloudflare network.
 *
 * @example
 * // Create a basic HTTP handler worker with custom domain routing
 * // and workers.dev URL:
 * const api = await Worker("api", {
 *   name: "api-worker",
 *   entrypoint: "./src/api.ts",
 *   url: true
 * });
 *
 * await Route("route", {
 *   zoneId: zone.zoneId,
 *   worker: api,
 *   pattern: "api.example.com/*",
 * });
 *
 * @example
 * // Create a real-time chat worker using Durable Objects
 * // for state management:
 * const chatRooms = DurableObjectNamespace("chat-rooms");
 * const userStore = DurableObjectNamespace("user-store");
 *
 * const chat = await Worker("chat", {
 *   name: "chat-worker",
 *   entrypoint: "./src/chat.ts",
 *   bindings: {
 *     ROOMS: chatRooms,
 *     USERS: userStore
 *   },
 * });
 *
 * @example
 * // Create a worker with KV namespace for caching and data storage:
 * const cache = await KVNamespace("cache-store");
 * const settings = await KVNamespace("user-settings");
 *
 * const cacheWorker = await Worker("cache", {
 *   name: "cache-worker",
 *   entrypoint: "./src/cache.ts",
 *   bindings: {
 *     CACHE: cache,
 *     SETTINGS: settings
 *   }
 * });
 *
 * @example
 * // Create a worker with R2 bucket for object storage:
 * const uploads = await R2Bucket("uploads", {
 *   name: "user-uploads"
 * });
 * const assets = await R2Bucket("assets", {
 *   name: "static-assets",
 *   allowPublicAccess: true
 * });
 *
 * const storageWorker = await Worker("storage", {
 *   name: "storage-worker",
 *   entrypoint: "./src/storage.ts",
 *   bindings: {
 *     UPLOADS: uploads,
 *     ASSETS: assets
 *   }
 * });
 *
 * @example
 * // Create a worker with static assets:
 * const staticAssets = await Assets({
 *   path: "./src/assets"
 * });
 *
 * const frontendWorker = await Worker("frontend", {
 *   name: "frontend-worker",
 *   entrypoint: "./src/worker.ts",
 *   bindings: {
 *     ASSETS: staticAssets
 *   }
 * });
 *
 * @example
 * // Create a worker with scheduled cron triggers:
 * const cronWorker = await Worker("scheduled-tasks", {
 *   name: "cron-worker",
 *   entrypoint: "./src/scheduled.ts",
 *   crons: ['* 15 * * *', '0 0 * * *', '0 12 * * MON']
 * })
 *
 * @example
 * // Create cross-script durable object binding where one worker
 * // defines the durable object and another worker accesses it:
 * const dataWorker = await Worker("data-worker", {
 *   name: "data-worker",
 *   entrypoint: "./src/data.ts",
 *   bindings: {
 *     // Bind to its own durable object
 *     STORAGE: DurableObjectNamespace("storage", {
 *       className: "DataStorage"
 *     })
 *   }
 * });
 *
 * const apiWorker = await Worker("api-worker", {
 *   name: "api-worker",
 *   entrypoint: "./src/api.ts",
 *   bindings: {
 *     // Cross-script binding to the data worker's durable object
 *     SHARED_STORAGE: dataWorker.bindings.STORAGE
 *   }
 * });
 *
 * @example
 * // Create a worker with queue event sources and custom consumer settings:
 * const taskQueue = await Queue("task-queue", {
 *   name: "task-queue"
 * });
 *
 * const dlq = await Queue("failed-tasks", {
 *   name: "failed-tasks"
 * });
 *
 * const queueWorker = await Worker("queue-processor", {
 *   name: "queue-processor",
 *   entrypoint: "./src/processor.ts",
 *   bindings: {
 *     TASK_QUEUE: taskQueue  // Producer: bind queue for sending messages
 *   },
 *   eventSources: [{  // Consumer: configure processing settings
 *     queue: taskQueue,
 *     settings: {
 *       batchSize: 15,           // Process 15 messages at once
 *       maxConcurrency: 3,       // Allow 3 concurrent invocations
 *       maxRetries: 5,           // Retry failed messages up to 5 times
 *       maxWaitTimeMs: 2500,     // Wait up to 2.5 seconds to fill a batch
 *       retryDelay: 60,          // Wait 60 seconds before retrying failed messages
 *       deadLetterQueue: dlq     // Send failed messages to dead letter queue
 *     }
 *   }]
 * });
 *
 * @example
 * // Create a worker version for testing with a preview URL:
 * const previewWorker = await Worker("my-worker", {
 *   name: "my-worker",
 *   entrypoint: "./src/worker.ts",
 *   version: "pr-123"
 * });
 *
 * // The worker will have a preview URL for testing:
 * console.log(`Preview URL: ${previewWorker.url}`);
 * // Output: Preview URL: https://pr-123-my-worker.subdomain.workers.dev
 */
export function Worker<
  const B extends Bindings,
  RPC extends Rpc.WorkerEntrypointBranded,
>(id: string, props: WorkerProps<B, RPC>): Promise<Worker<B, RPC>>;

export function Worker<const B extends Bindings>(
  id: string,
  props: WorkerProps<B>,
): Promise<Worker<B>> {
  return _Worker(id, props as WorkerProps<B>);
}

Worker.experimentalEntrypoint = <RPC extends Rpc.WorkerEntrypointBranded>(
  worker: Worker | WorkerRef | Self,
  entrypoint: string,
) => {
  if (Scope.getScope()?.local) {
    logger.warn(
      "Worker.experimentalEntrypoint is not supported in local development. See: https://github.com/cloudflare/workers-sdk/issues/10681",
    );
  }
  return {
    ...worker,
    // we rename the entrypoint in order to prevent collisions with entrypoint on Worker
    __entrypoint__: entrypoint,
  } as (Worker | WorkerRef) & {
    __entrypoint__?: string;
    __rpc__?: RPC;
  };
};

const _Worker = Resource(
  "cloudflare::Worker",
  {
    alwaysUpdate: true,
  },
  async function <const B extends Bindings>(
    this: Context<Worker<NoInfer<B>>>,
    id: string,
    props: WorkerProps<B>,
  ) {
    let adopt = props.adopt ?? this.scope.adopt;
    const workerName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    if (this.phase === "create" && !props.adopt) {
      // it is possible that this worker already exists and was created by the old Website wrapper with a nested scope
      // we need to detect this and set adopt=true so that the previous version will be adopted seamlessly

      // HEURISTIC: `this.scope` would previously be the nested outer scope alchemy.run
      // so, if `this.scope` has a child of `wrangler.jsonc`, then it is likely that it was created by the old Website wrapper with a nested scope
      if (await this.scope.has("wrangler.jsonc", "cloudflare::WranglerJson")) {
        logger.warn(
          `Migrating Worker '${workerName}' from the legacy Website wrapper.`,
        );
        props.adopt = true;
      }
    }

    const options = (() => {
      if (props.projectRoot) {
        logger.warn("projectRoot is deprecated, use cwd instead");
        props.cwd = props.projectRoot;
      }

      const cwd = path.resolve(props.cwd ?? process.cwd());
      const compatibilityDate =
        props.compatibilityDate ?? DEFAULT_COMPATIBILITY_DATE;
      const compatibilityFlags = unionCompatibilityFlags(
        props.compatibility,
        props.compatibilityFlags,
      );
      const dispatchNamespace =
        typeof props.namespace === "string"
          ? props.namespace
          : props.namespace?.namespaceName;
      const bundle = normalizeWorkerBundle({
        id,
        entrypoint: props.entrypoint,
        script: props.script,
        format: props.format,
        noBundle: props.noBundle,
        rules: "rules" in props ? props.rules : undefined,
        bundle: props.bundle,
        cwd,
        compatibilityDate,
        compatibilityFlags,
        outdir:
          props.bundle?.outdir ??
          // the out folder can't be moved to the root of a monorepo, it must be ${cwd} or else miniflare throws a fit
          path.join(process.cwd(), ".alchemy", "out", workerName),
        sourceMap: "sourceMap" in props ? props.sourceMap : undefined,
      });

      let assets: Assets | undefined;
      const containers: Container[] = [];
      const workflows: Workflow[] = [];
      const durableObjects: DurableObjectNamespace[] = [];
      for (const binding of Object.values(props.bindings ?? {})) {
        if (typeof binding !== "object") continue;

        if (binding.type === "assets") {
          assets = binding;
        } else if (binding.type === "container") {
          containers.push(binding);
        } else if (
          binding.type === "workflow" &&
          (!binding.scriptName || binding.scriptName === workerName)
        ) {
          workflows.push(binding);
        } else if (
          binding.type === "durable_object_namespace" &&
          (!binding.scriptName || binding.scriptName === workerName)
        ) {
          durableObjects.push(binding);
        }
      }

      return {
        name: workerName,
        cwd,
        compatibilityDate,
        compatibilityFlags,
        dispatchNamespace,
        bundle,
        assets,
        containers,
        workflows,
        durableObjects,
      };
    })();

    if (this.phase === "delete") {
      // Heuristic: we must detect the case where this is the Worker wrapped in the old Website nested scope and not delete it
      // we must not delete it because what we're actually doing is migrating to a flat worker
      // we will achieve this by checking for a sibling resource with ID wrangler.jsonc and type cloudflare::WranglerJson
      if (await this.scope.has("wrangler.jsonc", "cloudflare::WranglerJson")) {
        // skip deletion
        logger.warn(
          `Migrating Worker '${options.name}' from the legacy Website wrapper.`,
        );
        return this.destroy(true);
      }

      if (options.bundle.isOk()) {
        await options.bundle.value.delete?.();
      }
      await deleteMiniflareWorkerData(this.scope, options.name, {
        durableObjects: options.durableObjects,
        workflows: options.workflows,
      });
      if (this.output?.dev?.hasRemote !== false) {
        const api = await createCloudflareApi(props);
        if (props.version) {
          //* if the worker exists we deploy an empty version so we can destroy
          if (await exists(api, options.name)) {
            await createEmptyWorker(api, options.name, props.version);
          }
        } else {
          await deleteQueueConsumers(api, options.name);
          await deleteWorker(api, {
            scriptName: options.name,
            dispatchNamespace: options.dispatchNamespace,
          });
        }
      }
      return this.destroy();
    }

    if (options.bundle.isErr()) {
      throw new Error(options.bundle.error);
    }
    const bundle = options.bundle.value;
    const api = await createCloudflareApi(props);

    if (this.scope.local && !props.dev?.remote) {
      let url: string | undefined;
      if (props.dev?.url) {
        url = props.dev.url;
      } else {
        const { MiniflareController } = await import(
          "./miniflare/miniflare-controller.js"
        );
        const controller = MiniflareController.singleton;
        url = await controller.add({
          api,
          id,
          name: options.name,
          compatibilityDate: options.compatibilityDate,
          compatibilityFlags: options.compatibilityFlags,
          bindings: props.bindings,
          eventSources: props.eventSources,
          assets: props.assets,
          bundle,
          port: props.dev?.port,
          tunnel: props.dev?.tunnel ?? this.scope.tunnel,
        });
        this.onCleanup(() => controller.dispose());
      }
      await provisionResources(
        {
          ...props,
          adopt,
        },
        {
          name: options.name,
          local: true,
          dispatchNamespace: options.dispatchNamespace,
          containers: options.containers,
        },
      );
      return {
        ...props,
        type: "service",
        id,
        name: options.name,
        cwd: path.relative(process.cwd(), options.cwd),
        compatibilityDate: options.compatibilityDate,
        compatibilityFlags: options.compatibilityFlags,
        format: props.format || "esm",
        bindings: normalizeExportBindings(options.name, props.bindings),
        createdAt: this.output?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        url,
        routes: [],
        domains: [],
        dev: {
          hasRemote: this.output?.dev?.hasRemote ?? false,
        },
        Env: undefined!,
      } as unknown as Worker<B>;
    }

    if (this.phase === "create" || this.output.dev?.hasRemote === false) {
      if (props.version) {
        // When version is specified, we adopt existing workers or create them if they don't exist
        if (!(await workerExists(api, options))) {
          // Create the base worker first if it doesn't exist
          await putWorker(api, {
            ...props,
            version: undefined,
            workerName: options.name,
            scriptBundle: await bundle.create(),
            dispatchNamespace: options.dispatchNamespace,
            compatibilityDate: options.compatibilityDate,
            compatibilityFlags: options.compatibilityFlags,
            assetUploadResult: options.assets
              ? await uploadAssets(api, {
                  workerName: options.name,
                  assets: options.assets,
                  assetConfig: props.assets,
                  namespace: options.dispatchNamespace,
                })
              : undefined,
          });
        }
        // We always "adopt" when publishing versions
      } else if (!adopt) {
        await assertWorkerDoesNotExist(api, options.name);
      } else if (adopt && !options.dispatchNamespace && props.url === false) {
        // explicitly disable the workers.dev subdomain
        await disableWorkerSubdomain(api, options.name);
      }
    } else if (this.phase === "update") {
      const oldName = this.output.name ?? this.output.id;
      const newName = options.name;

      if (oldName && oldName !== newName) {
        if (options.dispatchNamespace) {
          this.replace(true);
        } else {
          const renameResponse = await api.patch(
            `/accounts/${api.accountId}/workers/services/${oldName}`,
            { id: newName },
          );

          if (!renameResponse.ok) {
            await handleApiError(renameResponse, "rename", "worker", oldName);
          }
        }
      }
    }

    const assets = options.assets
      ? await uploadAssets(api, {
          workerName: options.name,
          assets: options.assets,
          assetConfig: props.assets,
          namespace: options.dispatchNamespace,
        })
      : undefined;
    let result: PutWorkerResult;

    if (this.scope.watch) {
      const controller = new AbortController();
      result = await watchWorker(api, props, {
        id,
        name: options.name,
        dispatchNamespace: options.dispatchNamespace,
        bundle,
        compatibilityDate: options.compatibilityDate,
        compatibilityFlags: options.compatibilityFlags,
        version: props.version,
        assets,
        controller,
      });
      this.onCleanup(() => controller.abort());
      const tail = await createTail(api, id, options.name).catch((error) => {
        logger.error(`Failed to create tail for ${options.name}`, error);
      });
      this.onCleanup(() => tail?.close());
    } else {
      result = await putWorker(api, {
        ...props,
        workerName: options.name,
        scriptBundle: await bundle.create(),
        dispatchNamespace: options.dispatchNamespace,
        compatibilityDate: options.compatibilityDate,
        compatibilityFlags: options.compatibilityFlags,
        assetUploadResult: assets,
      });
    }

    if (props.crons) {
      await api.put(
        `/accounts/${api.accountId}/workers/scripts/${options.name}/schedules`,
        props.crons?.map((cron) => ({ cron })) ?? [],
      );
    }

    await Promise.all(
      options.workflows.map((workflow) =>
        upsertWorkflow(api, {
          workflowName: workflow.workflowName,
          className: workflow.className,
          scriptName: workflow.scriptName ?? options.name,
        }),
      ),
    );

    const { domains, routes, subdomain } = await provisionResources(
      {
        ...props,
        adopt,
      },
      {
        name: options.name,
        local: false,
        dispatchNamespace: options.dispatchNamespace,
        containers: options.containers,
        result,
        api,
      },
    );

    const now = new Date();
    return {
      ...props,
      type: "service",
      id,
      entrypoint: props.entrypoint,
      name: options.name,
      cwd: path.relative(process.cwd(), options.cwd),
      compatibilityDate: options.compatibilityDate,
      compatibilityFlags: options.compatibilityFlags,
      format: props.format || "esm",
      bindings: normalizeExportBindings(options.name, props.bindings),
      env: props.env,
      observability: props.observability,
      createdAt: this.output?.createdAt ?? now,
      updatedAt: now,
      eventSources: props.eventSources,
      url: subdomain?.url,
      assets: props.assets,
      crons: props.crons,
      tailConsumers: props.tailConsumers,
      routes,
      domains,
      namespace: props.namespace,
      version: props.version,
      placement: props.placement,
      limits: props.limits,
      Env: undefined!,
      dev: {
        hasRemote: true,
      },
    } as unknown as Worker<B>;
  },
);

const normalizeExportBindings = (
  scriptName: string,
  bindings: Bindings = {},
) => {
  return Object.fromEntries(
    Object.entries(bindings).map(([bindingName, binding]) => [
      bindingName,
      isDurableObjectNamespace(binding) && binding.scriptName === undefined
        ? DurableObjectNamespace(binding.id, {
            ...binding,
            // re-export this binding mapping to the host worker (this worker)
            scriptName,
          })
        : isWorkflow(binding) && binding.scriptName === undefined
          ? Workflow(binding.id, {
              ...binding,
              // re-export this binding mapping to the host worker (this worker)
              scriptName,
            })
          : binding,
    ]),
  );
};

const assertUnique = <T, Key extends keyof T>(
  inputs: T[],
  key: Key,
  message: string,
) => {
  const ids = inputs.map((input) => input[key]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicates.length > 0) {
    throw new Error(`Duplicate ${message} found: ${duplicates.join(", ")}`);
  }
};

async function provisionResources<B extends Bindings>(
  props: WorkerProps<B> & {
    adopt: boolean;
  },
  options:
    | {
        name: string;
        local: true;
        dispatchNamespace: string | undefined;
        containers: Container[] | undefined;
        result?: undefined;
        api?: undefined;
      }
    | {
        name: string;
        local: false;
        dispatchNamespace: string | undefined;
        containers: Container[] | undefined;
        result: PutWorkerResult;
        api: CloudflareApi;
      },
) {
  let metadataPromise: ReturnType<typeof getVersionMetadata> | undefined;

  const input = {
    containers: options.containers,
    domains: props.domains?.map((domain) => {
      if (typeof domain === "string") {
        return {
          name: domain,
          zoneId: undefined,
          adopt: props.adopt,
        };
      }
      return {
        name: domain.domainName,
        zoneId: domain.zoneId,
        adopt: domain.adopt ?? props.adopt,
      };
    }),
    eventSources: props.eventSources?.map((eventSource) => {
      if (isQueue(eventSource)) {
        return {
          queue: eventSource,
          settings: eventSource.dlq
            ? { deadLetterQueue: eventSource.dlq }
            : undefined,
        };
      }
      if (isQueueEventSource(eventSource)) {
        return {
          queue: eventSource.queue,
          settings: eventSource.settings,
        };
      }
      throw new Error(`Unsupported event source: ${eventSource}`);
    }),
    routes: props.routes?.map((route) => {
      if (typeof route === "string") {
        return {
          pattern: route,
          adopt: props.adopt,
        };
      }
      return {
        pattern: route.pattern,
        zoneId: route.zoneId,
        adopt: route.adopt ?? props.adopt,
      };
    }),
    api: {
      accountId: props.accountId,
      apiKey: props.apiKey,
      apiToken: props.apiToken,
      email: props.email,
      baseUrl: props.baseUrl,
      profile: props.profile,
    } satisfies CloudflareApiOptions,
  };

  if (input.routes) {
    assertUnique(input.routes, "pattern", "Route");
  }
  if (input.domains) {
    assertUnique(input.domains, "name", "Custom Domain");
  }

  const [containers, domains, eventSources, routes, subdomain] =
    await Promise.all([
      input.containers
        ? Promise.all(
            input.containers.map(async (container) => {
              return await ContainerApplication(container.id, {
                image: container.image,
                name: container.name,
                instanceType: container.instanceType,
                observability: container.observability,
                durableObjects: {
                  namespaceId: await getContainerNamespaceId(container),
                },
                schedulingPolicy: container.schedulingPolicy,
                adopt: container.adopt,
                dev: options.local,
                ...input.api,
              });
            }),
          )
        : undefined,
      input.domains
        ? Promise.all(
            input.domains.map(async (domain) => {
              return await CustomDomain(domain.name, {
                name: domain.name,
                zoneId: domain.zoneId,
                adopt: domain.adopt,
                workerName: options.name,
                dev: options.local,
                ...input.api,
              });
            }),
          )
        : undefined,
      input.eventSources
        ? Promise.all(
            input.eventSources.map(async (eventSource) => {
              return await QueueConsumer(`${eventSource.queue.id}-consumer`, {
                queue: eventSource.queue,
                scriptName: options.name,
                settings: eventSource.settings,
                adopt: props.adopt,
                dev: options.local,
                ...input.api,
              });
            }),
          )
        : undefined,
      input.routes
        ? Promise.all(
            input.routes.map(async (route) => {
              return await Route(route.pattern, {
                pattern: route.pattern,
                script: options.name,
                zoneId: route.zoneId,
                adopt: route.adopt,
                dev: options.local,
                ...input.api,
              });
            }),
          )
        : undefined,
      (props.url ?? !options.dispatchNamespace)
        ? WorkerSubdomain("url", {
            scriptName: options.name,
            previewVersionId: props.version ? options.result?.id : undefined,
            retain: !!props.version,
            dev: options.local,
            ...input.api,
          })
        : undefined,
    ]);

  return { containers, domains, routes, eventSources, subdomain };

  async function getContainerNamespaceId(container: Container) {
    if (options.local) {
      return container.id;
    }
    metadataPromise ??= getVersionMetadata(
      options.api,
      options.name,
      options.result.deployment_id,
    );
    const metadata = await metadataPromise;
    const binding = metadata.resources.bindings.find(
      (binding): binding is WorkerBindingDurableObjectNamespace =>
        binding.type === "durable_object_namespace" &&
        binding.class_name === container.className,
    );
    if (!binding?.namespace_id) {
      throw new Error(
        `Container ${container.name} not found in version ${options.result.deployment_id}`,
      );
    }
    return binding.namespace_id;
  }
}

const watchWorker = async <B extends Bindings>(
  api: CloudflareApi,
  props: WorkerProps<B>,
  input: {
    id: string;
    name: string;
    dispatchNamespace: string | undefined;
    bundle: WorkerBundleSource;
    compatibilityDate: string;
    compatibilityFlags: string[];
    version: string | undefined;
    assets: AssetUploadResult | undefined;
    controller: AbortController;
  },
) => {
  const promise = new DeferredPromise<PutWorkerResult>();
  const run = async () => {
    for await (const bundle of input.bundle.watch(input.controller.signal)) {
      if (promise.status === "pending") {
        try {
          const result = await putWorker(api, {
            ...props,
            workerName: input.name,
            scriptBundle: bundle,
            dispatchNamespace: input.dispatchNamespace,
            compatibilityDate: input.compatibilityDate,
            compatibilityFlags: input.compatibilityFlags,
            assetUploadResult: input.assets,
          });
          promise.resolve(result);
        } catch (error) {
          input.controller.abort();
          promise.reject(error);
        }
        continue;
      }

      logger.task("", {
        message: "reload",
        status: "success",
        resource: input.id,
        prefix: "build",
        prefixColor: "cyanBright",
      });

      await putWorker(api, {
        ...props,
        workerName: input.name,
        scriptBundle: bundle,
        dispatchNamespace: input.dispatchNamespace,
        version: input.version,
        compatibilityDate: input.compatibilityDate,
        compatibilityFlags: input.compatibilityFlags,
        assetUploadResult: input.assets
          ? {
              keepAssets: true,
              assetConfig: props.assets,
            }
          : undefined,
        unstable_cacheWorkerSettings: true,
      });

      logger.task("", {
        message: "updated",
        status: "success",
        resource: input.id,
        prefix: "build",
        prefixColor: "greenBright",
      });
    }
  };
  void run();
  return await promise.value;
};

type PutWorkerOptions = Omit<WorkerProps, "entrypoint"> & {
  dispatchNamespace?: string;
  migrationTag?: string;
  workerName: string;
  scriptBundle: WorkerBundle;
  version?: string;
  compatibilityDate: string;
  compatibilityFlags: string[];
  assetUploadResult?: {
    completionToken?: string;
    keepAssets?: boolean;
    assetConfig?: AssetsConfig;
  };
  tags?: string[];
  unstable_cacheWorkerSettings?: boolean;
};

async function prepareWorkerUpload(
  api: CloudflareApi,
  props: PutWorkerOptions,
) {
  const scriptMetadata = await prepareWorkerMetadata(api, props);

  if (props.format === "cjs") {
    scriptMetadata.body_part = props.scriptBundle.entrypoint;
  } else {
    scriptMetadata.main_module = props.scriptBundle.entrypoint;
  }
  const body = await WorkerBundle.toFormData(props.scriptBundle);
  // Prepare metadata - add version annotations if this is a version
  const finalMetadata = props.version
    ? {
        ...scriptMetadata,
        // Exclude migrations for worker versions - they're not allowed
        migrations: undefined,
        annotations: {
          "workers/tag": props.version,
          "workers/message": `Version ${props.version}`,
        },
      }
    : {
        ...scriptMetadata,
        migrations: scriptMetadata.migrations
          ? {
              ...scriptMetadata.migrations,
              old_tag: props.migrationTag,
              new_tag: bumpMigrationTagVersion(props.migrationTag),
            }
          : undefined,
      };

  body.append(
    "metadata",
    new Blob([JSON.stringify(finalMetadata)], {
      type: "application/json",
    }),
  );

  let endpoint: string;
  let method: "PUT" | "POST";
  if (props.version) {
    if (props.dispatchNamespace) {
      throw new Error(
        "Worker Preview Versions are not supported in Workers for Platforms",
      );
    }
    // Upload worker version using the versions API
    endpoint = `/accounts/${api.accountId}/workers/scripts/${props.workerName}/versions`;
    method = "POST";
  } else {
    // Upload worker script with bindings
    endpoint = props.dispatchNamespace
      ? `/accounts/${api.accountId}/workers/dispatch/namespaces/${props.dispatchNamespace}/scripts/${props.workerName}`
      : `/accounts/${api.accountId}/workers/scripts/${props.workerName}`;
    method = "PUT";
  }

  return {
    body,
    endpoint,
    method,
  };
}

interface PutWorkerResult {
  id: string;
  number: number;
  metadata: {
    has_preview: boolean;
  };
  annotations?: {
    "workers/tag"?: string;
  };
  deployment_id: string;
}

export async function putWorker(
  api: CloudflareApi,
  props: PutWorkerOptions,
): Promise<PutWorkerResult> {
  const {
    //
    workerName,
    version,
  } = props;

  return withExponentialBackoff(
    async () => {
      const { body, endpoint, method } = await prepareWorkerUpload(api, props);
      const uploadResponse = await api.fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body,
      });

      // Check if the upload was successful
      if (!uploadResponse.ok) {
        try {
          return await handleApiError(
            uploadResponse,
            version ? "uploading worker version" : "uploading worker script",
            "worker",
            workerName,
          );
        } catch (error) {
          if (error instanceof CloudflareApiError && error.status === 412) {
            // this happens when adopting a Worker managed with Wrangler
            // because wrangler includes a migration tag and we do not
            // currently, the only way to discover the old_tag is through the error message
            // Get Worker Script Settings is meant to return it (according to the docs)
            // but it doesn't work at runtime
            //
            // so, we catch the error and parse out the tag and then retry
            if (error.message.includes("when expected tag is")) {
              const newTag = error.message.match(
                /when expected tag is ['"]?(v\d+)['"]?/,
              )?.[1];
              if (newTag) {
                return await putWorker(api, {
                  ...props,
                  migrationTag: newTag,
                });
              }
            } else {
              throw error;
            }
          } else {
            throw error;
          }
        }
      }
      const responseData = (await uploadResponse.json()) as {
        result: PutWorkerResult;
      };
      return responseData.result;
    },
    (err) =>
      err.status === 404 ||
      err.status === 500 ||
      err.status === 503 ||
      // this is a transient error that cloudflare throws randomly
      (err instanceof CloudflareApiError &&
        err.status === 400 &&
        err.message.match(/binding.*failed to generate/)),
    10,
    100,
  );
}

const workerExists = async (
  api: CloudflareApi,
  options: {
    name: string;
    dispatchNamespace: string | undefined;
  },
) => {
  const res = await api.get(
    options.dispatchNamespace
      ? `/accounts/${api.accountId}/workers/dispatch/namespaces/${options.dispatchNamespace}/scripts/${options.name}`
      : `/accounts/${api.accountId}/workers/scripts/${options.name}`,
  );
  return res.status === 200;
};

async function assertWorkerDoesNotExist(
  api: CloudflareApi,
  scriptName: string,
) {
  const response = await api.get(
    `/accounts/${api.accountId}/workers/scripts/${scriptName}`,
  );
  if (response.status === 404) {
    return true;
  }
  if (response.status === 200) {
    const metadata = await getScriptMetadata(api, scriptName);

    if (!metadata) {
      throw new Error(
        `Worker exists but failed to fetch metadata: ${response.status} ${response.statusText}`,
      );
    }

    throw new Error(
      `Worker with name '${scriptName}' already exists. Please use a unique name.`,
    );
  }
  throw new Error(
    `Error checking if worker exists: ${response.status} ${response.statusText} ${await response.text()}`,
  );
}

export async function getScriptMetadata(
  api: CloudflareApi,
  scriptName: string,
): Promise<WorkerScriptMetadata | undefined> {
  const res = await api.get(
    `/accounts/${api.accountId}/workers/services/${scriptName}`,
  );
  if (res.status === 404) {
    return;
  }
  if (!res.ok) {
    throw new Error(
      `Error getting worker script metadata: ${res.status} ${res.statusText}`,
    );
  }
  const json = (await res.json()) as { result: WorkerScriptMetadata };
  return json.result;
}

async function deleteQueueConsumers(api: CloudflareApi, scriptName: string) {
  const consumers = await listQueueConsumersForWorker(api, scriptName);
  await Promise.all(
    consumers.map(async (consumer) => {
      await deleteQueueConsumer(api, consumer.queueId, consumer.consumerId);
    }),
  );
}

export async function deleteWorker(
  api: CloudflareApi,
  props: {
    scriptName: string;
    dispatchNamespace?: string;
  },
) {
  await withExponentialBackoff(
    async () => {
      const deleteResponse = await api.delete(
        props.dispatchNamespace
          ? `/accounts/${api.accountId}/workers/dispatch/namespaces/${props.dispatchNamespace}/scripts/${props.scriptName}?force=true`
          : `/accounts/${api.accountId}/workers/scripts/${props.scriptName}?force=true`,
      );

      if (!deleteResponse.ok && deleteResponse.status !== 404) {
        await handleApiError(
          deleteResponse,
          "delete",
          "worker",
          props.scriptName,
        );
      }
    },
    (err) =>
      (err.status === 400 &&
        err.message.includes(
          "is still referenced by service bindings in Workers",
        )) ||
      err.status === 500 ||
      err.status === 503,
    10,
    100,
  );
}

async function getVersionMetadata(
  api: CloudflareApi,
  scriptName: string,
  deploymentId: string,
) {
  const response = await api.get(
    `/accounts/${api.accountId}/workers/scripts/${scriptName}/versions/${deploymentId}`,
  );
  const result = (await response.json()) as {
    result: {
      resources: {
        bindings: WorkerBindingSpec[];
      };
    };
  };
  return result.result;
}
