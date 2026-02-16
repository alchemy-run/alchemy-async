import fs from "node:fs/promises";
import path from "pathe";
import type { Unstable_Config as WranglerJsonConfig } from "wrangler";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { Scope } from "../scope.ts";
import { isSecret } from "../secret.ts";
import { assertNever } from "../util/assert-never.ts";
import { createCloudflareApi } from "./api.ts";
import type { Bindings } from "./bindings.ts";
import { getCloudflareRegistryWithAccountNamespace } from "./container.ts";
import type { DurableObjectNamespace } from "./durable-object-namespace.ts";
import type { EventSource } from "./event-source.ts";
import { isQueueEventSource } from "./event-source.ts";
import { isQueue } from "./queue.ts";
import { unencryptSecrets } from "./util/filter-env-bindings.ts";
import { getAccountSubdomain } from "./worker-subdomain.ts";
import { isWorker, Worker, type WorkerProps } from "./worker.ts";

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
    limits: worker.limits
      ? {
          cpu_ms: worker.limits.cpu_ms ?? 30_000,
          subrequests: worker.limits.subrequests,
        }
      : undefined,
    logpush: worker.logpush,
  };

  // Process bindings if they exist
  if (worker.bindings) {
    await processBindings(
      spec,
      worker.bindings,
      worker.eventSources,
      worker.name,
      cwd,
      props.secrets ?? false,
      Scope.current.local && !props.worker.dev?.remote,
      async () =>
        worker.accountId ?? (await createCloudflareApi(worker)).accountId,
      async () => await getAccountSubdomain(await createCloudflareApi(worker)),
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

  if (spec.assets && spec.assets.directory) {
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
      vars: unencryptSecrets((finalSpec.vars as Record<string, string>) ?? {}),
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
export interface WranglerJsonSpec extends Partial<WranglerJsonConfig> {}

/**
 * Process worker bindings into wrangler.json format
 */
async function processBindings(
  spec: WranglerJsonSpec,
  bindings: Bindings,
  eventSources: EventSource[] | undefined,
  workerName: string,
  workerCwd: string,
  writeSecrets: boolean,
  local: boolean,
  getAccountId: () => Promise<string>,
  getAccountSubdomain: () => Promise<string>,
): Promise<void> {
  // Arrays to collect different binding types
  const kvNamespaces: WranglerJsonConfig["kv_namespaces"] = [];
  const durableObjects: WranglerJsonConfig["durable_objects"]["bindings"] = [];
  const r2Buckets: WranglerJsonConfig["r2_buckets"] = [];
  const services: WranglerJsonConfig["services"] = [];
  const secrets: string[] = [];
  const workflows: WranglerJsonConfig["workflows"] = [];
  const d1Databases: WranglerJsonConfig["d1_databases"] = [];
  const queues: {
    producers: WranglerJsonConfig["queues"]["producers"] & {};
    consumers: WranglerJsonConfig["queues"]["consumers"] & {};
  } = {
    producers: [],
    consumers: [],
  };
  const new_sqlite_classes: WranglerJsonConfig["migrations"][number]["new_sqlite_classes"] =
    [];
  const new_classes: WranglerJsonConfig["migrations"][number]["new_classes"] =
    [];
  const vectorizeIndexes: WranglerJsonConfig["vectorize"] = [];
  const analyticsEngineDatasets: WranglerJsonConfig["analytics_engine_datasets"] =
    [];
  const hyperdrive: WranglerJsonConfig["hyperdrive"] = [];
  const pipelines: WranglerJsonConfig["pipelines"] = [];
  const secretsStoreSecrets: WranglerJsonConfig["secrets_store_secrets"] = [];
  const dispatchNamespaces: WranglerJsonConfig["dispatch_namespaces"] = [];
  const ratelimits: WranglerJsonConfig["ratelimits"] = [];
  const containers: WranglerJsonConfig["containers"] = [];
  const workerLoaders: WranglerJsonConfig["worker_loaders"] = [];
  const vpcServices: WranglerJsonConfig["vpc_services"] = [];

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
    } else if (binding.type === "cloudflare::Worker::DevDomain") {
      const subdomain = await getAccountSubdomain();
      // Subdomain binding
      (spec.vars ??= {})[bindingName] =
        `${workerName}.${subdomain}.workers.dev`;
    } else if (binding.type === "cloudflare::Worker::DevUrl") {
      const subdomain = await getAccountSubdomain();
      // Subdomain binding
      (spec.vars ??= {})[bindingName] =
        `https://${workerName}.${subdomain}.workers.dev`;
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
        ...("dev" in binding && binding.dev?.remote ? { remote: true } : {}),
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
        ...(binding.dev?.remote ? { remote: true } : {}),
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
        ...(binding.dev?.remote ? { remote: true } : {}),
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
        remote: true,
      });
    } else if (binding.type === "browser") {
      if (spec.browser) {
        throw new Error(`Browser already bound to ${spec.browser.binding}`);
      }
      spec.browser = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        remote: true,
      };
    } else if (binding.type === "ai") {
      if (spec.ai) {
        throw new Error(`AI already bound to ${spec.ai.binding}`);
      }
      spec.ai = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        remote: true,
      };
    } else if (binding.type === "images") {
      if (spec.images) {
        throw new Error(`Images already bound to ${spec.images.binding}`);
      }
      spec.images = {
        binding: bindingName,
        // https://developers.cloudflare.com/workers/development-testing/#recommended-remote-bindings
        remote: true,
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
        remote: true,
      });
    } else if (binding.type === "ratelimit") {
      ratelimits.push({
        name: bindingName,
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
      new_sqlite_classes.push(binding.className);
      // If there are build options, use the local image path, otherwise use the image reference
      const image = binding.image.build
        ? path.resolve(
            workerCwd,
            path.join(
              binding.image.build.context ?? process.cwd(),
              binding.image.build.dockerfile ?? "Dockerfile",
            ),
          )
        : getCloudflareRegistryWithAccountNamespace(
            await getAccountId(),
            binding.image.imageRef,
          );
      containers.push({
        class_name: binding.className,
        image,
      });
    } else if (binding.type === "worker_loader") {
      workerLoaders.push({
        binding: bindingName,
      });
    } else if (binding.type === "vpc_service") {
      vpcServices.push({
        binding: bindingName,
        service_id: binding.serviceId,
        remote: true,
      });
    } else {
      console.log("binding", binding);
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

  if (containers.length > 0) {
    spec.containers = containers;
  }

  if (ratelimits.length > 0) {
    spec.ratelimits = ratelimits;
  }

  if (workerLoaders.length > 0) {
    spec.worker_loaders = workerLoaders;
  }
}
