import type { Rpc } from "@cloudflare/workers-types";
import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import type { type } from "../type.ts";
import { handleApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { WorkerSubdomain } from "./worker-subdomain.ts";

/**
 * Properties for creating a Worker stub
 */
export interface WorkerStubProps<
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> extends CloudflareApiOptions {
  /**
   * Name for the worker
   */
  name: string;

  /**
   * Whether to enable a workers.dev URL for this worker
   *
   * If true, the worker will be available at {name}.{subdomain}.workers.dev
   * @default true
   */
  url?: boolean;

  /**
   * The RPC class to use for the worker.
   *
   * This is only used when using the rpc property.
   */
  rpc?: (new (...args: any[]) => RPC) | type<RPC>;
}

/**
 * Output returned after WorkerStub creation
 */
export interface WorkerStub<
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
> {
  type: "service";
  /**
   * The name of the worker
   */
  name: string;

  /**
   * The worker's URL if enabled
   * Format: {name}.{subdomain}.workers.dev
   */
  url?: string;

  /**
   * Optional type branding for the worker's RPC entrypoint.
   *
   * @internal
   */
  __rpc__?: RPC;
}

export function isWorkerStub(resource: any): resource is WorkerStub {
  return resource?.[ResourceKind] === "cloudflare::WorkerStub";
}

/**
 * Creates an empty worker if it doesn't already exist.
 *
 * This is useful for reserving a worker name without deploying any code.
 * Unlike the full Worker resource, WorkerStub only checks if the worker
 * exists and creates an empty one if needed.
 *
 * @example
 * // Reserve a worker name without deploying code, with URL enabled (default)
 * const workerStub = await WorkerStub("my-worker", {
 *   name: "my-reserved-worker"
 * });
 *
 * console.log(`Worker ${workerStub.name} is available at: ${workerStub.url}`);
 *
 * @example
 * // Reserve a worker name without enabling URL
 * const workerStub = await WorkerStub("my-worker", {
 *   name: "my-reserved-worker",
 *   url: false
 * });
 *
 * console.log(`Worker ${workerStub.name} created without URL`);
 */
export const WorkerStub = Resource("cloudflare::WorkerStub", async function <
  RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded,
>(this: Context<WorkerStub>, _id: string, props: WorkerStubProps<RPC>): Promise<
  WorkerStub<RPC>
> {
  // Create Cloudflare API client with automatic account discovery
  const api = await createCloudflareApi(props);

  if (this.phase === "delete") {
    // We don't actually delete the worker, just mark the resource as destroyed
    return this.destroy();
  }

  // If worker doesn't exist and we're in create phase, create an empty one
  if (!(await exists(api, props.name)) && this.phase === "create") {
    await createEmptyWorker(api, props.name);
  }

  // Configure URL if requested (defaults to true)
  const subdomain =
    props.url !== false
      ? await WorkerSubdomain("url", {
          ...props,
          scriptName: props.name,
        })
      : undefined;

  // Return the worker stub info
  return {
    type: "service",
    __rpc__: props.rpc as unknown as RPC,
    ...props,
    url: subdomain?.url,
  } as WorkerStub<RPC>;
});

export async function exists(
  api: CloudflareApi,
  workerName: string,
): Promise<boolean> {
  const response = await api.get(
    `/accounts/${api.accountId}/workers/scripts/${workerName}`,
  );

  if (response.ok) {
    return true;
  } else if (response.status === 404) {
    return false;
  } else {
    return await handleApiError(response, "get", "worker", workerName);
  }
}

export async function createEmptyWorker(
  api: CloudflareApi,
  workerName: string,
  version?: string,
): Promise<void> {
  // Minimal empty worker script
  const emptyScript = `export default { 
    fetch() { 
      return new Response("Worker stub", { status: 200 }) 
    } 
  }`;

  // Create FormData for the upload
  const formData = new FormData();

  // Add the empty script content
  formData.append(
    "worker.js",
    new Blob([emptyScript], {
      type: "application/javascript+module",
    }),
    "worker.js",
  );

  // Add metadata as JSON
  formData.append(
    "metadata",
    new Blob(
      [
        // Minimal metadata required for worker creation
        JSON.stringify({
          main_module: "worker.js",
          compatibility_date: "2025-04-20",
          bindings: [],
          ...(version != null && {
            annotations: {
              "workers/tag": version,
              "workers/message": `Version ${version}`,
            },
          }),
        }),
      ],
      {
        type: "application/json",
      },
    ),
  );

  // Upload worker script
  await extractCloudflareResult(
    `create empty worker "${workerName}"`,
    version != null
      ? api.post(
          `/accounts/${api.accountId}/workers/scripts/${workerName}/versions`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        )
      : api.put(
          `/accounts/${api.accountId}/workers/scripts/${workerName}`,
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        ),
  );
}
