import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import type {
  PrismaDatabaseBackup,
  PrismaDatabaseBackupsResponse,
  PrismaPostgresAuthProps,
} from "./types.ts";
import { PrismaPostgresApi } from "./api.ts";
import type { Database } from "./database.ts";

/**
 * Properties for retrieving database backups
 */
export interface DatabaseBackupsProps extends PrismaPostgresAuthProps {
  /**
   * Database (id or resource) to inspect
   */
  database: string | Database;

  /**
   * Maximum number of backups to fetch (1-100)
   *
   * @default 25
   */
  limit?: number;
}

/**
 * Database backups list information
 */
export interface DatabaseBackups {
  databaseId: string;
  backups: PrismaDatabaseBackup[];
  meta: PrismaDatabaseBackupsResponse["meta"];
  pagination: PrismaDatabaseBackupsResponse["pagination"];
  mostRecent?: PrismaDatabaseBackup;
}

/**
 * Retrieve available Prisma Postgres backups for a database
 *
 * @example
 * const backups = await DatabaseBackups("backups", {
 *   database,
 *   limit: 10,
 * });
 */
export const DatabaseBackups = Resource(
  "prisma-postgres::DatabaseBackups",
  async function (
    this: Context<DatabaseBackups>,
    _id,
    props: DatabaseBackupsProps,
  ) {
    if (this.phase === "delete") {
      return this.destroy();
    }

    const api = new PrismaPostgresApi(props);
    const databaseId =
      typeof props.database === "string" ? props.database : props.database.id;
    const limit = props.limit;

    const response = await api.listDatabaseBackups({
      databaseId,
      limit,
    });

    const mostRecent = response.data.at(0);

    return {
      databaseId,
      backups: response.data,
      meta: response.meta,
      pagination: response.pagination,
      mostRecent: mostRecent ?? undefined,
    } satisfies DatabaseBackups;
  },
);
