import type { Context } from "../context.ts";
import { type NeonApiOptions } from "./api.ts";
import type * as neon from "./api/types.gen.ts";
import { type NeonConnectionUri, type NeonRole } from "./utils.ts";
/**
 * A Neon region where projects can be provisioned
 */
export type NeonRegion = "aws-us-east-1" | "aws-us-east-2" | "aws-us-west-2" | "aws-eu-central-1" | "aws-eu-west-2" | "aws-ap-southeast-1" | "aws-ap-southeast-2" | "aws-sa-east-1" | "azure-eastus2" | "azure-westus3" | "azure-gwc";
export type NeonPgVersion = 14 | 15 | 16 | 17 | 18;
/**
 * Properties for creating or updating a Neon project
 */
export interface NeonProjectProps extends NeonApiOptions {
    /**
     * When `true`, will adopt an existing project by `name`
     */
    adopt?: true;
    /**
     * Whether to delete the database when the resource is destroyed.
     * When false, the database will only be removed from the state but not deleted via API.
     * @default true, unless the resource was adopted
     */
    delete?: boolean;
    /**
     * Name of the project
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Region where the project will be provisioned
     * @default "aws-us-east-1"
     */
    region_id?: NeonRegion;
    /**
     * PostgreSQL version to use
     * @default 16
     */
    pg_version?: NeonPgVersion;
    /**
     * Default branch name
     * @default "main"
     */
    default_branch_name?: string;
    /**
     * Settings for the project
     */
    settings?: neon.ProjectSettingsData;
    /**
     * Default endpoint settings for the project
     */
    default_endpoint_settings?: neon.DefaultEndpointSettings;
    /**
     * History retention seconds for the project
     * @default 86400
     */
    history_retention_seconds?: number;
}
/**
 * Output returned after Neon project creation/update
 * IMPORTANT: The interface name MUST match the exported resource name
 */
export interface NeonProject {
    /**
     * The ID of the project
     */
    id: string;
    /**
     * Name of the Project.
     */
    name: string;
    /**
     * Time at which the project was created
     */
    created_at: string;
    /**
     * Time at which the project was last updated
     */
    updated_at: string;
    /**
     * Hostname for proxy access
     */
    proxy_host: string;
    /**
     * Region where the project is provisioned
     */
    region_id: NeonRegion;
    /**
     * Settings for the project
     */
    settings: neon.ProjectSettingsData | undefined;
    /**
     * Default endpoint settings for the project
     */
    default_endpoint_settings: neon.DefaultEndpointSettings | undefined;
    /**
     * History retention seconds for the project
     */
    history_retention_seconds: number;
    /**
     * PostgreSQL version used by the project
     */
    pg_version: NeonPgVersion;
    /**
     * Connection URIs for the databases
     */
    connection_uris: [NeonConnectionUri, ...NeonConnectionUri[]];
    /**
     * Database roles created with the project
     */
    roles: [NeonRole, ...NeonRole[]];
    /**
     * Databases created with the project
     */
    databases: [neon.Database, ...neon.Database[]];
    /**
     * Default branch information
     */
    branch: neon.Branch;
    /**
     * Compute endpoints for the project
     */
    endpoints: [neon.Endpoint, ...neon.Endpoint[]];
}
/**
 * Creates a Neon serverless PostgreSQL project.
 *
 * @example
 * // Create a basic Neon project with default settings:
 * const project = await NeonProject("my-project", {
 *   name: "My Project"
 * });
 *
 * @example
 * // Adopt an existing Neon project by name:
 * const project = await NeonProject("my-project", {
 *   adopt: true
 *   name: "adjective-noun-123",
 * });
 *
 * @example
 * // Create a Neon project in a specific region with a specific PostgreSQL version:
 * const euProject = await NeonProject("my-eu-project", {
 *   name: "My EU Project",
 *   region_id: "aws-eu-west-1",
 *   pg_version: 16,
 *   apiKey: alchemy.secret(process.env.NEON_API_KEY)
 * });
 *
 * @example
 * // Create a Neon project with a custom default branch name:
 * const devProject = await NeonProject("dev-project", {
 *   name: "Development Project",
 *   default_branch_name: "development"
 * });
 */
export declare const NeonProject: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<NeonProject>, id: string, props: NeonProjectProps) => Promise<NeonProject>);
/**
 * References an existing Neon project by name. You can use this to reference an existing NeonProject without adopting it.
 *
 * @example
 * const project = await NeonProjectRef({
 *   name: "my-project"
 * });
 *
 * @warning Project names must be unique when referencing existing projects. If multiple projects are found with the same name, an error will be thrown.
 */
export declare function NeonProjectRef(props: NeonProjectProps & {
    name: string;
}): Promise<NeonProject>;
//# sourceMappingURL=project.d.ts.map