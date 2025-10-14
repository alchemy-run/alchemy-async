import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import { secret, type Secret } from "../../secret.ts";
import type {
  PrismaDatabaseConnection,
  PrismaConnectionListItem,
  PrismaPostgresAuthProps,
} from "./types.ts";
import { PrismaPostgresApi } from "./api.ts";
import type { Database } from "./database.ts";

/**
 * Properties for managing a Prisma Postgres database connection string
 */
export interface DatabaseConnectionProps extends PrismaPostgresAuthProps {
  /**
   * Database (id or resource) the connection belongs to
   */
  database: string | Database;

  /**
   * Human-readable name for the connection string
   */
  name: string;
}

/**
 * Prisma Postgres database connection string output
 */
export interface DatabaseConnection {
  id: string;
  name: string;
  createdAt: string;
  database: {
    id: string;
    name: string;
  };
  connectionString: Secret<string>;
}

/**
 * Create and rotate Prisma Postgres database connection strings
 *
 * @example
 * const connection = await DatabaseConnection("primary", {
 *   database: database.id,
 *   name: "app",
 * });
 */
export const DatabaseConnection = Resource(
  "prisma-postgres::DatabaseConnection",
  async function (
    this: Context<DatabaseConnection>,
    _id,
    props: DatabaseConnectionProps,
  ) {
    const api = new PrismaPostgresApi(props);
    const databaseId =
      typeof props.database === "string" ? props.database : props.database.id;

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.deleteConnection(this.output.id);
      }
      return this.destroy();
    }

    if (
      this.phase === "update" &&
      this.output &&
      props.name !== this.output.name
    ) {
      throw new Error(
        "Updating Prisma Postgres connection name is not supported. Create a new connection instead.",
      );
    }

    // Attempt to locate existing connection in the API
    let connectionMeta = this.output?.id
      ? await findConnectionById(api, databaseId, this.output.id)
      : undefined;

    if (!connectionMeta) {
      const created = await api.createConnection({
        databaseId,
        name: props.name,
      });

      return formatConnection(created);
    }

    // Reuse existing connection metadata and previously returned secret
    if (!this.output?.connectionString) {
      throw new Error(
        "Existing connection secret missing from state. Remove the resource or recreate the connection.",
      );
    }

    return {
      id: connectionMeta.id,
      name: connectionMeta.name,
      createdAt: connectionMeta.createdAt,
      database: {
        id: connectionMeta.database.id,
        name: connectionMeta.database.name,
      },
      connectionString: this.output.connectionString,
    } satisfies DatabaseConnection;
  },
);

async function findConnectionById(
  api: PrismaPostgresApi,
  databaseId: string,
  connectionId: string,
): Promise<PrismaConnectionListItem | undefined> {
  let cursor: string | undefined;
  do {
    const response = await api.listConnections(databaseId, cursor);
    const match = response.data.find(
      (connection) => connection.id === connectionId,
    );
    if (match) return match;
    cursor = response.pagination.nextCursor ?? undefined;
  } while (cursor);
  return undefined;
}

function formatConnection(
  connection: PrismaDatabaseConnection,
): DatabaseConnection {
  return {
    id: connection.id,
    name: connection.name,
    createdAt: connection.createdAt,
    database: {
      id: connection.database.id,
      name: connection.database.name,
    },
    connectionString: secret(connection.connectionString),
  } satisfies DatabaseConnection;
}
