import type { Context } from "../context.ts";
import { type Secret } from "../secret.ts";
import type { Service as ApiService, Organization } from "./api/types.gen.ts";
type MysqlEndpoint = {
    protocol: "mysql";
    host: string;
    port: number;
    username: string;
};
type HttpsEndpoint = {
    protocol: "https";
    host: string;
    port: number;
};
type NativesecureEndpoint = {
    protocol: "nativesecure";
    host: string;
    port: number;
};
export interface ServiceProps {
    /**
     * The key ID for the Clickhouse API
     */
    keyId?: string | Secret<string>;
    /**
     * The secret for the Clickhouse API
     */
    secret?: string | Secret<string>;
    /**
     * The id, name, or OrganizationRef of Clickhouse cloud organization to create the service in.
     */
    organization: string | Organization;
    /**
     * The name of the Clickhouse service to create.
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * The underlying cloud provider to create the service on.
     */
    provider: ApiService["provider"];
    /**
     * The region to create the service in.
     */
    region: ApiService["region"];
    /**
     * The IP access list to create the service with.
     *
     * @default [{ description: "Anywhere", source: "0.0.0.0/0" }]
     */
    ipAccessList?: ApiService["ipAccessList"];
    /**
     * The minimum replica memory to create the service with.
     *
     * @default 8
     */
    minReplicaMemoryGb?: ApiService["minReplicaMemoryGb"];
    /**
     * The maximum replica memory to create the service with.
     *
     * @default 356
     */
    maxReplicaMemoryGb?: ApiService["maxReplicaMemoryGb"];
    /**
     * The number of replicas to create the service with.
     *
     * @default 3
     */
    numReplicas?: ApiService["numReplicas"];
    /**
     * Whether to enable idle scaling.
     *
     * @default true
     */
    idleScaling?: ApiService["idleScaling"];
    /**
     * The timeout minutes for idle scaling.
     *
     * @default 15
     */
    idleTimeoutMinutes?: ApiService["idleTimeoutMinutes"];
    /**
     * Whether to make the service readonly.
     *
     * @default false
     */
    isReadonly?: ApiService["isReadonly"];
    /**
     * The release channel to create the service with.
     *
     * @default "default"
     */
    releaseChannel?: ApiService["releaseChannel"];
    /**
     * The desired state of the service.
     *
     * @default "start"
     */
    stateTarget?: "start" | "stop";
    /**
     * Whether to enable the mysql endpoint.
     *
     * @default true
     */
    enableMysqlEndpoint?: boolean;
    /**
     * Whether to enable the https endpoint. Cannot be disabled
     *
     * @default true
     */
    enableHttpsEndpoint?: true;
    /**
     * Whether to enable the nativesecure endpoint. Cannot be disabled
     *
     * @default true
     */
    enableNativesecureEndpoint?: true;
    /**
     * The compliance type to create the service with.
     */
    complianceType?: ApiService["complianceType"];
    /**
     * wait for http service to be ready before marking the resource as created
     *
     * @default true
     */
    waitForHttpEndpointReady?: boolean;
    byocId?: ApiService["byocId"];
    hasTransparentDataEncryption?: ApiService["hasTransparentDataEncryption"];
    profile?: ApiService["profile"];
    dataWarehouseId?: ApiService["dataWarehouseId"];
    backupId?: string;
    encryptionKey?: ApiService["encryptionKey"];
    encryptionAssumedRoleIdentifier?: ApiService["encryptionAssumedRoleIdentifier"];
}
export interface Service {
    /**
     * The id of Clickhouse cloud organization the service is in.
     */
    organizationId: string;
    /**
     * The name of the Clickhouse service.
     *
     */
    name: string;
    /**
     * The clickhouse id of the Clickhouse service.
     */
    clickhouseId: string;
    /**
     * The password for the Clickhouse service.
     */
    password: Secret<string>;
    /**
     * The provider of the Clickhouse service.
     */
    provider: NonNullable<ApiService["provider"]>;
    /**
     * The region of the Clickhouse service.
     */
    region: NonNullable<ApiService["region"]>;
    /**
     * The IP access list of the Clickhouse service.
     */
    ipAccessList: NonNullable<ApiService["ipAccessList"]>;
    /**
     * The minimum replica memory of the Clickhouse service.
     */
    minReplicaMemoryGb: NonNullable<ApiService["minReplicaMemoryGb"]>;
    /**
     * The maximum replica memory of the Clickhouse service.
     */
    maxReplicaMemoryGb: NonNullable<ApiService["maxReplicaMemoryGb"]>;
    /**
     * The number of replicas of the Clickhouse service.
     */
    numReplicas: NonNullable<ApiService["numReplicas"]>;
    /**
     * Whether to enable idle scaling of the Clickhouse service.
     */
    idleScaling: NonNullable<ApiService["idleScaling"]>;
    /**
     * The timeout minutes for idle scaling of the Clickhouse service.
     */
    idleTimeoutMinutes: NonNullable<ApiService["idleTimeoutMinutes"]>;
    /**
     * Whether to make the Clickhouse service readonly.
     */
    isReadonly: NonNullable<ApiService["isReadonly"]>;
    /**
     * The data warehouse id of the Clickhouse service.
     */
    dataWarehouseId: NonNullable<ApiService["dataWarehouseId"]>;
    /**
     * The encryption key of the Clickhouse service.
     */
    encryptionKey?: ApiService["encryptionKey"];
    /**
     * The encryption assumed role identifier of the Clickhouse service.
     */
    encryptionAssumedRoleIdentifier?: ApiService["encryptionAssumedRoleIdentifier"];
    /**
     * The release channel of the Clickhouse service.
     */
    releaseChannel: NonNullable<ApiService["releaseChannel"]>;
    /**
     * The byoc id of the Clickhouse service if it is using BYOC infrastructure.
     */
    byocId?: ApiService["byocId"];
    /**
     * Whether to enable transparent data encryption of the Clickhouse service.
     */
    hasTransparentDataEncryption?: ApiService["hasTransparentDataEncryption"];
    /**
     * The profile the Clickhouse service was created using.
     */
    profile?: ApiService["profile"];
    /**
     * The compliance type of the Clickhouse service.
     */
    complianceType?: ApiService["complianceType"];
    /**
     * The backup id of the Clickhouse service.
     */
    backupId?: string;
    /**
     * If the mysql endpoint is enabled.
     */
    enableMysqlEndpoint?: boolean;
    /**
     * If the https endpoint is enabled.
     */
    enableHttpsEndpoint?: true;
    /**
     * If the nativesecure endpoint is enabled.
     */
    enableNativesecureEndpoint?: true;
    /**
     * The mysql endpoint details of the Clickhouse service.
     */
    mysqlEndpoint?: MysqlEndpoint;
    /**
     * The https endpoint details of the Clickhouse service.
     */
    httpsEndpoint?: HttpsEndpoint;
    /**
     * The nativesecure endpoint details of the Clickhouse service.
     */
    nativesecureEndpoint?: NativesecureEndpoint;
    /**
     * The desired state of the Clickhouse service.
     */
    stateTarget: "start" | "stop";
    /**
     * The state of the Clickhouse service.
     */
    state: ApiService["state"];
}
/**
 * Create, manage and delete Clickhouse services
 *
 * @example
 * // Create a basic Clickhouse service on aws
 * const organization = await OrganizationRef("Alchemy's Organization");
 * const service = await Service("clickhouse", {
 *   organization,
 *   provider: "aws",
 *   region: "us-east-1",
 * });
 *
 * @example
 * // Create a basic Clickhouse service on aws with custom scaling rules
 * const service = await Service("clickhouse", {
 *   organization,
 *   provider: "aws",
 *   region: "us-east-1",
 *   minReplicaMemoryGb: 8,
 *   maxReplicaMemoryGb: 356,
 *   numReplicas: 3,
 * });
 */
export declare const Service: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Service>, id: string, props: ServiceProps) => Promise<Service>);
export {};
//# sourceMappingURL=service.d.ts.map