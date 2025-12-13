import type { BundleProps } from "../esbuild/bundle.ts";
import type { type } from "../type.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Bindings, Self } from "./bindings.ts";
import type { Bound } from "./bound.ts";
import { type CompatibilityPreset } from "./compatibility-presets.ts";
import { CustomDomain } from "./custom-domain.ts";
import type { DispatchNamespace } from "./dispatch-namespace.ts";
import { type EventSource } from "./event-source.ts";
import { Route } from "./route.ts";
import { WorkerBundle } from "./worker-bundle.ts";
import { type WorkerScriptMetadata } from "./worker-metadata.ts";
import "../esbuild/bundle.ts";
import type { WorkerRef } from "./worker-ref.ts";
/**
 * Configuration options for static assets
 */
export interface AssetsConfig {
    /**
     * The contents of a _headers file (used to attach custom headers on asset responses)
     * @default the `_headers` file in the assets directory, if present
     */
    _headers?: string;
    /**
     * The contents of a _redirects file (used to apply redirects or proxy paths ahead of asset serving)
     * @default the `_redirects` file in the assets directory, if present
     */
    _redirects?: string;
    /**
     * Determines the redirects and rewrites of requests for HTML content
     *
     * @default auto-trailing-slash
     */
    html_handling?: "auto-trailing-slash" | "force-trailing-slash" | "drop-trailing-slash" | "none";
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
export interface BaseWorkerProps<B extends Bindings | undefined = undefined, RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> extends CloudflareApiOptions {
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
    routes?: (string | {
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
    })[];
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
    domains?: (string | {
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
    })[];
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
    dev?: {
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
    } | {
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
    tailConsumers?: Array<Worker | {
        service: string;
    }>;
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
export interface InlineWorkerProps<B extends Bindings | undefined = Bindings, RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> extends BaseWorkerProps<B, RPC> {
    script: string;
    entrypoint?: undefined;
    noBundle?: false;
}
export interface EntrypointWorkerProps<B extends Bindings | undefined = Bindings, RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> extends BaseWorkerProps<B, RPC> {
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
export type WorkerProps<B extends Bindings | undefined = Bindings, RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> = InlineWorkerProps<B, RPC> | EntrypointWorkerProps<B, RPC>;
export declare function isWorker(resource: any): resource is Worker<any>;
/**
 * Output returned after Worker creation/update
 */
export type Worker<B extends Bindings | undefined = Bindings | undefined, RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> = Omit<WorkerProps<B>, "url" | "script" | "routes" | "domains"> & {
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
    Env: B extends Bindings ? {
        [bindingName in keyof B]: Bound<B[bindingName]>;
    } : undefined;
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
export declare function Worker<const B extends Bindings, RPC extends Rpc.WorkerEntrypointBranded>(id: string, props: WorkerProps<B, RPC>): Promise<Worker<B, RPC>>;
export declare namespace Worker {
    var experimentalEntrypoint: <RPC extends Rpc.WorkerEntrypointBranded>(worker: Worker | WorkerRef | Self, entrypoint: string) => (Worker | WorkerRef) & {
        __entrypoint__?: string;
        __rpc__?: RPC;
    };
}
export declare namespace Worker {
    type DevDomain = typeof DevDomain;
    const DevDomain: {
        type: "cloudflare::Worker::DevDomain";
    };
    type DevUrl = typeof DevUrl;
    const DevUrl: {
        type: "cloudflare::Worker::DevUrl";
    };
}
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
export declare function putWorker(api: CloudflareApi, props: PutWorkerOptions): Promise<PutWorkerResult>;
export declare function getScriptMetadata(api: CloudflareApi, scriptName: string): Promise<WorkerScriptMetadata | undefined>;
export declare function deleteWorker(api: CloudflareApi, props: {
    scriptName: string;
    dispatchNamespace?: string;
}): Promise<void>;
export {};
//# sourceMappingURL=worker.d.ts.map