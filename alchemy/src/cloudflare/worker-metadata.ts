import { assertNever } from "../util/assert-never.ts";
import { camelToSnakeObjectDeep } from "../util/camel-to-snake.ts";
import { logger } from "../util/logger.ts";
import { memoize } from "../util/memoize.ts";
import { extractCloudflareResult } from "./api-response.ts";
import type { CloudflareApi } from "./api.ts";
import type {
  Bindings,
  WorkerBindingDurableObjectNamespace,
  WorkerBindingSpec,
} from "./bindings.ts";
import { isContainer, type Container } from "./container.ts";
import {
  isDurableObjectNamespace,
  type DurableObjectNamespace,
} from "./durable-object-namespace.ts";
import { createAssetConfig } from "./worker-assets.ts";
import type {
  MultiStepMigration,
  SingleStepMigration,
} from "./worker-migration.ts";
import { isWorker, type AssetsConfig, type WorkerProps } from "./worker.ts";

/**
 * Metadata returned by Cloudflare API for a worker script
 */
export interface WorkerScriptMetadata {
  /**
   * Worker ID
   */
  id: string;

  /**
   * Default environment information
   */
  default_environment?: WorkerDefaultEnvironment;

  /**
   * Worker creation timestamp
   */
  created_on: string;

  /**
   * Worker last modification timestamp
   */
  modified_on: string;

  /**
   * Worker usage model
   */
  usage_model: string;

  /**
   * Worker environments
   */
  environments?: WorkerEnvironment[];
}

/**
 * Worker script information
 */
export interface WorkerScriptInfo {
  /**
   * Script creation timestamp
   */
  created_on: string;

  /**
   * Script last modification timestamp
   */
  modified_on: string;

  /**
   * Script ID
   */
  id: string;

  /**
   * Script tag
   */
  tag: string;

  /**
   * Script tags
   */
  tags: string[];

  /**
   * Deployment ID
   */
  deployment_id: string;

  /**
   * Tail consumers
   */
  tail_consumers: any;

  /**
   * Whether logpush is enabled
   */
  logpush: boolean;

  /**
   * Observability settings
   */
  observability: {
    /**
     * Whether observability is enabled
     */
    enabled: boolean;

    /**
     * Head sampling rate
     */
    head_sampling_rate: number | null;
  };

  /**
   * Whether the script has assets
   */
  has_assets: boolean;

  /**
   * Whether the script has modules
   */
  has_modules: boolean;

  /**
   * Script etag
   */
  etag: string;

  /**
   * Script handlers
   */
  handlers: string[];

  /**
   * Where the script was last deployed from
   */
  last_deployed_from: string;

  /**
   * Script usage model
   */
  usage_model: string;
}

/**
 * Worker environment information
 */
export interface WorkerEnvironment {
  /**
   * Environment name
   */
  environment: string;

  /**
   * Environment creation timestamp
   */
  created_on: string;

  /**
   * Environment last modification timestamp
   */
  modified_on: string;
}

/**
 * Default environment with script information
 */
export interface WorkerDefaultEnvironment extends WorkerEnvironment {
  /**
   * Script information
   */
  script: WorkerScriptInfo;
}

//? (jacob): why is this not using BaseWorkerProps?
export interface WorkerMetadata {
  compatibility_date: string;
  compatibility_flags?: string[];
  bindings: WorkerBindingSpec[];
  observability?: {
    enabled?: boolean;
    head_sampling_rate?: number;
    logs?: {
      enabled?: boolean;
      head_sampling_rate?: number;
      invocation_logs?: boolean;
    };
    traces?: {
      enabled?: boolean;
      head_sampling_rate?: number;
      persist?: boolean;
      destinations?: string[];
    };
  };
  logpush?: boolean;
  migrations?: SingleStepMigration;
  main_module?: string;
  body_part?: string;
  tags?: string[];
  assets?: {
    jwt?: string;
    keep_assets?: boolean;
    config?: AssetsConfig;
  };
  cron_triggers?: {
    cron: string;
    suspended: boolean;
  }[];
  containers?: { class_name: string }[];
  placement?: {
    mode: "smart";
  };
  limits?: {
    cpu_ms?: number;
  };
  tail_consumers?: Array<Worker | { service: string }>;
}

export async function prepareWorkerMetadata(
  api: CloudflareApi,
  props: Omit<WorkerProps, "entrypoint"> & {
    compatibilityDate: string;
    compatibilityFlags: string[];
    workerName: string;
    migrationTag?: string;
    assetUploadResult?: {
      completionToken?: string;
      keepAssets?: boolean;
      assetConfig?: AssetsConfig;
    };
    tags?: string[];
    unstable_cacheWorkerSettings?: boolean;
    placement?: {
      mode: "smart";
    };
  },
): Promise<WorkerMetadata> {
  const oldSettings = await (
    props.unstable_cacheWorkerSettings
      ? getWorkerSettingsWithCache
      : getWorkerSettings
  )(api, props.workerName);
  const oldTags: string[] | undefined = Array.from(
    new Set([
      ...(oldSettings?.default_environment?.script?.tags ?? []),
      ...(oldSettings?.tags ?? []),
    ]),
  );

  const oldBindings = oldSettings?.bindings;
  // we use Cloudflare Worker tags to store a mapping between Alchemy's stable identifier and the binding name
  // e.g.
  // {
  //   BINDING_NAME: DurableObjectNamespace("stable-id")
  // }
  // will be stored as alchemy:do:stable-id:BINDING_NAME
  // TODO(sam): should we base64 encode to ensure no `:` collision risk?
  const bindingNameToStableId = Object.fromEntries(
    oldTags?.flatMap((tag: string) => {
      // alchemy:do:{stableId}:{bindingName}
      if (tag.startsWith("alchemy:do:")) {
        const [, , stableId, bindingName] = tag.split(":");
        return [[bindingName, stableId]];
      }
      return [];
    }) ?? [],
  );

  const oldMigrationTag = oldTags?.flatMap((tag: string) => {
    if (tag.startsWith("alchemy:migration-tag:")) {
      return [tag.slice("alchemy:migration-tag:".length)];
    }
    return [];
  })[0];
  const newMigrationTag = bumpMigrationTagVersion(oldMigrationTag);

  const deletedClasses = oldBindings?.flatMap((oldBinding) => {
    if (
      oldBinding.type === "durable_object_namespace" &&
      (oldBinding.script_name === undefined ||
        // if this a cross-script binding, we don't need to do migrations in the remote worker
        oldBinding.script_name === props.workerName)
    ) {
      // reverse the stableId from our tag-encoded metadata
      const stableId = bindingNameToStableId[oldBinding.name];
      if (stableId) {
        if (props.bindings === undefined) {
          // all classes are deleted
          return [oldBinding.class_name];
        }
        // we created this worker on latest version, we can now intelligently determine migrations

        // try and find the DO binding by stable id
        const object = Object.values(props.bindings).find(
          (binding): binding is DurableObjectNamespace | Container =>
            (isDurableObjectNamespace(binding) || isContainer(binding)) &&
            binding.id === stableId,
        );
        if (object) {
          // we found the corresponding object, it should not be deleted
          return [];
        } else {
          // it was not found, we will now delete it
          return [oldBinding.class_name];
        }
      } else {
        // ok, we were unable to find the stableId, this worker must have been created by an old alchemy or outside of alchemy
        // let's now apply a herusitic based on binding name (assume binding name is consistent)
        // TODO(sam): this has a chance of being wrong, is that OK? Users should be encouraged to upgrade alchemy version and re-deploy
        const object = props.bindings?.[oldBinding.name];
        if (object && isDurableObjectNamespace(object)) {
          if (object.className === oldBinding.class_name) {
            // this is relatively safe to assume is the right match, do not delete
            return [];
          } else {
            // the class name has changed, this could indicate one of:
            // 1. the user has changed the class name and we should migrate it
            // 2. the user deleted the DO a long time ago and this is unrelated (we should just create a new one)
            return [oldBinding.class_name];
          }
        } else {
          // we didn't find it, so delete it
          return [oldBinding.class_name];
        }
      }
    }
    return [];
  });

  const observability = camelToSnakeObjectDeep(props.observability);

  // Prepare metadata with bindings
  const meta: WorkerMetadata = {
    compatibility_date: props.compatibilityDate,
    compatibility_flags: props.compatibilityFlags,
    tail_consumers: props.tailConsumers?.map((consumer) =>
      isWorker(consumer) ? { service: consumer.name } : consumer,
    ),
    bindings: [],
    observability: {
      ...observability,
      enabled: observability?.enabled !== false,
    },
    logpush: props.logpush ?? false,
    // TODO(sam): base64 encode instead? 0 collision risk vs readability.
    tags: [
      // encode a mapping table of Durable Object stable ID -> binding name
      // we use this to reliably compute class migrations based on server-side state
      ...Object.entries(props.bindings ?? {}).flatMap(
        ([bindingName, binding]) =>
          isDurableObjectNamespace(binding) || isContainer(binding)
            ? // TODO(sam): base64 encode if contains `:`?
              [`alchemy:do:${binding.id}:${bindingName}`]
            : [],
      ),
      // encode the migraiton tag if there is one so we can avoid the failed PutWorker after adoption
      ...(newMigrationTag ? [`alchemy:migration-tag:${newMigrationTag}`] : []),
      ...(props.tags ?? []),
    ],
    migrations: {
      old_tag: oldMigrationTag,
      new_tag: newMigrationTag,
      new_classes: [],
      deleted_classes: [...(deletedClasses ?? [])],
      renamed_classes: [],
      transferred_classes: [],
      new_sqlite_classes: [],
    },
    placement: props.placement,
    limits: props.limits,
  };

  const assetUploadResult = props.assetUploadResult;
  // If we have asset upload results, add them to the metadata
  if (assetUploadResult) {
    meta.assets = {
      jwt: assetUploadResult.completionToken,
      keep_assets: assetUploadResult.keepAssets,
      config: assetUploadResult.assetConfig,
    };

    // If there's no config from assetUploadResult but we have props.assets,
    // we need to create the config ourselves (this handles the case when no assets were uploaded)
    if (!meta.assets.config && props.assets) {
      meta.assets.config = createAssetConfig(props.assets);
    }
  }

  const bindings = (props.bindings ?? {}) as Bindings;

  // Validate that all Container and DurableObjectNamespace bindings have unique IDs
  const bindingIds = new Map<string, string>();
  for (const [bindingName, binding] of Object.entries(bindings)) {
    if (typeof binding === "object" && binding !== null && "id" in binding) {
      if (isDurableObjectNamespace(binding) || isContainer(binding)) {
        if (bindingIds.has(binding.id)) {
          throw new Error(
            `Duplicate binding ID '${binding.id}' found for bindings '${bindingIds.get(binding.id)}' and '${bindingName}'. Container and DurableObjectNamespace bindings must have unique IDs.`,
          );
        }
        bindingIds.set(binding.id, bindingName);
      }
    }
  }

  // Convert bindings to the format expected by the API
  for (const [bindingName, binding] of Object.entries(bindings)) {
    // Create a copy of the binding to avoid modifying the original

    if (typeof binding === "string") {
      meta.bindings.push({
        type: "plain_text",
        name: bindingName,
        text: binding,
      });
    } else if (binding.type === "cloudflare::Worker::Self") {
      meta.bindings.push({
        type: "service",
        name: bindingName,
        service: props.workerName,
        entrypoint: binding.__entrypoint__,
      });
    } else if (binding.type === "d1") {
      meta.bindings.push({
        type: "d1",
        name: bindingName,
        id: binding.id,
      });
    } else if (binding.type === "kv_namespace") {
      meta.bindings.push({
        type: "kv_namespace",
        name: bindingName,
        namespace_id:
          "namespaceId" in binding ? binding.namespaceId : binding.id,
      });
    } else if (binding.type === "service") {
      meta.bindings.push({
        type: "service",
        name: bindingName,
        service: "service" in binding ? binding.service : binding.name,
        entrypoint:
          "__entrypoint__" in binding ? binding.__entrypoint__ : undefined,
      });
    } else if (binding.type === "durable_object_namespace") {
      meta.bindings.push({
        type: "durable_object_namespace",
        name: bindingName,
        class_name: binding.className,
        script_name:
          binding.scriptName === props.workerName
            ? undefined
            : binding.scriptName,
        environment: binding.environment,
        namespace_id: binding.namespaceId,
      });
      if (
        binding.scriptName === undefined ||
        // TODO(sam): not sure if Cloudflare Api would like us using `this` worker name here
        binding.scriptName === props.workerName
      ) {
        // we do not need configure class migrations for cross-script bindings
        configureClassMigration(bindingName, binding);
      }
    } else if (binding.type === "r2_bucket") {
      meta.bindings.push({
        type: "r2_bucket",
        name: bindingName,
        bucket_name: binding.name,
        jurisdiction:
          binding.jurisdiction === "default" ? undefined : binding.jurisdiction,
      });
    } else if (binding.type === "secrets_store_secret") {
      meta.bindings.push({
        type: "secrets_store_secret",
        name: bindingName,
        store_id: binding.storeId,
        secret_name: binding.name,
      });
    } else if (binding.type === "assets") {
      meta.bindings.push({
        type: "assets",
        name: bindingName,
      });
    } else if (binding.type === "secret") {
      meta.bindings.push({
        type: "secret_text",
        name: bindingName,
        text: binding.unencrypted,
      });
    } else if (binding.type === "workflow") {
      meta.bindings.push({
        type: "workflow",
        name: bindingName,
        workflow_name: binding.workflowName,
        class_name: binding.className,
        script_name: binding.scriptName,
      });
      // it's unclear whether this is needed, but it works both ways
      // configureClassMigration(binding, binding.id, binding.className);
    } else if (binding.type === "queue") {
      meta.bindings.push({
        type: "queue",
        name: bindingName,
        queue_name: binding.name,
      });
    } else if (binding.type === "pipeline") {
      meta.bindings.push({
        type: "pipelines",
        name: bindingName,
        pipeline: binding.name,
      });
    } else if (binding.type === "vectorize") {
      meta.bindings.push({
        type: "vectorize",
        name: bindingName,
        index_name: binding.name,
      });
    } else if (binding.type === "hyperdrive") {
      // Hyperdrive binding
      meta.bindings.push({
        type: "hyperdrive",
        name: bindingName,
        id: binding.hyperdriveId,
      });
    } else if (binding.type === "browser") {
      meta.bindings.push({
        type: "browser",
        name: bindingName,
      });
    } else if (binding.type === "ai") {
      const existing = meta.bindings.find((b) => b.type === "ai");
      if (existing) {
        throw new Error(
          `Workers cannot have multiple AI bindings. Binding "${bindingName}" conflicts with "${existing.name}".`,
        );
      }
      meta.bindings.push({
        type: "ai",
        name: bindingName,
      });
    } else if (binding.type === "json") {
      meta.bindings.push({
        type: "json",
        name: bindingName,
        json: JSON.stringify(binding.json),
      });
    } else if (binding.type === "analytics_engine") {
      meta.bindings.push({
        type: "analytics_engine",
        name: bindingName,
        dataset: binding.dataset,
      });
    } else if (binding.type === "images") {
      meta.bindings.push({
        type: "images",
        name: bindingName,
      });
    } else if (binding.type === "version_metadata") {
      meta.bindings.push({
        type: "version_metadata",
        name: bindingName,
      });
    } else if (binding.type === "dispatch_namespace") {
      meta.bindings.push({
        type: "dispatch_namespace",
        name: bindingName,
        namespace: binding.namespaceName,
      });
    } else if (binding.type === "worker_loader") {
      meta.bindings.push({
        type: "worker_loader",
        name: bindingName,
      });
    } else if (binding.type === "secret_key") {
      meta.bindings.push({
        type: "secret_key",
        name: bindingName,
        algorithm: binding.algorithm,
        format: binding.format,
        usages: binding.usages,
        key_base64: binding.key_base64?.unencrypted,
        key_jwk: binding.key_jwk?.unencrypted,
      });
    } else if (binding.type === "container") {
      meta.bindings.push({
        type: "durable_object_namespace",
        class_name: binding.className,
        name: bindingName,
      });
      if (
        binding.scriptName === undefined ||
        // TODO(sam): not sure if Cloudflare Api would like us using `this` worker name here
        binding.scriptName === props.workerName
      ) {
        // we do not need configure class migrations for cross-script bindings
        configureClassMigration(bindingName, binding);
      }
      (meta.containers ??= []).push({ class_name: binding.className });
    } else if (binding.type === "ratelimit") {
      meta.bindings.push({
        type: "ratelimit",
        name: bindingName,
        namespace_id: binding.namespace_id.toString(),
        simple: binding.simple,
      });
    } else {
      assertNever(
        binding,
        `Unsupported binding type: ${
          // @ts-expect-error - types think it's never
          binding.type
        }`,
      );
    }
  }

  function configureClassMigration(
    bindingName: string,
    newBinding: DurableObjectNamespace<any> | Container,
  ) {
    let prevBinding: WorkerBindingDurableObjectNamespace | undefined;
    if (oldBindings) {
      // try and find the prev binding for this
      for (const oldBinding of oldBindings) {
        if (oldBinding.type === "durable_object_namespace") {
          const stableId = bindingNameToStableId[oldBinding.name];
          if (stableId) {
            // (happy case)
            // great, this Worker was created with Alchemy and we can map stable ids
            if (stableId === newBinding.id) {
              prevBinding = oldBinding;
              break;
            }
          } else {
            // (heuristic case)
            // we were unable to find the stableId, this Worker must not have been created with Alchemy
            // now, try and resolve by assuming 1:1 binding name correspondence
            // WARNING: this is an imperfect assumption. Users are advised to upgrade alchemy and re-deploy
            if (oldBinding.name === bindingName) {
              prevBinding = oldBinding;
              break;
            }
          }
        }
      }
    }

    if (!prevBinding) {
      if (newBinding.sqlite) {
        meta.migrations!.new_sqlite_classes!.push(newBinding.className);
      } else {
        meta.migrations!.new_classes!.push(newBinding.className);
      }
    } else if (prevBinding.class_name !== newBinding.className) {
      meta.migrations!.renamed_classes!.push({
        from: prevBinding.class_name,
        to: newBinding.className,
      });
    }
  }

  // Convert env variables to plain_text bindings
  // TODO(sam): remove Worker.env in favor of always bindings
  if (props.env) {
    for (const [key, value] of Object.entries(props.env)) {
      meta.bindings.push({
        name: key,
        type: "plain_text",
        text: value,
      });
    }
  }

  if (process.env.DEBUG) {
    logger.log(meta);
  }
  return meta;
}

export function bumpMigrationTagVersion(tag?: string) {
  if (tag) {
    if (!tag.match(/^v\d+$/)) {
      throw new Error(`Invalid tag format: ${tag}. Expected format: v<number>`);
    }
    return `v${Number.parseInt(tag.slice(1), 10) + 1}`;
  }
  return undefined;
}

interface WorkerSettings {
  bindings: WorkerBindingSpec[];
  compatibility_date: string;
  compatibility_flags: string[];
  migrations: SingleStepMigration | MultiStepMigration;
  tags: string[];
  [key: string]: any;
}

const getWorkerSettingsWithCache = memoize(
  getWorkerSettings,
  (api, workerName) => `${api.accountId}:${workerName}`,
);

export async function getWorkerSettings(
  api: CloudflareApi,
  workerName: string,
): Promise<WorkerSettings | undefined> {
  // Fetch the bindings for a worker by calling the Cloudflare API endpoint:
  // GET /accounts/:account_id/workers/scripts/:script_name/bindings
  // See: https://developers.cloudflare.com/api/resources/workers/subresources/scripts/subresources/script_and_version_settings/methods/get/
  return await extractCloudflareResult<WorkerSettings>(
    `get worker settings for ${workerName}`,
    api.get(
      `/accounts/${api.accountId}/workers/scripts/${workerName}/settings`,
    ),
  ).catch((error) => {
    if (error.status === 404) {
      return undefined;
    }
    throw error;
  });
}
