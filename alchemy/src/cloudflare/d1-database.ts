import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { cloneD1Database } from "./d1-clone.ts";
import { applyLocalD1Migrations } from "./d1-local-migrations.ts";
import { applyMigrations, listMigrationsFiles } from "./d1-migrations.ts";
import { deleteMiniflareBinding } from "./miniflare/delete.ts";

const DEFAULT_MIGRATIONS_TABLE = "d1_migrations";

type PrimaryLocationHint =
  | "wnam"
  | "enam"
  | "weur"
  | "eeur"
  | "apac"
  | "auto"
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
   * These files will be generated internally with the D1Database wrapper function when migrationsDir is specified
   *
   * @private
   */
  migrationsFiles?: Array<{ id: string; sql: string }>;

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
  const migrationsFiles = props.migrationsDir
    ? await listMigrationsFiles(props.migrationsDir)
    : [];

  return _D1Database(id, {
    ...props,
    migrationsFiles,
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
    props: D1DatabaseProps = {},
  ): Promise<D1Database> {
    const databaseName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "update" && this.output?.name !== databaseName) {
      this.replace();
    }

    const local = this.scope.local && !props.dev?.remote;
    const dev = {
      id: this.output?.dev?.id ?? this.output?.id ?? id,
      remote: props.dev?.remote ?? false,
    };
    const adopt = props.adopt ?? this.scope.adopt;

    if (local) {
      if (props.migrationsFiles && props.migrationsFiles.length > 0) {
        await applyLocalD1Migrations({
          databaseId: dev.id,
          migrationsTable: props.migrationsTable ?? DEFAULT_MIGRATIONS_TABLE,
          migrations: props.migrationsFiles,
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
    let dbData: CloudflareD1Response;

    if (
      this.phase === "create" ||
      // this is true IFF the database was created locally before any live deployment
      // in that case, we should still go through the create flow for "update"
      // after that, the ID will remain the UUID for the lifetime of the database
      !this.output?.id
    ) {
      logger.log("Creating D1 database:", databaseName);
      try {
        dbData = await createDatabase(api, databaseName, props);

        // Read replication cannot be set during creation, so update it after creation
        if (props.readReplication && dbData.result.uuid) {
          dbData = await updateDatabase(api, dbData.result.uuid, props);
        }

        // If clone property is provided, perform cloning after database creation
        if (props.clone && dbData.result.uuid) {
          await cloneDb(api, props.clone, dbData.result.uuid);
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
          dbData = await getDatabase(api, existingDb.id);

          // Update the database with the provided properties
          if (props.readReplication) {
            logger.log(
              `Updating adopted database ${databaseName} with new properties`,
            );
            dbData = await updateDatabase(api, existingDb.id, props);
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
      logger.log("Updating D1 database:", databaseName);
      // Update the database with new properties
      dbData = await updateDatabase(api, this.output.id, props);
    } else {
      // If no ID exists, fall back to creating a new database
      logger.log(
        "No existing database ID found, creating new D1 database:",
        databaseName,
      );
      dbData = await createDatabase(api, databaseName, props);
    }

    // Run migrations if provided
    if (props.migrationsFiles && props.migrationsFiles.length > 0) {
      try {
        const migrationsTable =
          props.migrationsTable || DEFAULT_MIGRATIONS_TABLE;
        const databaseId = dbData.result.uuid || this.output?.id;

        if (!databaseId) {
          throw new Error("Database ID not found for migrations");
        }

        await applyMigrations({
          migrationsFiles: props.migrationsFiles,
          migrationsTable,
          accountId: api.accountId,
          databaseId,
          api,
        });
      } catch (migrationErr) {
        logger.error("Failed to apply D1 migrations:", migrationErr);
        throw migrationErr;
      }
    }
    if (!dbData.result.uuid) {
      // TODO(sam): why would this ever happen?
      throw new Error("Database ID not found");
    }
    return {
      type: "d1",
      id: dbData.result.uuid!,
      name: databaseName,
      readReplication: dbData.result.read_replication,
      primaryLocationHint: props.primaryLocationHint,
      dev,
      migrationsDir: props.migrationsDir,
      migrationsTable: props.migrationsTable ?? DEFAULT_MIGRATIONS_TABLE,
    };
  },
);

interface CloudflareD1Response {
  result: {
    uuid?: string;
    name: string;
    file_size: number;
    num_tables: number;
    version: string;
    primary_location_hint?: string;
    read_replication?: {
      mode: "auto" | "disabled";
    };
  };
  success: boolean;
  errors: Array<{ code: number; message: string }>;
  messages: string[];
}

/**
 * Create a new D1 database
 */
export async function createDatabase(
  api: CloudflareApi,
  databaseName: string,
  props: D1DatabaseProps,
): Promise<CloudflareD1Response> {
  // Create new D1 database
  const createPayload: any = {
    name: databaseName,
  };

  if (props.primaryLocationHint) {
    createPayload.primary_location_hint = props.primaryLocationHint;
  }

  const createResponse = await api.post(
    `/accounts/${api.accountId}/d1/database`,
    createPayload,
  );

  if (!createResponse.ok) {
    return await handleApiError(
      createResponse,
      "creating",
      "D1 database",
      databaseName,
    );
  }

  return (await createResponse.json()) as CloudflareD1Response;
}

/**
 * Get a D1 database
 */
export async function getDatabase(
  api: CloudflareApi,
  databaseId?: string,
): Promise<CloudflareD1Response> {
  if (!databaseId) {
    throw new Error("Database ID is required");
  }

  const response = await api.get(
    `/accounts/${api.accountId}/d1/database/${databaseId}`,
  );

  if (!response.ok) {
    return await handleApiError(response, "getting", "D1 database", databaseId);
  }

  return (await response.json()) as CloudflareD1Response;
}

/**
 * Delete a D1 database
 */
export async function deleteDatabase(
  api: CloudflareApi,
  databaseId?: string,
): Promise<void> {
  if (!databaseId) {
    logger.log("No database ID provided, skipping delete");
    return;
  }

  // Delete D1 database
  const deleteResponse = await api.delete(
    `/accounts/${api.accountId}/d1/database/${databaseId}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    const errorData: any = await deleteResponse.json().catch(() => ({
      errors: [{ message: deleteResponse.statusText }],
    }));
    throw new CloudflareApiError(
      `Error deleting D1 database '${databaseId}': ${errorData.errors?.[0]?.message || deleteResponse.statusText}`,
      deleteResponse,
    );
  }
}

/**
 * List all D1 databases in an account
 */
export async function listDatabases(
  api: CloudflareApi,
  name?: string,
): Promise<{ name: string; id: string }[]> {
  // Construct query string if name is provided
  const queryParams = name ? `?name=${encodeURIComponent(name)}` : "";

  const response = await api.get(
    `/accounts/${api.accountId}/d1/database${queryParams}`,
  );

  if (!response.ok) {
    throw new CloudflareApiError(
      `Failed to list databases: ${response.statusText}`,
      response,
    );
  }

  const data = (await response.json()) as {
    success: boolean;
    errors?: Array<{ code: number; message: string }>;
    result?: Array<{
      name: string;
      uuid: string;
    }>;
  };

  if (!data.success) {
    const errorMessage = data.errors?.[0]?.message || "Unknown error";
    throw new Error(`Failed to list databases: ${errorMessage}`);
  }

  // Transform API response
  return (data.result || []).map((db) => ({
    name: db.name,
    id: db.uuid,
  }));
}

/**
 * Update a D1 database
 *
 * Note: According to Cloudflare API, only read_replication.mode can be modified during updates.
 */
export async function updateDatabase(
  api: CloudflareApi,
  databaseId: string,
  props: D1DatabaseProps,
): Promise<CloudflareD1Response> {
  const updatePayload: any = {};

  // Only include read_replication in update payload
  if (props.readReplication) {
    updatePayload.read_replication = {
      mode: props.readReplication.mode,
    };
  }

  const updateResponse = await api.patch(
    `/accounts/${api.accountId}/d1/database/${databaseId}`,
    updatePayload,
  );

  if (!updateResponse.ok) {
    return await handleApiError(
      updateResponse,
      "updating",
      "D1 database",
      databaseId,
    );
  }

  return (await updateResponse.json()) as CloudflareD1Response;
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

    sourceId = foundDb.id;
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
