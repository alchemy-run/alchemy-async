import type { Client, Options as Options2, TDataShape } from "../../util/api/client/index.ts";
import type { CancelBranchChangeRequestData, CancelBranchChangeRequestErrors, CancelBranchChangeRequestResponses, CancelDeployRequestData, CancelDeployRequestErrors, CancelDeployRequestResponses, CloseDeployRequestData, CloseDeployRequestErrors, CloseDeployRequestResponses, CompleteErroredDeployData, CompleteErroredDeployErrors, CompleteErroredDeployResponses, CompleteGatedDeployRequestData, CompleteGatedDeployRequestErrors, CompleteGatedDeployRequestResponses, CompleteRevertData, CompleteRevertErrors, CompleteRevertResponses, CreateBackupData, CreateBackupErrors, CreateBackupResponses, CreateBranchData, CreateBranchErrors, CreateBranchResponses, CreateDatabaseData, CreateDatabaseErrors, CreateDatabaseResponses, CreateDeployRequestData, CreateDeployRequestErrors, CreateDeployRequestResponses, CreateKeyspaceData, CreateKeyspaceErrors, CreateKeyspaceResponses, CreateOauthTokenData, CreateOauthTokenErrors, CreateOauthTokenResponses, CreatePasswordData, CreatePasswordErrors, CreatePasswordResponses, CreateQueryPatternsReportData, CreateQueryPatternsReportErrors, CreateQueryPatternsReportResponses, CreateRoleData, CreateRoleErrors, CreateRoleResponses, CreateWebhookData, CreateWebhookErrors, CreateWebhookResponses, CreateWorkflowData, CreateWorkflowErrors, CreateWorkflowResponses, DeleteBackupData, DeleteBackupErrors, DeleteBackupResponses, DeleteBranchData, DeleteBranchErrors, DeleteBranchResponses, DeleteDatabaseData, DeleteDatabaseErrors, DeleteDatabaseResponses, DeleteKeyspaceData, DeleteKeyspaceErrors, DeleteKeyspaceResponses, DeleteOauthTokenData, DeleteOauthTokenErrors, DeleteOauthTokenResponses, DeletePasswordData, DeletePasswordErrors, DeletePasswordResponses, DeleteQueryPatternsReportData, DeleteQueryPatternsReportErrors, DeleteQueryPatternsReportResponses, DeleteRoleData, DeleteRoleErrors, DeleteRoleResponses, DeleteWebhookData, DeleteWebhookErrors, DeleteWebhookResponses, DemoteBranchData, DemoteBranchErrors, DemoteBranchResponses, DisableSafeMigrationsData, DisableSafeMigrationsErrors, DisableSafeMigrationsResponses, EnableSafeMigrationsData, EnableSafeMigrationsErrors, EnableSafeMigrationsResponses, GetBackupData, GetBackupErrors, GetBackupResponses, GetBranchData, GetBranchErrors, GetBranchResponses, GetBranchSchemaData, GetBranchSchemaErrors, GetBranchSchemaResponses, GetCurrentUserData, GetCurrentUserErrors, GetCurrentUserResponses, GetDatabaseData, GetDatabaseErrors, GetDatabaseResponses, GetDatabaseThrottlerData, GetDatabaseThrottlerErrors, GetDatabaseThrottlerResponses, GetDeploymentData, GetDeploymentErrors, GetDeploymentResponses, GetDeployQueueData, GetDeployQueueErrors, GetDeployQueueResponses, GetDeployRequestData, GetDeployRequestErrors, GetDeployRequestResponses, GetDeployRequestThrottlerData, GetDeployRequestThrottlerErrors, GetDeployRequestThrottlerResponses, GetInvoiceData, GetInvoiceErrors, GetInvoiceLineItemsData, GetInvoiceLineItemsErrors, GetInvoiceLineItemsResponses, GetInvoiceResponses, GetKeyspaceData, GetKeyspaceErrors, GetKeyspaceResponses, GetKeyspaceRolloutStatusData, GetKeyspaceRolloutStatusErrors, GetKeyspaceRolloutStatusResponses, GetKeyspaceVschemaData, GetKeyspaceVschemaErrors, GetKeyspaceVschemaResponses, GetOauthApplicationData, GetOauthApplicationErrors, GetOauthApplicationResponses, GetOauthTokenData, GetOauthTokenErrors, GetOauthTokenResponses, GetOrganizationData, GetOrganizationErrors, GetOrganizationResponses, GetPasswordData, GetPasswordErrors, GetPasswordResponses, GetQueryPatternsReportData, GetQueryPatternsReportErrors, GetQueryPatternsReportStatusData, GetQueryPatternsReportStatusErrors, GetQueryPatternsReportStatusResponses, GetRoleData, GetRoleErrors, GetRoleResponses, GetWebhookData, GetWebhookErrors, GetWebhookResponses, GetWorkflowData, GetWorkflowErrors, GetWorkflowResponses, LintBranchSchemaData, LintBranchSchemaErrors, LintBranchSchemaResponses, ListAuditLogsData, ListAuditLogsErrors, ListAuditLogsResponses, ListBackupsData, ListBackupsErrors, ListBackupsResponses, ListBranchChangeRequestsData, ListBranchChangeRequestsErrors, ListBranchChangeRequestsResponses, ListBranchesData, ListBranchesErrors, ListBranchesResponses, ListDatabaseRegionsData, ListDatabaseRegionsErrors, ListDatabaseRegionsResponses, ListDatabasesData, ListDatabasesErrors, ListDatabasesResponses, ListDeployOperationsData, ListDeployOperationsErrors, ListDeployOperationsResponses, ListDeployRequestReviewsData, ListDeployRequestReviewsErrors, ListDeployRequestReviewsResponses, ListDeployRequestsData, ListDeployRequestsErrors, ListDeployRequestsResponses, ListExtensionsData, ListExtensionsErrors, ListExtensionsResponses, ListGeneratedQueryPatternsReportsData, ListGeneratedQueryPatternsReportsErrors, ListGeneratedQueryPatternsReportsResponses, ListInvoicesData, ListInvoicesErrors, ListInvoicesResponses, ListKeyspaceResizesData, ListKeyspaceResizesErrors, ListKeyspaceResizesResponses, ListKeyspacesData, ListKeyspacesErrors, ListKeyspacesResponses, ListOauthApplicationsData, ListOauthApplicationsErrors, ListOauthApplicationsResponses, ListOauthTokensData, ListOauthTokensErrors, ListOauthTokensResponses, ListOrganizationMembersData, ListOrganizationMembersErrors, ListOrganizationMembersResponses, ListOrganizationsData, ListOrganizationsErrors, ListOrganizationsResponses, ListParametersData, ListParametersErrors, ListParametersResponses, ListPasswordsData, ListPasswordsErrors, ListPasswordsResponses, ListPublicRegionsData, ListPublicRegionsErrors, ListPublicRegionsResponses, ListReadOnlyRegionsData, ListReadOnlyRegionsErrors, ListReadOnlyRegionsResponses, ListRegionsForOrganizationData, ListRegionsForOrganizationErrors, ListRegionsForOrganizationResponses, ListRolesData, ListRolesErrors, ListRolesResponses, ListWebhooksData, ListWebhooksErrors, ListWebhooksResponses, ListWorkflowsData, ListWorkflowsErrors, ListWorkflowsResponses, PromoteBranchData, PromoteBranchErrors, PromoteBranchResponses, QueueDeployRequestData, QueueDeployRequestErrors, QueueDeployRequestResponses, RenewPasswordData, RenewPasswordErrors, RenewPasswordResponses, RenewRoleData, RenewRoleErrors, RenewRoleResponses, ReviewDeployRequestData, ReviewDeployRequestErrors, ReviewDeployRequestResponses, SkipRevertPeriodData, SkipRevertPeriodErrors, SkipRevertPeriodResponses, TestWebhookData, TestWebhookErrors, TestWebhookResponses, UpdateAutoApplyData, UpdateAutoApplyErrors, UpdateAutoApplyResponses, UpdateBackupData, UpdateBackupErrors, UpdateBackupResponses, UpdateBranchChangeRequestData, UpdateBranchChangeRequestErrors, UpdateBranchChangeRequestResponses, UpdateBranchClusterConfigData, UpdateBranchClusterConfigErrors, UpdateBranchClusterConfigResponses, UpdateDatabaseSettingsData, UpdateDatabaseSettingsErrors, UpdateDatabaseSettingsResponses, UpdateDatabaseThrottlerData, UpdateDatabaseThrottlerErrors, UpdateDatabaseThrottlerResponses, UpdateDeployRequestThrottlerData, UpdateDeployRequestThrottlerErrors, UpdateDeployRequestThrottlerResponses, UpdateKeyspaceData, UpdateKeyspaceErrors, UpdateKeyspaceResponses, UpdateKeyspaceVschemaData, UpdateKeyspaceVschemaErrors, UpdateKeyspaceVschemaResponses, UpdateOrganizationData, UpdateOrganizationErrors, UpdateOrganizationResponses, UpdatePasswordData, UpdatePasswordErrors, UpdatePasswordResponses, UpdateRoleData, UpdateRoleErrors, UpdateRoleResponses, UpdateWebhookData, UpdateWebhookErrors, UpdateWebhookResponses, VerifyWorkflowData, VerifyWorkflowErrors, VerifyWorkflowResponses, WorkflowCancelData, WorkflowCancelErrors, WorkflowCancelResponses, WorkflowCompleteData, WorkflowCompleteErrors, WorkflowCompleteResponses, WorkflowCutoverData, WorkflowCutoverErrors, WorkflowCutoverResponses, WorkflowRetryData, WorkflowRetryErrors, WorkflowRetryResponses, WorkflowReverseCutoverData, WorkflowReverseCutoverErrors, WorkflowReverseCutoverResponses, WorkflowReverseTrafficData, WorkflowReverseTrafficErrors, WorkflowReverseTrafficResponses, WorkflowSwitchPrimariesData, WorkflowSwitchPrimariesErrors, WorkflowSwitchPrimariesResponses, WorkflowSwitchReplicasData, WorkflowSwitchReplicasErrors, WorkflowSwitchReplicasResponses } from "./types.gen.ts";
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
export declare class PlanetScaleClient extends _HeyApiClient {
    /**
     * List organizations
     * When using a service token, returns the list of organizations the service token has access to. When using an OAuth token, returns the list of organizations the user has access to.
     * ### Authorization
     * A   OAuth token must have at least one of the following   scopes in order to use this API endpoint:
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | User | `read_organizations` |
     */
    listOrganizations<ThrowOnError extends boolean = true>(options?: Options<ListOrganizationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationsResponses, ListOrganizationsErrors, ThrowOnError, "fields">;
    /**
     * Get an organization
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_organization`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | User | `read_organizations` |
     * | Organization | `read_organization` |
     */
    getOrganization<ThrowOnError extends boolean = true>(options: Options<GetOrganizationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationResponses, GetOrganizationErrors, ThrowOnError, "fields">;
    /**
     * Update an organization
     *
     * ### Authorization
     * A   OAuth token must have at least one of the following   scopes in order to use this API endpoint:
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_organization` |
     */
    updateOrganization<ThrowOnError extends boolean = true>(options: Options<UpdateOrganizationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateOrganizationResponses, UpdateOrganizationErrors, ThrowOnError, "fields">;
    /**
     * List audit logs
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_audit_logs`
     *
     *
     */
    listAuditLogs<ThrowOnError extends boolean = true>(options: Options<ListAuditLogsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListAuditLogsResponses, ListAuditLogsErrors, ThrowOnError, "fields">;
    /**
     * List regions for an organization
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_organization`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | User | `read_organizations` |
     * | Organization | `read_organization` |
     */
    listRegionsForOrganization<ThrowOnError extends boolean = true>(options: Options<ListRegionsForOrganizationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListRegionsForOrganizationResponses, ListRegionsForOrganizationErrors, ThrowOnError, "fields">;
    /**
     * List databases
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`, `delete_database`, `write_database`, `read_branch`, `delete_branch`, `create_branch`, `delete_production_branch`, `connect_branch`, `connect_production_branch`, `delete_branch_password`, `delete_production_branch_password`, `read_deploy_request`, `create_deploy_request`, `approve_deploy_request`, `read_schema_recommendations`, `close_schema_recommendations`, `read_comment`, `create_comment`, `restore_backup`, `restore_production_branch_backup`, `read_backups`, `write_backups`, `delete_backups`, `delete_production_branch_backups`, `write_branch_vschema`, `write_production_branch_vschema`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     */
    listDatabases<ThrowOnError extends boolean = true>(options: Options<ListDatabasesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDatabasesResponses, ListDatabasesErrors, ThrowOnError, "fields">;
    /**
     * Create a database
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `create_databases`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `create_databases` |
     */
    createDatabase<ThrowOnError extends boolean = true>(options: Options<CreateDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateDatabaseResponses, CreateDatabaseErrors, ThrowOnError, "fields">;
    /**
     * List branches
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    listBranches<ThrowOnError extends boolean = true>(options: Options<ListBranchesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListBranchesResponses, ListBranchesErrors, ThrowOnError, "fields">;
    /**
     * Create a branch
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `create_branch`, `restore_production_branch_backup`, `restore_backup`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_branches`, `restore_production_branch_backups`, `restore_backups` |
     * | Database | `write_branches`, `restore_production_branch_backups`, `restore_backups` |
     * | Branch | `restore_backups` |
     */
    createBranch<ThrowOnError extends boolean = true>(options: Options<CreateBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateBranchResponses, CreateBranchErrors, ThrowOnError, "fields">;
    /**
     * List backups
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_backups`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_backups` |
     * | Database | `read_backups` |
     * | Branch | `read_backups` |
     */
    listBackups<ThrowOnError extends boolean = true>(options: Options<ListBackupsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListBackupsResponses, ListBackupsErrors, ThrowOnError, "fields">;
    /**
     * Create a backup
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_backups`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_backups` |
     * | Database | `write_backups` |
     * | Branch | `write_backups` |
     */
    createBackup<ThrowOnError extends boolean = true>(options: Options<CreateBackupData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateBackupResponses, CreateBackupErrors, ThrowOnError, "fields">;
    /**
     * Delete a backup
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_backups`, `delete_production_branch_backups`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `delete_backups`, `delete_production_branch_backups` |
     * | Database | `delete_backups`, `delete_production_branch_backups` |
     * | Branch | `delete_backups` |
     */
    deleteBackup<ThrowOnError extends boolean = true>(options: Options<DeleteBackupData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteBackupResponses, DeleteBackupErrors, ThrowOnError, "fields">;
    /**
     * Get a backup
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_backups`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_backups` |
     * | Database | `read_backups` |
     * | Branch | `read_backups` |
     */
    getBackup<ThrowOnError extends boolean = true>(options: Options<GetBackupData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetBackupResponses, GetBackupErrors, ThrowOnError, "fields">;
    /**
     * Update a backup
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_backups`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_backups` |
     * | Database | `write_backups` |
     * | Branch | `write_backups` |
     */
    updateBackup<ThrowOnError extends boolean = true>(options: Options<UpdateBackupData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateBackupResponses, UpdateBackupErrors, ThrowOnError, "fields">;
    /**
     * Get branch change requests
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    listBranchChangeRequests<ThrowOnError extends boolean = true>(options: Options<ListBranchChangeRequestsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListBranchChangeRequestsResponses, ListBranchChangeRequestsErrors, ThrowOnError, "fields">;
    /**
     * Upsert a change request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    updateBranchChangeRequest<ThrowOnError extends boolean = true>(options: Options<UpdateBranchChangeRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateBranchChangeRequestResponses, UpdateBranchChangeRequestErrors, ThrowOnError, "fields">;
    /**
     * List cluster extensions
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    listExtensions<ThrowOnError extends boolean = true>(options: Options<ListExtensionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListExtensionsResponses, ListExtensionsErrors, ThrowOnError, "fields">;
    /**
     * Get keyspaces
     *
     *
     */
    listKeyspaces<ThrowOnError extends boolean = true>(options: Options<ListKeyspacesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListKeyspacesResponses, ListKeyspacesErrors, ThrowOnError, "fields">;
    /**
     * Create a keyspace
     *
     *
     */
    createKeyspace<ThrowOnError extends boolean = true>(options: Options<CreateKeyspaceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateKeyspaceResponses, CreateKeyspaceErrors, ThrowOnError, "fields">;
    /**
     * Get the VSchema for the keyspace
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     *
     */
    getKeyspaceVschema<ThrowOnError extends boolean = true>(options: Options<GetKeyspaceVschemaData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetKeyspaceVschemaResponses, GetKeyspaceVschemaErrors, ThrowOnError, "fields">;
    /**
     * Update the VSchema for the keyspace
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_production_branch_vschema`, `write_branch_vschema`
     *
     *
     */
    updateKeyspaceVschema<ThrowOnError extends boolean = true>(options: Options<UpdateKeyspaceVschemaData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateKeyspaceVschemaResponses, UpdateKeyspaceVschemaErrors, ThrowOnError, "fields">;
    /**
     * Delete a keyspace
     *
     *
     */
    deleteKeyspace<ThrowOnError extends boolean = true>(options: Options<DeleteKeyspaceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteKeyspaceResponses, DeleteKeyspaceErrors, ThrowOnError, "fields">;
    /**
     * Get a keyspace
     *
     *
     */
    getKeyspace<ThrowOnError extends boolean = true>(options: Options<GetKeyspaceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetKeyspaceResponses, GetKeyspaceErrors, ThrowOnError, "fields">;
    /**
     * Configure keyspace settings
     *
     *
     */
    updateKeyspace<ThrowOnError extends boolean = true>(options: Options<UpdateKeyspaceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateKeyspaceResponses, UpdateKeyspaceErrors, ThrowOnError, "fields">;
    /**
     * Get keyspace rollout status
     *
     *
     */
    getKeyspaceRolloutStatus<ThrowOnError extends boolean = true>(options: Options<GetKeyspaceRolloutStatusData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetKeyspaceRolloutStatusResponses, GetKeyspaceRolloutStatusErrors, ThrowOnError, "fields">;
    /**
     * List cluster parameters
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    listParameters<ThrowOnError extends boolean = true>(options: Options<ListParametersData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListParametersResponses, ListParametersErrors, ThrowOnError, "fields">;
    /**
     * List passwords
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    listPasswords<ThrowOnError extends boolean = true>(options: Options<ListPasswordsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListPasswordsResponses, ListPasswordsErrors, ThrowOnError, "fields">;
    /**
     * Create a password
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    createPassword<ThrowOnError extends boolean = true>(options: Options<CreatePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreatePasswordResponses, CreatePasswordErrors, ThrowOnError, "fields">;
    /**
     * Delete a password
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_production_branch_password`, `delete_branch_password`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    deletePassword<ThrowOnError extends boolean = true>(options: Options<DeletePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeletePasswordResponses, DeletePasswordErrors, ThrowOnError, "fields">;
    /**
     * Get a password
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    getPassword<ThrowOnError extends boolean = true>(options: Options<GetPasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetPasswordResponses, GetPasswordErrors, ThrowOnError, "fields">;
    /**
     * Update a password
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    updatePassword<ThrowOnError extends boolean = true>(options: Options<UpdatePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdatePasswordResponses, UpdatePasswordErrors, ThrowOnError, "fields">;
    /**
     * Renew a password
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    renewPassword<ThrowOnError extends boolean = true>(options: Options<RenewPasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RenewPasswordResponses, RenewPasswordErrors, ThrowOnError, "fields">;
    /**
     * List generated query patterns reports
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    listGeneratedQueryPatternsReports<ThrowOnError extends boolean = true>(options: Options<ListGeneratedQueryPatternsReportsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListGeneratedQueryPatternsReportsResponses, ListGeneratedQueryPatternsReportsErrors, ThrowOnError, "fields">;
    /**
     * Create a new query patterns report
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    createQueryPatternsReport<ThrowOnError extends boolean = true>(options: Options<CreateQueryPatternsReportData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateQueryPatternsReportResponses, CreateQueryPatternsReportErrors, ThrowOnError, "fields">;
    /**
     * Delete a query patterns report
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    deleteQueryPatternsReport<ThrowOnError extends boolean = true>(options: Options<DeleteQueryPatternsReportData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteQueryPatternsReportResponses, DeleteQueryPatternsReportErrors, ThrowOnError, "fields">;
    /**
     * Show the status of a query patterns report
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    getQueryPatternsReportStatus<ThrowOnError extends boolean = true>(options: Options<GetQueryPatternsReportStatusData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetQueryPatternsReportStatusResponses, GetQueryPatternsReportStatusErrors, ThrowOnError, "fields">;
    /**
     * Download a finished query patterns report
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    getQueryPatternsReport<ThrowOnError extends boolean = true>(options: Options<GetQueryPatternsReportData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<unknown, GetQueryPatternsReportErrors, ThrowOnError, "fields">;
    /**
     * Cancel a change request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    cancelBranchChangeRequest<ThrowOnError extends boolean = true>(options: Options<CancelBranchChangeRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CancelBranchChangeRequestResponses, CancelBranchChangeRequestErrors, ThrowOnError, "fields">;
    /**
     * List roles
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    listRoles<ThrowOnError extends boolean = true>(options: Options<ListRolesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListRolesResponses, ListRolesErrors, ThrowOnError, "fields">;
    /**
     * Create role credentials
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `create_production_branch_password`, `create_branch_password`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    createRole<ThrowOnError extends boolean = true>(options: Options<CreateRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateRoleResponses, CreateRoleErrors, ThrowOnError, "fields">;
    /**
     * Delete role credentials
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_production_branch_password`, `delete_branch_password`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    deleteRole<ThrowOnError extends boolean = true>(options: Options<DeleteRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteRoleResponses, DeleteRoleErrors, ThrowOnError, "fields">;
    /**
     * Get a role
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    getRole<ThrowOnError extends boolean = true>(options: Options<GetRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetRoleResponses, GetRoleErrors, ThrowOnError, "fields">;
    /**
     * Update role name
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `create_production_branch_password`, `create_branch_password`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    updateRole<ThrowOnError extends boolean = true>(options: Options<UpdateRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateRoleResponses, UpdateRoleErrors, ThrowOnError, "fields">;
    /**
     * Renew role expiration
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `create_production_branch_password`, `create_branch_password`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `manage_passwords`, `manage_production_branch_passwords` |
     * | Database | `manage_passwords`, `manage_production_branch_passwords` |
     * | Branch | `manage_passwords` |
     */
    renewRole<ThrowOnError extends boolean = true>(options: Options<RenewRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RenewRoleResponses, RenewRoleErrors, ThrowOnError, "fields">;
    /**
     * Delete a branch
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `delete_branches`, `delete_production_branches` |
     * | Database | `delete_branches`, `delete_production_branches` |
     * | Branch | `delete_branch` |
     */
    deleteBranch<ThrowOnError extends boolean = true>(options: Options<DeleteBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteBranchResponses, DeleteBranchErrors, ThrowOnError, "fields">;
    /**
     * Get a branch
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    getBranch<ThrowOnError extends boolean = true>(options: Options<GetBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetBranchResponses, GetBranchErrors, ThrowOnError, "fields">;
    /**
     * Change a branch cluster configuration
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     *
     */
    updateBranchClusterConfig<ThrowOnError extends boolean = true>(options: Options<UpdateBranchClusterConfigData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateBranchClusterConfigResponses, UpdateBranchClusterConfigErrors, ThrowOnError, "fields">;
    /**
     * Demote a branch
     * Demotes a branch from production to development
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `connect_production_branch`, `demote_branches`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `demote_branches` |
     * | Database | `demote_branches` |
     */
    demoteBranch<ThrowOnError extends boolean = true>(options: Options<DemoteBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DemoteBranchResponses, DemoteBranchErrors, ThrowOnError, "fields">;
    /**
     * Promote a branch
     * Promotes a branch from development to production
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `connect_production_branch`, `promote_branches`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `promote_branches` |
     * | Database | `promote_branches` |
     */
    promoteBranch<ThrowOnError extends boolean = true>(options: Options<PromoteBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<PromoteBranchResponses, PromoteBranchErrors, ThrowOnError, "fields">;
    /**
     * Disable safe migrations for a branch
     *
     *
     */
    disableSafeMigrations<ThrowOnError extends boolean = true>(options: Options<DisableSafeMigrationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DisableSafeMigrationsResponses, DisableSafeMigrationsErrors, ThrowOnError, "fields">;
    /**
     * Enable safe migrations for a branch
     *
     *
     */
    enableSafeMigrations<ThrowOnError extends boolean = true>(options: Options<EnableSafeMigrationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<EnableSafeMigrationsResponses, EnableSafeMigrationsErrors, ThrowOnError, "fields">;
    /**
     * Get a branch schema
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    getBranchSchema<ThrowOnError extends boolean = true>(options: Options<GetBranchSchemaData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetBranchSchemaResponses, GetBranchSchemaErrors, ThrowOnError, "fields">;
    /**
     * Lint a branch schema
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_branch`, `delete_branch`, `create_branch`, `connect_production_branch`, `connect_branch`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     * | Branch | `read_branch` |
     */
    lintBranchSchema<ThrowOnError extends boolean = true>(options: Options<LintBranchSchemaData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<LintBranchSchemaResponses, LintBranchSchemaErrors, ThrowOnError, "fields">;
    /**
     * Get the deploy queue
     * The deploy queue returns the current list of deploy requests in the order they will be deployed.
     *
     */
    getDeployQueue<ThrowOnError extends boolean = true>(options: Options<GetDeployQueueData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDeployQueueResponses, GetDeployQueueErrors, ThrowOnError, "fields">;
    /**
     * List deploy requests
     * List deploy requests for a database
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    listDeployRequests<ThrowOnError extends boolean = true>(options: Options<ListDeployRequestsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDeployRequestsResponses, ListDeployRequestsErrors, ThrowOnError, "fields">;
    /**
     * Create a deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_requests`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_deploy_requests` |
     * | Database | `write_deploy_requests` |
     */
    createDeployRequest<ThrowOnError extends boolean = true>(options: Options<CreateDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateDeployRequestResponses, CreateDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Get a deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    getDeployRequest<ThrowOnError extends boolean = true>(options: Options<GetDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDeployRequestResponses, GetDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Close a deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_deploy_requests` |
     * | Database | `write_deploy_requests` |
     */
    closeDeployRequest<ThrowOnError extends boolean = true>(options: Options<CloseDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CloseDeployRequestResponses, CloseDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Complete a gated deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    completeGatedDeployRequest<ThrowOnError extends boolean = true>(options: Options<CompleteGatedDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CompleteGatedDeployRequestResponses, CompleteGatedDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Update auto-apply for deploy request
     * Enables or disabled the auto-apply setting for a deploy request
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    updateAutoApply<ThrowOnError extends boolean = true>(options: Options<UpdateAutoApplyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateAutoApplyResponses, UpdateAutoApplyErrors, ThrowOnError, "fields">;
    /**
     * Cancel a queued deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    cancelDeployRequest<ThrowOnError extends boolean = true>(options: Options<CancelDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CancelDeployRequestResponses, CancelDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Complete an errored deploy
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    completeErroredDeploy<ThrowOnError extends boolean = true>(options: Options<CompleteErroredDeployData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CompleteErroredDeployResponses, CompleteErroredDeployErrors, ThrowOnError, "fields">;
    /**
     * Queue a deploy request
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    queueDeployRequest<ThrowOnError extends boolean = true>(options: Options<QueueDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<QueueDeployRequestResponses, QueueDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Get a deployment
     * Get the deployment for a deploy request
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    getDeployment<ThrowOnError extends boolean = true>(options: Options<GetDeploymentData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDeploymentResponses, GetDeploymentErrors, ThrowOnError, "fields">;
    /**
     * List deploy operations
     * List deploy operations for a deploy request
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    listDeployOperations<ThrowOnError extends boolean = true>(options: Options<ListDeployOperationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDeployOperationsResponses, ListDeployOperationsErrors, ThrowOnError, "fields">;
    /**
     * Complete a revert
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    completeRevert<ThrowOnError extends boolean = true>(options: Options<CompleteRevertData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CompleteRevertResponses, CompleteRevertErrors, ThrowOnError, "fields">;
    /**
     * List deploy request reviews
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    listDeployRequestReviews<ThrowOnError extends boolean = true>(options: Options<ListDeployRequestReviewsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDeployRequestReviewsResponses, ListDeployRequestReviewsErrors, ThrowOnError, "fields">;
    /**
     * Review a deploy request
     * Review a deploy request by either approving or commenting on the deploy request
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `approve_deploy_request`, `review_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `approve_deploy_requests` |
     * | Database | `approve_deploy_requests` |
     */
    reviewDeployRequest<ThrowOnError extends boolean = true>(options: Options<ReviewDeployRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ReviewDeployRequestResponses, ReviewDeployRequestErrors, ThrowOnError, "fields">;
    /**
     * Skip revert period
     * Skips the revert period for a deploy request
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    skipRevertPeriod<ThrowOnError extends boolean = true>(options: Options<SkipRevertPeriodData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<SkipRevertPeriodResponses, SkipRevertPeriodErrors, ThrowOnError, "fields">;
    /**
     * Get deploy request throttler configurations
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_deploy_requests` |
     * | Database | `read_deploy_requests` |
     */
    getDeployRequestThrottler<ThrowOnError extends boolean = true>(options: Options<GetDeployRequestThrottlerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDeployRequestThrottlerResponses, GetDeployRequestThrottlerErrors, ThrowOnError, "fields">;
    /**
     * Update deploy request throttler configurations
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    updateDeployRequestThrottler<ThrowOnError extends boolean = true>(options: Options<UpdateDeployRequestThrottlerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateDeployRequestThrottlerResponses, UpdateDeployRequestThrottlerErrors, ThrowOnError, "fields">;
    /**
     * Get database throttler configurations
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     * | Database | `read_database` |
     */
    getDatabaseThrottler<ThrowOnError extends boolean = true>(options: Options<GetDatabaseThrottlerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDatabaseThrottlerResponses, GetDatabaseThrottlerErrors, ThrowOnError, "fields">;
    /**
     * Update database throttler configurations
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_deploy_request`, `create_deploy_request`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `deploy_deploy_requests` |
     * | Database | `deploy_deploy_requests` |
     */
    updateDatabaseThrottler<ThrowOnError extends boolean = true>(options: Options<UpdateDatabaseThrottlerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateDatabaseThrottlerResponses, UpdateDatabaseThrottlerErrors, ThrowOnError, "fields">;
    /**
     * List webhooks
     * List webhooks for a database
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     * | Database | `read_database` |
     */
    listWebhooks<ThrowOnError extends boolean = true>(options: Options<ListWebhooksData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListWebhooksResponses, ListWebhooksErrors, ThrowOnError, "fields">;
    /**
     * Create a webhook
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    createWebhook<ThrowOnError extends boolean = true>(options: Options<CreateWebhookData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateWebhookResponses, CreateWebhookErrors, ThrowOnError, "fields">;
    /**
     * Delete a webhook
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    deleteWebhook<ThrowOnError extends boolean = true>(options: Options<DeleteWebhookData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteWebhookResponses, DeleteWebhookErrors, ThrowOnError, "fields">;
    /**
     * Get a webhook
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     * | Database | `read_database` |
     */
    getWebhook<ThrowOnError extends boolean = true>(options: Options<GetWebhookData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetWebhookResponses, GetWebhookErrors, ThrowOnError, "fields">;
    /**
     * Update a webhook
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    updateWebhook<ThrowOnError extends boolean = true>(options: Options<UpdateWebhookData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateWebhookResponses, UpdateWebhookErrors, ThrowOnError, "fields">;
    /**
     * Test a webhook
     * Sends a test event to the webhook
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    testWebhook<ThrowOnError extends boolean = true>(options: Options<TestWebhookData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<TestWebhookResponses, TestWebhookErrors, ThrowOnError, "fields">;
    /**
     * List workflows
     *
     *
     */
    listWorkflows<ThrowOnError extends boolean = true>(options: Options<ListWorkflowsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListWorkflowsResponses, ListWorkflowsErrors, ThrowOnError, "fields">;
    /**
     * Create a workflow
     *
     *
     */
    createWorkflow<ThrowOnError extends boolean = true>(options: Options<CreateWorkflowData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateWorkflowResponses, CreateWorkflowErrors, ThrowOnError, "fields">;
    /**
     * Cancel a workflow
     *
     *
     */
    workflowCancel<ThrowOnError extends boolean = true>(options: Options<WorkflowCancelData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowCancelResponses, WorkflowCancelErrors, ThrowOnError, "fields">;
    /**
     * Get a workflow
     *
     *
     */
    getWorkflow<ThrowOnError extends boolean = true>(options: Options<GetWorkflowData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetWorkflowResponses, GetWorkflowErrors, ThrowOnError, "fields">;
    /**
     * Complete a workflow
     *
     *
     */
    workflowComplete<ThrowOnError extends boolean = true>(options: Options<WorkflowCompleteData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowCompleteResponses, WorkflowCompleteErrors, ThrowOnError, "fields">;
    /**
     * Cutover traffic
     *
     *
     */
    workflowCutover<ThrowOnError extends boolean = true>(options: Options<WorkflowCutoverData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowCutoverResponses, WorkflowCutoverErrors, ThrowOnError, "fields">;
    /**
     * Retry a failed workflow
     *
     *
     */
    workflowRetry<ThrowOnError extends boolean = true>(options: Options<WorkflowRetryData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowRetryResponses, WorkflowRetryErrors, ThrowOnError, "fields">;
    /**
     * Reverse traffic cutover
     *
     *
     */
    workflowReverseCutover<ThrowOnError extends boolean = true>(options: Options<WorkflowReverseCutoverData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowReverseCutoverResponses, WorkflowReverseCutoverErrors, ThrowOnError, "fields">;
    /**
     * Reverse traffic
     *
     *
     */
    workflowReverseTraffic<ThrowOnError extends boolean = true>(options: Options<WorkflowReverseTrafficData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowReverseTrafficResponses, WorkflowReverseTrafficErrors, ThrowOnError, "fields">;
    /**
     * Switch primary traffic
     *
     *
     */
    workflowSwitchPrimaries<ThrowOnError extends boolean = true>(options: Options<WorkflowSwitchPrimariesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowSwitchPrimariesResponses, WorkflowSwitchPrimariesErrors, ThrowOnError, "fields">;
    /**
     * Switch replica traffic
     *
     *
     */
    workflowSwitchReplicas<ThrowOnError extends boolean = true>(options: Options<WorkflowSwitchReplicasData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<WorkflowSwitchReplicasResponses, WorkflowSwitchReplicasErrors, ThrowOnError, "fields">;
    /**
     * Verify workflow data
     *
     *
     */
    verifyWorkflow<ThrowOnError extends boolean = true>(options: Options<VerifyWorkflowData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<VerifyWorkflowResponses, VerifyWorkflowErrors, ThrowOnError, "fields">;
    /**
     * Delete a database
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `delete_databases` |
     * | Database | `delete_database` |
     */
    deleteDatabase<ThrowOnError extends boolean = true>(options: Options<DeleteDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteDatabaseResponses, DeleteDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Get a database
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`, `delete_database`, `write_database`, `read_branch`, `delete_branch`, `create_branch`, `delete_production_branch`, `connect_branch`, `connect_production_branch`, `delete_branch_password`, `delete_production_branch_password`, `read_deploy_request`, `create_deploy_request`, `approve_deploy_request`, `read_schema_recommendations`, `close_schema_recommendations`, `read_comment`, `create_comment`, `restore_backup`, `restore_production_branch_backup`, `read_backups`, `write_backups`, `delete_backups`, `delete_production_branch_backups`, `write_branch_vschema`, `write_production_branch_vschema`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     * | Database | `read_database` |
     */
    getDatabase<ThrowOnError extends boolean = true>(options: Options<GetDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetDatabaseResponses, GetDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Update database settings
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_database`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `write_databases` |
     * | Database | `write_database` |
     */
    updateDatabaseSettings<ThrowOnError extends boolean = true>(options: Options<UpdateDatabaseSettingsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateDatabaseSettingsResponses, UpdateDatabaseSettingsErrors, ThrowOnError, "fields">;
    /**
     * List read-only regions
     * List read-only regions for the database's default branch
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`, `delete_database`, `write_database`, `read_branch`, `delete_branch`, `create_branch`, `delete_production_branch`, `connect_branch`, `connect_production_branch`, `delete_branch_password`, `delete_production_branch_password`, `read_deploy_request`, `create_deploy_request`, `approve_deploy_request`, `read_schema_recommendations`, `close_schema_recommendations`, `read_comment`, `create_comment`, `restore_backup`, `restore_production_branch_backup`, `read_backups`, `write_backups`, `delete_backups`, `delete_production_branch_backups`, `write_branch_vschema`, `write_production_branch_vschema`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_branches` |
     * | Database | `read_branches` |
     */
    listReadOnlyRegions<ThrowOnError extends boolean = true>(options: Options<ListReadOnlyRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListReadOnlyRegionsResponses, ListReadOnlyRegionsErrors, ThrowOnError, "fields">;
    /**
     * List database regions
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_database`, `delete_database`, `write_database`, `read_branch`, `delete_branch`, `create_branch`, `delete_production_branch`, `connect_branch`, `connect_production_branch`, `delete_branch_password`, `delete_production_branch_password`, `read_deploy_request`, `create_deploy_request`, `approve_deploy_request`, `read_schema_recommendations`, `close_schema_recommendations`, `read_comment`, `create_comment`, `restore_backup`, `restore_production_branch_backup`, `read_backups`, `write_backups`, `delete_backups`, `delete_production_branch_backups`, `write_branch_vschema`, `write_production_branch_vschema`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_databases` |
     * | Database | `read_database` |
     */
    listDatabaseRegions<ThrowOnError extends boolean = true>(options: Options<ListDatabaseRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListDatabaseRegionsResponses, ListDatabaseRegionsErrors, ThrowOnError, "fields">;
    /**
     * Get invoices
     * Get the invoices for an organization
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_invoices`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_invoices` |
     */
    listInvoices<ThrowOnError extends boolean = true>(options: Options<ListInvoicesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListInvoicesResponses, ListInvoicesErrors, ThrowOnError, "fields">;
    /**
     * Get an invoice
     *
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_invoices`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_invoices` |
     */
    getInvoice<ThrowOnError extends boolean = true>(options: Options<GetInvoiceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetInvoiceResponses, GetInvoiceErrors, ThrowOnError, "fields">;
    /**
     * Get invoice line items
     * Get the line items for an invoice
     * ### Authorization
     * A service token or OAuth token must have at least one of the following access or scopes in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_invoices`
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | Organization | `read_invoices` |
     */
    getInvoiceLineItems<ThrowOnError extends boolean = true>(options: Options<GetInvoiceLineItemsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetInvoiceLineItemsResponses, GetInvoiceLineItemsErrors, ThrowOnError, "fields">;
    /**
     * List organization members
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_organization`
     *
     *
     */
    listOrganizationMembers<ThrowOnError extends boolean = true>(options: Options<ListOrganizationMembersData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationMembersResponses, ListOrganizationMembersErrors, ThrowOnError, "fields">;
    /**
     * List OAuth applications
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_oauth_applications`
     *
     *
     */
    listOauthApplications<ThrowOnError extends boolean = true>(options: Options<ListOauthApplicationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOauthApplicationsResponses, ListOauthApplicationsErrors, ThrowOnError, "fields">;
    /**
     * Get an OAuth application
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_oauth_applications`
     *
     *
     */
    getOauthApplication<ThrowOnError extends boolean = true>(options: Options<GetOauthApplicationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOauthApplicationResponses, GetOauthApplicationErrors, ThrowOnError, "fields">;
    /**
     * List OAuth tokens
     * List OAuth tokens created by an OAuth application
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_oauth_tokens`
     *
     *
     */
    listOauthTokens<ThrowOnError extends boolean = true>(options: Options<ListOauthTokensData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOauthTokensResponses, ListOauthTokensErrors, ThrowOnError, "fields">;
    /**
     * Delete an OAuth token
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `delete_oauth_tokens`
     *
     *
     */
    deleteOauthToken<ThrowOnError extends boolean = true>(options: Options<DeleteOauthTokenData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteOauthTokenResponses, DeleteOauthTokenErrors, ThrowOnError, "fields">;
    /**
     * Get an OAuth token
     *
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `read_oauth_tokens`
     *
     *
     */
    getOauthToken<ThrowOnError extends boolean = true>(options: Options<GetOauthTokenData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOauthTokenResponses, GetOauthTokenErrors, ThrowOnError, "fields">;
    /**
     * Create or renew an OAuth token
     * Create an OAuth token from an authorization grant code, or refresh an OAuth token from a refresh token
     * ### Authorization
     * A service token   must have at least one of the following access   in order to use this API endpoint:
     *
     * **Service Token Accesses**
     * `write_oauth_tokens`
     *
     *
     */
    createOauthToken<ThrowOnError extends boolean = true>(options: Options<CreateOauthTokenData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateOauthTokenResponses, CreateOauthTokenErrors, ThrowOnError, "fields">;
    /**
     * List public regions
     * Endpoint is available without authentication.
     *
     */
    listPublicRegions<ThrowOnError extends boolean = true>(options?: Options<ListPublicRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListPublicRegionsResponses, ListPublicRegionsErrors, ThrowOnError, "fields">;
    /**
     * Get current user
     * Get the user associated with this service token
     * ### Authorization
     * A   OAuth token must have at least one of the following   scopes in order to use this API endpoint:
     *
     * **OAuth Scopes**
     *
     * | Resource | Scopes |
     * | :------- | :---------- |
     * | User | `read_user` |
     */
    getCurrentUser<ThrowOnError extends boolean = true>(options?: Options<GetCurrentUserData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetCurrentUserResponses, GetCurrentUserErrors, ThrowOnError, "fields">;
    /**
     * List keyspace resizes
     */
    listKeyspaceResizes<ThrowOnError extends boolean = true>(options: Options<ListKeyspaceResizesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListKeyspaceResizesResponses, ListKeyspaceResizesErrors, ThrowOnError, "fields">;
}
export {};
//# sourceMappingURL=sdk.gen.d.ts.map