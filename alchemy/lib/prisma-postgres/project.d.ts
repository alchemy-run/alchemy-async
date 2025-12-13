import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
export interface ProjectProps {
    /**
     * The name of the project
     */
    name?: string;
    /**
     * Whether to delete the project if the resource is deleted
     *
     * @default false
     */
    delete?: boolean;
    /**
     * The service token to use for the API
     */
    serviceToken?: Secret<string>;
}
export interface Project {
    /**
     * The prisma id of the project
     */
    id: string;
    /**
     * The name of the project
     */
    name: string;
    /**
     * The timestamp of the project creation
     */
    createdAt: string;
    /**
     * The workspace the project belongs to
     */
    workspace: {
        /**
         * The prisma id of the workspace
         */
        id: string;
        /**
         * The name of the workspace
         */
        name: string;
    };
}
/**
 * Creates and manages Prisma Postgres projects.
 *
 * Prisma Postgres projects are containers for your databases and
 * their configurations. Projects belong to a workspace and can
 * contain multiple databases.
 *
 * @example
 * // Create a database for a project
 * import { Project, Database } from "alchemy/prisma-postgres";
 * const project = await Project("my-app");
 */
export declare const Project: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Project>, id: string, props?: ProjectProps) => Promise<Project>);
export declare function findProjectByName(props: ProjectProps): Promise<{
    id: string;
    type: "project";
    name: string;
    createdAt: string;
    workspace: {
        id: string;
        name: string;
    };
} | undefined>;
//# sourceMappingURL=project.d.ts.map