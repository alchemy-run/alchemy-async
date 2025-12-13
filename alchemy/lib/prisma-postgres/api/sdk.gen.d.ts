import type { Client, Options as Options2, TDataShape } from "../../util/api/client/index.ts";
import type { CreateDatabaseConnectionStringData, CreateDatabaseConnectionStringErrors, CreateDatabaseConnectionStringResponses, CreateDatabaseData, CreateDatabaseErrors, CreateDatabaseResponses, CreateProjectWithPostgresDatabaseData, CreateProjectWithPostgresDatabaseErrors, CreateProjectWithPostgresDatabaseResponses, DeleteDatabaseConnectionStringData, DeleteDatabaseConnectionStringErrors, DeleteDatabaseConnectionStringResponses, DeleteDatabaseData, DeleteDatabaseErrors, DeleteDatabaseResponses, DeleteProjectData, DeleteProjectErrors, DeleteProjectResponses, GetDatabaseData, GetDatabaseErrors, GetDatabaseResponses, GetDatabaseUsageMetricsData, GetDatabaseUsageMetricsErrors, GetDatabaseUsageMetricsResponses, GetPrismaAccelerateRegionsData, GetPrismaAccelerateRegionsErrors, GetPrismaAccelerateRegionsResponses, GetPrismaPostgresRegionsData, GetPrismaPostgresRegionsErrors, GetPrismaPostgresRegionsResponses, GetProjectData, GetProjectErrors, GetProjectResponses, ListBackupsData, ListBackupsErrors, ListBackupsResponses, ListDatabaseConnectionsData, ListDatabaseConnectionsErrors, ListDatabaseConnectionsResponses, ListDatabasesData, ListDatabasesErrors, ListDatabasesResponses, ListIntegrationsData, ListIntegrationsErrors, ListIntegrationsResponses, ListProjectsData, ListProjectsErrors, ListProjectsResponses, ListWorkspacesData, ListWorkspacesErrors, ListWorkspacesResponses, RevokeIntegrationTokensData, RevokeIntegrationTokensErrors, RevokeIntegrationTokensResponses, TransferProjectData, TransferProjectErrors, TransferProjectResponses } from "./types.gen.ts";
export type Options<TData extends TDataShape = TDataShape, ThrowOnError extends boolean = boolean> = Options2<TData, ThrowOnError> & {
    /**
     * You can provide a client instance returned by `createClient()` instead of
     * individual options. This might be also useful if you want to implement a
     * custom client.
     */
    client?: Client;
    /**
     * You can pass arbitrary values through the `meta` object. This can be
     * used to access values that aren't defined as part of the SDK function.
     */
    meta?: Record<string, unknown>;
};
declare class _HeyApiClient {
    protected _client: Client;
    constructor(args?: {
        client?: Client;
    });
}
export declare class PrismaClient extends _HeyApiClient {
    /**
     * Delete database connection string
     * Deletes the database connection string with the given ID.
     */
    deleteDatabaseConnectionString<ThrowOnError extends boolean = true>(options: Options<DeleteDatabaseConnectionStringData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteDatabaseConnectionStringResponses, DeleteDatabaseConnectionStringErrors, ThrowOnError, "fields">;
    /**
     * Delete database
     * Deletes the database with the given ID.
     */
    deleteDatabase<ThrowOnError extends boolean = true>(options: Options<DeleteDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteDatabaseResponses, DeleteDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Get database
     * Returns the database with the given ID.
     */
    getDatabase<ThrowOnError extends boolean = true>(options: Options<GetDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDatabaseResponses, GetDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Get list of database connections
     * Returns all connections for the given database.
     */
    listDatabaseConnections<ThrowOnError extends boolean = true>(options: Options<ListDatabaseConnectionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDatabaseConnectionsResponses, ListDatabaseConnectionsErrors, ThrowOnError, "fields">;
    /**
     * Create database connection string
     * Creates a new connection string for the given database.
     */
    createDatabaseConnectionString<ThrowOnError extends boolean = true>(options: Options<CreateDatabaseConnectionStringData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateDatabaseConnectionStringResponses, CreateDatabaseConnectionStringErrors, ThrowOnError, "fields">;
    /**
     * Get list of backups
     * Returns backups for the specified database.
     */
    listBackups<ThrowOnError extends boolean = true>(options: Options<ListBackupsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListBackupsResponses, ListBackupsErrors, ThrowOnError, "fields">;
    /**
     * Get database usage metrics
     * Returns usage metrics for the specified database.
     */
    getDatabaseUsageMetrics<ThrowOnError extends boolean = true>(options: Options<GetDatabaseUsageMetricsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDatabaseUsageMetricsResponses, GetDatabaseUsageMetricsErrors, ThrowOnError, "fields">;
    /**
     * Get list of projects
     * Returns the list of projects the token has access to.
     */
    listProjects<ThrowOnError extends boolean = true>(options?: Options<ListProjectsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectsResponses, ListProjectsErrors, ThrowOnError, "fields">;
    /**
     * Create project with a postgres database
     * Creates a new project with a postgres database.
     */
    createProjectWithPostgresDatabase<ThrowOnError extends boolean = true>(options?: Options<CreateProjectWithPostgresDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectWithPostgresDatabaseResponses, CreateProjectWithPostgresDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Delete project
     * Deletes the project with the given ID.
     */
    deleteProject<ThrowOnError extends boolean = true>(options: Options<DeleteProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectResponses, DeleteProjectErrors, ThrowOnError, "fields">;
    /**
     * Get project
     * Returns the project with the given ID.
     */
    getProject<ThrowOnError extends boolean = true>(options: Options<GetProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectResponses, GetProjectErrors, ThrowOnError, "fields">;
    /**
     * Transfer project
     * Transfer the project with the given ID to the new owner's workspace
     */
    transferProject<ThrowOnError extends boolean = true>(options: Options<TransferProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<TransferProjectResponses, TransferProjectErrors, ThrowOnError, "fields">;
    /**
     * Get list of databases
     * Returns databases for the given project.
     */
    listDatabases<ThrowOnError extends boolean = true>(options: Options<ListDatabasesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDatabasesResponses, ListDatabasesErrors, ThrowOnError, "fields">;
    /**
     * Create database
     * Creates a new database for the given project.
     */
    createDatabase<ThrowOnError extends boolean = true>(options: Options<CreateDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateDatabaseResponses, CreateDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Get list of integrations
     * Returns integrations for the given workspace.
     */
    listIntegrations<ThrowOnError extends boolean = true>(options: Options<ListIntegrationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListIntegrationsResponses, ListIntegrationsErrors, ThrowOnError, "fields">;
    /**
     * Revoke integration tokens
     * Revokes the integration tokens with the given client ID.
     */
    revokeIntegrationTokens<ThrowOnError extends boolean = true>(options: Options<RevokeIntegrationTokensData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RevokeIntegrationTokensResponses, RevokeIntegrationTokensErrors, ThrowOnError, "fields">;
    /**
     * Get Prisma Postgres regions
     * Returns all available regions for Prisma Postgres.
     */
    getPrismaPostgresRegions<ThrowOnError extends boolean = true>(options?: Options<GetPrismaPostgresRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetPrismaPostgresRegionsResponses, GetPrismaPostgresRegionsErrors, ThrowOnError, "fields">;
    /**
     * Get Prisma Accelerate regions
     * Returns all available regions for Prisma Accelerate.
     */
    getPrismaAccelerateRegions<ThrowOnError extends boolean = true>(options?: Options<GetPrismaAccelerateRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetPrismaAccelerateRegionsResponses, GetPrismaAccelerateRegionsErrors, ThrowOnError, "fields">;
    /**
     * Get list of workspaces
     * Returns the list of workspaces the current token can access.
     */
    listWorkspaces<ThrowOnError extends boolean = true>(options?: Options<ListWorkspacesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListWorkspacesResponses, ListWorkspacesErrors, ThrowOnError, "fields">;
}
export {};
//# sourceMappingURL=sdk.gen.d.ts.map