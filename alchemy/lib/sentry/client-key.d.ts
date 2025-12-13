import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a ClientKey
 */
export interface ClientKeyProps {
    /**
     * The name of the key
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Rate limit configuration
     */
    rateLimit?: {
        /**
         * Time window in seconds
         */
        window: number;
        /**
         * Maximum number of events allowed in the window
         */
        count: number;
    };
    /**
     * The use case for the key
     */
    useCase?: "user" | "profiling" | "escalating_issues" | "tempest" | "demo";
    /**
     * The project slug that owns the key
     */
    project: string;
    /**
     * The organization ID or slug that owns the key
     */
    organization: string;
    /**
     * Auth token to use (overrides environment variable)
     */
    authToken?: Secret;
    /**
     * Whether to adopt an existing key with the same name if it exists
     * If true and a key with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
}
/**
 * Output returned after ClientKey creation/update
 */
export interface ClientKey extends ClientKeyProps {
    /**
     * The ID of the key
     */
    id: string;
    /**
     * Name of the Client Key.
     */
    name: string;
    /**
     * The label of the key
     */
    label: string;
    /**
     * The public key
     */
    public: string;
    /**
     * The secret key
     */
    secret: string;
    /**
     * The project ID
     */
    projectId: number;
    /**
     * Whether the key is active
     */
    isActive: boolean;
    /**
     * DSN configuration
     */
    dsn: {
        secret: string;
        public: string;
        csp: string;
        security: string;
        minidump: string;
        nel: string;
        unreal: string;
        cdn: string;
        crons: string;
    };
    /**
     * Browser SDK version
     */
    browserSdkVersion: string;
    /**
     * Browser SDK choices
     */
    browserSdk: {
        choices: Array<[string, string]>;
    };
    /**
     * Time at which the key was created
     */
    dateCreated: string;
    /**
     * Dynamic SDK loader options
     */
    dynamicSdkLoaderOptions: {
        hasReplay: boolean;
        hasPerformance: boolean;
        hasDebug: boolean;
    };
}
/**
 * Create and manage Sentry client keys
 *
 * @example
 * // Create a basic Sentry client key:
 * const key = await ClientKey("my-key", {
 *   name: "My Key",
 *   project: "my-project",
 *   organization: "my-org"
 * });
 *
 * @example
 * // Create a client key with rate limiting:
 * const key = await ClientKey("rate-limited-key", {
 *   name: "Rate Limited Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   rateLimit: {
 *     window: 3600, // 1 hour
 *     count: 1000   // 1000 events per hour
 *   }
 * });
 *
 * @example
 * // Create a client key for a specific use case:
 * const key = await ClientKey("profiling-key", {
 *   name: "Profiling Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   useCase: "profiling"
 * });
 *
 * @example
 * // Create or adopt an existing key with the same name:
 * const key = await ClientKey("existing-key", {
 *   name: "Existing Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   adopt: true
 * });
 */
export declare const ClientKey: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<ClientKey>, id: string, props: ClientKeyProps) => Promise<ClientKey>);
//# sourceMappingURL=client-key.d.ts.map