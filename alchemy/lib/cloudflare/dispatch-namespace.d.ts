import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a Dispatch Namespace
 */
export interface DispatchNamespaceProps extends CloudflareApiOptions {
    /**
     * Name of the namespace
     *
     * @default ${app}-${stage}-${id}
     */
    namespace?: string;
    /**
     * Whether to adopt an existing namespace with the same name if it exists
     * If true and a namespace with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to delete the namespace.
     * If set to false, the namespace will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
}
export declare function isDispatchNamespace(resource: any): resource is DispatchNamespace;
/**
 * Output returned after Dispatch Namespace creation/update
 */
export interface DispatchNamespace extends Omit<DispatchNamespaceProps, "delete"> {
    type: "dispatch_namespace";
    /**
     * The name of the namespace
     */
    namespace: string;
    /**
     * The namespace name from Cloudflare API
     */
    namespaceName: string;
    /**
     * The namespace ID from Cloudflare API
     */
    namespaceId: string;
    /**
     * Time at which the namespace was created
     */
    createdAt: number;
    /**
     * Time at which the namespace was last modified
     */
    modifiedAt: number;
}
/**
 * A Cloudflare Dispatch Namespace enables routing worker requests to different scripts based on patterns.
 *
 * @see https://developers.cloudflare.com/workers/configuration/routing/dispatch-namespace/
 *
 * @example
 * // Create a basic dispatch namespace
 * const myNamespace = await DispatchNamespace("my-namespace", {
 *   namespace: "my-namespace"
 * });
 *
 * @example
 * // Create dispatch namespace with default name from id
 * const dispatchNS = await DispatchNamespace("api-dispatch");
 *
 * @example
 * // Adopt an existing namespace if it already exists instead of failing
 * const existingNamespace = await DispatchNamespace("existing-ns", {
 *   namespace: "existing-namespace",
 *   adopt: true
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the namespace in Cloudflare
 * const preservedNamespace = await DispatchNamespace("preserve-ns", {
 *   namespace: "preserved-namespace",
 *   delete: false
 * });
 */
export declare const DispatchNamespace: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<DispatchNamespace>, id: string, props?: DispatchNamespaceProps) => Promise<DispatchNamespace>);
export declare function createDispatchNamespace(api: CloudflareApi, props: DispatchNamespaceProps & {
    namespace: string;
}): Promise<void>;
export declare function getDispatchNamespace(api: CloudflareApi, namespace: string): Promise<{
    namespaceName: string;
    namespaceId: string;
} | undefined>;
export declare function deleteDispatchNamespace(api: CloudflareApi, namespace: string): Promise<void>;
export declare function listWorkersInNamespace(api: CloudflareApi, namespace: string): Promise<Array<{
    id: string;
    created_on: string;
    modified_on: string;
}>>;
//# sourceMappingURL=dispatch-namespace.d.ts.map