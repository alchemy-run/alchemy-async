export interface D1LocalMigrationOptions {
    rootDir: string;
    databaseId: string;
    migrationsTable: string;
    migrations: {
        id: string;
        sql: string;
    }[];
}
export declare const applyLocalD1Migrations: (options: D1LocalMigrationOptions) => Promise<void>;
//# sourceMappingURL=d1-local-migrations.d.ts.map