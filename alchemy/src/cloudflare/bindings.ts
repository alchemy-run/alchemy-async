/**
 * Type definitions for Cloudflare Worker bindings
 * Based on Cloudflare API documentation:
 * https://developers.cloudflare.com/api/resources/workers/subresources/scripts/methods/update/
 */
import type { Secret } from "../secret.ts";
import type { Ai } from "./ai.ts";
import type { AnalyticsEngineDataset } from "./analytics-engine.ts";
import type { Assets } from "./assets.ts";
import type { Bound } from "./bound.ts";
import type { BrowserRendering } from "./browser-rendering.ts";
import type { R2Bucket, R2BucketJurisdiction } from "./bucket.ts";
import type { Container } from "./container.ts";
import type { D1Database } from "./d1-database.ts";
import type { DispatchNamespace } from "./dispatch-namespace.ts";
import type { DurableObjectNamespace } from "./durable-object-namespace.ts";
import type { HyperdriveRef } from "./hyperdrive-ref.ts";
import type { Hyperdrive } from "./hyperdrive.ts";
import type { Images } from "./images.ts";
import type { KVNamespace } from "./kv-namespace.ts";
import type { Pipeline } from "./pipeline.ts";
import type { Queue } from "./queue.ts";
import type { RateLimit } from "./rate-limit.ts";
import type { SecretKey } from "./secret-key.ts";
import type { SecretRef as CloudflareSecretRef } from "./secret-ref.ts";
import type { Secret as CloudflareSecret } from "./secret.ts";
import type { VectorizeIndex } from "./vectorize-index.ts";
import type { VersionMetadata } from "./version-metadata.ts";
import type { WorkerRef } from "./worker-ref.ts";
import type { WorkerStub } from "./worker-stub.ts";
import type { Worker } from "./worker.ts";
import type { WorkerLoader } from "./worker-loader.ts";
import type { Workflow } from "./workflow.ts";

export type Bindings = {
  [bindingName: string]: Binding;
};

export declare namespace Bindings {
  export type Runtime<B extends Bindings> = {
    [bindingName in keyof B]: Bound<B[bindingName]>;
  };
}

/**
 * L2 Binding Resources.
 */
export type Binding =
  | Ai
  | Assets
  | Container
  | CloudflareSecret
  | CloudflareSecretRef
  | D1Database
  | DispatchNamespace
  | AnalyticsEngineDataset
  | DurableObjectNamespace<any>
  | Hyperdrive
  | HyperdriveRef
  | Images
  | KVNamespace
  | Pipeline
  | Queue
  | RateLimit
  | R2Bucket
  | {
      type: "kv_namespace";
      id: string;
    }
  | Secret
  | SecretKey
  | string
  | VectorizeIndex
  | Worker
  | WorkerStub
  | WorkerRef
  | WorkerEntrypoint
  | WorkerLoader
  | Workflow
  | BrowserRendering
  | VersionMetadata
  | Self
  | Json;

export type Self<
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> = {
  type: "cloudflare::Worker::Self";
  __entrypoint__?: string;
  __rpc__?: RPC;
};
export const Self = {
  type: "cloudflare::Worker::Self",
} as const;

export type WorkerEntrypoint = (Worker | WorkerRef) & {
  __entrypoint__?: string;
};

export type Json<T = any> = {
  type: "json";
  json: T;
};

export function Json<const T>(value: T): Json<T> {
  return {
    type: "json",
    json: value,
  };
}

/**
 * Union type for all Worker binding types (API spec)
 */
export type WorkerBindingSpec =
  | WorkerBindingAI
  | WorkerBindingAnalyticsEngine
  | WorkerBindingAssets
  | WorkerBindingBrowserRendering
  | WorkerBindingD1
  | WorkerBindingDispatchNamespace
  | WorkerBindingDurableObjectNamespace
  | WorkerBindingHyperdrive
  | WorkerBindingImages
  | WorkerBindingJson
  | WorkerBindingKVNamespace
  | WorkerBindingMTLSCertificate
  | WorkerBindingPipeline
  | WorkerBindingPlainText
  | WorkerBindingQueue
  | WorkerBindingRateLimit
  | WorkerBindingR2Bucket
  | WorkerBindingSecretKey
  | WorkerBindingSecretText
  | WorkerBindingSecretsStore
  | WorkerBindingSecretsStoreSecret
  | WorkerBindingService
  | WorkerBindingStaticContent
  | WorkerBindingTailConsumer
  | WorkerBindingVectorize
  | WorkerBindingVersionMetadata
  | WorkerBindingWasmModule
  | WorkerBindingWorkerLoader
  | WorkerBindingWorkflow;

/**
 * AI binding type
 */
export interface WorkerBindingAI {
  /** The name of the binding */
  name: string;
  /** Type identifier for AI binding */
  type: "ai";
}

/**
 * Analytics Engine binding type
 */
export interface WorkerBindingAnalyticsEngine {
  /** The name of the binding */
  name: string;
  /** Type identifier for Analytics Engine binding */
  type: "analytics_engine";
  /** Dataset name */
  dataset: string;
}

/**
 * Assets binding type
 */
export interface WorkerBindingAssets {
  /** The name of the binding */
  name: string;
  /** Type identifier for Assets binding */
  type: "assets";
}

/**
 * Browser Rendering binding type
 */
export interface WorkerBindingBrowserRendering {
  /** The name of the binding */
  name: string;
  /** Type identifier for Browser Rendering binding */
  type: "browser";
}

/**
 * D1 database binding type
 */
export interface WorkerBindingD1 {
  /** The name of the binding */
  name: string;
  /** Type identifier for D1 binding */
  type: "d1";
  /** D1 database ID */
  id: string;
}

/**
 * Dispatch Namespace binding type
 */
export interface WorkerBindingDispatchNamespace {
  /** The name of the binding */
  name: string;
  /** Type identifier for Dispatch Namespace binding */
  type: "dispatch_namespace";
  /** Namespace identifier */
  namespace: string;
  /** Optional outbound service */
  outbound?: any; // Documentation doesn't specify the exact type
}

/**
 * Durable Object Namespace binding type
 */
export interface WorkerBindingDurableObjectNamespace {
  /**
   * The stable ID of the binding
   * @internal
   */
  stableId?: string;
  /** The name of the binding */
  name: string;
  /** Type identifier for Durable Object Namespace binding */
  type: "durable_object_namespace";
  /** Durable Object class name */
  class_name: string;
  /** Script name that contains the Durable Object */
  script_name?: string;
  /** Environment */
  environment?: string;
  /** Namespace ID */
  namespace_id?: string;
}

/**
 * Hyperdrive binding type
 */
export interface WorkerBindingHyperdrive {
  /** The name of the binding */
  name: string;
  /** Type identifier for Hyperdrive binding */
  type: "hyperdrive";
  /** Hyperdrive ID */
  id: string;
}

/**
 * JSON binding type
 */
export interface WorkerBindingJson {
  /** The name of the binding */
  name: string;
  /** Type identifier for JSON binding */
  type: "json";
  /** JSON value */
  json: string;
}

/**
 * KV Namespace binding type
 */
export interface WorkerBindingKVNamespace {
  /** The name of the binding */
  name: string;
  /** Type identifier for KV Namespace binding */
  type: "kv_namespace";
  /** KV Namespace ID */
  namespace_id: string;
}

/**
 * MTLS Certificate binding type
 */
export interface WorkerBindingMTLSCertificate {
  /** The name of the binding */
  name: string;
  /** Type identifier for MTLS Certificate binding */
  type: "mtls_certificate";
  /** Certificate ID */
  certificate_id: string;
}

/**
 * Plain Text binding type
 */
export interface WorkerBindingPlainText {
  /** The name of the binding */
  name: string;
  /** Type identifier for Plain Text binding */
  type: "plain_text";
  /** Text content */
  text: string;
}

/**
 * Queue binding type
 */
export interface WorkerBindingQueue {
  /** The name of the binding */
  name: string;
  /** Type identifier for Queue binding */
  type: "queue";
  /** Queue name */
  queue_name: string;
}

/**
 * Rate Limit binding type
 */
export interface WorkerBindingRateLimit {
  /** The name of the binding */
  name: string;
  /** Type identifier for Rate Limit binding */
  type: "ratelimit";
  /** Namespace ID for the rate limit */
  namespace_id: string;
  /** Simple rate limiting configuration */
  simple: {
    /** Maximum number of requests */
    limit: number;
    /** Time period in seconds */
    period: 60 | 10;
  };
}

/**
 * R2 Bucket binding type
 */
export interface WorkerBindingR2Bucket {
  /** The name of the binding */
  name: string;
  /** Type identifier for R2 Bucket binding */
  type: "r2_bucket";
  /** Bucket name */
  bucket_name: string;
  /** Jurisdiction */
  jurisdiction?: R2BucketJurisdiction;
}

/**
 * Secret Key binding type
 */
export interface WorkerBindingSecretKey {
  /** The name of the binding */
  name: string;
  /** Type identifier for Secret Key binding */
  type: "secret_key";
  /** Algorithm-specific key parameters */
  algorithm: unknown;
  /** Data format of the key */
  format: "raw" | "pkcs8" | "spki" | "jwk";
  /** Allowed operations with the key */
  usages: Array<
    | "encrypt"
    | "decrypt"
    | "sign"
    | "verify"
    | "deriveKey"
    | "deriveBits"
    | "wrapKey"
    | "unwrapKey"
  >;
  /** Base64-encoded key data. Required if format is "raw", "pkcs8", or "spki" */
  key_base64?: string;
  /** Key data in JSON Web Key format. Required if format is "jwk" */
  key_jwk?: unknown;
}

/**
 * Secret Text binding type
 */
export interface WorkerBindingSecretText {
  /** The name of the binding */
  name: string;
  /** Type identifier for Secret Text binding */
  type: "secret_text";
  /** Secret value */
  text: string;
}

export interface WorkerBindingSecretsStore {
  /** The name of the binding */
  name: string;
  /** Type identifier for Secrets Store binding */
  type: "secrets_store";
  /** Store ID */
  store_id: string;
  /** Secret name */
  secret_name: string;
}

/**
 * Secrets Store Secret binding type for individual secrets
 */
export interface WorkerBindingSecretsStoreSecret {
  /** The name of the binding */
  name: string;
  /** Type identifier for Secrets Store Secret binding */
  type: "secrets_store_secret";
  /** Store ID */
  store_id: string;
  /** Secret name */
  secret_name: string;
}

/**
 * Service binding type
 */
export interface WorkerBindingService {
  /** The name of the binding */
  name: string;
  /** Type identifier for Service binding */
  type: "service";
  /** Service name */
  service: string;
  /** Environment */
  environment?: string;
  /** Service namespace */
  namespace?: string;
  /** Service entrypoint */
  entrypoint?: string;
}

/**
 * Tail Consumer binding type
 */
export interface WorkerBindingTailConsumer {
  /** The name of the binding */
  name: string;
  /** Type identifier for Tail Consumer binding */
  type: "tail_consumer";
  /** Service name */
  service: string;
}

/**
 * Vectorize binding type
 */
export interface WorkerBindingVectorize {
  /** The name of the binding */
  name: string;
  /** Type identifier for Vectorize binding */
  type: "vectorize";
  /** Index name */
  index_name: string;
}

/**
 * Version Metadata binding type
 */
export interface WorkerBindingVersionMetadata {
  /** The name of the binding */
  name: string;
  /** Type identifier for Version Metadata binding */
  type: "version_metadata";
}

/**
 * WASM Module binding type
 */
export interface WorkerBindingWasmModule {
  /** The name of the binding */
  name: string;
  /** Type identifier for WASM Module binding */
  type: "wasm_module";
  /** Module name */
  module: string;
}

/**
 * Static content binding for Cloudflare Workers
 * Used for Workers Sites and static assets
 */
export interface WorkerBindingStaticContent {
  /** The name of the binding */
  name: string;
  /** Type identifier for Static Content binding */
  type: "static_content";
}

export interface WorkerBindingWorkflow {
  /** The name of the binding */
  name: string;
  /** Type identifier for Workflow binding */
  type: "workflow";
  /** Workflow name */
  workflow_name: string;
  /** Workflow class name */
  class_name: string;
  /**
   * Workflow script name
   *
   * @default - the name of the script it is bound to
   */
  script_name?: string;
}

/**
 * Images binding type
 */
export interface WorkerBindingImages {
  /** The name of the binding */
  name: string;
  /** Type identifier for Images binding */
  type: "images";
}

/**
 * Pipeline binding type
 */
export interface WorkerBindingPipeline {
  /** The name of the binding */
  name: string;
  /** Type identifier for Pipeline binding */
  type: "pipelines";
  /** Pipeline name */
  pipeline: string;
}

/**
 * Worker Loader binding type
 */
export interface WorkerBindingWorkerLoader {
  /** The name of the binding */
  name: string;
  /** Type identifier for Worker Loader binding */
  type: "worker_loader";
}
