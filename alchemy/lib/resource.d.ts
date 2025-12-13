import type { Context } from "./context.ts";
import { DestroyStrategy } from "./destroy.ts";
import { type Scope } from "./scope.ts";
declare global {
    var ALCHEMY_PROVIDERS: Map<ResourceKind, Provider<string, any>>;
    var ALCHEMY_HANDLERS: Map<ResourceKind, ResourceLifecycleHandler>;
    var ALCHEMY_DYNAMIC_RESOURCE_RESOLVERS: DynamicResourceResolver[];
}
export declare const PROVIDERS: Map<ResourceKind, Provider<string, any>>;
export type DynamicResourceResolver = (typeName: string) => Provider | undefined;
/**
 * Register a function that will be called if a Resource Type cannot be found during deletion.
 */
export declare function registerDynamicResource(handler: DynamicResourceResolver): void;
export declare function resolveDeletionHandler(typeName: string): Provider | undefined;
export type ResourceID = string;
export declare const ResourceID: unique symbol;
export type ResourceFQN = string;
export declare const ResourceFQN: unique symbol;
export type ResourceKind = string;
export declare const ResourceKind: unique symbol;
export declare const ResourceScope: unique symbol;
export declare const ResourceSeq: unique symbol;
export interface ProviderOptions {
    /**
     * If true, the resource will be updated even if the inputs have not changed.
     */
    alwaysUpdate: boolean;
    /**
     * The strategy to use when destroying the resource.
     *
     * @default "sequential"
     */
    destroyStrategy?: DestroyStrategy;
}
export type ResourceProps = {
    [key: string]: any;
};
export type ResourceAttributes = {
    [key: string]: any;
};
export type Provider<Type extends string = string, F extends ResourceLifecycleHandler = ResourceLifecycleHandler> = F & IsClass & {
    type: Type;
    options: Partial<ProviderOptions> | undefined;
    handler: F;
};
export interface PendingResource<Out = unknown> extends Promise<Out> {
    [ResourceKind]: ResourceKind;
    [ResourceID]: ResourceID;
    [ResourceFQN]: ResourceFQN;
    [ResourceScope]: Scope;
    [ResourceSeq]: number;
    [DestroyStrategy]: DestroyStrategy;
}
export interface Resource<Kind extends ResourceKind = ResourceKind> {
    [ResourceKind]: Kind;
    [ResourceID]: ResourceID;
    [ResourceFQN]: ResourceFQN;
    [ResourceScope]: Scope;
    [ResourceSeq]: number;
    [DestroyStrategy]: DestroyStrategy;
}
type IsClass = {
    new (_: never): never;
};
type ResourceLifecycleHandler = (this: Context<any, any>, id: string, props: any) => Promise<ResourceAttributes>;
type Handler<F extends (...args: any[]) => any> = F | (((this: any, id: string, props?: {}) => never) & IsClass);
export declare function Resource<const Type extends string, F extends ResourceLifecycleHandler>(type: Type, fn: F): Handler<F>;
export declare function Resource<const Type extends string, F extends ResourceLifecycleHandler>(type: Type, options: Partial<ProviderOptions>, fn: F): Handler<F>;
export {};
//# sourceMappingURL=resource.d.ts.map