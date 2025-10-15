import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { secret, type Secret } from "../secret.ts";
import { diff } from "../util/diff.ts";
import { createClickhouseApi } from "./api.ts";
import type { ClickhouseClient } from "./api/sdk.gen.ts";
import type { Service as ApiService, Organization } from "./api/types.gen.ts";
import { OrganizationRef } from "./organization.ts";

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

  //todo(michael): I need to understand more about what these properties do before documenting
  //todo(michael): support linking to BYOC infrastructure directly
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
export const Service = Resource(
  "clickhouse::Service",
  async function (
    this: Context<Service>,
    id: string,
    props: ServiceProps,
  ): Promise<Service> {
    const api = createClickhouseApi({
      keyId: props.keyId,
      secret: props.secret,
    });

    const idleScaling = props.idleScaling ?? true;
    const isReadonly = props.isReadonly ?? false;
    const releaseChannel = props.releaseChannel ?? "default";
    const endpoints: Array<{ protocol: "mysql"; enabled: boolean }> = [];
    const enableMysqlEndpoint = props.enableMysqlEndpoint ?? true;
    if (enableMysqlEndpoint) {
      endpoints.push({ protocol: "mysql", enabled: true });
    }
    const waitForHttpEndpointReady = props.waitForHttpEndpointReady ?? true;
    //todo(michael): comment these in when disabling is supported
    // const enableHttpsEndpoint = props.enableHttpsEndpoint ?? true;
    // if (enableHttpsEndpoint) {
    // 	endpoints.push({ protocol: "https", enabled: true });
    // }
    // const enableNativesecureEndpoint = props.enableNativesecureEndpoint ?? true;
    // if (enableNativesecureEndpoint) {
    // 	endpoints.push({ protocol: "nativesecure", enabled: true });
    // }
    const stateTarget = props.stateTarget ?? "start";
    const ipAccessList = props.ipAccessList ?? [
      {
        description: "Anywhere",
        source: "0.0.0.0/0",
      },
    ];
    const minReplicaMemoryGb = props.minReplicaMemoryGb ?? 8;
    const maxReplicaMemoryGb = props.maxReplicaMemoryGb ?? 356;
    const numReplicas = props.numReplicas ?? 3;
    const idleTimeoutMinutes = props.idleTimeoutMinutes ?? 15;

    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    const organizationId =
      typeof props.organization === "string"
        ? await OrganizationRef(props.organization)
            .then((organization) => organization.id!)
            .catch(() => props.organization as string)
        : props.organization.id!;

    if (this.phase === "delete") {
      await api.updateServiceState({
        path: {
          organizationId: organizationId,
          serviceId: this.output.clickhouseId,
        },
        body: {
          command: "stop",
        },
      });

      await waitForServiceState(
        api,
        organizationId,
        this.output.clickhouseId,
        (state) => state === "stopped",
      );

      await api.deleteService({
        path: {
          organizationId: organizationId,
          serviceId: this.output.clickhouseId,
        },
      });

      await waitForServiceDeletion(
        api,
        organizationId,
        this.output.clickhouseId,
      );

      return this.destroy();
    }
    if (this.phase === "update") {
      const resourceDiff = diff(
        {
          ...props,
          idleScaling,
          isReadonly,
          releaseChannel,
          name,
        },
        {
          ...this.output,
          organization: props.organization,
        },
      );

      const updates: Partial<Service> = {};

      if (
        resourceDiff.some(
          (prop) =>
            prop !== "name" &&
            prop !== "ipAccessList" &&
            prop !== "releaseChannel" &&
            prop !== "enableMysqlEndpoint" &&
            prop !== "enableHttpsEndpoint" &&
            prop !== "enableNativesecureEndpoint" &&
            prop !== "minReplicaMemoryGb" &&
            prop !== "maxReplicaMemoryGb" &&
            prop !== "numReplicas" &&
            prop !== "idleScaling" &&
            prop !== "idleTimeoutMinutes" &&
            prop !== "stateTarget",
        )
      ) {
        return this.replace();
      }

      if (
        //todo(michael): check encryption key swap?
        resourceDiff.some(
          (prop) =>
            prop === "name" ||
            prop === "ipAccessList" ||
            prop === "releaseChannel",
        ) ||
        enableMysqlEndpoint !== this.output.enableMysqlEndpoint
      ) {
        const ipAccessListToRemove = this.output.ipAccessList.filter(
          (ipAccessList) => !props.ipAccessList?.includes(ipAccessList),
        );
        const ipAccessListToAdd = props.ipAccessList?.filter(
          (ipAccessList) => !this.output.ipAccessList.includes(ipAccessList),
        );
        const response = (
          await api.updateServiceBasicDetails({
            path: {
              organizationId: organizationId,
              serviceId: this.output.clickhouseId,
            },
            body: {
              name,
              ipAccessList: {
                remove: ipAccessListToRemove,
                add: ipAccessListToAdd,
              },
              releaseChannel,
              endpoints,
            },
          })
        ).data.result!;

        updates.name = response.name!;
        updates.ipAccessList = response.ipAccessList!;
        updates.releaseChannel = response.releaseChannel!;
        updates.mysqlEndpoint = response!.endpoints!.find(
          (endpoint) => endpoint.protocol === "mysql",
        ) as MysqlEndpoint;
        updates.httpsEndpoint = response!.endpoints!.find(
          (endpoint) => endpoint.protocol === "https",
        ) as HttpsEndpoint;
        updates.nativesecureEndpoint = response!.endpoints!.find(
          (endpoint) => endpoint.protocol === "nativesecure",
        ) as NativesecureEndpoint;
      }

      if (stateTarget !== this.output.stateTarget) {
        const response = await api.updateServiceState({
          path: {
            organizationId: organizationId,
            serviceId: this.output.clickhouseId,
          },
          body: {
            command: stateTarget,
          },
        });

        updates.state = response.data.result!.state!;
        updates.stateTarget = stateTarget;
      }

      if (
        resourceDiff.some(
          (prop) =>
            prop === "minReplicaMemoryGb" ||
            prop === "maxReplicaMemoryGb" ||
            prop === "numReplicas" ||
            prop === "idleScaling" ||
            prop === "idleTimeoutMinutes",
        )
      ) {
        const response = (
          await api.updateServiceAutoScalingSettings2({
            path: {
              organizationId: organizationId,
              serviceId: this.output.clickhouseId,
            },
            body: {
              minReplicaMemoryGb: props.minReplicaMemoryGb,
              maxReplicaMemoryGb: props.maxReplicaMemoryGb,
              numReplicas: props.numReplicas,
              idleScaling: props.idleScaling,
              idleTimeoutMinutes: idleTimeoutMinutes,
            },
          })
        ).data.result!;

        updates.minReplicaMemoryGb = response.minReplicaMemoryGb!;
        updates.maxReplicaMemoryGb = response.maxReplicaMemoryGb!;
        updates.numReplicas = response.numReplicas!;
        updates.idleScaling = response.idleScaling!;
        updates.idleTimeoutMinutes = response.idleTimeoutMinutes!;
      }

      return {
        ...this.output,
        ...updates,
      };
    }

    const response = (
      await api.createNewService({
        path: {
          organizationId: organizationId,
        },
        body: {
          name,
          provider: props.provider,
          region: props.region,
          ipAccessList: ipAccessList,
          minReplicaMemoryGb: minReplicaMemoryGb,
          maxReplicaMemoryGb: maxReplicaMemoryGb,
          numReplicas: numReplicas,
          idleScaling: idleScaling,
          idleTimeoutMinutes: idleTimeoutMinutes,
          isReadonly: isReadonly,
          dataWarehouseId: props.dataWarehouseId,
          backupId: props.backupId,
          encryptionKey: props.encryptionKey,
          encryptionAssumedRoleIdentifier:
            props.encryptionAssumedRoleIdentifier,
          privatePreviewTermsChecked: true,
          releaseChannel: releaseChannel,
          byocId: props.byocId,
          hasTransparentDataEncryption:
            props.hasTransparentDataEncryption ?? false,
          endpoints: endpoints,
          profile: props.profile,
          complianceType: props.complianceType,
        },
      })
    ).data.result!;
    const password = response.password!;
    const service = response.service!;

    const httpEndpoint = service.endpoints!.find(
      (endpoint) => endpoint.protocol === "https",
    ) as HttpsEndpoint;

    await waitForServiceState(
      api,
      organizationId,
      response.service!.id!,
      (state) => state === "running" || state === "idle",
    );

    if (waitForHttpEndpointReady && httpEndpoint) {
      await waitForHttpServiceReady(httpEndpoint as HttpsEndpoint, {
        password: password!,
        username: "default",
      });
    }

    return {
      organizationId: organizationId,
      name: service.name!,
      clickhouseId: service.id!,
      password: secret(password!),
      provider: service.provider!,
      region: service.region!,
      ipAccessList: service.ipAccessList!,
      minReplicaMemoryGb: service.minReplicaMemoryGb!,
      maxReplicaMemoryGb: service.maxReplicaMemoryGb!,
      numReplicas: service.numReplicas!,
      idleScaling: service.idleScaling!,
      idleTimeoutMinutes: service.idleTimeoutMinutes!,
      isReadonly: service.isReadonly!,
      dataWarehouseId: service.dataWarehouseId!,
      backupId: props.backupId,
      encryptionKey: service.encryptionKey,
      encryptionAssumedRoleIdentifier: service.encryptionAssumedRoleIdentifier,
      releaseChannel: service.releaseChannel!,
      byocId: service.byocId,
      hasTransparentDataEncryption: service.hasTransparentDataEncryption,
      profile: service.profile,
      complianceType: service.complianceType,
      stateTarget,
      state: service.state,
      mysqlEndpoint: service.endpoints!.find(
        (endpoint) => endpoint.protocol === "mysql",
      ) as MysqlEndpoint,
      httpsEndpoint: httpEndpoint,
      nativesecureEndpoint: service.endpoints!.find(
        (endpoint) => endpoint.protocol === "nativesecure",
      ) as NativesecureEndpoint,
    };
  },
);

async function waitForServiceState(
  api: ClickhouseClient,
  organizationId: string,
  serviceId: string,
  stateChecker: (state: string) => boolean,
) {
  async function checkState(): Promise<void> {
    const service = await api.getServiceDetails({
      path: {
        organizationId: organizationId,
        serviceId: serviceId,
      },
    });
    const serviceState = service.data.result!.state!;

    if (stateChecker(serviceState)) {
      return;
    }

    throw new Error(`Service ${serviceId} is in state ${serviceState}`);
  }

  await waitFor(checkState, 10 * 60);
}

async function waitForHttpServiceReady(
  endpoint: {
    protocol: "https";
    host: string;
    port: number;
  },
  credentials: { password: string; username: string },
) {
  async function checkHttpEndpoint() {
    await fetch(
      `https://${endpoint.host}:${endpoint.port}/?query=SELECT%20count%28%29%20FROM%20system.databases%20WHERE%20name%20%3D%20%27default%27`,
      {
        headers: {
          Authorization: `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
        },
      },
    )
      .then((res) => res.text())
      .then((text) => {
        if (text === "0") {
          throw new Error("Service is not ready");
        }
        return;
      });
  }

  await waitFor(checkHttpEndpoint, 10 * 60);
}

async function waitForServiceDeletion(
  api: ClickhouseClient,
  organizationId: string,
  serviceId: string,
) {
  async function checkDeletion() {
    const status = await api
      .getServiceDetails({
        path: {
          organizationId: organizationId,
          serviceId: serviceId,
        },
      })
      .then((service) => service.response.status)
      .catch((error) => {
        return (error.status as number) ?? 500;
      });
    if (status === 404) {
      return;
    }
    throw new Error(`Service ${serviceId} is not deleted`);
  }

  await waitFor(checkDeletion, 10 * 60);
}

async function waitFor(
  checkFunction: () => Promise<void>,
  maxWaitSeconds: number,
) {
  if (maxWaitSeconds < 5) {
    maxWaitSeconds = 5;
  }

  const maxRetries = Math.floor(maxWaitSeconds / 5);

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await checkFunction();
      return;
    } catch (error) {
      if (attempt === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}
