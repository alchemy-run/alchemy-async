import fs from "node:fs/promises";
import path from "node:path";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { Scope } from "../scope.ts";
import { isSecret } from "../secret.ts";
import { unencryptSecrets } from "./util/filter-env-bindings.ts";
import { assertNever } from "../util/assert-never.ts";
import type { Bindings, WorkerBindingRateLimit } from "./bindings.ts";
import type { R2BucketJurisdiction } from "./bucket.ts";
import type { DurableObjectNamespace } from "./durable-object-namespace.ts";
import type { EventSource } from "./event-source.ts";
import { isQueueEventSource } from "./event-source.ts";
import { isQueue } from "./queue.ts";
import { isWorker, type Worker, type WorkerProps } from "./worker.ts";

type WranglerJsonRateLimit = Omit<WorkerBindingRateLimit, "type"> & {
  type: "rate_limit";
};

/**
 * Properties for wrangler.json configuration file
 */
export interface WranglerJsonProps {
  name?: string;
  /**
   * The worker to generate the wrangler.json file for
   */
  worker:
    | Worker<any>
    | (WorkerProps<any> & {
        name: string;
      });
  /**
   * Path to write the wrangler.json file to
   *
   * @default worker.cwd/wrangler.json
   */
  path?: string;

  /**
   * The main entry point for the worker
   *
   * @default worker.entrypoint
   */
  main?: string;

  /**
   * Path to the assets directory
   *
   * @default inferred from the worker's Asset bindings
   */
  assets?: {
    binding: string;
    directory: string;
  };

  /**
   * Whether to include secrets in the wrangler.json file
   *
   * @default true
   */
  secrets?: boolean;

  /**
   * Transform hooks to modify generated configuration files
   */
  transform?: {
    /**
     * Hook to modify the wrangler.json object before it's written
     *
     * This function receives the generated wrangler.json spec and should return
     * a modified version. It's applied as the final transformation before the
     * file is written to disk.
     *
     * @param spec - The generated wrangler.json specification
     * @returns The modified wrangler.json specification
     */
    wrangler?: (
      spec: WranglerJsonSpec,
    ) => WranglerJsonSpec | Promise<WranglerJsonSpec>;
  };
}

/**
 * Output returned after WranglerJson creation/update
 */
export interface WranglerJson extends WranglerJsonProps {
  /**
   * Time at which the file was created
   */
  createdAt: number;

  /**
   * Time at which the file was last updated
   */
  updatedAt: number;

  /**
   * Path to the wrangler.json file
   */
  path: string;

  /**
   * `wrangler.json` spec
   */
  spec: WranglerJsonSpec;
}

// we are deprecating the WranglerJson resource (it is now just a funciton)
// but, a user may still have a resource that depends on it, so we register a no-op dummy resource so that it can be cleanly delted
Resource("cloudflare::WranglerJson", async function (this: Context<any>) {
  if (this.phase === "delete") {
    return this.destroy();
  }

  throw new Error("Not implemented");
});

/**
 * Resource for managing wrangler.json configuration files
 */
export async function WranglerJson(
  props: WranglerJsonProps,
): Promise<WranglerJson> {
  const cwd = props.worker.cwd ? path.resolve(props.worker.cwd) : process.cwd();

  const toAbsolute = <T extends string | undefined>(input: T): T => {
    return (input ? path.resolve(cwd, input) : undefined) as T;
  };

  const main = toAbsolute(props.main ?? props.worker.entrypoint);
  let filePath = toAbsolute(props.path ?? cwd);
  if (!path.basename(filePath).match(".json")) {
    filePath = path.join(filePath, props.name ?? "wrangler.jsonc");
  }

  const dirname = path.dirname(filePath);

  if (!main) {
    throw new Error(
      "Worker must have an entrypoint to generate a wrangler.json",
    );
  }

  const worker = props.worker;

  const spec: WranglerJsonSpec = {
    name: worker.name,
    // Use entrypoint as main if it exists
    main: path.relative(dirname, main),
    // see: https://developers.cloudflare.com/workers/configuration/compatibility-dates/
    compatibility_date: worker.compatibilityDate,
    compatibility_flags: props.worker.compatibilityFlags,
    assets: props.assets
      ? {
          directory: toAbsolute(props.assets.directory),
          binding: props.assets.binding,
          not_found_handling: props.worker.assets?.not_found_handling,
          html_handling: props.worker.assets?.html_handling,
          run_worker_first: props.worker.assets?.run_worker_first,
        }
      : undefined,
    placement: worker.placement,
    limits: worker.limits,
    logpush: worker.logpush,
  };

  // Process bindings if they exist
  if (worker.bindings) {
    processBindings(
      spec,
      worker.bindings,
      worker.eventSources,
      worker.name,
      cwd,
      props.secrets ?? false,
      Scope.current.local && !props.worker.dev?.remote,
    );
  }

  // Add environment variables as vars
  if (worker.env) {
    spec.vars = { ...worker.env };
  }

  if (worker.tailConsumers && worker.tailConsumers.length > 0) {
    spec.tail_consumers = worker.tailConsumers.map((consumer) => {
      if (isWorker(consumer)) {
        return { service: consumer.name };
      }
      return { service: consumer.service };
    });
  }

  if (worker.crons && worker.crons.length > 0) {
    spec.triggers = { crons: worker.crons };
  }

  if (spec.assets) {
    spec.assets.directory = path.relative(dirname, spec.assets.directory);
  }

  // Apply the wrangler configuration hook as the final transformation
  const finalSpec = props.transform?.wrangler
    ? await props.transform.wrangler(spec)
    : spec;

  await fs.mkdir(dirname, { recursive: true });
  if (props.secrets) {
    // If secrets are enabled, decrypt them in the wrangler.json file,
    // but do not modify `finalSpec` so that way secrets aren't written to state unencrypted.
    const withSecretsUnwrapped = {
      ...finalSpec,
      vars: unencryptSecrets(finalSpec.vars ?? {}),
    };
    await writeJSON(filePath, withSecretsUnwrapped);
  } else {
    await writeJSON(filePath, finalSpec);
  }

  return {
    ...props,
    path: path.relative(cwd, filePath),
    spec: finalSpec,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

const writeJSON = async (filePath: string, content: any) => {
  await fs.writeFile(filePath, `${JSON.stringify(content, null, 2)}\n`);
};

/**
 * Wrangler.json configuration specification based on Cloudflare's schema
 */
export interface WranglerJsonSpec {
  /**
   * The name of the worker
   */
  name: string;

  /**
   * Main entry point for the worker
   */
  main?: string;

  /**
   * A date in the form yyyy-mm-dd used to determine Workers runtime version
   */
  compatibility_date?: string;

  /**
   * A list of flags that enable features from upcoming Workers runtime
   */
  compatibility_flags?: string[];

  /**
   * The placement mode for the worker
   */
  placement?: {
    mode: "smart";
  };

  /**
   * The CPU time limit for the worker
   */
  limits?: {
    cpu_ms?: number;
  };

  /**
   * Send Trace Events from this Worker to Workers Logpush.
   *
   * This will not configure a corresponding Logpush job automatically.
   *
   * @default false
   */
  logpush?: boolean;

  /**
   * Whether to enable a workers.dev URL for this worker
   */
  workers_dev?: boolean;

  /**
   * Routes to attach to the worker
   */
  routes?: string[];

  /**
   * Scheduled triggers for the worker
   */
  triggers?: {
    crons: string[];
  };

  /**
   * AI bindings
   */
  ai?: {
    binding: string;
    experimental_remote?: boolean;
  };

  /**
   * Browser bindings
   */
  browser?: {
    binding: string;
    experimental_remote?: boolean;
  };

  /**
   * Images bindings
   */
  images?: {
    binding: string;
    experimental_remote?: boolean;
  };

  /**
   * KV Namespace bindings
   */
  kv_namespaces?: {
    binding: string;
    id: string;
    /**
     * The ID of the KV namespace used during `wrangler dev`
     */
    preview_id?: string;
    experimental_remote?: boolean;
  }[];

  /**
   * Durable Object bindings
   */
  durable_objects?: {
    bindings: {
      name: string;
      class_name: string;
      script_name?: string;
      environment?: string;
    }[];
  };

  /**
   * R2 bucket bindings
   */
  r2_buckets?: {
    binding: string;
    bucket_name: string;
    /**
     * The preview name of this R2 bucket at the edge.
     */
    preview_bucket_name?: string;
    experimental_remote?: boolean;
  }[];

  /**
   * Queue bindings
   */
  queues?: {
    producers?: { queue: string; binding: string }[];
    consumers?: QueueConsumerWranglerJson[];
  };

  /**
   * Service bindings
   */
  services?: {
    binding: string;
    service: string;
    environment?: string;
    entrypoint?: string;
  }[];

  worker_loaders?: {
    binding: string;
  }[];

  /**
   * Workflow bindings
   */
  workflows?: {
    name: string;
    binding: string;
    class_name: string;
    script_name?: string;
  }[];

  /**
   * Vectorize index bindings
   */
  vectorize?: {
    binding: string;
    index_name: string;
    experimental_remote?: boolean;
  }[];

  /**
   * Plain text bindings (vars)
   */
  vars?: Record<string, string>;

  /**
   * D1 database bindings
   */
  d1_databases?: {
    binding: string;
    database_id: string;
    database_name: string;
    migrations_dir?: string;
    /**
     * The ID of the D1 database used during `wrangler dev`
     */
    preview_database_id?: string;
    experimental_remote?: boolean;
  }[];

  /**
   * Assets bindings
   */
  assets?: {
    directory: string;
    binding: string;
    not_found_handling?: "none" | "404-page" | "single-page-application";
    html_handling?:
      | "auto-trailing-slash"
      | "drop-trailing-slash"
      | "force-trailing-slash"
      | "none";
    run_worker_first?: boolean | string[];
  };

  /**
   * Migrations
   */
  migrations?: {
    tag: string;
    new_sqlite_classes?: string[];
    new_classes?: string[];
  }[];

  /**
   * Workflow bindings
   */
  wasm_modules?: Record<string, string>;

  /**
   * Safe mode configuration
   */
  node_compat?: boolean;

  /**
   * Whether to minify the worker script
   */
  minify?: boolean;

  /**
   * Analytics Engine datasets
   */
  analytics_engine_datasets?: { binding: string; dataset: string }[];

  /**
   * Hyperdrive bindings
   */
  hyperdrive?: {
    binding: string;
    id: string;
    localConnectionString?: string;
  }[];

  /**
   * Pipelines
   */
  pipelines?: { binding: string; pipeline: string }[];

  /**
   * Secrets Store bindings
   */
  secrets_store_secrets?: {
    binding: string;
    store_id: string;
    secret_name: string;
  }[];

  /**
   * Version metadata bindings
   */
  version_metadata?: {
    binding: string;
  };

  /**
   * Dispatch namespace bindings
   */
  dispatch_namespaces?: {
    binding: string;
    namespace: string;
    experimental_remote?: boolean;
  }[];

  /**
   * Tail consumers that will receive execution logs from this worker
   */
  tail_consumers?: Array<{ service: string }>;

  /**
   * Unsafe bindings section for experimental features
   */
  unsafe?: {
    bindings: WranglerJsonRateLimit[];
  };
}

/**
 * Queue consumer bindings for wrangler.json
 */
interface QueueConsumerWranglerJson {
  queue: string;
  /**
   * The maximum number of messages allowed in each batch.
   */
  max_batch_size?: number;
  /**
   * The maximum number of concurrent consumers allowed to run at once. Leaving this unset will mean that the number of invocations will scale to the currently supported maximum.
   */
  max_concurrency?: number;
  /**
   * The maximum number of retries for a message, if it fails or `retryAll()` is invoked.
   */
  max_retries?: number;
  /**
   * The maximum number of seconds to wait for messages to fill a batch before the batch is sent to the consumer Worker.
   */
  max_batch_timeout?: number;
  /**
   * The number of seconds to delay retried messages for by default, before they are re-delivered to the consumer. This can be overridden on a per-message or per-batch basis when retrying messages.
   */
  retry_delay?: number;
}

/**
 * Process worker bindings into wrangler.json format
 */
function processBindings(
  spec: WranglerJsonSpec,
  bindings: Bindings,
  eventSources: EventSource[] | undefined,
  workerName: string,
  workerCwd: string,
  writeSecrets: boolean,
  local: boolean,
): void {
  // Arrays to collect different binding types
  const kvNamespaces: {
    binding: string;
    id: string;
    preview_id: string;
    experimental_remote?: boolean;
  }[] = [];
  const durableObjects: {
    name: string;
    class_name: string;
    script_name?: string;
    environment?: string;
  }[] = [];
  const r2Buckets: {
    binding: string;
    bucket_name: string;
    preview_bucket_name: string;
    jurisdiction?: R2BucketJurisdiction;
  }[] = [];
  const services: {
    binding: string;
    service: string;
    environment?: string;
    entrypoint?: string;
  }[] = [];
  const secrets: string[] = [];
  const workflows: {
    name: string;
    binding: string;
    class_name: string;
    script_name?: string;
  }[] = [];
  const d1Databases: {
    binding: string;
    database_id: string;
    database_name: string;
    migrations_dir?: string;
    preview_database_id: string;
    experimental_remote?: boolean;
  }[] = [];
  const queues: {
    producers: { queue: string; binding: string }[];
    consumers: QueueConsumerWranglerJson[];
  } = {
    producers: [],
    consumers: [],
  };

  const new_sqlite_classes: string[] = [];
  const new_classes: string[] = [];

  const vectorizeIndexes: {
    binding: string;
    index_name: string;
    experimental_remote?: boolean;
  }[] = [];
  const analyticsEngineDatasets: { binding: string; dataset: string }[] = [];
  const hyperdrive: {
    binding: string;
    id: string;
    localConnectionString?: string;
  }[] = [];
  const pipelines: { binding: string; pipeline: string }[] = [];
  const secretsStoreSecrets: {
    binding: string;
    store_id: string;
    secret_name: string;
  }[] = [];
  const dispatchNamespaces: {
    binding: string;
    namespace: string;
    experimental_remote?: boolean;
  }[] = [];
  const unsafeBindings: WranglerJsonRateLimit[] = [];
  const containers: {
    class_name: string;
  }[] = [];
  const workerLoaders: {
    binding: string;
  }[] = [];

  for (const eventSource of eventSources ?? []) {
    if (isQueueEventSource(eventSource)) {
      queues.consumers.push({
        queue: eventSource.queue.name,
        max_batch_size: eventSource.settings?.batchSize,
        max_concurrency: eventSource.settings?.maxConcurrency,
        max_retries: eventSource.settings?.maxRetries,
        max_batch_timeout: eventSource.settings?.maxWaitTimeMs
          ? eventSource.settings?.maxWaitTimeMs / 1000
          : undefined,
        retry_delay: eventSource.settings?.retryDelay,
      });
    } else if (isQueue(eventSource)) {
      queues.consumers.push({
        queue: eventSource.name,
      });
    }
  }
  // Process each binding
  for (const [bindingName, binding] of Object.entries(bindings)) {
    if (typeof binding === "function") {
      // this is only reachable in the
      throw new Error(`Invalid binding ${bindingName} is a function`);
    }
    if (typeof binding === "string") {
      // Plain text binding - add to vars
      spec.vars ??= {};
      spec.vars[bindingName] = binding;
    } else if (writeSecrets && isSecret(binding)) {
      spec.vars ??= {};
      spec.vars[bindingName] = binding as any;
    } else if (binding.type === "cloudflare::Worker::Self") {
      // Self(service) binding
      services.push({
        binding: bindingName,
        service: workerName,
        entrypoint: binding.__entrypoint__,
      });
    } else if (binding.type === "service") {
      // Service binding
      services.push({
        binding: bindingName,
        service: "name" in binding ? binding.name : binding.service,
        entrypoint:
          "__entrypoint__" in binding ? binding.__entrypoint__ : undefined,
      });
    } else if (binding.type === "kv_namespace") {
      // KV Namespace binding
      const id =
        "dev" in binding && !binding.dev?.remote && local
          ? binding.dev.id
          : "namespaceId" in binding
            ? binding.namespaceId
            : binding.id;
      kvNamespaces.push({
        binding: bindingName,
        id: id,
        preview_id: id,
        ...("dev" in binding && binding.dev?.remote
          ? { experimental_remote: true }
          : {}),
      });
    } else if (
      typeof binding === "object" &&
      binding.type === "durable_object_namespace"
    ) {
      // Durable Object binding
      const doBinding = binding as DurableObjectNamespace;
      durableObjects.push({
        name: bindingName,
        class_name: doBinding.className,
        script_name: doBinding.scriptName,
        environment: doBinding.environment,
      });
      if (doBinding.sqlite) {
        new_sqlite_classes.push(doBinding.className);
      } else {
        new_classes.push(doBinding.className);
      }
    } else if (binding.type === "r2_bucket") {
      const name =
        "dev" in binding && !binding.dev?.remote && local
          ? binding.dev.id
          : binding.name;
      r2Buckets.push({
        binding: bindingName,
        bucket_name: name,
        preview_bucket_name: name,
        jurisdiction:
          binding.jurisdiction === "default" ? undefined : binding.jurisdiction,
        ...(binding.dev?.remote ? { experimental_remote: true } : {}),
      });
    } else if (binding.type === "secret") {
      // Secret binding
      secrets.push(bindingName);
    } else if (binding.type === "assets") {
      spec.assets = {
        directory: path.resolve(workerCwd, binding.path),
        binding: bindingName,
      };
    } else if (binding.type === "workflow") {
      workflows.push({
        name: binding.workflowName,
        binding: bindingName,
        class_name: binding.className,
        script_name: binding.scriptName,
      });
    } else if (binding.type === "d1") {
      const id =
        "dev" in binding && !binding.dev?.remote && local
          ? binding.dev.id
          : binding.id;
      d1Databases.push({
        binding: bindingName,
        database_id: id,
        database_name: binding.name,
        migrations_dir: binding.migrationsDir,
        preview_database_id: id,
        ...(binding.dev?.remote ? { experimental_remote: true } : {}),
      });
    } else if (binding.type === "queue") {
      const id =
        "dev" in binding && !binding.dev?.remote && local
          ? binding.dev.id
          : binding.id;
      queues.producers.push({
        binding: bindingName,
        queue: id,
      });
    } else if (binding.type === "vectorize") {
      vectorizeIndexes.push({
        binding: bindingName,
        index_name: binding.name,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        experimental_remote: true,
      });
    } else if (binding.type === "browser") {
      if (spec.browser) {
        throw new Error(`Browser already bound to ${spec.browser.binding}`);
      }
      spec.browser = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        experimental_remote: true,
      };
    } else if (binding.type === "ai") {
      if (spec.ai) {
        throw new Error(`AI already bound to ${spec.ai.binding}`);
      }
      spec.ai = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        experimental_remote: true,
      };
    } else if (binding.type === "images") {
      if (spec.images) {
        throw new Error(`Images already bound to ${spec.images.binding}`);
      }
      spec.images = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        experimental_remote: true,
      };
    } else if (binding.type === "analytics_engine") {
      analyticsEngineDatasets.push({
        binding: bindingName,
        dataset: binding.dataset,
      });
    } else if (binding.type === "version_metadata") {
      if (spec.version_metadata) {
        throw new Error(
          `Version metadata already bound to ${spec.version_metadata.binding}`,
        );
      }
      spec.version_metadata = {
        binding: bindingName,
      };
    } else if (binding.type === "hyperdrive") {
      hyperdrive.push({
        binding: bindingName,
        id: binding.hyperdriveId,
        localConnectionString: writeSecrets
          ? binding.dev?.origin.unencrypted
          : undefined,
      });
    } else if (binding.type === "pipeline") {
      pipelines.push({
        binding: bindingName,
        pipeline: binding.name,
      });
    } else if (binding.type === "json") {
      // TODO(sam): anything to do here? not sure wrangler.json supports this
    } else if (binding.type === "secrets_store_secret") {
      secretsStoreSecrets.push({
        binding: bindingName,
        store_id: binding.storeId,
        secret_name: binding.name,
      });
    } else if (binding.type === "dispatch_namespace") {
      dispatchNamespaces.push({
        binding: bindingName,
        namespace: binding.namespaceName,
        experimental_remote: true,
      });
    } else if (binding.type === "ratelimit") {
      unsafeBindings.push({
        name: bindingName,
        type: "rate_limit",
        namespace_id: binding.namespace_id.toString(),
        simple: binding.simple,
      });
    } else if (binding.type === "secret_key") {
      // no-op
    } else if (binding.type === "container") {
      durableObjects.push({
        name: bindingName,
        class_name: binding.className,
        script_name: binding.scriptName,
      });
      containers.push({
        class_name: binding.className,
      });
    } else if (binding.type === "worker_loader") {
      workerLoaders.push({
        binding: bindingName,
      });
    } else {
      console.log("binding", binding);
      // biome-ignore lint/correctness/noVoidTypeReturn: it returns never
      return assertNever(binding);
    }
  }

  // Add collected bindings to the spec
  if (kvNamespaces.length > 0) {
    spec.kv_namespaces = kvNamespaces;
  }

  if (durableObjects.length > 0) {
    spec.durable_objects = {
      bindings: durableObjects,
    };
  }

  if (r2Buckets.length > 0) {
    spec.r2_buckets = r2Buckets;
  }

  if (services.length > 0) {
    spec.services = services;
  }

  if (d1Databases.length > 0) {
    spec.d1_databases = d1Databases;
  }

  if (queues.consumers.length > 0) {
    (spec.queues ??= {}).consumers = queues.consumers;
  }
  if (queues.producers.length > 0) {
    (spec.queues ??= {}).producers = queues.producers;
  }

  if (vectorizeIndexes.length > 0) {
    spec.vectorize = vectorizeIndexes;
  }

  if (new_sqlite_classes.length > 0 || new_classes.length > 0) {
    spec.migrations = [
      {
        tag: "v1",
        new_sqlite_classes,
        new_classes,
      },
    ];
  }

  if (workflows.length > 0) {
    spec.workflows = workflows;
  }

  if (analyticsEngineDatasets.length > 0) {
    spec.analytics_engine_datasets = analyticsEngineDatasets;
  }

  if (hyperdrive.length > 0) {
    spec.hyperdrive = hyperdrive;
  }

  if (pipelines.length > 0) {
    spec.pipelines = pipelines;
  }

  if (secretsStoreSecrets.length > 0) {
    spec.secrets_store_secrets = secretsStoreSecrets;
  }

  if (dispatchNamespaces.length > 0) {
    spec.dispatch_namespaces = dispatchNamespaces;
  }

  if (unsafeBindings.length > 0) {
    spec.unsafe = {
      bindings: unsafeBindings,
    };
  }

  if (workerLoaders.length > 0) {
    spec.worker_loaders = workerLoaders;
  }
}
