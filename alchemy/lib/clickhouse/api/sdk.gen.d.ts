import type { Client, Options as Options2, TDataShape } from "../../util/api/client/index.ts";
import type { CreateByocInfrastructureData, CreateByocInfrastructureErrors, CreateByocInfrastructureResponses, CreateClickPipeData, CreateClickPipeErrors, CreateClickPipeResponses, CreateInvitationData, CreateInvitationErrors, CreateInvitationResponses, CreateKeyData, CreateKeyErrors, CreateKeyResponses, CreateNewServiceData, CreateNewServiceErrors, CreateNewServiceResponses, CreatePrivateEndpointData, CreatePrivateEndpointErrors, CreatePrivateEndpointResponses, CreateReversePrivateEndpointData, CreateReversePrivateEndpointErrors, CreateReversePrivateEndpointResponses, DeleteClickPipeData, DeleteClickPipeErrors, DeleteClickPipeResponses, DeleteKeyData, DeleteKeyErrors, DeleteKeyResponses, DeleteOrganizationInvitationData, DeleteOrganizationInvitationErrors, DeleteOrganizationInvitationResponses, DeleteReversePrivateEndpointData, DeleteReversePrivateEndpointErrors, DeleteReversePrivateEndpointResponses, DeleteServiceData, DeleteServiceErrors, DeleteServiceQueryEndpointForInstanceData, DeleteServiceQueryEndpointForInstanceErrors, DeleteServiceQueryEndpointForInstanceResponses, DeleteServiceResponses, GetBackupDetailsData, GetBackupDetailsErrors, GetBackupDetailsResponses, GetCdcClickPipesScalingData, GetCdcClickPipesScalingErrors, GetCdcClickPipesScalingResponses, GetClickPipeData, GetClickPipeErrors, GetClickPipeResponses, GetClickPipeSettingsData, GetClickPipeSettingsErrors, GetClickPipeSettingsResponses, GetInvitationDetailsData, GetInvitationDetailsErrors, GetInvitationDetailsResponses, GetKeyDetailsData, GetKeyDetailsErrors, GetKeyDetailsResponses, GetMemberDetailsData, GetMemberDetailsErrors, GetMemberDetailsResponses, GetOrganizationDetailsData, GetOrganizationDetailsErrors, GetOrganizationDetailsResponses, GetOrganizationMetricsData, GetOrganizationMetricsErrors, GetOrganizationMetricsResponses, GetOrganizationUsageCostsData, GetOrganizationUsageCostsErrors, GetOrganizationUsageCostsResponses, GetPrivateEndpointConfigurationData, GetPrivateEndpointConfigurationErrors, GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationData, GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationErrors, GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationResponses, GetPrivateEndpointConfigurationResponses, GetReversePrivateEndpointData, GetReversePrivateEndpointErrors, GetReversePrivateEndpointResponses, GetServiceBackupConfigurationData, GetServiceBackupConfigurationErrors, GetServiceBackupConfigurationResponses, GetServiceDetailsData, GetServiceDetailsErrors, GetServiceDetailsResponses, GetServiceMetricsData, GetServiceMetricsErrors, GetServiceMetricsResponses, GetServiceQueryEndpointForInstanceData, GetServiceQueryEndpointForInstanceErrors, GetServiceQueryEndpointForInstanceResponses, ListAllInvitationsData, ListAllInvitationsErrors, ListAllInvitationsResponses, ListAllKeysData, ListAllKeysErrors, ListAllKeysResponses, ListAvailableOrganizationsData, ListAvailableOrganizationsErrors, ListAvailableOrganizationsResponses, ListClickPipesData, ListClickPipesErrors, ListClickPipesResponses, ListOrganizationActivitiesData, ListOrganizationActivitiesErrors, ListOrganizationActivitiesResponses, ListOrganizationMembersData, ListOrganizationMembersErrors, ListOrganizationMembersResponses, ListOrganizationServicesData, ListOrganizationServicesErrors, ListOrganizationServicesResponses, ListReversePrivateEndpointsData, ListReversePrivateEndpointsErrors, ListReversePrivateEndpointsResponses, ListServiceBackupsData, ListServiceBackupsErrors, ListServiceBackupsResponses, OrganizationActivityData, OrganizationActivityErrors, OrganizationActivityResponses, RemoveByocInfrastructureData, RemoveByocInfrastructureErrors, RemoveByocInfrastructureResponses, RemoveOrganizationMemberData, RemoveOrganizationMemberErrors, RemoveOrganizationMemberResponses, ScalingClickPipeData, ScalingClickPipeErrors, ScalingClickPipeResponses, UpdateCdcClickPipesScalingData, UpdateCdcClickPipesScalingErrors, UpdateCdcClickPipesScalingResponses, UpdateClickPipeData, UpdateClickPipeErrors, UpdateClickPipeResponses, UpdateClickPipeSettingsData, UpdateClickPipeSettingsErrors, UpdateClickPipeSettingsResponses, UpdateClickPipeStateData, UpdateClickPipeStateErrors, UpdateClickPipeStateResponses, UpdateKeyData, UpdateKeyErrors, UpdateKeyResponses, UpdateOrganizationDetailsData, UpdateOrganizationDetailsErrors, UpdateOrganizationDetailsResponses, UpdateOrganizationMemberData, UpdateOrganizationMemberErrors, UpdateOrganizationMemberResponses, UpdateServiceAutoScalingSettings2Data, UpdateServiceAutoScalingSettings2Errors, UpdateServiceAutoScalingSettings2Responses, UpdateServiceAutoScalingSettingsData, UpdateServiceAutoScalingSettingsErrors, UpdateServiceAutoScalingSettingsResponses, UpdateServiceBackupConfigurationData, UpdateServiceBackupConfigurationErrors, UpdateServiceBackupConfigurationResponses, UpdateServiceBasicDetailsData, UpdateServiceBasicDetailsErrors, UpdateServiceBasicDetailsResponses, UpdateServicePasswordData, UpdateServicePasswordErrors, UpdateServicePasswordResponses, UpdateServiceStateData, UpdateServiceStateErrors, UpdateServiceStateResponses, UpsertServiceQueryEndpointForInstanceData, UpsertServiceQueryEndpointForInstanceErrors, UpsertServiceQueryEndpointForInstanceResponses } from "./types.gen.ts";
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
export declare class ClickhouseClient extends _HeyApiClient {
    /**
     * Get list of available organizations
     * Returns a list with a single organization associated with the API key in the request.
     */
    listAvailableOrganizations<ThrowOnError extends boolean = true>(options?: Options<ListAvailableOrganizationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListAvailableOrganizationsResponses, ListAvailableOrganizationsErrors, ThrowOnError, "fields">;
    /**
     * Get organization details
     * Returns details of a single organization. In order to get the details, the auth key must belong to the organization.
     */
    getOrganizationDetails<ThrowOnError extends boolean = true>(options: Options<GetOrganizationDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationDetailsResponses, GetOrganizationDetailsErrors, ThrowOnError, "fields">;
    /**
     * Update organization details
     * Updates organization fields. Requires ADMIN auth key role.
     */
    updateOrganizationDetails<ThrowOnError extends boolean = true>(options: Options<UpdateOrganizationDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateOrganizationDetailsResponses, UpdateOrganizationDetailsErrors, ThrowOnError, "fields">;
    /**
     * Get organization metrics
     * Returns prometheus metrics for all services in an organization.
     */
    getOrganizationMetrics<ThrowOnError extends boolean = true>(options: Options<GetOrganizationMetricsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationMetricsResponses, GetOrganizationMetricsErrors, ThrowOnError, "fields">;
    /**
     * List of organization services
     * Returns a list of all services in the organization.
     */
    listOrganizationServices<ThrowOnError extends boolean = true>(options: Options<ListOrganizationServicesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationServicesResponses, ListOrganizationServicesErrors, ThrowOnError, "fields">;
    /**
     * Create new service
     * Creates a new service in the organization, and returns the current service state and a password to access the service. The service is started asynchronously.
     */
    createNewService<ThrowOnError extends boolean = true>(options: Options<CreateNewServiceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateNewServiceResponses, CreateNewServiceErrors, ThrowOnError, "fields">;
    /**
     * Delete service
     * Deletes the service. The service must be in stopped state and is deleted asynchronously after this method call.
     */
    deleteService<ThrowOnError extends boolean = true>(options: Options<DeleteServiceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteServiceResponses, DeleteServiceErrors, ThrowOnError, "fields">;
    /**
     * Get service details
     * Returns a service that belongs to the organization
     */
    getServiceDetails<ThrowOnError extends boolean = true>(options: Options<GetServiceDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetServiceDetailsResponses, GetServiceDetailsErrors, ThrowOnError, "fields">;
    /**
     * Update service basic details
     * Updates basic service details like service name or IP access list.
     */
    updateServiceBasicDetails<ThrowOnError extends boolean = true>(options: Options<UpdateServiceBasicDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServiceBasicDetailsResponses, UpdateServiceBasicDetailsErrors, ThrowOnError, "fields">;
    /**
     * Get private endpoint configuration
     * Information required to set up a private endpoint
     */
    getPrivateEndpointConfiguration<ThrowOnError extends boolean = true>(options: Options<GetPrivateEndpointConfigurationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetPrivateEndpointConfigurationResponses, GetPrivateEndpointConfigurationErrors, ThrowOnError, "fields">;
    /**
     * Delete the service query endpoint for a given instance
     * This is an experimental feature. Please contact support to enable it.
     */
    deleteServiceQueryEndpointForInstance<ThrowOnError extends boolean = true>(options: Options<DeleteServiceQueryEndpointForInstanceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteServiceQueryEndpointForInstanceResponses, DeleteServiceQueryEndpointForInstanceErrors, ThrowOnError, "fields">;
    /**
     * Get the service query endpoint for a given instance
     * This is an experimental feature. Please contact support to enable it.
     */
    getServiceQueryEndpointForInstance<ThrowOnError extends boolean = true>(options: Options<GetServiceQueryEndpointForInstanceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetServiceQueryEndpointForInstanceResponses, GetServiceQueryEndpointForInstanceErrors, ThrowOnError, "fields">;
    /**
     * Upsert the service query endpoint for a given instance
     * This is an experimental feature. Please contact support to enable it.
     */
    upsertServiceQueryEndpointForInstance<ThrowOnError extends boolean = true>(options: Options<UpsertServiceQueryEndpointForInstanceData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpsertServiceQueryEndpointForInstanceResponses, UpsertServiceQueryEndpointForInstanceErrors, ThrowOnError, "fields">;
    /**
     * Update service state
     * Starts or stop service
     */
    updateServiceState<ThrowOnError extends boolean = true>(options: Options<UpdateServiceStateData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServiceStateResponses, UpdateServiceStateErrors, ThrowOnError, "fields">;
    /**
     * Update service auto scaling settings
     * Updates minimum and maximum total memory limits and idle mode scaling behavior for the service. The memory settings are available only for "production" services and must be a multiple of 12 starting from 24GB. Please contact support to enable adjustment of numReplicas.
     * @deprecated
     */
    updateServiceAutoScalingSettings<ThrowOnError extends boolean = true>(options: Options<UpdateServiceAutoScalingSettingsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServiceAutoScalingSettingsResponses, UpdateServiceAutoScalingSettingsErrors, ThrowOnError, "fields">;
    /**
     * Update service auto scaling settings
     * Updates minimum and maximum memory limits per replica and idle mode scaling behavior for the service. The memory settings are available only for "production" services and must be a multiple of 4 starting from 8GB. Please contact support to enable adjustment of numReplicas.
     */
    updateServiceAutoScalingSettings2<ThrowOnError extends boolean = true>(options: Options<UpdateServiceAutoScalingSettings2Data, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServiceAutoScalingSettings2Responses, UpdateServiceAutoScalingSettings2Errors, ThrowOnError, "fields">;
    /**
     * Update service password
     * Sets a new password for the service
     */
    updateServicePassword<ThrowOnError extends boolean = true>(options: Options<UpdateServicePasswordData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServicePasswordResponses, UpdateServicePasswordErrors, ThrowOnError, "fields">;
    /**
     * Create a private endpoint
     * Create a new private endpoint. The private endpoint will be associated with this service and organization
     */
    createPrivateEndpoint<ThrowOnError extends boolean = true>(options: Options<CreatePrivateEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreatePrivateEndpointResponses, CreatePrivateEndpointErrors, ThrowOnError, "fields">;
    /**
     * Get service metrics
     * Returns prometheus metrics for a service.
     */
    getServiceMetrics<ThrowOnError extends boolean = true>(options: Options<GetServiceMetricsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetServiceMetricsResponses, GetServiceMetricsErrors, ThrowOnError, "fields">;
    /**
     * List of service backups
     * Returns a list of all backups for the service. The most recent backups comes first in the list.
     */
    listServiceBackups<ThrowOnError extends boolean = true>(options: Options<ListServiceBackupsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListServiceBackupsResponses, ListServiceBackupsErrors, ThrowOnError, "fields">;
    /**
     * Get backup details
     * Returns a single backup info.
     */
    getBackupDetails<ThrowOnError extends boolean = true>(options: Options<GetBackupDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetBackupDetailsResponses, GetBackupDetailsErrors, ThrowOnError, "fields">;
    /**
     * Get service backup configuration
     * Returns the service backup configuration.
     */
    getServiceBackupConfiguration<ThrowOnError extends boolean = true>(options: Options<GetServiceBackupConfigurationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetServiceBackupConfigurationResponses, GetServiceBackupConfigurationErrors, ThrowOnError, "fields">;
    /**
     * Update service backup configuration
     * Updates service backup configuration. Requires ADMIN auth key role. Setting the properties with null value, will reset the properties to theirs default values.
     */
    updateServiceBackupConfiguration<ThrowOnError extends boolean = true>(options: Options<UpdateServiceBackupConfigurationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateServiceBackupConfigurationResponses, UpdateServiceBackupConfigurationErrors, ThrowOnError, "fields">;
    /**
     * Get list of all keys
     * Returns a list of all keys in the organization.
     */
    listAllKeys<ThrowOnError extends boolean = true>(options: Options<ListAllKeysData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListAllKeysResponses, ListAllKeysErrors, ThrowOnError, "fields">;
    /**
     * Create key
     * Creates new API key.
     */
    createKey<ThrowOnError extends boolean = true>(options: Options<CreateKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateKeyResponses, CreateKeyErrors, ThrowOnError, "fields">;
    /**
     * Delete key
     * Deletes API key. Only a key not used to authenticate the active request can be deleted.
     */
    deleteKey<ThrowOnError extends boolean = true>(options: Options<DeleteKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteKeyResponses, DeleteKeyErrors, ThrowOnError, "fields">;
    /**
     * Get key details
     * Returns a single key details.
     */
    getKeyDetails<ThrowOnError extends boolean = true>(options: Options<GetKeyDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetKeyDetailsResponses, GetKeyDetailsErrors, ThrowOnError, "fields">;
    /**
     * Update key
     * Updates API key properties.
     */
    updateKey<ThrowOnError extends boolean = true>(options: Options<UpdateKeyData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateKeyResponses, UpdateKeyErrors, ThrowOnError, "fields">;
    /**
     * List organization members
     * Returns a list of all members in the organization.
     */
    listOrganizationMembers<ThrowOnError extends boolean = true>(options: Options<ListOrganizationMembersData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationMembersResponses, ListOrganizationMembersErrors, ThrowOnError, "fields">;
    /**
     * Remove an organization member
     * Removes a user from the organization
     */
    removeOrganizationMember<ThrowOnError extends boolean = true>(options: Options<RemoveOrganizationMemberData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RemoveOrganizationMemberResponses, RemoveOrganizationMemberErrors, ThrowOnError, "fields">;
    /**
     * Get member details
     * Returns a single organization member details.
     */
    getMemberDetails<ThrowOnError extends boolean = true>(options: Options<GetMemberDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetMemberDetailsResponses, GetMemberDetailsErrors, ThrowOnError, "fields">;
    /**
     * Update organization member
     * Updates organization member role.
     */
    updateOrganizationMember<ThrowOnError extends boolean = true>(options: Options<UpdateOrganizationMemberData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateOrganizationMemberResponses, UpdateOrganizationMemberErrors, ThrowOnError, "fields">;
    /**
     * List all invitations
     * Returns list of all organization invitations.
     */
    listAllInvitations<ThrowOnError extends boolean = true>(options: Options<ListAllInvitationsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListAllInvitationsResponses, ListAllInvitationsErrors, ThrowOnError, "fields">;
    /**
     * Create an invitation
     * Creates organization invitation.
     */
    createInvitation<ThrowOnError extends boolean = true>(options: Options<CreateInvitationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateInvitationResponses, CreateInvitationErrors, ThrowOnError, "fields">;
    /**
     * Delete organization invitation
     * Deletes a single organization invitation.
     */
    deleteOrganizationInvitation<ThrowOnError extends boolean = true>(options: Options<DeleteOrganizationInvitationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteOrganizationInvitationResponses, DeleteOrganizationInvitationErrors, ThrowOnError, "fields">;
    /**
     * Get invitation details
     * Returns details for a single organization invitation.
     */
    getInvitationDetails<ThrowOnError extends boolean = true>(options: Options<GetInvitationDetailsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetInvitationDetailsResponses, GetInvitationDetailsErrors, ThrowOnError, "fields">;
    /**
     * List of organization activities
     * Returns a list of all organization activities.
     */
    listOrganizationActivities<ThrowOnError extends boolean = true>(options: Options<ListOrganizationActivitiesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListOrganizationActivitiesResponses, ListOrganizationActivitiesErrors, ThrowOnError, "fields">;
    /**
     * Organization activity
     * Returns a single organization activity by ID.
     */
    organizationActivity<ThrowOnError extends boolean = true>(options: Options<OrganizationActivityData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<OrganizationActivityResponses, OrganizationActivityErrors, ThrowOnError, "fields">;
    /**
     * Get organization usage costs
     * Returns a grand total and a list of daily, per-entity organization usage cost records for the organization in the queried time period (maximum 31 days). All days in both the request and the response are evaluated based on the UTC timezone.
     */
    getOrganizationUsageCosts<ThrowOnError extends boolean = true>(options: Options<GetOrganizationUsageCostsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetOrganizationUsageCostsResponses, GetOrganizationUsageCostsErrors, ThrowOnError, "fields">;
    /**
     * List ClickPipes
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Returns a list of ClickPipes.
     */
    listClickPipes<ThrowOnError extends boolean = true>(options: Options<ListClickPipesData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListClickPipesResponses, ListClickPipesErrors, ThrowOnError, "fields">;
    /**
     * Create ClickPipe
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Create a new ClickPipe.
     */
    createClickPipe<ThrowOnError extends boolean = true>(options: Options<CreateClickPipeData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateClickPipeResponses, CreateClickPipeErrors, ThrowOnError, "fields">;
    /**
     * Delete ClickPipe
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Delete the specified ClickPipe.
     */
    deleteClickPipe<ThrowOnError extends boolean = true>(options: Options<DeleteClickPipeData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteClickPipeResponses, DeleteClickPipeErrors, ThrowOnError, "fields">;
    /**
     * Get ClickPipe
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Returns the specified ClickPipe.
     */
    getClickPipe<ThrowOnError extends boolean = true>(options: Options<GetClickPipeData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetClickPipeResponses, GetClickPipeErrors, ThrowOnError, "fields">;
    /**
     * Update ClickPipe
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Update the specified ClickPipe.
     */
    updateClickPipe<ThrowOnError extends boolean = true>(options: Options<UpdateClickPipeData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateClickPipeResponses, UpdateClickPipeErrors, ThrowOnError, "fields">;
    /**
     * Get ClickPipe settings
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Returns the advanced settings for the specified ClickPipe.
     */
    getClickPipeSettings<ThrowOnError extends boolean = true>(options: Options<GetClickPipeSettingsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetClickPipeSettingsResponses, GetClickPipeSettingsErrors, ThrowOnError, "fields">;
    /**
     * Update ClickPipe settings
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Update the advanced settings for the specified ClickPipe. Send key-value pairs where values can be strings, numbers, or booleans.
     */
    updateClickPipeSettings<ThrowOnError extends boolean = true>(options: Options<UpdateClickPipeSettingsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateClickPipeSettingsResponses, UpdateClickPipeSettingsErrors, ThrowOnError, "fields">;
    /**
     * Scaling ClickPipe
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Change scaling settings for the specified ClickPipe.
     */
    scalingClickPipe<ThrowOnError extends boolean = true>(options: Options<ScalingClickPipeData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ScalingClickPipeResponses, ScalingClickPipeErrors, ThrowOnError, "fields">;
    /**
     * Update ClickPipe state
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Start, stop or resync ClickPipe. Stopping a ClickPipe will stop the ingestion process from any state. Starting is allowed for ClickPipes in the "Stopped" state or with a "Failed" state. Resyncing is only for Postgres pipes and can be done from any state.
     */
    updateClickPipeState<ThrowOnError extends boolean = true>(options: Options<UpdateClickPipeStateData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateClickPipeStateResponses, UpdateClickPipeStateErrors, ThrowOnError, "fields">;
    /**
     * Get CDC ClickPipes scaling
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Get scaling settings for DB ClickPipes.
     *
     * The infrastructure is shared between all DB ClickPipes in the service, both for initial load and CDC. For billing purposes, 2 CPU cores and 8 GB of RAM [correspond](https://clickhouse.com/docs/cloud/manage/billing/overview#clickpipes-for-postgres-cdc) to one compute unit.
     *
     * **This endpoint becomes available once at least one DB ClickPipe was provisioned.**
     */
    getCdcClickPipesScaling<ThrowOnError extends boolean = true>(options: Options<GetCdcClickPipesScalingData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetCdcClickPipesScalingResponses, GetCdcClickPipesScalingErrors, ThrowOnError, "fields">;
    /**
     * Update CDC ClickPipes scaling
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Update scaling settings for DB ClickPipes.
     *
     * The infrastructure is shared between all DB ClickPipes in the service, both for initial load and CDC. Scaling settings may take a few minutes to fully propagate.
     *
     * For billing purposes, 2 CPU cores and 8 GB of RAM [correspond](https://clickhouse.com/docs/cloud/manage/billing/overview#clickpipes-for-postgres-cdc) to one compute unit. If your organization tier changes, DB ClickPipes will be [rescaled](https://clickhouse.com/docs/cloud/manage/billing/overview#compute) appropriately.
     *
     * **This endpoint becomes available once at least one DB ClickPipe was provisioned.**
     */
    updateCdcClickPipesScaling<ThrowOnError extends boolean = true>(options: Options<UpdateCdcClickPipesScalingData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<UpdateCdcClickPipesScalingResponses, UpdateCdcClickPipesScalingErrors, ThrowOnError, "fields">;
    /**
     * Get private endpoint configuration for region within cloud provider for an organization
     * Deprecated. Please follow [documentation](https://clickhouse.com/docs/manage/security/aws-privatelink#add-endpoint-id-to-services-allow-list) for the updated process.
     * @deprecated
     */
    getPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganization<ThrowOnError extends boolean = true>(options: Options<GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationResponses, GetPrivateEndpointConfigurationForRegionWithinCloudProviderForOrganizationErrors, ThrowOnError, "fields">;
    /**
     * Create BYOC Infrastructure
     * Create a new BYOC Infrastructure in the organization. Returns the configuration of the newly created infrastructure
     */
    createByocInfrastructure<ThrowOnError extends boolean = true>(options: Options<CreateByocInfrastructureData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateByocInfrastructureResponses, CreateByocInfrastructureErrors, ThrowOnError, "fields">;
    /**
     * Remove a BYOC infrastructure
     * Removes a BYOC Infrastructure from the organization
     */
    removeByocInfrastructure<ThrowOnError extends boolean = true>(options: Options<RemoveByocInfrastructureData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<RemoveByocInfrastructureResponses, RemoveByocInfrastructureErrors, ThrowOnError, "fields">;
    /**
     * List reverse private endpoints
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Returns a list of reverse private endpoints for the specified service.
     */
    listReversePrivateEndpoints<ThrowOnError extends boolean = true>(options: Options<ListReversePrivateEndpointsData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<ListReversePrivateEndpointsResponses, ListReversePrivateEndpointsErrors, ThrowOnError, "fields">;
    /**
     * Create reverse private endpoint
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Create a new reverse private endpoint.
     */
    createReversePrivateEndpoint<ThrowOnError extends boolean = true>(options: Options<CreateReversePrivateEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<CreateReversePrivateEndpointResponses, CreateReversePrivateEndpointErrors, ThrowOnError, "fields">;
    /**
     * Delete reverse private endpoint
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Delete the reverse private endpoint with the specified ID.
     */
    deleteReversePrivateEndpoint<ThrowOnError extends boolean = true>(options: Options<DeleteReversePrivateEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<DeleteReversePrivateEndpointResponses, DeleteReversePrivateEndpointErrors, ThrowOnError, "fields">;
    /**
     * Get reverse private endpoint
     * **This endpoint is in beta.** API contract is stable, and no breaking changes are expected in the future. <br /><br /> Returns the reverse private endpoint with the specified ID.
     */
    getReversePrivateEndpoint<ThrowOnError extends boolean = true>(options: Options<GetReversePrivateEndpointData, ThrowOnError>): import("../../util/api/client/types.gen.ts").RequestResult<GetReversePrivateEndpointResponses, GetReversePrivateEndpointErrors, ThrowOnError, "fields">;
}
export {};
//# sourceMappingURL=sdk.gen.d.ts.map