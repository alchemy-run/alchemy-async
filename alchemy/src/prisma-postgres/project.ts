import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { createPrismaApi } from "./api.ts";

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
export const Project = Resource(
  "prisma::Project",
  async function (
    this: Context<Project>,
    id: string,
    props?: ProjectProps,
  ): Promise<Project> {
    const api = createPrismaApi({
      serviceToken: props?.serviceToken,
    });
    const name =
      props?.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const shouldDelete = props?.delete ?? false;

    if (this.phase === "delete") {
      if (shouldDelete) {
        await api.deleteProject({
          path: { id: this.output.id },
        });
      }
      return this.destroy();
    }
    if (this.phase === "update") {
      return this.replace();
    }

    const project = await api
      .createProjectWithPostgresDatabase({
        body: {
          createDatabase: false,
          name,
          //! prisma seems to not support setting the workspace on project creation?
        },
      })
      .then((response) => response.data.data!);

    return {
      id: project.id,
      name: project.name,
      createdAt: project.createdAt,
      workspace: project.workspace,
    };
  },
);

export async function findProjectByName(props: ProjectProps) {
  const api = createPrismaApi(props);
  let hasMore = true;
  let project:
    | NonNullable<
        Awaited<ReturnType<typeof api.listProjects>>["data"]
      >["data"][number]
    | undefined;
  while (hasMore) {
    const response = await api.listProjects();
    project = response.data.data.find((project) => project.name === props.name);
    if (project != null) {
      break;
    }
    hasMore = response.data.pagination.hasMore;
  }
  return project;
}
