import type { Scope } from "../../scope.ts";
import type { DurableObjectNamespace } from "../durable-object-namespace.ts";
import type { Workflow } from "../workflow.ts";
declare const BINDING_TYPE_KEY: {
    readonly d1: "miniflare-D1DatabaseObject";
    readonly kv: "miniflare-KVNamespaceObject";
    readonly r2: "miniflare-R2BucketObject";
};
type BindingType = keyof typeof BINDING_TYPE_KEY;
/**
 * Delete a binding from the miniflare directory.
 */
export declare function deleteMiniflareBinding(scope: Scope, type: BindingType, id: string): Promise<void>;
/**
 * Delete local durable object and workflow data for a given Worker script.
 */
export declare function deleteMiniflareWorkerData(scope: Scope, scriptName: string, input: {
    durableObjects: DurableObjectNamespace[];
    workflows: Workflow[];
}): Promise<void>;
export {};
//# sourceMappingURL=delete.d.ts.map