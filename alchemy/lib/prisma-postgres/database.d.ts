import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import type { Project } from "./project.ts";
export interface DatabaseProps {
    /**
     * The name of the database
     */
    project: Project | string;
    /**
     * The region to create the database in
     */
    name?: string;
    /**
     * The project to create the database in
     */
    region?: "us-east-1" | "us-west-1" | "eu-west-3" | "eu-central-1" | "ap-northeast-1" | "ap-southeast-1" | (string & {});
    /**
     * Whether to delete the database if the resource is deleted
     *
     * @default false
     */
    delete?: boolean;
    /**
     * The service token to use for the API
     */
    serviceToken?: Secret<string>;
}
export interface Database {
    /**
     * The prisma id of the database
     */
    id: string;
    /**
     * The name of the database
     */
    name: string;
    /**
     * The status of the database
     */
    status: "failure" | "provisioning" | "ready" | "recovering";
    /**
     * The region of the database
     */
    region?: string;
    /**
     * The timestamp of the database creation
     */
    createdAt: string;
    /**
     * The prisma id of the project the database belongs to
     */
    project: string;
}
/**
 * Creates and manages Prisma Postgres databases.
 *
 * Prisma Postgres databases are fully managed PostgreSQL instances
 * that can be connected to applications. Databases belong to a
 * Prisma Postgres project.
 *
 * @example
 * // Create a database for a project
 * import { Project, Database } from "alchemy/prisma-postgres";
 * const project = await Project("my-app");
 * const database = await Database("my-database", {
 *   project: project,
 * });
 *
 * @example
 * // Create a database in the asia pacific region
 * import { Project, Database } from "alchemy/prisma-postgres";
 * const project = await Project("my-app");
 * const database = await Database("my-database", {
 *   project: project,
 *   region: "ap-northeast-1",
 * });
 *
 * @example
 * // Create a database and fully delete on destroy
 * import { Project, Database } from "alchemy/prisma-postgres";
 * const project = await Project("my-app");
 * const database = await Database("my-database", {
 *   project: project,
 *   delete: true,
 * });
 */
export declare const Database: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Database>, id: string, props: DatabaseProps) => Promise<Database>);
export declare function findDatabaseByName(props: DatabaseProps): Promise<{
    id: string;
    type: "database";
    name: string;
    status: "failure" | "provisioning" | "ready" | "recovering";
    createdAt: string;
    isDefault: boolean;
    project: {
        id: string;
        name: string;
    };
    region: {
        id: string;
        name: string;
    } | null;
} | undefined>;
//# sourceMappingURL=database.d.ts.map