import { type PendingResource, type Resource, type ResourceAttributes, type ResourceProps } from "./resource.ts";
export interface ApplyOptions {
    quiet?: boolean;
    alwaysUpdate?: boolean;
    noop?: boolean;
}
export declare function apply<Out extends ResourceAttributes>(resource: PendingResource<Out>, props: ResourceProps | undefined, options?: ApplyOptions): Promise<Awaited<Out> & Resource>;
export declare function isReplacedSignal(error: any): error is ReplacedSignal;
export declare class ReplacedSignal extends Error {
    readonly kind = "ReplacedSignal";
    force: boolean;
    constructor(force?: boolean);
}
//# sourceMappingURL=apply.d.ts.map