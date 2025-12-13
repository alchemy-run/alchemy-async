import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
export type D1DatabaseJurisdiction = "default" | "eu" | "fedramp";
type PrimaryLocationHint = "wnam" | "enam" | "weur" | "eeur" | "apac" | "auto" | (string & {});
/**
 * Properties for creating or updating a D1 Database
 */
export interface D1DatabaseProps extends CloudflareApiOptions {
    /**
     * Name of the database
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Optional primary location hint for the database
     * Indicates the primary geographical location data will be stored
     */
    primaryLocationHint?: PrimaryLocationHint;
    /**
     * Read replication configuration
     * Only mutable property during updates
     */
    readReplication?: {
        /**
         * Read replication mode
         * - auto: Automatic read replication
         * - disabled: No read replication
         */
        mode: "auto" | "disabled";
    };
    /**
     * Whether to delete the database.
     * If set to false, the database will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to adopt an existing database with the same name if it exists
     * If true and a database with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Clone data from an existing database to this new database.
     * Only applicable during creation phase.
     *
     * Can be specified as:
     * - A D1Database object
     * - An object with an id property
     * - An object with a name property (will look up the ID by name)
     */
    clone?: D1Database | {
        id: string;
    } | {
        name: string;
    };
    /**
     * These files will be generated internally with the D1Database wrapper function when migrationsDir is specified
     *
     * @private
     */
    migrationsFiles?: Array<{
        id: string;
        sql: string;
    }>;
    /**
     * Name of the table used to track migrations. Only used if migrationsDir is specified. Defaults to 'd1_migrations'
     * This is analogous to wrangler's `migrations_table`.
     */
    migrationsTable?: string;
    /**
     * Directory containing migration SQL files. If not set, no migrations will be applied.
     * This is analogous to wrangler's `migrations_dir`.
     */
    migrationsDir?: string;
    /**
     * Whether to emulate the database locally when Alchemy is running in watch mode.
     */
    dev?: {
        /**
         * Whether to run the database remotely instead of locally
         * @default false
         */
        remote?: boolean;
        /**
         * Set when `Scope.local` is true to force update to the database even if it was already deployed live.
         * @internal
         */
        force?: boolean;
    };
    /**
     * Optional jurisdiction for the bucket
     * Determines the regulatory jurisdiction the bucket data falls under
     */
    jurisdiction?: D1DatabaseJurisdiction;
}
export declare function isD1Database(resource: any): resource is D1Database;
/**
 * Output returned after D1 Database creation/update
 */
export type D1Database = Pick<D1DatabaseProps, "migrationsDir" | "migrationsTable" | "primaryLocationHint" | "readReplication"> & {
    type: "d1";
    /**
     * The unique ID of the database (UUID)
     */
    id: string;
    /**
     * The name of the database
     */
    name: string;
    /**
     * Development mode properties
     * @internal
     */
    dev: {
        /**
         * The ID of the database in development mode
         */
        id: string;
        /**
         * Whether the database is running remotely
         */
        remote: boolean;
    };
    /**
     * The jurisdiction of the database
     */
    jurisdiction: D1DatabaseJurisdiction;
};
/**
 * Creates and manages Cloudflare D1 Databases.
 *
 * D1 Databases provide serverless SQL databases built on SQLite with
 * automatic data replication for high availability.
 *
 * @example
 * // Create a basic D1 database with default settings
 * const basicDatabase = await D1Database("my-app-db", {
 *   name: "my-app-db"
 * });
 *
 * @example
 * // Create a database with location hint for optimal performance
 * const westUsDatabase = await D1Database("west-us-db", {
 *   name: "west-us-db",
 *   primaryLocationHint: "wnam"
 * });
 *
 * @example
 * // Adopt an existing database if it already exists instead of failing
 * const existingDb = await D1Database("existing-db", {
 *   name: "existing-db",
 *   adopt: true,
 *   readReplication: {
 *     mode: "auto"
 *   }
 * });
 *
 * @example
 * // Create a database with migrations
 * const dbWithMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 * });
 *
 * @example
 * // Create a database with migrations using a custom migration table (compatible with Drizzle)
 * const dbWithCustomMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 *   migrationsTable: "drizzle_migrations",
 * });
 *
 * @example
 * // Create a database with custom migration table and ID column for maximum compatibility
 * const dbWithCustomMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 *   migrationsTable: "custom_migrations",
 *   migrationsIdColumn: "migration_name", // explicit column name override
 * });
 *
 * @example
 * // Clone an existing database by ID
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: otherDb
 * });
 *
 * @example
 * // Clone an existing database by ID
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: { id: "existing-db-uuid" }
 * });
 *
 * @example
 * // Clone an existing database by name
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: { name: "existing-db-name" }
 * });
 *
 * @see https://developers.cloudflare.com/d1/
 */
export declare function D1Database(id: string, props?: Omit<D1DatabaseProps, "migrationsFiles">): Promise<D1Database>;
interface CloudflareD1Response {
    result: {
        uuid?: string;
        name: string;
        file_size: number;
        num_tables: number;
        version: string;
        primary_location_hint?: string;
        read_replication?: {
            mode: "auto" | "disabled";
        };
        jurisdiction?: string;
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Create a new D1 database
 */
export declare function createDatabase(api: CloudflareApi, databaseName: string, props: D1DatabaseProps): Promise<CloudflareD1Response>;
/**
 * Get a D1 database
 */
export declare function getDatabase(api: CloudflareApi, databaseId?: string, props?: D1DatabaseProps): Promise<CloudflareD1Response>;
/**
 * Delete a D1 database
 */
export declare function deleteDatabase(api: CloudflareApi, databaseId?: string, props?: D1DatabaseProps): Promise<void>;
/**
 * List all D1 databases in an account
 */
export declare function listDatabases(api: CloudflareApi, name?: string, props?: D1DatabaseProps): Promise<{
    name: string;
    id: string;
}[]>;
/**
 * Update a D1 database
 *
 * Note: According to Cloudflare API, only read_replication.mode can be modified during updates.
 */
export declare function updateDatabase(api: CloudflareApi, databaseId: string, props: D1DatabaseProps): Promise<CloudflareD1Response>;
export {};
//# sourceMappingURL=d1-database.d.ts.map