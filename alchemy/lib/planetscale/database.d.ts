import type { Context } from "../context.ts";
import type { PlanetScaleProps } from "./api.ts";
import { type PlanetScaleClusterSize } from "./utils.ts";
interface BaseDatabaseProps extends PlanetScaleProps {
    /**
     * The name of the database
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * The organization name where the database will be created
     * @default process.env.PLANETSCALE_ORGANIZATION
     */
    organization?: string;
    /**
     * Whether to adopt the database if it already exists in Planetscale
     */
    adopt?: boolean;
    /**
     * Whether to delete the database when the resource is destroyed.
     * When false, the database will only be removed from the state but not deleted via API.
     * @default true
     */
    delete?: boolean;
    /**
     * The region where the database will be created (create only)
     */
    region?: {
        /**
         * The slug identifier of the region
         */
        slug: string;
    };
    /**
     * Whether to require approval for deployments
     */
    requireApprovalForDeploy?: boolean;
    /**
     * Whether to allow data branching
     */
    allowDataBranching?: boolean;
    /**
     * Whether to enable automatic migrations
     */
    automaticMigrations?: boolean;
    /**
     * Whether to restrict branch creation to the same region as database
     */
    restrictBranchRegion?: boolean;
    /**
     * Whether to collect full queries from the database
     */
    insightsRawQueries?: boolean;
    /**
     * Whether web console can be used on production branch
     */
    productionBranchWebConsole?: boolean;
    /**
     * The default branch of the database
     */
    defaultBranch?: string;
    /**
     * Migration framework to use on the database
     */
    migrationFramework?: string;
    /**
     * Name of table to use as migration table
     */
    migrationTableName?: string;
    /**
     * The database cluster size (required)
     */
    clusterSize: PlanetScaleClusterSize;
    /**
     * The engine kind for the database
     * @default "mysql"
     */
    kind?: "mysql" | "postgresql";
    /**
     * The CPU architecture for the database. Only available for PostgreSQL databases.
     */
    arch?: "x86" | "arm";
}
/**
 * Properties for creating or updating a PlanetScale Database
 */
export type DatabaseProps = BaseDatabaseProps & ({
    kind?: "mysql";
    arch?: undefined;
} | {
    kind: "postgresql";
    arch?: "x86" | "arm";
});
/**
 * Represents a PlanetScale Database
 */
export type Database = DatabaseProps & {
    /**
     * The unique identifier of the database
     */
    id: string;
    /**
     * The name of the database
     */
    name: string;
    /**
     * The current state of the database
     */
    state: string;
    /**
     * The default branch name
     */
    defaultBranch: string;
    /**
     * The plan type
     */
    plan: string;
    /**
     * Time at which the database was created
     */
    createdAt: string;
    /**
     * Time at which the database was last updated
     */
    updatedAt: string;
    /**
     * HTML URL to access the database
     */
    htmlUrl: string;
    /**
     * The organization of the database
     */
    organization: string;
};
/**
 * Create, manage and delete PlanetScale databases
 *
 * @example
 * // Create a basic database in a specific organization
 * const db = await Database("my-app-db", {
 *   name: "my-app-db",
 *   organization: "my-org",
 *   clusterSize: "PS_10"
 * });
 *
 * @example
 * // Create a database with specific region and settings
 * const db = await Database("my-app-db", {
 *   name: "my-app-db",
 *   organization: "my-org",
 *   region: {
 *     slug: "us-east"
 *   },
 *   clusterSize: "PS_10",
 *   requireApprovalForDeploy: true,
 *   allowDataBranching: true,
 *   automaticMigrations: true
 * });
 *
 * @example
 * // Create a database with custom API key
 * const db = await Database("my-app-db", {
 *   name: "my-app-db",
 *   organization: "my-org",
 *   apiKey: alchemy.secret(process.env.CUSTOM_PLANETSCALE_TOKEN),
 *   clusterSize: "PS_10"
 * });
 */
export declare const Database: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Database>, id: string, props: DatabaseProps) => Promise<Database>);
export {};
//# sourceMappingURL=database.d.ts.map