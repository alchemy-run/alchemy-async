import type { Client, Options as Options2, TDataShape } from "../../util/api/client/index.ts";
import type { AcceptProjectTransferRequestData, AcceptProjectTransferRequestErrors, AcceptProjectTransferRequestResponses, AddNeonAuthDomainToRedirectUriWhitelistData, AddNeonAuthDomainToRedirectUriWhitelistErrors, AddNeonAuthDomainToRedirectUriWhitelistResponses, AddNeonAuthOauthProviderData, AddNeonAuthOauthProviderErrors, AddNeonAuthOauthProviderResponses, AddProjectJwksData, AddProjectJwksErrors, AddProjectJwksResponses, AssignOrganizationVpcEndpointData, AssignOrganizationVpcEndpointErrors, AssignOrganizationVpcEndpointResponses, AssignProjectVpcEndpointData, AssignProjectVpcEndpointErrors, AssignProjectVpcEndpointResponses, CountProjectBranchesData, CountProjectBranchesErrors, CountProjectBranchesResponses, CreateApiKeyData, CreateApiKeyErrors, CreateApiKeyResponses, CreateNeonAuthIntegrationData, CreateNeonAuthIntegrationErrors, CreateNeonAuthIntegrationResponses, CreateNeonAuthNewUserData, CreateNeonAuthNewUserErrors, CreateNeonAuthNewUserResponses, CreateNeonAuthProviderSdkKeysData, CreateNeonAuthProviderSdkKeysErrors, CreateNeonAuthProviderSdkKeysResponses, CreateOrganizationInvitationsData, CreateOrganizationInvitationsErrors, CreateOrganizationInvitationsResponses, CreateOrgApiKeyData, CreateOrgApiKeyErrors, CreateOrgApiKeyResponses, CreateProjectBranchData, CreateProjectBranchDataApiData, CreateProjectBranchDataApiErrors, CreateProjectBranchDataApiResponses, CreateProjectBranchDatabaseData, CreateProjectBranchDatabaseErrors, CreateProjectBranchDatabaseResponses, CreateProjectBranchErrors, CreateProjectBranchResponses, CreateProjectBranchRoleData, CreateProjectBranchRoleErrors, CreateProjectBranchRoleResponses, CreateProjectData, CreateProjectEndpointData, CreateProjectEndpointErrors, CreateProjectEndpointResponses, CreateProjectErrors, CreateProjectResponses, CreateProjectTransferRequestData, CreateProjectTransferRequestErrors, CreateProjectTransferRequestResponses, CreateSnapshotData, CreateSnapshotErrors, CreateSnapshotResponses, DeleteNeonAuthDomainFromRedirectUriWhitelistData, DeleteNeonAuthDomainFromRedirectUriWhitelistErrors, DeleteNeonAuthDomainFromRedirectUriWhitelistResponses, DeleteNeonAuthIntegrationData, DeleteNeonAuthIntegrationErrors, DeleteNeonAuthIntegrationResponses, DeleteNeonAuthOauthProviderData, DeleteNeonAuthOauthProviderErrors, DeleteNeonAuthOauthProviderResponses, DeleteNeonAuthUserData, DeleteNeonAuthUserErrors, DeleteNeonAuthUserResponses, DeleteOrganizationVpcEndpointData, DeleteOrganizationVpcEndpointErrors, DeleteOrganizationVpcEndpointResponses, DeleteProjectBranchData, DeleteProjectBranchDataApiData, DeleteProjectBranchDataApiErrors, DeleteProjectBranchDataApiResponses, DeleteProjectBranchDatabaseData, DeleteProjectBranchDatabaseErrors, DeleteProjectBranchDatabaseResponses, DeleteProjectBranchErrors, DeleteProjectBranchResponses, DeleteProjectBranchRoleData, DeleteProjectBranchRoleErrors, DeleteProjectBranchRoleResponses, DeleteProjectData, DeleteProjectEndpointData, DeleteProjectEndpointErrors, DeleteProjectEndpointResponses, DeleteProjectErrors, DeleteProjectJwksData, DeleteProjectJwksErrors, DeleteProjectJwksResponses, DeleteProjectResponses, DeleteProjectVpcEndpointData, DeleteProjectVpcEndpointErrors, DeleteProjectVpcEndpointResponses, DeleteSnapshotData, DeleteSnapshotErrors, DeleteSnapshotResponses, FinalizeRestoreBranchData, FinalizeRestoreBranchErrors, FinalizeRestoreBranchResponses, GetActiveRegionsData, GetActiveRegionsErrors, GetActiveRegionsResponses, GetAuthDetailsData, GetAuthDetailsErrors, GetAuthDetailsResponses, GetAvailablePreloadLibrariesData, GetAvailablePreloadLibrariesErrors, GetAvailablePreloadLibrariesResponses, GetConnectionUriData, GetConnectionUriErrors, GetConnectionUriResponses, GetConsumptionHistoryPerAccountData, GetConsumptionHistoryPerAccountErrors, GetConsumptionHistoryPerAccountResponses, GetConsumptionHistoryPerProjectData, GetConsumptionHistoryPerProjectErrors, GetConsumptionHistoryPerProjectResponses, GetCurrentUserInfoData, GetCurrentUserInfoErrors, GetCurrentUserInfoResponses, GetCurrentUserOrganizationsData, GetCurrentUserOrganizationsErrors, GetCurrentUserOrganizationsResponses, GetNeonAuthEmailServerData, GetNeonAuthEmailServerErrors, GetNeonAuthEmailServerResponses, GetOrganizationData, GetOrganizationErrors, GetOrganizationInvitationsData, GetOrganizationInvitationsErrors, GetOrganizationInvitationsResponses, GetOrganizationMemberData, GetOrganizationMemberErrors, GetOrganizationMemberResponses, GetOrganizationMembersData, GetOrganizationMembersErrors, GetOrganizationMembersResponses, GetOrganizationResponses, GetOrganizationVpcEndpointDetailsData, GetOrganizationVpcEndpointDetailsErrors, GetOrganizationVpcEndpointDetailsResponses, GetProjectBranchData, GetProjectBranchDataApiData, GetProjectBranchDataApiErrors, GetProjectBranchDataApiResponses, GetProjectBranchDatabaseData, GetProjectBranchDatabaseErrors, GetProjectBranchDatabaseResponses, GetProjectBranchErrors, GetProjectBranchResponses, GetProjectBranchRoleData, GetProjectBranchRoleErrors, GetProjectBranchRolePasswordData, GetProjectBranchRolePasswordErrors, GetProjectBranchRolePasswordResponses, GetProjectBranchRoleResponses, GetProjectBranchSchemaComparisonData, GetProjectBranchSchemaComparisonErrors, GetProjectBranchSchemaComparisonResponses, GetProjectBranchSchemaData, GetProjectBranchSchemaErrors, GetProjectBranchSchemaResponses, GetProjectData, GetProjectEndpointData, GetProjectEndpointErrors, GetProjectEndpointResponses, GetProjectErrors, GetProjectJwksData, GetProjectJwksErrors, GetProjectJwksResponses, GetProjectOperationData, GetProjectOperationErrors, GetProjectOperationResponses, GetProjectResponses, GrantPermissionToProjectData, GrantPermissionToProjectErrors, GrantPermissionToProjectResponses, ListApiKeysData, ListApiKeysErrors, ListApiKeysResponses, ListNeonAuthIntegrationsData, ListNeonAuthIntegrationsErrors, ListNeonAuthIntegrationsResponses, ListNeonAuthOauthProvidersData, ListNeonAuthOauthProvidersErrors, ListNeonAuthOauthProvidersResponses, ListNeonAuthRedirectUriWhitelistDomainsData, ListNeonAuthRedirectUriWhitelistDomainsErrors, ListNeonAuthRedirectUriWhitelistDomainsResponses, ListOrganizationVpcEndpointsAllRegionsData, ListOrganizationVpcEndpointsAllRegionsErrors, ListOrganizationVpcEndpointsAllRegionsResponses, ListOrganizationVpcEndpointsData, ListOrganizationVpcEndpointsErrors, ListOrganizationVpcEndpointsResponses, ListOrgApiKeysData, ListOrgApiKeysErrors, ListOrgApiKeysResponses, ListProjectBranchDatabasesData, ListProjectBranchDatabasesErrors, ListProjectBranchDatabasesResponses, ListProjectBranchEndpointsData, ListProjectBranchEndpointsErrors, ListProjectBranchEndpointsResponses, ListProjectBranchesData, ListProjectBranchesErrors, ListProjectBranchesResponses, ListProjectBranchRolesData, ListProjectBranchRolesErrors, ListProjectBranchRolesResponses, ListProjectEndpointsData, ListProjectEndpointsErrors, ListProjectEndpointsResponses, ListProjectOperationsData, ListProjectOperationsErrors, ListProjectOperationsResponses, ListProjectPermissionsData, ListProjectPermissionsErrors, ListProjectPermissionsResponses, ListProjectsData, ListProjectsErrors, ListProjectsResponses, ListProjectVpcEndpointsData, ListProjectVpcEndpointsErrors, ListProjectVpcEndpointsResponses, ListSharedProjectsData, ListSharedProjectsErrors, ListSharedProjectsResponses, ListSnapshotsData, ListSnapshotsErrors, ListSnapshotsResponses, RefreshSchemaCacheDataApiData, RefreshSchemaCacheDataApiErrors, RefreshSchemaCacheDataApiResponses, RemoveOrganizationMemberData, RemoveOrganizationMemberErrors, RemoveOrganizationMemberResponses, ResetProjectBranchRolePasswordData, ResetProjectBranchRolePasswordErrors, ResetProjectBranchRolePasswordResponses, RestartProjectEndpointData, RestartProjectEndpointErrors, RestartProjectEndpointResponses, RestoreProjectBranchData, RestoreProjectBranchErrors, RestoreProjectBranchResponses, RestoreSnapshotData, RestoreSnapshotErrors, RestoreSnapshotResponses, RevokeApiKeyData, RevokeApiKeyErrors, RevokeApiKeyResponses, RevokeOrgApiKeyData, RevokeOrgApiKeyErrors, RevokeOrgApiKeyResponses, RevokePermissionFromProjectData, RevokePermissionFromProjectErrors, RevokePermissionFromProjectResponses, SetDefaultProjectBranchData, SetDefaultProjectBranchErrors, SetDefaultProjectBranchResponses, StartProjectEndpointData, StartProjectEndpointErrors, StartProjectEndpointResponses, SuspendProjectEndpointData, SuspendProjectEndpointErrors, SuspendProjectEndpointResponses, TransferNeonAuthProviderProjectData, TransferNeonAuthProviderProjectErrors, TransferNeonAuthProviderProjectResponses, TransferProjectsFromOrgToOrgData, TransferProjectsFromOrgToOrgErrors, TransferProjectsFromOrgToOrgResponses, TransferProjectsFromUserToOrgData, TransferProjectsFromUserToOrgErrors, TransferProjectsFromUserToOrgResponses, UpdateNeonAuthEmailServerData, UpdateNeonAuthEmailServerErrors, UpdateNeonAuthEmailServerResponses, UpdateNeonAuthOauthProviderData, UpdateNeonAuthOauthProviderErrors, UpdateNeonAuthOauthProviderResponses, UpdateOrganizationMemberData, UpdateOrganizationMemberErrors, UpdateOrganizationMemberResponses, UpdateProjectBranchData, UpdateProjectBranchDatabaseData, UpdateProjectBranchDatabaseErrors, UpdateProjectBranchDatabaseResponses, UpdateProjectBranchErrors, UpdateProjectBranchResponses, UpdateProjectData, UpdateProjectEndpointData, UpdateProjectEndpointErrors, UpdateProjectEndpointResponses, UpdateProjectErrors, UpdateProjectResponses, UpdateSnapshotData, UpdateSnapshotErrors, UpdateSnapshotResponses } from "./types.gen.ts";
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
export declare class NeonClient extends _HeyApiClient {
    /**
     * List API keys
     * Retrieves the API keys for your Neon account.
     * The response does not include API key tokens. A token is only provided when creating an API key.
     * API keys can also be managed in the Neon Console.
     * For more information, see [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    listApiKeys<ThrowOnError extends boolean = true>(options?: Options<ListApiKeysData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListApiKeysResponses, ListApiKeysErrors, ThrowOnError, "fields">;
    /**
     * Create API key
     * Creates an API key.
     * The `key_name` is a user-specified name for the key.
     * This method returns an `id` and `key`. The `key` is a randomly generated, 64-bit token required to access the Neon API.
     * API keys can also be managed in the Neon Console.
     * See [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    createApiKey<ThrowOnError extends boolean = true>(options: Options<CreateApiKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateApiKeyResponses, CreateApiKeyErrors, ThrowOnError, "fields">;
    /**
     * Revoke API key
     * Revokes the specified API key.
     * An API key that is no longer needed can be revoked.
     * This action cannot be reversed.
     * You can obtain `key_id` values by listing the API keys for your Neon account.
     * API keys can also be managed in the Neon Console.
     * See [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    revokeApiKey<ThrowOnError extends boolean = true>(options: Options<RevokeApiKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RevokeApiKeyResponses, RevokeApiKeyErrors, ThrowOnError, "fields">;
    /**
     * Retrieve operation details
     * Retrieves details for the specified operation.
     * An operation is an action performed on a Neon project resource.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain a `operation_id` by listing operations for the project.
     *
     */
    getProjectOperation<ThrowOnError extends boolean = true>(options: Options<GetProjectOperationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectOperationResponses, GetProjectOperationErrors, ThrowOnError, "fields">;
    /**
     * List projects
     * Retrieves a list of projects for an organization.
     * You may need to specify an org_id parameter depending on your API key type.
     * For more information, see [Manage projects](https://neon.tech/docs/manage/projects/).
     *
     */
    listProjects<ThrowOnError extends boolean = true>(options?: Options<ListProjectsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectsResponses, ListProjectsErrors, ThrowOnError, "fields">;
    /**
     * Create project
     * Creates a Neon project within an organization.
     * You may need to specify an org_id parameter depending on your API key type.
     * Plan limits define how many projects you can create.
     * For more information, see [Manage projects](https://neon.tech/docs/manage/projects/).
     *
     * You can specify a region and Postgres version in the request body.
     * Neon currently supports PostgreSQL 14, 15, 16, and 17.
     * For supported regions and `region_id` values, see [Regions](https://neon.tech/docs/introduction/regions/).
     *
     */
    createProject<ThrowOnError extends boolean = true>(options: Options<CreateProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectResponses, CreateProjectErrors, ThrowOnError, "fields">;
    /**
     * List shared projects
     * Retrieves a list of projects shared with your Neon account.
     * For more information, see [Manage projects](https://neon.tech/docs/manage/projects/).
     *
     */
    listSharedProjects<ThrowOnError extends boolean = true>(options?: Options<ListSharedProjectsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListSharedProjectsResponses, ListSharedProjectsErrors, ThrowOnError, "fields">;
    /**
     * Delete project
     * Deletes the specified project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * Deleting a project is a permanent action.
     * Deleting a project also deletes endpoints, branches, databases, and users that belong to the project.
     *
     */
    deleteProject<ThrowOnError extends boolean = true>(options: Options<DeleteProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectResponses, DeleteProjectErrors, ThrowOnError, "fields">;
    /**
     * Retrieve project details
     * Retrieves information about the specified project.
     * You can obtain a `project_id` by listing the projects for an organization.
     *
     */
    getProject<ThrowOnError extends boolean = true>(options: Options<GetProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectResponses, GetProjectErrors, ThrowOnError, "fields">;
    /**
     * Update project
     * Updates the specified project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     *
     */
    updateProject<ThrowOnError extends boolean = true>(options: Options<UpdateProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateProjectResponses, UpdateProjectErrors, ThrowOnError, "fields">;
    /**
     * List operations
     * Retrieves a list of operations for the specified Neon project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * The number of operations returned can be large.
     * To paginate the response, issue an initial request with a `limit` value.
     * Then, add the `cursor` value that was returned in the response to the next request.
     * Operations older than 6 months may be deleted from our systems.
     * If you need more history than that, you should store your own history.
     *
     */
    listProjectOperations<ThrowOnError extends boolean = true>(options: Options<ListProjectOperationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectOperationsResponses, ListProjectOperationsErrors, ThrowOnError, "fields">;
    /**
     * List project access
     * Retrieves details about users who have access to the project, including the permission `id`, the granted-to email address, and the date project access was granted.
     */
    listProjectPermissions<ThrowOnError extends boolean = true>(options: Options<ListProjectPermissionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectPermissionsResponses, ListProjectPermissionsErrors, ThrowOnError, "fields">;
    /**
     * Grant project access
     * Grants project access to the account associated with the specified email address
     */
    grantPermissionToProject<ThrowOnError extends boolean = true>(options: Options<GrantPermissionToProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GrantPermissionToProjectResponses, GrantPermissionToProjectErrors, ThrowOnError, "fields">;
    /**
     * Revoke project access
     * Revokes project access from the user associated with the specified permission `id`. You can retrieve a user's permission `id` by listing project access.
     */
    revokePermissionFromProject<ThrowOnError extends boolean = true>(options: Options<RevokePermissionFromProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RevokePermissionFromProjectResponses, RevokePermissionFromProjectErrors, ThrowOnError, "fields">;
    /**
     * Return available shared preload libraries
     * Return available shared preload libraries
     */
    getAvailablePreloadLibraries<ThrowOnError extends boolean = true>(options: Options<GetAvailablePreloadLibrariesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetAvailablePreloadLibrariesResponses, GetAvailablePreloadLibrariesErrors, ThrowOnError, "fields">;
    /**
     * Create a project transfer request
     * Creates a transfer request for the specified project. A transfer request allows
     * the project to be transferred to another account or organization. The request
     * has an expiration time after which it can no longer be used. To accept/claim
     * the transfer request, the recipient user/organization must call the
     * `/projects/{project_id}/transfer_requests/{request_id}` API endpoint, or visit
     * `https://console.neon.tech/app/claim?p={project_id}&tr={request_id}&ru={redirect_url}`
     * in the Neon Console. The `ru` parameter is optional and can be used to redirect
     * the user after accepting the transfer request. This feature is currently in
     * private preview. Get in touch with us to get access.
     *
     */
    createProjectTransferRequest<ThrowOnError extends boolean = true>(options: Options<CreateProjectTransferRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectTransferRequestResponses, CreateProjectTransferRequestErrors, ThrowOnError, "fields">;
    /**
     * Accept a project transfer request
     * Accepts a transfer request for the specified project, transferring it to the specified organization
     * or user. If org_id is not passed, the project will be transferred to the current user or organization account.
     *
     */
    acceptProjectTransferRequest<ThrowOnError extends boolean = true>(options: Options<AcceptProjectTransferRequestData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AcceptProjectTransferRequestResponses, AcceptProjectTransferRequestErrors, ThrowOnError, "fields">;
    /**
     * List JWKS URLs
     * Returns the JWKS URLs available for verifying JWTs used as the authentication mechanism for the specified project.
     *
     */
    getProjectJwks<ThrowOnError extends boolean = true>(options: Options<GetProjectJwksData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectJwksResponses, GetProjectJwksErrors, ThrowOnError, "fields">;
    /**
     * Add JWKS URL
     * Add a new JWKS URL to a project, such that it can be used for verifying JWTs used as the authentication mechanism for the specified project.
     *
     * The URL must be a valid HTTPS URL that returns a JSON Web Key Set.
     *
     * The `provider_name` field allows you to specify which authentication provider you're using (e.g., Clerk, Auth0, AWS Cognito, etc.).
     *
     * The `branch_id` can be used to specify on which branches the JWKS URL will be accepted. If not specified, then it will work on any branch.
     *
     * The `role_names` can be used to specify for which roles the JWKS URL will be accepted. If not specified, then default roles will be used (authenticator, authenticated and anonymous).
     *
     * The `jwt_audience` can be used to specify which "aud" values should be accepted by Neon in the JWTs that are used for authentication.
     *
     */
    addProjectJwks<ThrowOnError extends boolean = true>(options: Options<AddProjectJwksData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AddProjectJwksResponses, AddProjectJwksErrors, ThrowOnError, "fields">;
    /**
     * Delete JWKS URL
     * Deletes a JWKS URL from the specified project
     */
    deleteProjectJwks<ThrowOnError extends boolean = true>(options: Options<DeleteProjectJwksData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectJwksResponses, DeleteProjectJwksErrors, ThrowOnError, "fields">;
    /**
     * Delete Neon Data API
     * Deletes the Neon Data API for the specified branch.
     * You can obtain the `project_id` and `branch_id` by listing the projects and branches for your Neon account.
     *
     */
    deleteProjectBranchDataApi<ThrowOnError extends boolean = true>(options: Options<DeleteProjectBranchDataApiData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectBranchDataApiResponses, DeleteProjectBranchDataApiErrors, ThrowOnError, "fields">;
    /**
     * Get Neon Data API
     * Retrieves the Neon Data API for the specified branch.
     *
     */
    getProjectBranchDataApi<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchDataApiData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchDataApiResponses, GetProjectBranchDataApiErrors, ThrowOnError, "fields">;
    /**
     * Refresh schema cache
     * Refreshes the schema cache for the Neon Data API in the specified branch.
     * You can obtain the `project_id` and `branch_id` by listing the projects and branches for your Neon account.
     *
     */
    refreshSchemaCacheDataApi<ThrowOnError extends boolean = true>(options: Options<RefreshSchemaCacheDataApiData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RefreshSchemaCacheDataApiResponses, RefreshSchemaCacheDataApiErrors, ThrowOnError, "fields">;
    /**
     * Create Neon Data API
     * Creates a new instance of Neon Data API in the specified branch.
     * You can obtain the `project_id` and `branch_id` by listing the projects and branches for your Neon account.
     *
     */
    createProjectBranchDataApi<ThrowOnError extends boolean = true>(options: Options<CreateProjectBranchDataApiData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectBranchDataApiResponses, CreateProjectBranchDataApiErrors, ThrowOnError, "fields">;
    /**
     * Create Neon Auth integration
     * Creates a project on a third-party authentication provider's platform for use with Neon Auth.
     * Use this endpoint if the frontend integration flow can't be used.
     *
     */
    createNeonAuthIntegration<ThrowOnError extends boolean = true>(options: Options<CreateNeonAuthIntegrationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateNeonAuthIntegrationResponses, CreateNeonAuthIntegrationErrors, ThrowOnError, "fields">;
    /**
     * Delete domain from redirect_uri whitelist
     * Deletes a domain from the redirect_uri whitelist for the specified project.
     *
     */
    deleteNeonAuthDomainFromRedirectUriWhitelist<ThrowOnError extends boolean = true>(options: Options<DeleteNeonAuthDomainFromRedirectUriWhitelistData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteNeonAuthDomainFromRedirectUriWhitelistResponses, DeleteNeonAuthDomainFromRedirectUriWhitelistErrors, ThrowOnError, "fields">;
    /**
     * List domains in redirect_uri whitelist
     * Lists the domains in the redirect_uri whitelist for the specified project.
     *
     */
    listNeonAuthRedirectUriWhitelistDomains<ThrowOnError extends boolean = true>(options: Options<ListNeonAuthRedirectUriWhitelistDomainsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListNeonAuthRedirectUriWhitelistDomainsResponses, ListNeonAuthRedirectUriWhitelistDomainsErrors, ThrowOnError, "fields">;
    /**
     * Add domain to redirect_uri whitelist
     * Adds a domain to the redirect_uri whitelist for the specified project.
     *
     */
    addNeonAuthDomainToRedirectUriWhitelist<ThrowOnError extends boolean = true>(options: Options<AddNeonAuthDomainToRedirectUriWhitelistData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AddNeonAuthDomainToRedirectUriWhitelistResponses, AddNeonAuthDomainToRedirectUriWhitelistErrors, ThrowOnError, "fields">;
    /**
     * Create Auth Provider SDK keys
     * Generates SDK or API Keys for the auth provider. These might be called different things depending
     * on the auth provider you're using, but are generally used for setting up the frontend and backend SDKs.
     *
     */
    createNeonAuthProviderSdkKeys<ThrowOnError extends boolean = true>(options: Options<CreateNeonAuthProviderSdkKeysData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateNeonAuthProviderSdkKeysResponses, CreateNeonAuthProviderSdkKeysErrors, ThrowOnError, "fields">;
    /**
     * Create new auth user
     * Creates a new user in Neon Auth.
     * The user will be created in your neon_auth.users_sync table and automatically propagated to your auth project, whether Neon-managed or provider-owned.
     *
     */
    createNeonAuthNewUser<ThrowOnError extends boolean = true>(options: Options<CreateNeonAuthNewUserData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateNeonAuthNewUserResponses, CreateNeonAuthNewUserErrors, ThrowOnError, "fields">;
    /**
     * Delete auth user
     * Deletes the auth user for the specified project.
     *
     */
    deleteNeonAuthUser<ThrowOnError extends boolean = true>(options: Options<DeleteNeonAuthUserData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteNeonAuthUserResponses, DeleteNeonAuthUserErrors, ThrowOnError, "fields">;
    /**
     * Transfer Neon-managed auth project to your own account
     * Transfer ownership of your Neon-managed auth project to your own auth provider account.
     *
     */
    transferNeonAuthProviderProject<ThrowOnError extends boolean = true>(options: Options<TransferNeonAuthProviderProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<TransferNeonAuthProviderProjectResponses, TransferNeonAuthProviderProjectErrors, ThrowOnError, "fields">;
    /**
     * Lists active integrations with auth providers
     */
    listNeonAuthIntegrations<ThrowOnError extends boolean = true>(options: Options<ListNeonAuthIntegrationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListNeonAuthIntegrationsResponses, ListNeonAuthIntegrationsErrors, ThrowOnError, "fields">;
    /**
     * List OAuth providers
     * Lists the OAuth providers for the specified project.
     *
     */
    listNeonAuthOauthProviders<ThrowOnError extends boolean = true>(options: Options<ListNeonAuthOauthProvidersData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListNeonAuthOauthProvidersResponses, ListNeonAuthOauthProvidersErrors, ThrowOnError, "fields">;
    /**
     * Add a OAuth provider
     * Adds a OAuth provider to the specified project.
     *
     */
    addNeonAuthOauthProvider<ThrowOnError extends boolean = true>(options: Options<AddNeonAuthOauthProviderData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AddNeonAuthOauthProviderResponses, AddNeonAuthOauthProviderErrors, ThrowOnError, "fields">;
    /**
     * Delete OAuth provider
     * Deletes a OAuth provider from the specified project.
     *
     */
    deleteNeonAuthOauthProvider<ThrowOnError extends boolean = true>(options: Options<DeleteNeonAuthOauthProviderData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteNeonAuthOauthProviderResponses, DeleteNeonAuthOauthProviderErrors, ThrowOnError, "fields">;
    /**
     * Update OAuth provider
     * Updates a OAuth provider for the specified project.
     *
     */
    updateNeonAuthOauthProvider<ThrowOnError extends boolean = true>(options: Options<UpdateNeonAuthOauthProviderData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateNeonAuthOauthProviderResponses, UpdateNeonAuthOauthProviderErrors, ThrowOnError, "fields">;
    /**
     * Get email server configuration
     * Gets the email server configuration for the specified project.
     *
     */
    getNeonAuthEmailServer<ThrowOnError extends boolean = true>(options: Options<GetNeonAuthEmailServerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetNeonAuthEmailServerResponses, GetNeonAuthEmailServerErrors, ThrowOnError, "fields">;
    /**
     * Update email server configuration
     * Updates the email server configuration for the specified project.
     *
     */
    updateNeonAuthEmailServer<ThrowOnError extends boolean = true>(options: Options<UpdateNeonAuthEmailServerData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateNeonAuthEmailServerResponses, UpdateNeonAuthEmailServerErrors, ThrowOnError, "fields">;
    /**
     * Delete integration with auth provider
     */
    deleteNeonAuthIntegration<ThrowOnError extends boolean = true>(options: Options<DeleteNeonAuthIntegrationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteNeonAuthIntegrationResponses, DeleteNeonAuthIntegrationErrors, ThrowOnError, "fields">;
    /**
     * Retrieve connection URI
     * Retrieves a connection URI for the specified database.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `database_name` by listing the databases for a branch.
     * You can obtain a `role_name` by listing the roles for a branch.
     *
     */
    getConnectionUri<ThrowOnError extends boolean = true>(options: Options<GetConnectionUriData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetConnectionUriResponses, GetConnectionUriErrors, ThrowOnError, "fields">;
    /**
     * List branches
     * Retrieves a list of branches for the specified project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     *
     * Each Neon project has a root branch named `main`.
     * A `branch_id` value has a `br-` prefix.
     * A project may contain child branches that were branched from `main` or from another branch.
     * A parent branch is identified by the `parent_id` value, which is the `id` of the parent branch.
     * For related information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     */
    listProjectBranches<ThrowOnError extends boolean = true>(options: Options<ListProjectBranchesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectBranchesResponses, ListProjectBranchesErrors, ThrowOnError, "fields">;
    /**
     * Create branch
     * Creates a branch in the specified project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * This method does not require a request body, but you can specify one to create a compute endpoint for the branch or to select a non-default parent branch.
     * By default, the branch is created from the project's default branch with no compute endpoint, and the branch name is auto-generated.
     * To access the branch, you must add an endpoint object. A `read_write` endpoint allows you to perform read and write operations on the branch.
     * Each branch supports one read-write endpoint and multiple read-only endpoints.
     * For related information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     */
    createProjectBranch<ThrowOnError extends boolean = true>(options: Options<CreateProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectBranchResponses, CreateProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Retrieve number of branches
     * Retrieves the total number of branches in the specified project.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     *
     */
    countProjectBranches<ThrowOnError extends boolean = true>(options: Options<CountProjectBranchesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CountProjectBranchesResponses, CountProjectBranchesErrors, ThrowOnError, "fields">;
    /**
     * Delete branch
     * Deletes the specified branch from a project, and places
     * all compute endpoints into an idle state, breaking existing client connections.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain a `branch_id` by listing the project's branches.
     * For related information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     * When a successful response status is received, the compute endpoints are still active,
     * and the branch is not yet deleted from storage.
     * The deletion occurs after all operations finish.
     * You cannot delete a project's root or default branch, and you cannot delete a branch that has a child branch.
     * A project must have at least one branch.
     *
     */
    deleteProjectBranch<ThrowOnError extends boolean = true>(options: Options<DeleteProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectBranchResponses, DeleteProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Retrieve branch details
     * Retrieves information about the specified branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain a `branch_id` by listing the project's branches.
     * A `branch_id` value has a `br-` prefix.
     *
     * Each Neon project is initially created with a root and default branch named `main`.
     * A project can contain one or more branches.
     * A parent branch is identified by a `parent_id` value, which is the `id` of the parent branch.
     * For related information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     */
    getProjectBranch<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchResponses, GetProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Update branch
     * Updates the specified branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For more information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     */
    updateProjectBranch<ThrowOnError extends boolean = true>(options: Options<UpdateProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateProjectBranchResponses, UpdateProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Restore branch
     * Restores a branch to an earlier state in its own or another branch's history
     */
    restoreProjectBranch<ThrowOnError extends boolean = true>(options: Options<RestoreProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RestoreProjectBranchResponses, RestoreProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Retrieve database schema
     * Retrieves the schema from the specified database. The `lsn` and `timestamp` values cannot be specified at the same time. If both are omitted, the database schema is retrieved from database's head.
     */
    getProjectBranchSchema<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchSchemaData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchSchemaResponses, GetProjectBranchSchemaErrors, ThrowOnError, "fields">;
    /**
     * Compare database schema
     * Compares the schema from the specified database with another branch's schema.
     */
    getProjectBranchSchemaComparison<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchSchemaComparisonData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchSchemaComparisonResponses, GetProjectBranchSchemaComparisonErrors, ThrowOnError, "fields">;
    /**
     * Set branch as default
     * Sets the specified branch as the project's default branch.
     * The default designation is automatically removed from the previous default branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For more information, see [Manage branches](https://neon.tech/docs/manage/branches/).
     *
     */
    setDefaultProjectBranch<ThrowOnError extends boolean = true>(options: Options<SetDefaultProjectBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<SetDefaultProjectBranchResponses, SetDefaultProjectBranchErrors, ThrowOnError, "fields">;
    /**
     * Finalize restore
     * Finalize the restore operation for a branch created from a snapshot.
     * This operation updates the branch so it functions as the original branch it replaced.
     * This includes:
     * - Reassigning any computes from the original branch to the restored branch (this will restart the computes)
     * - Renaming the restored branch to the original branch's name
     * - Renaming the original branch so it no longer uses the original name
     *
     * This operation only applies to branches created using the `restoreSnapshot` endpoint with `finalize_restore: false`.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    finalizeRestoreBranch<ThrowOnError extends boolean = true>(options: Options<FinalizeRestoreBranchData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<FinalizeRestoreBranchResponses, FinalizeRestoreBranchErrors, ThrowOnError, "fields">;
    /**
     * List branch endpoints
     * Retrieves a list of compute endpoints for the specified branch.
     * Neon permits only one read-write compute endpoint per branch.
     * A branch can have multiple read-only compute endpoints.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     *
     */
    listProjectBranchEndpoints<ThrowOnError extends boolean = true>(options: Options<ListProjectBranchEndpointsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectBranchEndpointsResponses, ListProjectBranchEndpointsErrors, ThrowOnError, "fields">;
    /**
     * List databases
     * Retrieves a list of databases for the specified branch.
     * A branch can have multiple databases.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For related information, see [Manage databases](https://neon.tech/docs/manage/databases/).
     *
     */
    listProjectBranchDatabases<ThrowOnError extends boolean = true>(options: Options<ListProjectBranchDatabasesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectBranchDatabasesResponses, ListProjectBranchDatabasesErrors, ThrowOnError, "fields">;
    /**
     * Create database
     * Creates a database in the specified branch.
     * A branch can have multiple databases.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For related information, see [Manage databases](https://neon.tech/docs/manage/databases/).
     *
     */
    createProjectBranchDatabase<ThrowOnError extends boolean = true>(options: Options<CreateProjectBranchDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectBranchDatabaseResponses, CreateProjectBranchDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Delete database
     * Deletes the specified database from the branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` and `database_name` by listing the branch's databases.
     * For related information, see [Manage databases](https://neon.tech/docs/manage/databases/).
     *
     */
    deleteProjectBranchDatabase<ThrowOnError extends boolean = true>(options: Options<DeleteProjectBranchDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectBranchDatabaseResponses, DeleteProjectBranchDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Retrieve database details
     * Retrieves information about the specified database.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` and `database_name` by listing the branch's databases.
     * For related information, see [Manage databases](https://neon.tech/docs/manage/databases/).
     *
     */
    getProjectBranchDatabase<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchDatabaseResponses, GetProjectBranchDatabaseErrors, ThrowOnError, "fields">;
    /**
     * Update database
     * Updates the specified database in the branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` and `database_name` by listing the branch's databases.
     * For related information, see [Manage databases](https://neon.tech/docs/manage/databases/).
     *
     */
    updateProjectBranchDatabase<ThrowOnError extends boolean = true>(options: Options<UpdateProjectBranchDatabaseData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateProjectBranchDatabaseResponses, UpdateProjectBranchDatabaseErrors, ThrowOnError, "fields">;
    /**
     * List roles
     * Retrieves a list of Postgres roles from the specified branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     */
    listProjectBranchRoles<ThrowOnError extends boolean = true>(options: Options<ListProjectBranchRolesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectBranchRolesResponses, ListProjectBranchRolesErrors, ThrowOnError, "fields">;
    /**
     * Create role
     * Creates a Postgres role in the specified branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     * Connections established to the active compute endpoint will be dropped.
     * If the compute endpoint is idle, the endpoint becomes active for a short period of time and is suspended afterward.
     *
     */
    createProjectBranchRole<ThrowOnError extends boolean = true>(options: Options<CreateProjectBranchRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectBranchRoleResponses, CreateProjectBranchRoleErrors, ThrowOnError, "fields">;
    /**
     * Delete role
     * Deletes the specified Postgres role from the branch.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * You can obtain the `role_name` by listing the roles for a branch.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     */
    deleteProjectBranchRole<ThrowOnError extends boolean = true>(options: Options<DeleteProjectBranchRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectBranchRoleResponses, DeleteProjectBranchRoleErrors, ThrowOnError, "fields">;
    /**
     * Retrieve role details
     * Retrieves details about the specified role.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * You can obtain the `role_name` by listing the roles for a branch.
     * In Neon, the terms "role" and "user" are synonymous.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     */
    getProjectBranchRole<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchRoleData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchRoleResponses, GetProjectBranchRoleErrors, ThrowOnError, "fields">;
    /**
     * Retrieve role password
     * Retrieves the password for the specified Postgres role, if possible.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * You can obtain the `role_name` by listing the roles for a branch.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     */
    getProjectBranchRolePassword<ThrowOnError extends boolean = true>(options: Options<GetProjectBranchRolePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectBranchRolePasswordResponses, GetProjectBranchRolePasswordErrors, ThrowOnError, "fields">;
    /**
     * Reset role password
     * Resets the password for the specified Postgres role.
     * Returns a new password and operations. The new password is ready to use when the last operation finishes.
     * The old password remains valid until last operation finishes.
     * Connections to the compute endpoint are dropped. If idle,
     * the compute endpoint becomes active for a short period of time.
     *
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain the `branch_id` by listing the project's branches.
     * You can obtain the `role_name` by listing the roles for a branch.
     * For related information, see [Manage roles](https://neon.tech/docs/manage/roles/).
     *
     */
    resetProjectBranchRolePassword<ThrowOnError extends boolean = true>(options: Options<ResetProjectBranchRolePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ResetProjectBranchRolePasswordResponses, ResetProjectBranchRolePasswordErrors, ThrowOnError, "fields">;
    /**
     * List VPC endpoint restrictions
     * Lists VPC endpoint restrictions for the specified Neon project.
     *
     */
    listProjectVpcEndpoints<ThrowOnError extends boolean = true>(options: Options<ListProjectVpcEndpointsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectVpcEndpointsResponses, ListProjectVpcEndpointsErrors, ThrowOnError, "fields">;
    /**
     * Delete VPC endpoint restriction
     * Removes the specified VPC endpoint restriction from a Neon project.
     *
     */
    deleteProjectVpcEndpoint<ThrowOnError extends boolean = true>(options: Options<DeleteProjectVpcEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectVpcEndpointResponses, DeleteProjectVpcEndpointErrors, ThrowOnError, "fields">;
    /**
     * Set VPC endpoint restriction
     * Sets or updates a VPC endpoint restriction for a Neon project.
     * When a VPC endpoint restriction is set, the project only accepts connections
     * from the specified VPC.
     * A VPC endpoint can be set as a restriction only after it is assigned to the
     * parent organization of the Neon project.
     *
     */
    assignProjectVpcEndpoint<ThrowOnError extends boolean = true>(options: Options<AssignProjectVpcEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AssignProjectVpcEndpointResponses, AssignProjectVpcEndpointErrors, ThrowOnError, "fields">;
    /**
     * List compute endpoints
     * Retrieves a list of compute endpoints for the specified project.
     * A compute endpoint is a Neon compute instance.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    listProjectEndpoints<ThrowOnError extends boolean = true>(options: Options<ListProjectEndpointsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListProjectEndpointsResponses, ListProjectEndpointsErrors, ThrowOnError, "fields">;
    /**
     * Create compute endpoint
     * Creates a compute endpoint for the specified branch.
     * An endpoint is a Neon compute instance.
     * There is a maximum of one read-write compute endpoint per branch.
     * If the specified branch already has a read-write compute endpoint, the operation fails.
     * A branch can have multiple read-only compute endpoints.
     *
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain `branch_id` by listing the project's branches.
     * A `branch_id` has a `br-` prefix.
     * For supported regions and `region_id` values, see [Regions](https://neon.tech/docs/introduction/regions/).
     * For more information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    createProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<CreateProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateProjectEndpointResponses, CreateProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Delete compute endpoint
     * Delete the specified compute endpoint.
     * A compute endpoint is a Neon compute instance.
     * Deleting a compute endpoint drops existing network connections to the compute endpoint.
     * The deletion is completed when last operation in the chain finishes successfully.
     *
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    deleteProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<DeleteProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteProjectEndpointResponses, DeleteProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Retrieve compute endpoint details
     * Retrieves information about the specified compute endpoint.
     * A compute endpoint is a Neon compute instance.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    getProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<GetProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetProjectEndpointResponses, GetProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Update compute endpoint
     * Updates the specified compute endpoint.
     *
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` and `branch_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix. A `branch_id` has a `br-` prefix.
     * For more information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     * If the returned list of operations is not empty, the compute endpoint is not ready to use.
     * The client must wait for the last operation to finish before using the compute endpoint.
     * If the compute endpoint was idle before the update, it becomes active for a short period of time,
     * and the control plane suspends it again after the update.
     *
     */
    updateProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<UpdateProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateProjectEndpointResponses, UpdateProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Start compute endpoint
     * Starts a compute endpoint. The compute endpoint is ready to use
     * after the last operation in chain finishes successfully.
     *
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    startProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<StartProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<StartProjectEndpointResponses, StartProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Suspend compute endpoint
     * Suspend the specified compute endpoint
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    suspendProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<SuspendProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<SuspendProjectEndpointResponses, SuspendProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Restart compute endpoint
     * Restart the specified compute endpoint: suspend immediately followed by start operations.
     * You can obtain a `project_id` by listing the projects for your Neon account.
     * You can obtain an `endpoint_id` by listing your project's compute endpoints.
     * An `endpoint_id` has an `ep-` prefix.
     * For information about compute endpoints, see [Manage computes](https://neon.tech/docs/manage/endpoints/).
     *
     */
    restartProjectEndpoint<ThrowOnError extends boolean = true>(options: Options<RestartProjectEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RestartProjectEndpointResponses, RestartProjectEndpointErrors, ThrowOnError, "fields">;
    /**
     * Retrieve account consumption metrics
     * Retrieves consumption metrics for Scale, Business, and Enterprise plan accounts. History begins at the time of upgrade.
     *
     */
    getConsumptionHistoryPerAccount<ThrowOnError extends boolean = true>(options: Options<GetConsumptionHistoryPerAccountData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetConsumptionHistoryPerAccountResponses, GetConsumptionHistoryPerAccountErrors, ThrowOnError, "fields">;
    /**
     * Retrieve project consumption metrics
     * Retrieves consumption metrics for Scale, Business, and Enterprise plan projects. History begins at the time of upgrade.
     * Issuing a call to this API does not wake a project's compute endpoint.
     *
     */
    getConsumptionHistoryPerProject<ThrowOnError extends boolean = true>(options: Options<GetConsumptionHistoryPerProjectData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetConsumptionHistoryPerProjectResponses, GetConsumptionHistoryPerProjectErrors, ThrowOnError, "fields">;
    /**
     * Retrieve organization details
     * Retrieves information about the specified organization.
     *
     */
    getOrganization<ThrowOnError extends boolean = true>(options: Options<GetOrganizationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationResponses, GetOrganizationErrors, ThrowOnError, "fields">;
    /**
     * List organization API keys
     * Retrieves the API keys for the specified organization.
     * The response does not include API key tokens. A token is only provided when creating an API key.
     * API keys can also be managed in the Neon Console.
     * For more information, see [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    listOrgApiKeys<ThrowOnError extends boolean = true>(options: Options<ListOrgApiKeysData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrgApiKeysResponses, ListOrgApiKeysErrors, ThrowOnError, "fields">;
    /**
     * Create organization API key
     * Creates an API key for the specified organization.
     * The `key_name` is a user-specified name for the key.
     * This method returns an `id` and `key`. The `key` is a randomly generated, 64-bit token required to access the Neon API.
     * API keys can also be managed in the Neon Console.
     * See [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    createOrgApiKey<ThrowOnError extends boolean = true>(options: Options<CreateOrgApiKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateOrgApiKeyResponses, CreateOrgApiKeyErrors, ThrowOnError, "fields">;
    /**
     * Revoke organization API key
     * Revokes the specified organization API key.
     * An API key that is no longer needed can be revoked.
     * This action cannot be reversed.
     * You can obtain `key_id` values by listing the API keys for an organization.
     * API keys can also be managed in the Neon Console.
     * See [Manage API keys](https://neon.tech/docs/manage/api-keys/).
     *
     */
    revokeOrgApiKey<ThrowOnError extends boolean = true>(options: Options<RevokeOrgApiKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RevokeOrgApiKeyResponses, RevokeOrgApiKeyErrors, ThrowOnError, "fields">;
    /**
     * Retrieve organization members details
     * Retrieves information about the specified organization members.
     *
     */
    getOrganizationMembers<ThrowOnError extends boolean = true>(options: Options<GetOrganizationMembersData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationMembersResponses, GetOrganizationMembersErrors, ThrowOnError, "fields">;
    /**
     * Remove member from the organization
     * Remove member from the organization.
     * Only an admin of the organization can perform this action.
     * If another admin is being removed, it will not be allows in case it is the only admin left in the organization.
     *
     */
    removeOrganizationMember<ThrowOnError extends boolean = true>(options: Options<RemoveOrganizationMemberData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RemoveOrganizationMemberResponses, RemoveOrganizationMemberErrors, ThrowOnError, "fields">;
    /**
     * Retrieve organization member details
     * Retrieves information about the specified organization member.
     *
     */
    getOrganizationMember<ThrowOnError extends boolean = true>(options: Options<GetOrganizationMemberData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationMemberResponses, GetOrganizationMemberErrors, ThrowOnError, "fields">;
    /**
     * Update role for organization member
     * Only an admin can perform this action.
     *
     */
    updateOrganizationMember<ThrowOnError extends boolean = true>(options: Options<UpdateOrganizationMemberData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateOrganizationMemberResponses, UpdateOrganizationMemberErrors, ThrowOnError, "fields">;
    /**
     * Retrieve organization invitation details
     * Retrieves information about extended invitations for the specified organization
     *
     */
    getOrganizationInvitations<ThrowOnError extends boolean = true>(options: Options<GetOrganizationInvitationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationInvitationsResponses, GetOrganizationInvitationsErrors, ThrowOnError, "fields">;
    /**
     * Create organization invitations
     * Creates invitations for a specific organization.
     * If the invited user has an existing account, they automatically join as a member.
     * If they don't yet have an account, they are invited to create one, after which they become a member.
     * Each invited user receives an email notification.
     *
     */
    createOrganizationInvitations<ThrowOnError extends boolean = true>(options: Options<CreateOrganizationInvitationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateOrganizationInvitationsResponses, CreateOrganizationInvitationsErrors, ThrowOnError, "fields">;
    /**
     * Transfer projects between organizations
     * Transfers selected projects, identified by their IDs, from your organization to another specified organization.
     *
     */
    transferProjectsFromOrgToOrg<ThrowOnError extends boolean = true>(options: Options<TransferProjectsFromOrgToOrgData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<TransferProjectsFromOrgToOrgResponses, TransferProjectsFromOrgToOrgErrors, ThrowOnError, "fields">;
    /**
     * List VPC endpoints across all regions
     * Retrieves the list of VPC endpoints for the specified Neon organization across all regions.
     *
     */
    listOrganizationVpcEndpointsAllRegions<ThrowOnError extends boolean = true>(options: Options<ListOrganizationVpcEndpointsAllRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationVpcEndpointsAllRegionsResponses, ListOrganizationVpcEndpointsAllRegionsErrors, ThrowOnError, "fields">;
    /**
     * List VPC endpoints
     * Retrieves the list of VPC endpoints for the specified Neon organization.
     *
     */
    listOrganizationVpcEndpoints<ThrowOnError extends boolean = true>(options: Options<ListOrganizationVpcEndpointsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationVpcEndpointsResponses, ListOrganizationVpcEndpointsErrors, ThrowOnError, "fields">;
    /**
     * Delete VPC endpoint
     * Deletes the VPC endpoint from the specified Neon organization.
     * If you delete a VPC endpoint from a Neon organization, that VPC endpoint cannot
     * be added back to the Neon organization.
     *
     */
    deleteOrganizationVpcEndpoint<ThrowOnError extends boolean = true>(options: Options<DeleteOrganizationVpcEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteOrganizationVpcEndpointResponses, DeleteOrganizationVpcEndpointErrors, ThrowOnError, "fields">;
    /**
     * Retrieve VPC endpoint details
     * Retrieves the current state and configuration details of a specified VPC endpoint.
     *
     */
    getOrganizationVpcEndpointDetails<ThrowOnError extends boolean = true>(options: Options<GetOrganizationVpcEndpointDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationVpcEndpointDetailsResponses, GetOrganizationVpcEndpointDetailsErrors, ThrowOnError, "fields">;
    /**
     * Assign or update VPC endpoint
     * Assigns a VPC endpoint to a Neon organization or updates its existing assignment.
     *
     */
    assignOrganizationVpcEndpoint<ThrowOnError extends boolean = true>(options: Options<AssignOrganizationVpcEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<AssignOrganizationVpcEndpointResponses, AssignOrganizationVpcEndpointErrors, ThrowOnError, "fields">;
    /**
     * List supported regions
     * Lists supported Neon regions
     *
     */
    getActiveRegions<ThrowOnError extends boolean = true>(options?: Options<GetActiveRegionsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetActiveRegionsResponses, GetActiveRegionsErrors, ThrowOnError, "fields">;
    /**
     * Retrieve current user details
     * Retrieves information about the current Neon user account.
     *
     */
    getCurrentUserInfo<ThrowOnError extends boolean = true>(options?: Options<GetCurrentUserInfoData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetCurrentUserInfoResponses, GetCurrentUserInfoErrors, ThrowOnError, "fields">;
    /**
     * Retrieve current user organizations list
     * Retrieves information about the current Neon user's organizations
     *
     */
    getCurrentUserOrganizations<ThrowOnError extends boolean = true>(options?: Options<GetCurrentUserOrganizationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetCurrentUserOrganizationsResponses, GetCurrentUserOrganizationsErrors, ThrowOnError, "fields">;
    /**
     * Transfer projects from personal account to organization
     * Transfers selected projects, identified by their IDs, from your personal account to a specified organization.
     *
     */
    transferProjectsFromUserToOrg<ThrowOnError extends boolean = true>(options: Options<TransferProjectsFromUserToOrgData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<TransferProjectsFromUserToOrgResponses, TransferProjectsFromUserToOrgErrors, ThrowOnError, "fields">;
    /**
     * Get request authentication details
     * Returns auth information about the passed credentials. It can refer to an API key, Bearer token or OAuth session.
     *
     */
    getAuthDetails<ThrowOnError extends boolean = true>(options?: Options<GetAuthDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetAuthDetailsResponses, GetAuthDetailsErrors, ThrowOnError, "fields">;
    /**
     * Create snapshot
     * Create a snapshot from the specified branch using the provided parameters.
     * This endpoint may initiate an asynchronous operation.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    createSnapshot<ThrowOnError extends boolean = true>(options: Options<CreateSnapshotData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateSnapshotResponses, CreateSnapshotErrors, ThrowOnError, "fields">;
    /**
     * List project snapshots
     * List the snapshots for the specified project.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    listSnapshots<ThrowOnError extends boolean = true>(options: Options<ListSnapshotsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListSnapshotsResponses, ListSnapshotsErrors, ThrowOnError, "fields">;
    /**
     * Delete snapshot
     * Delete the specified snapshot.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    deleteSnapshot<ThrowOnError extends boolean = true>(options: Options<DeleteSnapshotData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteSnapshotResponses, DeleteSnapshotErrors, ThrowOnError, "fields">;
    /**
     * Update snapshot
     * Update the specified snapshot.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    updateSnapshot<ThrowOnError extends boolean = true>(options: Options<UpdateSnapshotData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateSnapshotResponses, UpdateSnapshotErrors, ThrowOnError, "fields">;
    /**
     * Restore snapshot
     * Restore the specified snapshot to a new branch and optionally finalize the restore operation.
     *
     * **Note**: This endpoint is currently in Beta.
     *
     */
    restoreSnapshot<ThrowOnError extends boolean = true>(options: Options<RestoreSnapshotData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RestoreSnapshotResponses, RestoreSnapshotErrors, ThrowOnError, "fields">;
}
export {};
//# sourceMappingURL=sdk.gen.d.ts.map