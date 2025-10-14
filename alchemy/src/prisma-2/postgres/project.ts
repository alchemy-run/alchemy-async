import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import { PrismaPostgresApi } from "./api.ts";
import type { PrismaDatabase, PrismaPostgresAuthProps, PrismaPostgresRegion, PrismaProject } from "./types.ts";

/**
 * Properties for managing a Prisma Postgres project
 */
type ProjectRegionProps =
  | {
      /**
       * Whether to create the default database when provisioning the project.
       * Some workspaces require enabling Prisma Postgres before automatic database
       * creation succeeds, so this defaults to false.
       *
       * @default false
       */
      createDatabase?: false | undefined;

      /**
       * Region where the initial database will be created (if requested).
       */
      region?: PrismaPostgresRegion;
    }
  | {
      /**
       * Whether to create the default database when provisioning the project.
       * Some workspaces require enabling Prisma Postgres before automatic database
       * creation succeeds, so this defaults to false.
       *
       * @default false
       */
      createDatabase: true;

      /**
       * Region where the initial database will be created (required when createDatabase is true).
       */
      region: PrismaPostgresRegion;
    };

export type ProjectProps = PrismaPostgresAuthProps &
  ProjectRegionProps & {
  /**
   * Project name. Must be unique per workspace.
   */
  name: string;

  /**
   * Adopt (reuse) an existing project with the same name instead of creating a new one.
   *
   * @default true
   */
  adopt?: boolean;
};

/**
 * Prisma Postgres project representation
 */
export interface Project {
  /**
   * Project identifier
   */
  id: string;

  /**
   * Project name
   */
  name: string;

  /**
   * Region used when the project was created (if known)
   */
  region?: PrismaPostgresRegion;

  /**
   * Timestamp when the project was created
   */
  createdAt: string;

  /**
   * Workspace metadata
   */
  workspace: PrismaProject["workspace"];

  /**
   * Default database created with the project, if any
   */
  database: ProjectDatabaseSummary | null;

  /**
   * Whether a default database was requested during project creation
   */
  createDatabase: boolean;
}

/**
 * Minimal information about a project's default database
 */
export interface ProjectDatabaseSummary {
  id: string;
  name: string;
  status: PrismaDatabase["status"];
  createdAt: string;
  isDefault: boolean;
  region: PrismaDatabase["region"];
}

/**
 * Create or adopt Prisma Postgres projects
 *
 * @example
 * // Create a project and provision a database in us-east-1
 * const project = await Project("my-project", {
 *   name: "my-project",
 *   region: "us-east-1",
 *   createDatabase: true,
 * });
 *
 * @example
 * // Reuse an existing project without creating a database
 * const project = await Project("existing", {
 *   name: "existing",
 *   region: "us-east-1",
 *   adopt: true,
 *   createDatabase: false,
 * });
 */
export const Project = Resource(
  "prisma-postgres::Project",
  async function (this: Context<Project>, _id, props: ProjectProps) {
    const api = new PrismaPostgresApi(props);
    const createDatabase = props.createDatabase ?? false;
    const adopt = props.adopt ?? true;
    const region = props.region;

    if (createDatabase && !region) {
      throw new Error(
        "region is required when createDatabase is true for Prisma Postgres projects.",
      );
    }

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.deleteProject(this.output.id);
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output) {
      if (region && this.output.region && region !== this.output.region) {
        throw new Error(
          "Updating Prisma Postgres project region is not supported. Create a new project instead.",
        );
      }
      if (createDatabase !== this.output.createDatabase) {
        throw new Error(
          "Changing createDatabase after project creation is not supported.",
        );
      }
    }

    let project: PrismaProject | undefined;

    if (this.output?.id) {
      project = await api.getProject(this.output.id);
    }

    if (!project && adopt) {
      project = await findProjectByName(api, props.name);
    }

    if (!project) {
      project = await api.createProject({
        name: props.name,
        ...(region ? { region } : {}),
        createDatabase,
      });
    }

    if (project.name !== props.name) {
      throw new Error(
        `Project name mismatch. Expected ${props.name} but API returned ${project.name}.`,
      );
    }

    return {
      id: project.id,
      name: project.name,
      region:
        region ??
        this.output?.region ??
        (project.database?.region?.id as PrismaPostgresRegion | undefined),
      createdAt: project.createdAt,
      workspace: project.workspace,
      database: summarizeDatabase(project.database),
      createDatabase,
    } satisfies Project;
  },
);

async function findProjectByName(
  api: PrismaPostgresApi,
  name: string,
): Promise<PrismaProject | undefined> {
  let cursor: string | undefined;
  do {
    const response = await api.listProjects(cursor);
    const found = response.data.find((project) => project.name === name);
    if (found) return found;
    cursor = response.pagination.nextCursor ?? undefined;
  } while (cursor);
  return undefined;
}

function summarizeDatabase(
  database: PrismaProject["database"],
): ProjectDatabaseSummary | null {
  if (!database) return null;
  return {
    id: database.id,
    name: database.name,
    status: database.status,
    createdAt: database.createdAt,
    isDefault: database.isDefault,
    region: database.region,
  } satisfies ProjectDatabaseSummary;
}
