import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
interface WorkerSubdomainProps extends CloudflareApiOptions {
    /**
     * The name of the script to create a subdomain for.
     */
    scriptName: string;
    /**
     * The version ID of the worker, if versioning is enabled and the worker is a preview.
     *
     * @default undefined
     */
    previewVersionId?: string;
    /**
     * Prevents the subdomain from being deleted when the worker is deleted.
     *
     * @default false
     */
    retain?: boolean;
    /**
     * If true, the subdomain will not be created, but will be retained if it already exists.
     * This is used for local development.
     *
     * @default `false`
     * @internal
     */
    dev?: boolean;
}
export interface WorkerSubdomain {
    /**
     * The `workers.dev` URL for the worker or preview version.
     */
    url: string;
}
export declare const WorkerSubdomain: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<WorkerSubdomain>, _id: string, props: WorkerSubdomainProps) => Promise<{
    url: string;
}>);
export declare function disableWorkerSubdomain(api: CloudflareApi, scriptName: string): Promise<void>;
export declare function enableWorkerSubdomain(api: CloudflareApi, scriptName: string): Promise<void>;
export declare function computeWorkerDevDomain(api: CloudflareApi, scriptName: string): Promise<string>;
export declare function getWorkerSubdomain(api: CloudflareApi, scriptName: string): Promise<SubdomainResponse>;
interface SubdomainResponse {
    enabled: boolean;
    previews_enabled: boolean;
}
export declare const getAccountSubdomain: (api: CloudflareApi) => Promise<string>;
export {};
//# sourceMappingURL=worker-subdomain.d.ts.map