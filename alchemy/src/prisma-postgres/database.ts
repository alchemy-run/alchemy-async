import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { createPrismaApi } from "./api.ts";
import type { CreateDatabaseData } from "./api/types.gen.ts";
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

  region?:
    | "us-east-1"
    | "us-west-1"
    | "eu-west-3"
    | "eu-central-1"
    | "ap-northeast-1"
    | "ap-southeast-1"
    | (string & {});

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
export const Database = Resource(
  "prisma::Database",
  async function (
    this: Context<Database>,
    id: string,
    props: DatabaseProps,
  ): Promise<Database> {
    const api = createPrismaApi({
      serviceToken: props.serviceToken,
    });
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const shouldDelete = props.delete ?? false;
    const project =
      typeof props.project === "string" ? props.project : props.project.id;

    if (this.phase === "delete") {
      if (shouldDelete) {
        await api.deleteDatabase({
          path: { databaseId: this.output.id },
        });
      }
      return this.destroy();
    }

    if (this.phase === "update") {
      return this.replace();
    }

    const database = await api
      .createDatabase({
        path: {
          projectId: project,
        },
        body: {
          isDefault: false,
          name,
          region: props.region,
        } as CreateDatabaseData["body"],
      })
      .then((response) => response.data.data);

    return {
      id: database.id,
      name: database.name,
      region: database.region?.id,
      status: database.status,
      createdAt: database.createdAt,
      project,
    };
  },
);

export async function findDatabaseByName(props: DatabaseProps) {
  const api = createPrismaApi({
    serviceToken: props.serviceToken,
  });

  const project =
    typeof props.project === "string" ? props.project : props.project.id;

  const databases = await api.listDatabases({
    path: {
      projectId: project,
    },
  });
  const database = databases.data.data.find((db) => db.name === props.name);
  return database;
}
