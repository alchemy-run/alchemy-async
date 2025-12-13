import type { Rpc } from "@cloudflare/workers-types";
import type { Context } from "../context.ts";
import type { type } from "../type.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating a Worker stub
 */
export interface WorkerStubProps<RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> extends CloudflareApiOptions {
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
export interface WorkerStub<RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> {
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
export declare function isWorkerStub(resource: any): resource is WorkerStub;
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
export declare const WorkerStub: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | (<RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded>(this: Context<WorkerStub>, _id: string, props: WorkerStubProps<RPC>) => Promise<WorkerStub<RPC>>);
export declare function exists(api: CloudflareApi, workerName: string): Promise<boolean>;
export declare function createEmptyWorker(api: CloudflareApi, workerName: string, version?: string): Promise<void>;
//# sourceMappingURL=worker-stub.d.ts.map