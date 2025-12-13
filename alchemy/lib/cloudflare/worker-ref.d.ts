import type { Rpc } from "@cloudflare/workers-types";
import type { WorkerBindingService } from "./bindings.ts";
/**
 * Represents a reference to a Cloudflare Worker service.
 *
 * @template RPC - The type of the worker's RPC entrypoint, defaults to Rpc.WorkerEntrypointBranded.
 *
 * This interface extends all properties of WorkerBindingService except for "name".
 * It also includes an optional __rpc__ property for type branding.
 */
export type WorkerRef<RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded> = Omit<WorkerBindingService, "name"> & {
    /**
     * Optional type branding for the worker's RPC entrypoint.
     */
    __rpc__?: RPC;
};
/**
 * Creates a reference to a Cloudflare Worker service.
 *
 * @example
 * // Create a reference to a Cloudflare Worker service:
 * const ref = WorkerRef({
 *   service: "my-worker",
 *   environment: "production",
 *   namespace: "main"
 * });
 *
 * // Optionally, you can specify only the service:
 * const ref2 = WorkerRef({ service: "my-worker" });
 *
 * // You can also specify the RPC type for stronger typing:
 * interface MyWorkerRPC extends Rpc.WorkerEntrypointBranded {
 *   myMethod(arg: string): Promise<number>;
 * }
 * const typedRef = WorkerRef<MyWorkerRPC>({ service: "my-worker" });
 */
export declare function WorkerRef<RPC extends Rpc.WorkerEntrypointBranded = Rpc.WorkerEntrypointBranded>(options?: {
    service: string;
    environment?: string;
    namespace?: string;
}): WorkerRef<RPC>;
//# sourceMappingURL=worker-ref.d.ts.map