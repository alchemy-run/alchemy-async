import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { secret, type Secret } from "../secret.ts";
import { createPrismaApi } from "./api.ts";
import type { Database } from "./database.ts";

export interface ConnectionProps {
  /**
   * Database (id or resource) the connection belongs to
   */
  database: Database | string;

  /**
   * The name of the connection
   */
  name?: string;

  /**
   * The service token to use for the API
   */
  serviceToken?: Secret<string>;
}

export interface Connection {
  /**
   * The prisma id of the connection
   */
  id: string;

  /**
   * The name of the connection
   */
  name: string;

  /**
   * The timestamp of the connection creation
   */
  createdAt: string;

  /**
   * The prisma connection string (prefixed with `prisma+postgres://`)
   */
  prismaConnectionString: Secret<string>;

  /**
   * The connection string
   */
  connectionString: Secret<string>;

  /**
   * The prisma id of the database the connection belongs to
   */
  database: string;

  /**
   * The host of the connection
   */
  host: string | null;

  /**
   * The password of the connection
   */
  password: Secret<string> | null;

  /**
   * The user of the connection
   */
  user: string | null;
}

/**
 * Creates and manages Prisma Postgres database connections.
 *
 * Prisma Postgres database connections provide secure credentials
 * and connection details for accessing your databases. Connections
 * belong to a Prisma Postgres database.
 *
 * @example
 * // Create a database connection for a database
 * import { Database, Connection } from "alchemy/prisma-postgres";
 * const project = await Project("my-project");
 * const database = await Database("my-database", { project });
 * const connection = await Connection("my-connection", {
 *   database: database,
 * });
 * console.log(`Connection String: ${connection.connectionString.unencrypted}`);
 *
 * @example
 * // Create a database connection and connect it to Cloudflare Hyperdrive
 * import { Hyperdrive } from "alchemy/cloudflare";
 * import { Database, Connection } from "alchemy/prisma-postgres";
 * const project = await Project("my-project");
 * const database = await Database("my-database", { project });
 * const connection = await Connection("my-connection", {
 *   database: database,
 * });
 * const db = await Hyperdrive("prisma-postgres", {
 *   origin: connection.connectionString.unencrypted,
 * });
 */
export const Connection = Resource(
  "prisma::Connection",
  async function (
    this: Context<Connection>,
    id: string,
    props: ConnectionProps,
  ): Promise<Connection> {
    const api = createPrismaApi({
      serviceToken: props.serviceToken,
    });
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const database =
      typeof props.database === "string" ? props.database : props.database.id;

    if (this.phase === "delete") {
      await api.deleteDatabaseConnectionString({
        path: {
          id: this.output.id,
        },
      });
      return this.destroy();
    }

    if (this.phase === "update") {
      return this.replace();
    }

    const connection = await api
      .createDatabaseConnectionString({
        path: {
          databaseId: database,
        },
        body: {
          name,
        },
      })
      .then((response) => response.data.data);

    return {
      id: connection.id,
      name: connection.name,
      createdAt: connection.createdAt,
      prismaConnectionString: secret(connection.connectionString),
      connectionString: secret(
        `postgres://${connection.user}:${connection.pass}@${connection.host}/${connection.database}`,
      ),
      database: database,
      host: connection.host,
      password: connection.pass ? secret(connection.pass) : null,
      user: connection.user,
    };
  },
);
