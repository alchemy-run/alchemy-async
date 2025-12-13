import type { CloudflareApi } from "./api.ts";
import type { Binding } from "./bindings.ts";
export interface WorkflowProps {
    /**
     * Name of the workflow
     *
     * @maxLength 64
     * @minLength 1
     * @default - className if provided, otherwise id
     */
    workflowName?: string;
    /**
     * Name of the class that implements the workflow
     *
     * @maxLength 255
     * @minLength 1
     * @default - workflowName if provided, otherwise id
     */
    className?: string;
    /**
     * Name of the script containing the workflow implementation
     *
     * @default - bound worker script
     */
    scriptName?: string;
    dev?: {
        /**
         * Whether to run the workflow remotely instead of locally
         * @default false
         */
        remote?: boolean;
    };
}
export type Workflow<PARAMS = unknown> = {
    type: "workflow";
    /**
     * Phantom property to preserve workflow params at the type level.
     * No value exists.
     */
    _PARAMS: PARAMS;
    id: string;
    workflowName: string;
    className: string;
    scriptName?: string;
};
export declare function isWorkflow(binding: Binding): binding is Workflow;
/**
 * Creates a workflow binding for orchestrating and automating tasks.
 *
 * @example
 * ```ts
 * // Create a basic workflow
 * const workflow = Workflow("my-workflow", {
 *   workflowName: "my-workflow",
 *   className: "MyWorkflow"
 * });
 * ```
 */
export declare function Workflow<PARAMS = unknown>(id: string, props?: WorkflowProps): Workflow<PARAMS>;
export interface WorkflowMetadata {
    id: string;
    class_name: string;
    created_on: string;
    modified_on: string;
    name: string;
    script_name: string;
    triggered_on: string;
    version_id: string;
}
export declare function upsertWorkflow(api: CloudflareApi, props: WorkflowProps & {
    workflowName: string;
    scriptName: string;
}): Promise<WorkflowMetadata>;
export declare function deleteWorkflow(api: CloudflareApi, name: string): Promise<void>;
//# sourceMappingURL=workflow.d.ts.map