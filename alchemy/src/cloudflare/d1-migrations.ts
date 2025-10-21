import { glob } from "glob";
import * as fs from "node:fs/promises";
import path from "pathe";
import { logger } from "../util/logger.ts";
import { handleApiError } from "./api-error.ts";
import type { CloudflareApi } from "./api.ts";

export interface D1MigrationOptions {
  migrationsFiles: Array<{ id: string; sql: string }>;
  migrationsTable: string;
  accountId: string;
  databaseId: string;
  api: CloudflareApi;
  quiet?: boolean;
}

const getPrefix = (name: string) => {
  const prefix = name.split("_")[0];
  const num = Number.parseInt(prefix, 10);
  return Number.isNaN(num) ? null : num;
};

async function readMigrationFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf-8");
}

/**
 * Detects the current schema of the migration table.
 * Returns info about the table structure to determine if migration is needed.
 */
async function detectMigrationTableSchema(
  options: D1MigrationOptions,
): Promise<{
  exists: boolean;
  hasIdColumn: boolean;
  hasNameColumn: boolean;
  isLegacySchema: boolean;
  columns: Array<{ name: string; type: string; pk: number }>;
}> {
  try {
    // Check if the table exists and get its schema
    const pragmaSQL = `PRAGMA table_info(${options.migrationsTable});`;
    const result = await executeD1SQL(options, pragmaSQL);
    const columns = result?.result[0]?.results || [];

    if (columns.length === 0) {
      return {
        exists: false,
        hasIdColumn: false,
        hasNameColumn: false,
        isLegacySchema: false,
        columns: [],
      };
    }

    const columnNames = columns.map((col: any) => col.name);
    const hasIdColumn = columnNames.includes("id");
    const hasNameColumn = columnNames.includes("name");

    // Legacy schema has only 2 columns and is missing the proper 3-column structure
    // Wrangler needs (id, name, applied_at) - if we don't have both id and name columns, it's legacy
    const isLegacySchema =
      columns.length === 2 && !(hasIdColumn && hasNameColumn);

    return {
      exists: true,
      hasIdColumn,
      hasNameColumn,
      isLegacySchema,
      columns: columns.map((col: any) => ({
        name: col.name,
        type: col.type,
        pk: col.pk,
      })),
    };
  } catch (_error) {
    return {
      exists: false,
      hasIdColumn: false,
      hasNameColumn: false,
      isLegacySchema: false,
      columns: [],
    };
  }
}

/**
 * Migrates a legacy 2-column migration table to the wrangler-compatible 3-column format.
 * Legacy: (id, applied_at) or (name, applied_at)
 * New: (id, name, applied_at) where id is primary key and name is migration filename
 */
async function migrateLegacySchema(
  options: D1MigrationOptions,
  schema: { columns: Array<{ name: string; type: string; pk: number }> },
): Promise<void> {
  if (!options.quiet) {
    logger.log(
      `Migrating legacy migration table ${options.migrationsTable} to wrangler-compatible schema...`,
    );
  }

  // Determine the current primary column name (could be 'id' or something else)
  const primaryColumn =
    schema.columns.find((col) => col.pk === 1)?.name || schema.columns[0]?.name;

  if (!primaryColumn) {
    throw new Error("Cannot migrate legacy migration table: no columns found");
  }

  const tempTableName = `${options.migrationsTable}_temp_migration`;

  try {
    // 1. Create new table with correct schema
    const createNewTableSQL = `CREATE TABLE ${tempTableName} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );`;
    await executeD1SQL(options, createNewTableSQL);

    // 2. Copy data from old table to new table
    // Use row_number() to generate sequential IDs, and use the old primary column value as the name
    const copyDataSQL = `
      INSERT INTO ${tempTableName} (id, name, applied_at)
      SELECT 
        printf('%05d', row_number() OVER (ORDER BY applied_at)) as id,
        ${primaryColumn} as name,
        applied_at
      FROM ${options.migrationsTable}
      ORDER BY applied_at;
    `;
    await executeD1SQL(options, copyDataSQL);

    // 3. Drop old table
    const dropOldTableSQL = `DROP TABLE ${options.migrationsTable};`;
    await executeD1SQL(options, dropOldTableSQL);

    // 4. Rename new table
    const renameTableSQL = `ALTER TABLE ${tempTableName} RENAME TO ${options.migrationsTable};`;
    await executeD1SQL(options, renameTableSQL);

    if (!options.quiet) {
      logger.log(
        "Successfully migrated migration table to wrangler-compatible schema",
      );
    }
  } catch (error) {
    // If migration fails, try to clean up temp table
    try {
      await executeD1SQL(options, `DROP TABLE IF EXISTS ${tempTableName};`);
    } catch {}
    throw new Error(`Failed to migrate legacy migration table: ${error}`);
  }
}

/**
 * Reads migration SQL files from the migrationsDir, sorted by filename.
 * @param migrationsDir Directory containing .sql migration files
 */
export async function listMigrationsFiles(
  migrationsDir: string,
): Promise<Array<{ id: string; sql: string }>> {
  const entries = await glob("**/*.sql", {
    cwd: migrationsDir,
  });

  const sqlFiles = entries.sort((a: string, b: string) => {
    const aNum = getPrefix(a);
    const bNum = getPrefix(b);

    if (aNum !== null && bNum !== null) return aNum - bNum;
    if (aNum !== null) return -1;
    if (bNum !== null) return 1;

    return a.localeCompare(b);
  });

  return await Promise.all(
    sqlFiles.map(async (file) => ({
      id: file,
      sql: await readMigrationFile(path.join(migrationsDir, file)),
    })),
  );
}

/**
 * Ensures the migrations table exists in the D1 database with wrangler-compatible schema.
 * Handles migration from legacy 2-column schema to 3-column schema if needed.
 */
export async function ensureMigrationsTable(
  options: D1MigrationOptions,
): Promise<void> {
  const schema = await detectMigrationTableSchema(options);

  // If table doesn't exist, create it with the correct 3-column schema
  if (!schema.exists) {
    const createTableSQL = `CREATE TABLE ${options.migrationsTable} (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );`;
    await executeD1SQL(options, createTableSQL);
    if (!options.quiet) {
      logger.log(
        `Created migration table ${options.migrationsTable} with wrangler-compatible schema`,
      );
    }
    return;
  }

  // If table has legacy schema, migrate it
  if (schema.isLegacySchema) {
    await migrateLegacySchema(options, schema);
    return;
  }

  // If table exists but doesn't have the correct 3-column structure, we need to handle it
  if (!schema.hasIdColumn || !schema.hasNameColumn) {
    if (!options.quiet) {
      logger.log(
        `Migration table ${options.migrationsTable} has incomplete schema - attempting migration...`,
      );
    }
    await migrateLegacySchema(options, schema);
    return;
  }

  // Table already has correct schema
  if (!options.quiet) {
    logger.log(
      `Migration table ${options.migrationsTable} already has correct schema`,
    );
  }
}

/**
 * Gets the list of applied migration names from the migrations table.
 * Uses the 'name' column which contains the migration filename.
 */
export async function getAppliedMigrations(
  options: D1MigrationOptions,
): Promise<Set<string>> {
  const sql = `SELECT name FROM ${options.migrationsTable};`;

  const result = await executeD1SQL(options, sql);

  const migrationNames = (result?.result[0]?.results || []).map(
    (row: any) => row.name,
  );
  return new Set(migrationNames);
}

/**
 * Executes a SQL statement against the D1 database using the HTTP API.
 */
export async function executeD1SQL(
  options: D1MigrationOptions,
  sql: string,
): Promise<{
  result: [
    {
      results: Array<unknown>;
      success: boolean;
      meta: any;
    },
  ];
  errors: Array<any>;
  messages: Array<any>;
  success: boolean;
}> {
  const response = await options.api.post(
    `/accounts/${options.accountId}/d1/database/${options.databaseId}/query`,
    { sql },
  );

  if (!response.ok) {
    await handleApiError(
      response,
      "executing migration SQL",
      "D1 database",
      options.databaseId,
    );
  }

  return response.json();
}

/**
 * Applies all pending migrations from the provided files to the D1 database.
 * Uses wrangler-compatible 3-column schema (id, name, applied_at).
 */
export async function applyMigrations(
  options: D1MigrationOptions,
): Promise<void> {
  await ensureMigrationsTable(options);
  const applied = await getAppliedMigrations(options);

  // Determine the starting point for sequential IDs by querying existing IDs from the database
  const existingIdsResult = await executeD1SQL(
    options,
    `SELECT id FROM ${options.migrationsTable} ORDER BY id;`,
  );

  const existingIds = (existingIdsResult?.result[0]?.results || []).map(
    (row: any) => row.id,
  );

  let maxNumeric = 0;
  for (const id of existingIds) {
    if (/^\d+$/.test(id)) {
      const num = Number.parseInt(id, 10);
      maxNumeric = Math.max(maxNumeric, num);
    }
  }
  let nextSeq = maxNumeric + 1;

  for (const migration of options.migrationsFiles) {
    const migrationName = migration.id;

    if (applied.has(migrationName)) continue;

    // Generate a migration id: prefer sequential zero-padded numeric ids (e.g. 00014)
    // to keep consistency with legacy/imported data. If we cannot produce a numeric id
    // (e.g. existing IDs are not numeric), fall back to a unique timestamp-based ID.
    let migrationId: string;
    if (nextSeq > 0) {
      migrationId = nextSeq.toString().padStart(5, "0");
      nextSeq += 1;
    } else {
      migrationId =
        Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Run and record the migration in a single request.
    // D1 over HTTP doesn't support transactions, so this is the next best thing.
    await executeD1SQL(
      options,
      [
        migration.sql,
        `INSERT INTO ${options.migrationsTable} (id, name, applied_at) VALUES ('${migrationId}', '${migrationName}', datetime('now'));`,
      ].join("\n"),
    );

    if (!options.quiet) {
      logger.log(`Applied migration: ${migrationName}`);
    }
  }
}
