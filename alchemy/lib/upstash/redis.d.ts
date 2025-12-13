import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { UpstashApi } from "./api.ts";
/**
 * Available regions for Upstash Redis databases
 */
export type UpstashRegion = "us-east-1" | "us-west-1" | "us-west-2" | "eu-west-1" | "eu-central-1" | "ap-southeast-1" | "ap-southeast-2" | "ap-northeast-1" | "sa-east-1";
/**
 * Properties for creating or updating an UpstashRedis database
 */
export interface UpstashRedisProps {
    /**
     * Name of the database
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Primary region for the database
     */
    primaryRegion: UpstashRegion;
    /**
     * Read regions for the database
     */
    readRegions?: UpstashRegion[];
    /**
     * Monthly budget for the database
     */
    budget?: number;
    /**
     * Whether to enable eviction for the database
     */
    eviction?: boolean;
    /**
     * API key to use (overrides environment variable)
     */
    apiKey?: Secret;
    /**
     * Email to use (overrides environment variable)
     */
    email?: string;
}
/**
 * Output returned after UpstashRedis creation/update
 */
export interface UpstashRedis extends UpstashRedisProps {
    /**
     * ID of the database
     */
    id: string;
    /**
     * Name of the database.
     */
    name: string;
    /**
     * Type of the database in terms of pricing model
     */
    databaseType: string;
    /**
     * Region where database is hosted
     */
    region: "global";
    /**
     * Database port for clients to connect
     */
    port: number;
    /**
     * Creation time of the database as Unix time
     */
    createdAt: number;
    /**
     * State of database (active or deleted)
     */
    state: string;
    /**
     * Password of the database
     */
    password: Secret;
    /**
     * Email or team id of the owner of the database
     */
    userEmail: string;
    /**
     * Endpoint URL of the database
     */
    endpoint: string;
    /**
     * Whether TLS is enabled
     */
    tls: boolean;
    /**
     * REST token for the database
     */
    restToken: Secret;
    /**
     * Read-only REST token for the database
     */
    readOnlyRestToken: Secret;
}
/**
 * Create and manage Upstash Redis databases
 *
 * @example
 * // Create a basic Redis database in us-east-1:
 * const redis = await UpstashRedis("my-redis", {
 *   name: "my-redis",
 *   primaryRegion: "us-east-1"
 * });
 *
 * @example
 * // Create a Redis database with read replicas:
 * const redis = await UpstashRedis("my-redis", {
 *   name: "my-redis",
 *   primaryRegion: "us-east-1",
 *   readRegions: ["us-west-1", "us-west-2"]
 * });
 *
 * @example
 * // Create a Redis database with a monthly budget:
 * const redis = await UpstashRedis("my-redis", {
 *   name: "my-redis",
 *   primaryRegion: "us-east-1",
 *   budget: 100
 * });
 */
export declare const UpstashRedis: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<UpstashRedis>, id: string, props: UpstashRedisProps) => Promise<UpstashRedis>);
/**
 * Response from Upstash API for database operations
 */
interface UpstashDatabaseResponse {
    database_id: string;
    database_name: string;
    database_type: string;
    region: "global";
    type: string;
    port: number;
    creation_time: number;
    state: string;
    password: string;
    user_email: string;
    endpoint: string;
    tls: boolean;
    rest_token: string;
    read_only_rest_token: string;
    eviction: boolean;
    read_regions?: UpstashRegion[];
}
/**
 * Parameters for creating a Redis database
 */
export interface CreateRedisDatabaseParams {
    name: string;
    primary_region: UpstashRegion;
    read_regions?: UpstashRegion[];
    region: "global";
    tls: boolean;
    budget?: number;
}
/**
 * Delete a Redis database
 *
 * @param api Upstash API client
 * @param databaseId ID of the database to delete
 */
export declare function deleteRedisDatabase(api: UpstashApi, databaseId: string): Promise<void>;
/**
 * Rename a Redis database
 *
 * @param api Upstash API client
 * @param databaseId ID of the database to rename
 * @param name New name for the database
 */
export declare function renameRedisDatabase(api: UpstashApi, databaseId: string, name: string): Promise<void>;
/**
 * Update read regions for a Redis database
 *
 * @param api Upstash API client
 * @param databaseId ID of the database to update
 * @param readRegions Array of read regions
 */
export declare function updateRedisReadRegions(api: UpstashApi, databaseId: string, readRegions: UpstashRegion[]): Promise<void>;
/**
 * Enable or disable eviction for a Redis database
 *
 * @param api Upstash API client
 * @param databaseId ID of the database to update
 * @param enable Whether to enable or disable eviction
 */
export declare function setRedisEviction(api: UpstashApi, databaseId: string, enable: boolean): Promise<void>;
/**
 * Get information about a Redis database
 *
 * @param api Upstash API client
 * @param databaseId ID of the database to get information about
 * @returns Database information
 */
export declare function getRedisDatabase(api: UpstashApi, databaseId: string): Promise<UpstashDatabaseResponse>;
/**
 * Create a new Redis database
 *
 * @param api Upstash API client
 * @param params Parameters for the new database
 * @returns Created database information
 */
export declare function createRedisDatabase(api: UpstashApi, params: CreateRedisDatabaseParams): Promise<UpstashDatabaseResponse>;
export {};
//# sourceMappingURL=redis.d.ts.map