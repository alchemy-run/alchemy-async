import { type Resource, type ResourceProps } from "./resource.ts";
import { Scope } from "./scope.ts";
export declare function isDestroyedSignal(error: any): error is DestroyedSignal;
export declare class DestroyedSignal extends Error {
    readonly noop: boolean;
    readonly kind = "DestroyedSignal";
    constructor(noop: boolean);
}
export type DestroyStrategy = "sequential" | "parallel";
export declare const DestroyStrategy: unique symbol;
export interface DestroyOptions {
    quiet?: boolean;
    strategy?: DestroyStrategy;
    replace?: {
        props?: ResourceProps | undefined;
        output?: Resource<string>;
    };
    /**
     * If true, children of the resource will not be destroyed (but their state will be deleted).
     */
    noop?: boolean;
}
/**
 * Prune all resources from an Output and "down", i.e. that branches from it.
 */
export declare function destroy(...args: [scope: Scope, options?: DestroyOptions] | [resource: any | undefined | null, options?: DestroyOptions]): Promise<void>;
export declare function destroyAll(resources: Resource[], options?: DestroyOptions & {
    force?: boolean;
}): Promise<void>;
//# sourceMappingURL=destroy.d.ts.map