import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a KV Namespace
 */
export interface KVNamespaceProps extends CloudflareApiOptions {
    /**
     * Title of the namespace
     *
     * @default ${app}-${stage}-${id}
     */
    title?: string;
    /**
     * KV pairs to store in the namespace
     * Only used for initial setup or updates
     */
    values?: KVPair[];
    /**
     * Whether to adopt an existing namespace with the same title if it exists
     * If true and a namespace with the same title exists, it will be adopted rather than creating a new one
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
    /**
     * Whether to emulate the KV namespace locally when Alchemy is running in watch mode.
     */
    dev?: {
        /**
         * Whether to run the KV namespace remotely instead of locally
         * @default false
         */
        remote?: boolean;
        /**
         * Whether to force the KV namespace to be created or updated
         * @default false
         */
        force?: boolean;
    };
}
/**
 * Key-value pair to store in a KV Namespace
 */
export interface KVPair {
    /**
     * Key name
     */
    key: string;
    /**
     * Value to store (string or JSON object)
     */
    value: string | object;
    /**
     * Optional expiration in seconds from now
     */
    expiration?: number;
    /**
     * Optional expiration timestamp in seconds since epoch
     */
    expirationTtl?: number;
    /**
     * Optional metadata for the key
     */
    metadata?: any;
}
export declare function isKVNamespace(resource: any): resource is KVNamespace;
/**
 * Output returned after KV Namespace creation/update
 */
export type KVNamespace = Omit<KVNamespaceProps, "delete" | "dev"> & {
    type: "kv_namespace";
    /**
     * The ID of the namespace
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
    /**
     * Development mode properties
     * @internal
     */
    dev: {
        /**
         * The ID of the KV namespace in development mode
         */
        id: string;
        /**
         * Whether the KV namespace is running remotely
         */
        remote: boolean;
    };
};
/**
 * A Cloudflare KV Namespace is a key-value store that can be used to store data for your application.
 *
 * @see https://developers.cloudflare.com/kv/concepts/kv-namespaces/
 *
 * @example
 * // Create a basic KV namespace for storing user data
 * const users = await KVNamespace("users", {
 *   title: "user-data"
 * });
 *
 * @example
 * // Create a KV namespace with initial values and TTL
 * const sessions = await KVNamespace("sessions", {
 *   title: "user-sessions",
 *   values: [{
 *     key: "session_123",
 *     value: { userId: "user_456", role: "admin" },
 *     expirationTtl: 3600 // Expires in 1 hour
 *   }]
 * });
 *
 * @example
 * // Create a KV namespace with metadata for caching
 * const assets = await KVNamespace("assets", {
 *   title: "static-assets",
 *   values: [{
 *     key: "main.js",
 *     value: "content...",
 *     metadata: {
 *       contentType: "application/javascript",
 *       etag: "abc123"
 *     }
 *   }]
 * });
 *
 * @example
 * // Adopt an existing namespace if it already exists instead of failing
 * const existingNamespace = await KVNamespace("existing-ns", {
 *   title: "existing-namespace",
 *   adopt: true,
 *   values: [{
 *     key: "config",
 *     value: { setting: "updated-value" }
 *   }]
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the namespace in Cloudflare
 * const preservedNamespace = await KVNamespace("preserve-ns", {
 *   title: "preserved-namespace",
 *   delete: false
 * });
 */
export declare function KVNamespace(id: string, props?: KVNamespaceProps): Promise<KVNamespace>;
export declare function createKVNamespace(api: CloudflareApi, props: KVNamespaceProps & {
    title: string;
}): Promise<{
    namespaceId: string;
    createdAt: number;
}>;
export declare function deleteKVNamespace(api: CloudflareApi, namespaceId: string): Promise<void>;
export declare function insertKVRecords(api: CloudflareApi, namespaceId: string, props: KVNamespaceProps): Promise<void>;
export declare function insertLocalKVRecords(input: {
    namespaceId: string;
    values: KVPair[];
    rootDir: string;
}): Promise<void>;
/**
 * Find a KV namespace by title with pagination support
 */
export declare function findKVNamespaceByTitle(api: CloudflareApi, title: string): Promise<{
    id: string;
    createdAt?: number;
} | null>;
export declare function renameKVNamespace(api: CloudflareApi, namespaceId: string, title: string): Promise<void>;
//# sourceMappingURL=kv-namespace.d.ts.map