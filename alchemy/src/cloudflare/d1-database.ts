import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { cloneD1Database } from "./d1-clone.ts";
import { importD1Database } from "./d1-import.ts";
import { applyLocalD1Migrations } from "./d1-local-migrations.ts";
import { applyMigrations } from "./d1-migrations.ts";
import { listSqlFiles, readSqlFile, type D1SqlFile } from "./d1-sql-file.ts";
import { deleteMiniflareBinding } from "./miniflare/delete.ts";

const DEFAULT_MIGRATIONS_TABLE = "d1_migrations";

export type D1DatabaseJurisdiction = "default" | "eu" | "fedramp";

type PrimaryLocationHint =
  | "wnam"
  | "enam"
  | "weur"
  | "eeur"
  | "apac"
  | "oc"
  | (string & {});

/**
 * Properties for creating or updating a D1 Database
 */
export interface D1DatabaseProps extends CloudflareApiOptions {
  /**
   * Name of the database
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Optional primary location hint for the database
   * Indicates the primary geographical location data will be stored
   */
  primaryLocationHint?: PrimaryLocationHint;

  /**
   * Read replication configuration
   * Only mutable property during updates
   */
  readReplication?: {
    /**
     * Read replication mode
     * - auto: Automatic read replication
     * - disabled: No read replication
     */
    mode: "auto" | "disabled";
  };

  /**
   * Whether to delete the database.
   * If set to false, the database will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;

  /**
   * Whether to adopt an existing database with the same name if it exists
   * If true and a database with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Clone data from an existing database to this new database.
   * Only applicable during creation phase.
   *
   * Can be specified as:
   * - A D1Database object
   * - An object with an id property
   * - An object with a name property (will look up the ID by name)
   */
  clone?: D1Database | { id: string } | { name: string };

  /**
   * The names of SQL files to import.
   * After migrations are applied, these files will be run using [Cloudflare's D1 import API](https://developers.cloudflare.com/d1/best-practices/import-export-data/).
   */
  importFiles?: string[];

  /**
   * Name of the table used to track migrations. Only used if migrationsDir is specified. Defaults to 'd1_migrations'
   * This is analogous to wrangler's `migrations_table`.
   */
  migrationsTable?: string;

  /**
   * Directory containing migration SQL files. If not set, no migrations will be applied.
   * This is analogous to wrangler's `migrations_dir`.
   */
  migrationsDir?: string;

  /**
   * Whether to emulate the database locally when Alchemy is running in watch mode.
   */
  dev?: {
    /**
     * Whether to run the database remotely instead of locally
     * @default false
     */
    remote?: boolean;

    /**
     * Set when `Scope.local` is true to force update to the database even if it was already deployed live.
     * @internal
     */
    force?: boolean;
  };

  /**
   * Optional jurisdiction for the bucket
   * Determines the regulatory jurisdiction the bucket data falls under
   */
  jurisdiction?: D1DatabaseJurisdiction;
}

export function isD1Database(resource: any): resource is D1Database {
  return resource?.[ResourceKind] === "cloudflare::D1Database";
}

/**
 * Output returned after D1 Database creation/update
 */
export type D1Database = Pick<
  D1DatabaseProps,
  | "migrationsDir"
  | "migrationsTable"
  | "primaryLocationHint"
  | "readReplication"
  | "importFiles"
> & {
  type: "d1";
  /**
   * The unique ID of the database (UUID)
   */
  id: string;

  /**
   * The name of the database
   */
  name: string;

  /**
   * Development mode properties
   * @internal
   */
  dev: {
    /**
     * The ID of the database in development mode
     */
    id: string;

    /**
     * Whether the database is running remotely
     */
    remote: boolean;
  };

  /**
   * The jurisdiction of the database
   */
  jurisdiction: D1DatabaseJurisdiction;
};

/**
 * Creates and manages Cloudflare D1 Databases.
 *
 * D1 Databases provide serverless SQL databases built on SQLite with
 * automatic data replication for high availability.
 *
 * @example
 * // Create a basic D1 database with default settings
 * const basicDatabase = await D1Database("my-app-db", {
 *   name: "my-app-db"
 * });
 *
 * @example
 * // Create a database with location hint for optimal performance
 * const westUsDatabase = await D1Database("west-us-db", {
 *   name: "west-us-db",
 *   primaryLocationHint: "wnam"
 * });
 *
 * @example
 * // Adopt an existing database if it already exists instead of failing
 * const existingDb = await D1Database("existing-db", {
 *   name: "existing-db",
 *   adopt: true,
 *   readReplication: {
 *     mode: "auto"
 *   }
 * });
 *
 * @example
 * // Create a database with migrations
 * const dbWithMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 * });
 *
 * @example
 * // Create a database with migrations using a custom migration table (compatible with Drizzle)
 * const dbWithCustomMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 *   migrationsTable: "drizzle_migrations",
 * });
 *
 * @example
 * // Create a database with custom migration table and ID column for maximum compatibility
 * const dbWithCustomMigrations = await D1Database("mydb", {
 *   name: "mydb",
 *   migrationsDir: "./migrations",
 *   migrationsTable: "custom_migrations",
 *   migrationsIdColumn: "migration_name", // explicit column name override
 * });
 *
 * @example
 * // Clone an existing database by ID
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: otherDb
 * });
 *
 * @example
 * // Clone an existing database by ID
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: { id: "existing-db-uuid" }
 * });
 *
 * @example
 * // Clone an existing database by name
 * const clonedDb = await D1Database("cloned-db", {
 *   name: "cloned-db",
 *   clone: { name: "existing-db-name" }
 * });
 *
 * @see https://developers.cloudflare.com/d1/
 */
export async function D1Database(
  id: string,
  props: Omit<D1DatabaseProps, "migrationsFiles"> = {},
): Promise<D1Database> {
  const [migrationsFiles, importFiles] = await Promise.all([
    props.migrationsDir ? await listSqlFiles(props.migrationsDir) : [],
    props.importFiles
      ? await Promise.all(
          props.importFiles.map((file) =>
            readSqlFile(Scope.current.rootDir, file),
          ),
        )
      : [],
  ]);

  return _D1Database(id, {
    ...props,
    migrationsFiles,
    importFiles,
    dev: {
      ...(props.dev ?? {}),
      // force local migrations to run even if the database was already deployed live
      // this property will oscillate from true to false depending on the dev vs live deployment
      force: Scope.current.local,
    },
  });
}

const _D1Database = Resource(
  "cloudflare::D1Database",
  async function (
    this: Context<D1Database>,
    id: string,
    props: Omit<D1DatabaseProps, "importFiles"> & {
      migrationsFiles: D1SqlFile[] | undefined;
      importFiles: D1SqlFile[] | undefined;
    },
  ): Promise<D1Database> {
    const databaseName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const jurisdiction = props.jurisdiction ?? "default";

    if (this.phase === "update" && this.output?.name !== databaseName) {
      this.replace();
    }

    const local = this.scope.local && !props.dev?.remote;
    const dev = {
      id: this.output?.dev?.id ?? this.output?.id ?? databaseName,
      remote: props.dev?.remote ?? false,
    };
    const adopt = props.adopt ?? this.scope.adopt;

    if (local) {
      if (props.migrationsFiles?.length || props.importFiles?.length) {
        await applyLocalD1Migrations({
          databaseId: dev.id,
          migrationsTable: props.migrationsTable ?? DEFAULT_MIGRATIONS_TABLE,
          migrations: props.migrationsFiles ?? [],
          imports: props.importFiles ?? [],
          rootDir: this.scope.rootDir,
        });
      }
      return {
        type: "d1",
        id: this.output?.id ?? "",
        name: databaseName,
        readReplication: props.readReplication,
        primaryLocationHint: props.primaryLocationHint,
        migrationsDir: props.migrationsDir,
        migrationsTable: props.migrationsTable ?? DEFAULT_MIGRATIONS_TABLE,
        dev,
        jurisdiction,
      };
    }

    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      if (this.output.dev?.id) {
        await deleteMiniflareBinding(this.scope, "d1", this.output.dev.id);
      }
      if (props.delete !== false && this.output?.id) {
        await deleteDatabase(api, this.output.id);
      }
      // Return void (a deleted database has no content)
      return this.destroy();
    }
    let dbData: D1ResponseObject;

    if (
      this.phase === "create" ||
      // this is true IFF the database was created locally before any live deployment
      // in that case, we should still go through the create flow for "update"
      // after that, the ID will remain the UUID for the lifetime of the database
      !this.output?.id
    ) {
      try {
        dbData = await createDatabase(api, databaseName, props);

        // If clone property is provided, perform cloning after database creation
        if (props.clone && dbData.uuid) {
          await cloneDb(api, props.clone, dbData.uuid);
        }
      } catch (error) {
        // Check if this is a "database already exists" error and adopt is enabled
        if (
          adopt &&
          error instanceof CloudflareApiError &&
          error.message.includes("already exists")
        ) {
          logger.log(`Database ${databaseName} already exists, adopting it`);
          // Find the existing database by name
          const databases = await listDatabases(api, databaseName);
          const existingDb = databases.find((db) => db.name === databaseName);

          if (!existingDb) {
            throw new Error(
              `Failed to find existing database '${databaseName}' for adoption`,
            );
          }

          // Get the database details using its ID
          dbData = await getDatabase(api, existingDb.uuid);

          // Update the database with the provided properties
          if (props.readReplication) {
            dbData = await updateReadReplicationMode(
              api,
              existingDb.uuid,
              props.readReplication?.mode,
            );
          }
        } else {
          // Re-throw the error if adopt is false or it's not a "database already exists" error
          throw error;
        }
      }
    } else if (this.output?.id) {
      // Only read_replication can be modified in update
      if (
        props.primaryLocationHint &&
        props.primaryLocationHint !== this.output?.primaryLocationHint
      ) {
        throw new Error(
          `Cannot update primaryLocationHint from '${this.output.primaryLocationHint}' to '${props.primaryLocationHint}' after database creation.`,
        );
      }
      if (
        (props.jurisdiction ?? "default") !==
        (this.output?.jurisdiction ?? "default")
      ) {
        throw new Error(
          `Cannot update jurisdiction from '${this.output.jurisdiction}' to '${props.jurisdiction}' after database creation.`,
        );
      }
      // Update the database with new properties
      dbData = await updateReadReplicationMode(
        api,
        this.output.id,
        props.readReplication?.mode ?? "disabled", // disabled seems to be the default
      );
    } else {
      // If no ID exists, fall back to creating a new database
      dbData = await createDatabase(api, databaseName, props);
    }

    // Run migrations if provided
    if (props.migrationsFiles && props.migrationsFiles.length > 0) {
      try {
        const migrationsTable =
          props.migrationsTable || DEFAULT_MIGRATIONS_TABLE;
        await applyMigrations({
          migrationsFiles: props.migrationsFiles,
          migrationsTable,
          accountId: api.accountId,
          databaseId: dbData.uuid,
          api,
        });
      } catch (migrationErr) {
        logger.error("Failed to apply D1 migrations:", migrationErr);
        throw migrationErr;
      }
    }
    if (props.importFiles?.length) {
      await Promise.all(
        props.importFiles.map(async (file) => {
          await importD1Database(api, {
            databaseId: dbData.uuid,
            sqlData: file.sql,
            filename: file.id,
          });
        }),
      );
    }
    return {
      type: "d1",
      id: dbData.uuid,
      name: databaseName,
      readReplication: props.readReplication,
      primaryLocationHint: props.primaryLocationHint,
      dev,
      migrationsDir: props.migrationsDir,
      migrationsTable: props.migrationsTable ?? DEFAULT_MIGRATIONS_TABLE,
      jurisdiction,
    };
  },
);

interface D1ResponseObject {
  uuid: string;
  name: string;
  created_at: string;
  version: string;
  num_tables: number;
  file_size: number;
  running_in_region: "EEUR" | "APAC" | "WNAM" | "ENAM" | "WEUR" | "EEUR" | "OC";
  read_replication: { mode: "auto" | "disabled" };
  jurisdiction: "eu" | "fedramp" | null;
}

/**
 * Create a new D1 database
 */
export async function createDatabase(
  api: CloudflareApi,
  databaseName: string,
  props: Pick<
    D1DatabaseProps,
    "jurisdiction" | "primaryLocationHint" | "readReplication"
  >,
): Promise<D1ResponseObject> {
  // Create new D1 database
  const createPayload: {
    name: string;
    jurisdiction?: "eu" | "fedramp";
    primary_location_hint?:
      | "wnam"
      | "enam"
      | "weur"
      | "eeur"
      | "apac"
      | "oc"
      | (string & {});
  } = {
    name: databaseName,
    jurisdiction:
      props.jurisdiction !== "default" ? props.jurisdiction : undefined,
    primary_location_hint: props.primaryLocationHint,
  };
  const database = await extractCloudflareResult<D1ResponseObject>(
    `create D1 database "${databaseName}"`,
    api.post(`/accounts/${api.accountId}/d1/database`, createPayload),
  );
  if (!database.uuid) {
    // this is included in the spec as optional... why is it optional? we may never know...
    throw new Error("Missing UUID for created database");
  }
  if (props.readReplication?.mode) {
    return await updateReadReplicationMode(
      api,
      database.uuid,
      props.readReplication?.mode,
    );
  }
  return database;
}

/**
 * Get a D1 database
 */
export async function getDatabase(
  api: CloudflareApi,
  databaseId: string,
): Promise<D1ResponseObject> {
  return await extractCloudflareResult<D1ResponseObject>(
    `get D1 database "${databaseId}"`,
    api.get(`/accounts/${api.accountId}/d1/database/${databaseId}`),
  );
}

/**
 * Delete a D1 database
 */
export async function deleteDatabase(
  api: CloudflareApi,
  databaseId: string,
): Promise<void> {
  try {
    await extractCloudflareResult(
      `delete D1 database "${databaseId}"`,
      api.delete(`/accounts/${api.accountId}/d1/database/${databaseId}`),
    );
  } catch (error) {
    if (error instanceof CloudflareApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}

/**
 * List all D1 databases in an account
 */
export async function listDatabases(
  api: CloudflareApi,
  name?: string,
): Promise<D1ResponseObject[]> {
  // Construct query string if name is provided
  const queryParams = name ? `?name=${encodeURIComponent(name)}` : "";

  // TODO(john): handle pagination (wasn't handled originally)
  return await extractCloudflareResult<D1ResponseObject[]>(
    `list D1 databases${name ? ` with name "${name}"` : ""}`,
    api.get(`/accounts/${api.accountId}/d1/database${queryParams}`),
  );
}

/**
 * Update a D1 database
 *
 * Note: According to Cloudflare API, only read_replication.mode can be modified during updates.
 */
export async function updateReadReplicationMode(
  api: CloudflareApi,
  databaseId: string,
  readReplicationMode: "auto" | "disabled",
): Promise<D1ResponseObject> {
  return await extractCloudflareResult<D1ResponseObject>(
    `update read replication mode for D1 database "${databaseId}"`,
    api.patch(`/accounts/${api.accountId}/d1/database/${databaseId}`, {
      read_replication: {
        mode: readReplicationMode,
      },
    }),
  );
}

/**
 * Helper function to clone data from a source database to a target database
 * Resolves the source database ID from different input formats and performs the cloning operation
 *
 * @param api CloudflareApi instance
 * @param sourceDb Source database specification (can be an ID, a name, or a D1Database object)
 * @param targetDbId Target database ID
 */
async function cloneDb(
  api: CloudflareApi,
  sourceDb: D1Database | { id: string } | { name: string },
  targetDbId: string,
): Promise<void> {
  let sourceId: string;

  // Determine source database ID
  if ("id" in sourceDb && sourceDb.id) {
    // Use provided ID directly
    sourceId = sourceDb.id;
  } else if ("name" in sourceDb && sourceDb.name) {
    // Look up ID by name
    const databases = await listDatabases(api, sourceDb.name);
    const foundDb = databases.find((db) => db.name === sourceDb.name);

    if (!foundDb) {
      throw new Error(
        `Source database with name '${sourceDb.name}' not found for cloning`,
      );
    }

    sourceId = foundDb.uuid;
  } else if ("type" in sourceDb && sourceDb.type === "d1" && "id" in sourceDb) {
    // It's a D1Database object
    sourceId = sourceDb.id;
  } else {
    throw new Error("Invalid clone property: must provide either id or name");
  }

  // Perform the cloning
  logger.log(`Cloning data from database ${sourceId} to ${targetDbId}`);
  await cloneD1Database(api, {
    sourceDatabaseId: sourceId,
    targetDatabaseId: targetDbId,
  });
}
