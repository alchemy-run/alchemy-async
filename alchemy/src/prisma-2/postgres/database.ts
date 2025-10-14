import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import { secret, type Secret } from "../../secret.ts";
import type {
  PrismaDatabase,
  PrismaDatabaseConnection,
  PrismaPostgresAuthProps,
  PrismaPostgresRegion,
} from "./types.ts";
import { PrismaPostgresApi } from "./api.ts";
import type { Project } from "./project.ts";

/**
 * Reference to another database when restoring from backup
 */
type DatabaseReference = string | { id: string };

type BackupReference = string | { id: string };

/**
 * Properties for managing a Prisma Postgres database
 */
export interface DatabaseProps extends PrismaPostgresAuthProps {
  /**
   * The parent project (id or Project resource)
   */
  project: string | Project;

  /**
   * Database name
   */
  name: string;

  /**
   * Region for the database
   */
  region: PrismaPostgresRegion;

  /**
   * Whether the database should become the default project database
   */
  isDefault?: boolean;

  /**
   * Adopt (reuse) an existing database with the same name if one already exists
   *
   * @default true
   */
  adopt?: boolean;

  /**
   * Restore the database from another database/backup
   */
  fromDatabase?: {
    /** Database to clone from */
    database: DatabaseReference;
    /** Specific backup id to restore from */
    backupId?: BackupReference;
  };
}

/**
 * Prisma Postgres database representation managed by Alchemy
 */
export interface Database {
  id: string;
  name: string;
  status: PrismaDatabase["status"];
  createdAt: string;
  isDefault: boolean;
  region: {
    id: PrismaPostgresRegion;
    name: string;
  } | null;
  project: {
    id: string;
    name: string;
  };
  connectionString: Secret<string> | null;
  directConnection: {
    host: string;
    user: string;
    password: Secret<string>;
  } | null;
  apiKeys: DatabaseConnectionInfo[];
}

/**
 * Connection information (API keys) associated with a database
 */
export interface DatabaseConnectionInfo {
  id: string;
  name: string;
  createdAt: string;
  connectionString: Secret<string>;
  directConnection: {
    host: string;
    user: string;
    password: Secret<string>;
  } | null;
}

/**
 * Create, adopt, and delete Prisma Postgres databases
 *
 * @example
 * // Create a database inside an existing project
 * const database = await Database("primary", {
 *   project: project.id,
 *   name: "primary",
 *   region: "us-east-1",
 * });
 *
 * @example
 * // Restore from backup
 * const database = await Database("restore", {
 *   project: project,
 *   name: "restored",
 *   region: "us-east-1",
 *   fromDatabase: {
 *     database: sourceDatabase,
 *     backupId: backup.id,
 *   },
 * });
 */
export const Database = Resource(
  "prisma-postgres::Database",
  async function (this: Context<Database>, _id, props: DatabaseProps) {
    const api = new PrismaPostgresApi(props);
    const adopt = props.adopt ?? true;
    const projectId =
      typeof props.project === "string" ? props.project : props.project.id;

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.deleteDatabase(this.output.id);
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output) {
      if (props.name !== this.output.name) {
        throw new Error(
          "Updating Prisma Postgres database name is not supported. Create a new database instead.",
        );
      }
      const previousRegionId = this.output.region?.id;
      if (previousRegionId && props.region !== previousRegionId) {
        throw new Error(
          "Updating Prisma Postgres database region is not supported.",
        );
      }
      if ((props.isDefault ?? false) !== this.output.isDefault) {
        throw new Error(
          "Changing the isDefault flag after database creation is not supported.",
        );
      }
      if (props.fromDatabase) {
        throw new Error(
          "Restoring from a backup is only supported during creation.",
        );
      }
    }

    let database: PrismaDatabase | undefined;

    if (this.output?.id) {
      database = await api.getDatabase(this.output.id);
    }

    if (!database && adopt) {
      database = await findDatabaseByName(api, projectId, props.name);
    }

    if (!database) {
      const payload: {
        projectId: string;
        name: string;
        region: PrismaPostgresRegion;
        isDefault?: boolean;
        fromDatabase?: {
          id: string;
          backupId?: string;
        };
      } = {
        projectId,
        name: props.name,
        region: props.region,
      };

      if (props.isDefault !== undefined) {
        payload.isDefault = props.isDefault;
      }

      if (props.fromDatabase) {
        payload.fromDatabase = {
          id: resolveId(props.fromDatabase.database),
          ...(props.fromDatabase.backupId
            ? { backupId: resolveId(props.fromDatabase.backupId) }
            : {}),
        };
      }

      database = await api.createDatabase(payload);
    }

    if (database.name !== props.name) {
      throw new Error(
        `Database name mismatch. Expected ${props.name} but API returned ${database.name}.`,
      );
    }

    if (database.region && database.region.id !== props.region) {
      throw new Error(
        `Database region mismatch. Expected ${props.region} but API reports ${database.region.id}.`,
      );
    }

    return formatDatabase(database);
  },
);

async function findDatabaseByName(
  api: PrismaPostgresApi,
  projectId: string,
  name: string,
): Promise<PrismaDatabase | undefined> {
  let cursor: string | undefined;
  do {
    const response = await api.listProjectDatabases(projectId, cursor);
    const match = response.data.find((db) => db.name === name);
    if (match) return match;
    cursor = response.pagination.nextCursor ?? undefined;
  } while (cursor);
  return undefined;
}

function formatDatabase(database: PrismaDatabase): Database {
  const region = database.region
    ? {
        id: database.region.id as PrismaPostgresRegion,
        name: database.region.name,
      }
    : null;

  return {
    id: database.id,
    name: database.name,
    status: database.status,
    createdAt: database.createdAt,
    isDefault: database.isDefault,
    region,
    project: {
      id: database.project.id,
      name: database.project.name,
    },
    connectionString: database.connectionString
      ? secret(database.connectionString)
      : null,
    directConnection: database.directConnection
      ? {
          host: database.directConnection.host,
          user: database.directConnection.user,
          password: secret(database.directConnection.pass),
        }
      : null,
    apiKeys: database.apiKeys.map(formatConnectionInfo),
  } satisfies Database;
}

function formatConnectionInfo(
  connection: PrismaDatabaseConnection,
): DatabaseConnectionInfo {
  return {
    id: connection.id,
    name: connection.name,
    createdAt: connection.createdAt,
    connectionString: secret(connection.connectionString),
    directConnection: connection.directConnection
      ? {
          host: connection.directConnection.host,
          user: connection.directConnection.user,
          password: secret(connection.directConnection.pass),
        }
      : null,
  } satisfies DatabaseConnectionInfo;
}

function resolveId(reference: DatabaseReference | BackupReference): string {
  if (typeof reference === "string") return reference;
  if (reference?.id) return reference.id;
  throw new Error("Unable to resolve id from reference");
}
