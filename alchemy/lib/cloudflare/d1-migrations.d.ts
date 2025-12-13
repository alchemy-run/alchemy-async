import type { CloudflareApi } from "./api.ts";
export interface D1MigrationOptions {
    migrationsFiles: Array<{
        id: string;
        sql: string;
    }>;
    migrationsTable: string;
    accountId: string;
    databaseId: string;
    api: CloudflareApi;
    quiet?: boolean;
}
/**
 * Reads migration SQL files from the migrationsDir, sorted by filename.
 * @param migrationsDir Directory containing .sql migration files
 */
export declare function listMigrationsFiles(migrationsDir: string): Promise<Array<{
    id: string;
    sql: string;
}>>;
/**
 * Ensures the migrations table exists in the D1 database with wrangler-compatible schema.
 * Handles migration from legacy 2-column schema to 3-column schema if needed.
 */
export declare function ensureMigrationsTable(options: D1MigrationOptions): Promise<void>;
/**
 * Gets the list of applied migration names from the migrations table.
 * Uses the 'name' column which contains the migration filename.
 */
export declare function getAppliedMigrations(options: D1MigrationOptions): Promise<Set<string>>;
/**
 * Executes a SQL statement against the D1 database using the HTTP API.
 */
export declare function executeD1SQL(options: D1MigrationOptions, sql: string): Promise<{
    result: [
        {
            results: Array<unknown>;
            success: boolean;
            meta: any;
        }
    ];
    errors: Array<any>;
    messages: Array<any>;
    success: boolean;
}>;
/**
 * Applies all pending migrations from the provided files to the D1 database.
 * Uses wrangler-compatible 3-column schema (id, name, applied_at).
 */
export declare function applyMigrations(options: D1MigrationOptions): Promise<void>;
//# sourceMappingURL=d1-migrations.d.ts.map