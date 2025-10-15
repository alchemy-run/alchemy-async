import type { Context } from "../context.ts";
import { Image, type ImageProps } from "../docker/image.ts";
import { Resource } from "../resource.ts";
import { Scope } from "../scope.ts";
import { secret } from "../secret.ts";
import {
  type CloudflareApi,
  type CloudflareApiOptions,
  createCloudflareApi,
} from "./api.ts";

/**
 * Properties for creating a Container binding or ContainerApplication
 *
 * Extends ImageProps for Docker image configuration and CloudflareApiOptions
 * for Cloudflare API authentication.
 */
export interface ContainerProps
  extends Omit<ImageProps, "registry" | "skipPush">,
    Partial<CloudflareApiOptions> {
  /**
   * The class name for the container binding.
   * This is used to identify the container class in Worker bindings.
   */
  className: string;

  /**
   * Maximum number of container instances that can be running.
   * Controls horizontal scaling limits.
   *
   * @default 10
   */
  maxInstances?: number;

  /**
   * Optional name for the Worker script that will use this container.
   * Used for organizing and identifying container deployments.
   */
  scriptName?: string;

  /**
   * The instance type determines the compute resources allocated to the container.
   * Different types offer different CPU, memory, and pricing characteristics.
   *
   * @default "dev"
   */
  instanceType?: InstanceType;

  /**
   * Configuration for observability features like logging and monitoring.
   * Controls what telemetry data is collected from the container.
   */
  observability?: DeploymentObservability;

  /**
   * Scheduling policy controls where and how containers are deployed.
   * Affects placement, resource allocation, and geographic distribution.
   *
   * @default "default"
   */
  schedulingPolicy?: SchedulingPolicy;

  /**
   * Whether to adopt an existing container application with the same name.
   *
   * If `true`, the resource will attempt to adopt an existing container application
   * instead of failing when one already exists with the same name.
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Development-specific configuration options.
   */
  dev?: {
    /**
     * Whether to use remote container deployment even in development mode.
     * When false, containers run locally using Miniflare.
     * When true, containers are deployed to Cloudflare's edge even in dev mode.
     *
     * @default false
     */
    remote?: boolean;
  };
}

/**
 * Instance types for Cloudflare Container deployments.
 *
 * Each type offers different compute resources and pricing:
 * - `dev`: Development instances with minimal resources, suitable for testing
 * - `basic`: Basic production instances with standard resources
 * - `standard`: Standard production instances with enhanced resources
 *
 * | Instance Type  | vCPU | Memory (Min) | Memory (Max) |
 * |---------------|------|--------------|--------------|
 * | lite          | 1/16 | 256 MiB      | 2 GB         |
 * | basic         | 1/4  | 1 GiB        | 4 GB         |
 * | standard-1    | 1/2  | 4 GiB        | 8 GB         |
 * | standard-2    | 1    | 6 GiB        | 12 GB        |
 * | standard-3    | 2    | 8 GiB        | 16 GB        |
 * | standard-4    | 4    | 12 GiB       | 20 GB        |
 *
 * @see https://developers.cloudflare.com/containers/pricing/
 * @see https://developers.cloudflare.com/changelog/2025-10-01-new-container-instance-types/
 */
export type InstanceType =
  | "lite"
  | "dev"
  | "basic"
  | "standard"
  | "standard-1"
  | "standard-2"
  | "standard-3"
  | "standard-4"
  | (string & {});

/**
 * Type guard to check if a binding is a Container binding.
 *
 * @param binding - The binding to check
 * @returns True if the binding is a Container binding
 */
export function isContainer(binding: any): binding is Container {
  return binding.type === "container";
}

/**
 * A Container binding that can be used in Cloudflare Workers.
 *
 * Container bindings allow Workers to communicate with containerized applications
 * running on Cloudflare's global network. The container can be called from the
 * Worker using the binding name.
 *
 * @template T - Type parameter for additional container-specific properties
 */
export type Container<T = any> = {
  /** Identifies this as a container binding type */
  type: "container";

  /** Unique identifier for the container */
  id: string;

  /**
   * Optional human-readable name for the container
   *
   * @default ${app.name}-${app.stage}-${id}
   */
  name?: string;

  /** Class name used to identify the container in Worker bindings */
  className: string;

  /** Docker image configuration for the container */
  image: Image;

  /** Maximum number of container instances that can be running */
  maxInstances?: number;

  /** Optional name for the Worker script that will use this container */
  scriptName?: string;

  /** Whether SQLite is enabled for the container (always true for containers) */
  sqlite?: true;

  /** The instance type determining compute resources */
  instanceType?: InstanceType;

  /** Observability configuration for logging and monitoring */
  observability?: DeploymentObservability;

  /** Scheduling policy for container placement */
  schedulingPolicy?: SchedulingPolicy;

  /** Whether this container was adopted from an existing deployment */
  adopt?: boolean;

  /** Development-specific configuration */
  dev?: {
    /** Whether to use remote deployment in development mode */
    remote?: boolean;
  };

  /**
   * @internal
   * Phantom type parameter for additional type safety
   */
  __phantom?: T;
};

export async function Container<T>(
  id: string,
  props: ContainerProps,
): Promise<Container<T>> {
  const scope = Scope.current;
  const name = props.name ?? scope.createPhysicalName(id);
  const tag =
    props.tag === undefined || props.tag === "latest"
      ? `latest-${Date.now()}`
      : props.tag;

  const output: Omit<Container<T>, "image"> = {
    type: "container",
    id,
    name,
    className: props.className,
    maxInstances: props.maxInstances,
    scriptName: props.scriptName,
    instanceType: props.instanceType,
    observability: props.observability,
    schedulingPolicy: props.schedulingPolicy,
    sqlite: true,
    dev: props.dev,
    adopt: props.adopt,
  };

  const isDev = scope.local && !props.dev?.remote;
  if (isDev) {
    const image = await Image(id, {
      name: `cloudflare-dev/${name}`, // prefix used by Miniflare
      tag,
      build: props.build,
    });

    return {
      ...output,
      image,
    };
  }

  const api = await createCloudflareApi(props);
  const credentials = await getContainerCredentials(api);

  const image = await Image(id, {
    name: `${api.accountId}/${name}`,
    tag,
    build: {
      platform: props.build?.platform ?? "linux/amd64",
      ...props.build,
    },
    registry: {
      server: "registry.cloudflare.com",
      username: credentials.username || credentials.user!,
      password: secret(credentials.password),
    },
  });

  return {
    ...output,
    image,
  };
}

/**
 * Configuration for progressive rollout strategy when updating container applications.
 *
 * Rollouts allow you to gradually deploy new container configurations, reducing
 * risk by updating instances incrementally rather than all at once.
 */
export interface ContainerApplicationRollout {
  /**
   * The rollout strategy to use.
   * Currently only "rolling" strategy is supported, which updates instances gradually.
   */
  strategy: "rolling";

  /**
   * The rollout automation level.
   * "full_auto" means the rollout proceeds automatically without manual intervention.
   *
   * @default "full_auto"
   */
  kind?: "full_auto";

  /**
   * Percentage of instances to update in each step of the rollout.
   * For example, 25 means 25% of instances are updated in each step.
   *
   * @minimum 1
   * @maximum 100
   */
  stepPercentage: number;

  /**
   * The target configuration that instances will be updated to.
   * This defines the final state after the rollout completes.
   */
  targetConfiguration: {
    /** The container image to deploy */
    image: string;

    /** The instance type for the new deployment */
    instance_type?: InstanceType;

    /** Observability configuration for the new deployment */
    observability: {
      /** Logging configuration */
      logs: {
        /** Whether logging is enabled */
        enabled: boolean;
      };
    };
  };
}

/**
 * Properties for creating a ContainerApplication resource.
 *
 * ContainerApplication represents a managed container deployment that runs your
 * Docker images with automatic scaling, scheduling, and integration with
 * Cloudflare's services.
 */
export interface ContainerApplicationProps extends CloudflareApiOptions {
  /**
   * The name of the container application.
   * Must be unique within your Cloudflare account.
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Scheduling policy that controls where and how containers are deployed.
   * Affects placement, resource allocation, and geographic distribution.
   *
   * @default "default"
   */
  schedulingPolicy?: SchedulingPolicy;

  /**
   * The initial number of container instances to deploy.
   * Can be scaled up or down after deployment.
   *
   * @default 1
   */
  instances?: number;

  /**
   * The instance type to be used for the deployment.
   * Determines the compute resources (CPU, memory) allocated to each instance.
   *
   * @default "dev"
   */
  instanceType?: InstanceType;

  /**
   * The observability configuration for the deployment.
   * Controls logging, monitoring, and telemetry collection.
   */
  observability?: DeploymentObservability;

  /**
   * The maximum number of instances to be used for the deployment.
   * Acts as an upper limit for auto-scaling.
   *
   * @default 1
   */
  maxInstances?: number;

  /**
   * The Docker image to deploy in the container application.
   * Must be built and available in a container registry.
   */
  image: Image;

  /**
   * Optional registry ID for custom container registries.
   * If not specified, uses Cloudflare's default registry.
   */
  registryId?: string;

  /**
   * Configuration for Durable Objects integration.
   * Allows the container to interact with Cloudflare Durable Objects.
   */
  durableObjects?: {
    /** The namespace ID of the Durable Objects namespace to bind */
    namespaceId: string;
  };

  /**
   * Configuration for progressive rollout when updating the application.
   * Defines how updates are deployed across instances.
   */
  rollout?: ContainerApplicationRollout;

  /**
   * Whether to adopt an existing container application with the same name.
   *
   * If `true`, the resource will attempt to adopt an existing container application
   * instead of failing when one already exists with the same name.
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * If true, the container application will not be created, but will be retained if it already exists.
   * This is used for local development.
   *
   * @default `false`
   * @internal
   */
  dev?: boolean;
}

/**
 * Scheduling policies that control container placement and resource allocation.
 *
 * Different policies optimize for different use cases:
 * - `moon`: Optimized for latency-sensitive applications
 * - `gpu`: Routes to locations with GPU resources available
 * - `regional`: Keeps containers within specific geographic regions
 * - `fill_metals`: Optimizes for resource utilization on dedicated hardware
 * - `default`: Uses Cloudflare's standard scheduling algorithm
 */
export type SchedulingPolicy =
  | "moon"
  | "gpu"
  | "regional"
  | "fill_metals"
  | "default"
  | (string & {});

/**
 * A ContainerApplication resource representing a managed container deployment.
 *
 * This resource manages the lifecycle of containerized applications running on
 * Cloudflare's global network with automatic scaling and scheduling.
 */
export interface ContainerApplication {
  /** Unique identifier for the container application */
  id: string;

  /** Human-readable name of the container application */
  name: string;
}

/**
 * Deploy and manage container applications on Cloudflare's global network.
 *
 * ContainerApplication creates a managed container deployment that runs your Docker images
 * with automatic scaling, scheduling, and integration with Cloudflare's services.
 *
 * @example
 * // Deploy a simple web application container
 * const webApp = await ContainerApplication("my-web-app", {
 *   name: "my-web-app",
 *   image: await Image("web-app", {
 *     name: "web-app",
 *     build: {
 *       context: "./docker/web-app"
 *     }
 *   }),
 *   instances: 1,
 *   maxInstances: 3
 * });
 *
 * @example
 * // Deploy a container with GPU support for AI workloads
 * const aiApp = await ContainerApplication("ai-inference", {
 *   name: "ai-inference",
 *   image: await Image("ai-model", {
 *     name: "ai-model",
 *     build: {
 *       context: "./docker/ai"
 *     }
 *   }),
 *   schedulingPolicy: "gpu",
 *   instances: 2,
 *   maxInstances: 5
 * });
 *
 * @example
 * // Deploy a container integrated with Durable Objects
 * const doApp = await ContainerApplication("stateful-app", {
 *   name: "stateful-app",
 *   image: await Image("do-app", {
 *     name: "do-app",
 *     build: {
 *       context: "./container"
 *     }
 *   }),
 *   durableObjects: {
 *     namespaceId: myDurableObjectNamespace.id
 *   },
 *   instances: 1,
 *   maxInstances: 10
 * });
 *
 * @example
 * // Create a Container binding for use in a Worker
 * const worker = await Worker("my-worker", {
 *   name: "my-worker",
 *   entrypoint: "./src/worker.ts",
 *   bindings: {
 *     MY_CONTAINER: new Container("my-container", {
 *       className: "MyContainerClass",
 *       image: await Image("container-do", {
 *         name: "container-do",
 *         context: "./docker/durable-object"
 *       }),
 *       maxInstances: 100,
 *       name: "my-container-do"
 *     })
 *   }
 * });
 *
 * @example
 * // Adopt an existing container application
 * const existingApp = await ContainerApplication("existing-app", {
 *   name: "existing-app",
 *   adopt: true, // Will adopt instead of failing if already exists
 *   image: await Image("updated-app", {
 *     name: "updated-app",
 *     build: {
 *       context: "./docker/updated"
 *     }
 *   }),
 *   instances: 2,
 *   maxInstances: 5
 * });
 */
export const ContainerApplication = Resource(
  "cloudflare::ContainerApplication",
  async function (
    this: Context<ContainerApplication, ContainerApplicationProps>,
    id: string,
    props: ContainerApplicationProps,
  ): Promise<ContainerApplication> {
    const applicationName = props.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local && props.dev) {
      return {
        id: this.output?.id ?? "",
        name: applicationName,
      };
    }

    const adopt = props.adopt ?? this.scope.adopt;

    const api = await createCloudflareApi(props);
    if (this.phase === "delete") {
      if (this.output?.id) {
        // Delete the container application
        await deleteContainerApplication(api, this.output.id);
      }
      return this.destroy();
    }

    // Prefer the immutable repo digest if present. Falls back to the tag reference.
    const imageReference = props.image.repoDigest ?? props.image.imageRef;

    const configuration = {
      image: imageReference,
      instance_type: props.instanceType ?? "dev",
      observability: {
        logs: {
          enabled: true,
        },
        logging: {
          enabled: true,
        },
      },
    };
    if (this.phase === "update" && this.output?.id) {
      const application = await updateContainerApplication(
        api,
        this.output.id,
        {
          instances: props.instances ?? 1,
          max_instances: props.maxInstances ?? 10,
          scheduling_policy: props.schedulingPolicy ?? "default",
          configuration,
        },
      );
      // TODO(sam): should we wait for the rollout to complete?
      await createContainerApplicationRollout(api, application.id, {
        description: "Progressive update",
        strategy: "rolling",
        kind: props.rollout?.kind ?? "full_auto",
        step_percentage: props.rollout?.stepPercentage ?? 25,
        target_configuration: configuration,
      });
      return {
        id: application.id,
        name: application.name,
      };
    } else {
      let application: ContainerApplicationData;

      try {
        application = await createContainerApplication(api, adopt, {
          name: applicationName,
          scheduling_policy: props.schedulingPolicy ?? "default",
          instances: props.instances ?? 1,
          max_instances: props.maxInstances ?? 1,
          durable_objects: props.durableObjects
            ? {
                namespace_id: props.durableObjects.namespaceId,
              }
            : undefined,
          constraints: {
            tier: 1,
          },
          configuration: {
            image: imageReference,
            instance_type: props.instanceType ?? "dev",
            observability: {
              logs: {
                enabled: true,
              },
            },
          },
        });
      } catch (error) {
        // Check if this is an "already exists" error and adopt is enabled
        if (
          adopt &&
          error instanceof Error &&
          error.message.includes("already exists")
        ) {
          // Find the existing container application
          const existingApplication = await findContainerApplicationByName(
            api,
            applicationName,
          );

          if (!existingApplication) {
            throw new Error(
              `Failed to find existing container application '${applicationName}' for adoption`,
            );
          }

          // Update the existing application with new properties
          application = await updateContainerApplication(
            api,
            existingApplication.id,
            {
              instances: props.instances ?? existingApplication.instances,
              max_instances:
                props.maxInstances ?? existingApplication.max_instances,
              scheduling_policy:
                props.schedulingPolicy ?? existingApplication.scheduling_policy,
              configuration,
            },
          );

          // Create a rollout for the updated configuration
          await createContainerApplicationRollout(api, application.id, {
            description: "Update configuration on adoption",
            strategy: "rolling",
            kind: props.rollout?.kind ?? "full_auto",
            step_percentage: props.rollout?.stepPercentage ?? 25,
            target_configuration: configuration,
          });
        } else {
          // Re-throw the error if adopt is false or different error
          throw error;
        }
      }

      return {
        id: application.id,
        name: application.name,
      };
    }
  },
);

/**
 * Complete data structure returned by the Cloudflare API for container applications.
 *
 * This interface represents the full state of a container application as stored
 * and managed by Cloudflare's container service. It includes both user-configured
 * properties and system-managed metadata.
 */
export interface ContainerApplicationData {
  /** Human-readable name of the container application */
  name: string;

  /** Scheduling policy controlling container placement and resource allocation */
  scheduling_policy: SchedulingPolicy;

  /** Current number of running container instances */
  instances: number;

  /** Maximum number of instances allowed for this application */
  max_instances: number;

  /** Resource and placement constraints for the application */
  constraints: {
    /** Infrastructure tier level (higher numbers indicate more resources) */
    tier: number;

    /** Additional constraint properties that may be added by Cloudflare */
    [key: string]: any;
  };

  /**
   * The deployment configuration defining how containers should run.
   * This includes image, compute resources, networking, and other runtime settings.
   */
  configuration: {
    /** Container image reference (tag or digest) */
    image: string;

    /** Geographic location preference for deployment */
    location: string;

    /** Number of virtual CPU cores allocated to each instance */
    vcpu: number;

    /** Memory allocation in mebibytes (MiB) */
    memory_mib: number;

    /** Disk configuration for persistent storage */
    disk: any;

    /** Network configuration and policies */
    network: any;

    /** Command to run when starting the container */
    command: string[];

    /** Entrypoint command for the container */
    entrypoint: string[];

    /** Container runtime to use (e.g., "runc") */
    runtime: string;

    /** Type of deployment strategy */
    deployment_type: string;

    /** Observability and monitoring configuration */
    observability: any;

    /** Human-readable memory allocation (e.g., "512MB") */
    memory: string;

    /** Additional configuration properties */
    [key: string]: any;
  };

  /** Durable Objects integration configuration */
  durable_objects: {
    /** ID of the Durable Objects namespace */
    namespace_id: string;

    /** Additional Durable Objects properties */
    [key: string]: any;
  };

  /** Unique identifier for the container application */
  id: string;

  /** Cloudflare account ID that owns this application */
  account_id: string;

  /** ISO 8601 timestamp when the application was created */
  created_at: string;

  /** Version number of the application configuration */
  version: number;

  /** Legacy field - ID of the Durable Objects namespace */
  durable_object_namespace_id: string;

  /** Health status and metrics for all instances */
  health: {
    /** Health information for individual instances */
    instances: any;

    /** Additional health metrics */
    [key: string]: any;
  };

  /** Additional properties that may be returned by the API */
  [key: string]: any;
}

export async function getContainerApplicationByName(
  api: CloudflareApi,
  name: string,
) {
  return (await listContainerApplications(api)).find(
    (app) => app.name === name,
  );
}

export async function getContainerApplication(
  api: CloudflareApi,
  applicationId: string,
) {
  const response = await api.get(
    `/accounts/${api.accountId}/containers/applications/${applicationId}`,
  );

  const result = (await response.json()) as {
    result: ContainerApplicationData;
    errors: { message: string }[];
  };
  if (response.ok) {
    return result.result;
  }
}

export async function listContainerApplications(
  api: CloudflareApi,
): Promise<ContainerApplicationData[]> {
  const deployments = await api.get(
    `/accounts/${api.accountId}/containers/applications`,
  );
  const response = (await deployments.json()) as any as {
    result: ContainerApplicationData[];
    errors: { message: string }[];
  };
  if (deployments.ok) {
    return response.result;
  }
  throw Error(
    `Failed to list container applications: ${response.errors.map((e) => e.message).join(", ")}`,
  );
}

export async function findContainerApplicationByName(
  api: CloudflareApi,
  name: string,
): Promise<ContainerApplicationData | undefined> {
  const applications = await listContainerApplications(api);
  return applications.find((app) => app.name === name);
}

export interface CreateContainerApplicationBody {
  name: string;
  max_instances: number;
  configuration: DeploymentConfiguration;
  durable_objects?: {
    namespace_id: string;
  };
  instances?: number;
  scheduling_policy?: string;
  constraints?: { tier: number };
  affinities?: {
    colocation?: "datacenter";
  };
  [key: string]: any;
}

export async function createContainerApplication(
  api: CloudflareApi,
  adopt: boolean | undefined,
  body: CreateContainerApplicationBody,
) {
  const response = await api.post(
    `/accounts/${api.accountId}/containers/applications`,
    body,
  );
  const result = (await response.json()) as {
    result: ContainerApplicationData;
    errors: { message: string; code: number }[];
  };
  if (response.ok) {
    return result.result;
  }

  const error = result.errors.find((e) => e.code === 1000);
  if (error) {
    // WEIRD: json-encoded error message - might change when they release an official API
    const errorMessage = JSON.parse(error.message) as {
      error: "DURABLE_OBJECT_ALREADY_HAS_APPLICATION" | (string & {});
      details: {
        name: string;
        id: string;
      };
    };

    if (errorMessage.error === "DURABLE_OBJECT_ALREADY_HAS_APPLICATION") {
      if (!adopt) {
        throw new Error(
          `Durable Object namespace ${body.durable_objects?.namespace_id} already has an application with id ${errorMessage.details.id}. Use adopt: true to adopt it.`,
        );
      }
      const application = await getContainerApplication(
        api,
        errorMessage.details.id,
      );
      if (application) {
        const currentId = application.durable_objects.namespace_id;
        const desiredId = body.durable_objects?.namespace_id;
        if (currentId === desiredId) {
          await updateContainerApplication(api, application.id, {
            configuration: body.configuration,
            instances: body.instances,
            constraints: body.constraints,
            scheduling_policy: body.scheduling_policy,
            max_instances: body.max_instances,
            affinities: body.affinities,
            // TODO(sam): API does not accepet this as input, we may need to repace
            // durable_objects: body.durable_objects,
          });
          // it's the same application, so we can just adpt it
          return application;
        } else {
          // TODO(sam): not sure what to do in this case
          throw new Error(
            "Cannot adopt an existing Container Application that is bound to a different Durable Object",
          );
        }
      }
    }
  }

  throw Error(
    `Failed to create container application: ${result.errors?.map((e: { message: string }) => e.message).join(", ") ?? "Unknown error"}`,
  );
}
type Region =
  | "AFR"
  | "APAC"
  | "EEUR"
  | "ENAM"
  | "WNAM"
  | "ME"
  | "OC"
  | "SAM"
  | "WEUR"
  | (string & {});

type City =
  | "AFR"
  | "APAC"
  | "EEUR"
  | "ENAM"
  | "WNAM"
  | "ME"
  | "OC"
  | "SAM"
  | "WEUR"
  | (string & {});

export type UpdateApplicationRequestBody = {
  /**
   * Number of deployments to maintain within this applicaiton. This can be used to scale the appliation up/down.
   */
  instances?: number;
  max_instances?: number;
  affinities?: {
    colocation?: "datacenter";
  };
  scheduling_policy?: SchedulingPolicy;
  constraints?: {
    region?: Region;
    tier?: number;
    regions?: Array<Region>;
    cities?: Array<City>;
  };
  /**
   * The deployment configuration of all deployments created by this application.
   * Right now, if you modify the application configuration, only new deployments
   * created will have the new configuration. You can delete old deployments to
   * release new instances.
   *
   * TODO(sam): should this trigger a replacement?
   */
  configuration?: DeploymentConfiguration;
};

export async function updateContainerApplication(
  api: CloudflareApi,
  applicationId: string,
  body: UpdateApplicationRequestBody,
) {
  const response = await api.patch(
    `/accounts/${api.accountId}/containers/applications/${applicationId}`,
    body,
  );
  const result = (await response.json()) as {
    result: ContainerApplicationData;
    errors: { message: string; code: number }[];
  };
  if (response.ok) {
    return result.result;
  }
  throw Error(
    `Failed to create container application: ${result.errors?.map((e) => `[${e.code}] ${e.message}`).join(", ") ?? "Unknown error"}`,
  );
}

export async function deleteContainerApplication(
  api: CloudflareApi,
  applicationId: string,
) {
  const response = await api.delete(
    `/accounts/${api.accountId}/containers/applications/${applicationId}`,
  );
  const result = (await response.json()) as any;
  // Treat missing applications as already-deleted so that destroy() is idempotent
  if (response.ok || response.status === 404) {
    return result?.result;
  }
  const errorMessages = Array.isArray(result?.errors)
    ? result.errors.map((e: { message: string }) => e.message).join(", ")
    : (result?.error ?? "Unknown error");
  throw Error(`Failed to delete container application: ${errorMessages}`);
}

interface CreateRolloutApplicationRequest {
  description: string;
  strategy: "rolling";
  kind?: "full_auto";
  step_percentage: number;
  target_configuration: DeploymentConfiguration;
}

interface CreateRolloutApplicationResponse {
  id: string;
  created_at: string;
  last_updated_at: string;
  description: string;
  status: "progressing" | "completed" | "failed" | (string & {});
  health: {
    instances: {
      healthy: number;
      failed: number;
      starting: number;
      scheduling: number;
    };
  };
  kind: "full_auto" | (string & {});
  strategy: "rolling" | (string & {});
  current_configuration: {
    image: string;
    observability?: {
      logs?: {
        enabled: boolean;
      };
      logging?: {
        enabled: boolean;
      };
    };
  };
  target_configuration: DeploymentConfiguration;
  current_version: number;
  target_version: number;
  steps: Array<{
    id: number;
    status: "progressing" | "pending" | "completed" | "failed" | (string & {});
    step_size: {
      percentage: number;
    };
    description: string;
    started_at?: string;
  }>;
  progress: {
    total_steps: number;
    current_step: number;
    updated_instances: number;
    total_instances: number;
  };
}

export async function createContainerApplicationRollout(
  api: CloudflareApi,
  applicationId: string,
  body: CreateRolloutApplicationRequest,
) {
  const response = await api.post(
    `/accounts/${api.accountId}/containers/applications/${applicationId}/rollouts`,
    body,
  );
  const result = (await response.json()) as {
    result: CreateRolloutApplicationResponse;
    errors: { message: string; code: number }[];
  };
  if (response.ok) {
    return result.result;
  }
  throw Error(
    `Failed to create container application rollout: ${result.errors.map((e) => `[${e.code}] ${e.message}`).join(", ")}`,
  );
}

export type ImageRegistryCredentialsConfiguration = {
  permissions: Array<"pull" | "push">;
  expiration_minutes: number;
};

export async function getContainerCredentials(
  api: CloudflareApi,
  registryId = "registry.cloudflare.com",
) {
  const credentials = await api.post(
    `/accounts/${api.accountId}/containers/registries/${registryId}/credentials`,
    {
      permissions: ["pull", "push"],
      expiration_minutes: 60,
    } satisfies ImageRegistryCredentialsConfiguration,
  );
  const result = (await credentials.json()) as {
    result: {
      user?: string;
      username?: string;
      password: string;
    };
    errors: { message: string }[];
  };
  if (credentials.ok) {
    return result.result;
  }
  throw Error(
    `Failed to get container credentials: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`,
  );
}

// The Cloudflare managed registry is special in that the namespaces for repos should always
// start with the Cloudflare Account tag
// This is a helper to generate the image tag with correct namespace attached to the Cloudflare Registry host
export const getCloudflareRegistryWithAccountNamespace = (
  accountID: string,
  tag: string,
): string => {
  return `${getCloudflareContainerRegistry()}/${accountID}/${tag}`;
};

// default cloudflare managed registry, can be overriden with the env var - CLOUDFLARE_CONTAINER_REGISTRY
export const getCloudflareContainerRegistry = () => {
  // previously defaulted to registry.cloudchamber.cfdata.org
  return process.env.CLOUDFLARE_CONTAINER_REGISTRY ?? "registry.cloudflare.com";
};

/**
 * Given a container image that is a registry link, this function
 * returns true if the link points the Cloudflare container registry
 * (defined as per `getCloudflareContainerRegistry` above)
 */
export function isCloudflareRegistryLink(image: string) {
  const cfRegistry = getCloudflareContainerRegistry();
  return image.includes(cfRegistry);
}

/** Prefixes with the cloudflare-dev namespace. The name should be the container's DO classname, and the tag a build uuid. */
export const getDevContainerImageName = (name: string, tag: string) => {
  return `${MF_DEV_CONTAINER_PREFIX}/${name.toLowerCase()}:${tag}`;
};

export const MF_DEV_CONTAINER_PREFIX = "cloudflare-dev";

export interface ContainerIdentity {
  account_id: string;
  external_account_id: string;
  legacy_identity: string;
  capabilities: string[];
  limits: {
    account_id: string;
    vcpu_per_deployment: number;
    memory_mib_per_deployment: number;
    memory_per_deployment: string;
    disk_per_deployment: string;
    disk_mb_per_deployment: number;
    total_vcpu: number;
    total_memory_mib: number;
    node_group: string;
    ipv4s: number;
    network_modes: string[];
    total_disk_mb: number;
    total_memory: string;
  };
  locations: any[];
  defaults: {
    vcpus: number;
    memory_mib: number;
    memory: string;
    disk_mb: number;
  };
}

export async function getContainerIdentity(api: CloudflareApi) {
  const metrics = await api.get(`/accounts/${api.accountId}/containers/me`);
  const result = (await metrics.json()) as {
    result: ContainerIdentity;
    errors: { message: string }[];
  };
  if (metrics.ok) {
    return result.result;
  }
  throw Error(
    `Failed to get container me: ${result.errors.map((e: { message: string }) => e.message).join(", ")}`,
  );
}

/**
 * Duration string. From Go documentation:
 * A string representing the duration in the form "3d1h3m". Leading zero units are omitted.
 * As a special case, durations less than one second format use a smaller unit (milli-, micro-, or nanoseconds)
 * to ensure that the leading digit is non-zero.
 */
export type Duration = string;

interface DeploymentObservability {
  logs?: {
    enabled: boolean;
  };
}

export type DeploymentConfiguration = {
  /**
   * The image to be used for the deployment.
   */
  image: string;
  /**
   * The instance type to be used for the deployment.
   */
  instance_type?: InstanceType;
  /**
   * The observability configuration for the deployment.
   */
  observability?: DeploymentObservability;
  /**
   * A list of SSH public key IDs from the account
   */
  ssh_public_key_ids?: Array<string>;
  /**
   * A list of objects with secret names and the their access types from the account
   */
  secrets?: Array<{
    /**
     * The name of the secret within the container
     */
    name: string;
    type: "env";
    /**
     * Corresponding secret name from the account
     */
    secret: string;
  }>;
  /**
   * Specify the vcpu to be used for the deployment. The default will be the one configured for the account.
   */
  vcpu?: number;
  /**
   * Specify the memory to be used for the deployment. The default will be the one configured for the account.
   */
  memory?: string;
  /**
   * The disk configuration for this deployment
   */
  disk?: {
    size: string;
  };
  /**
   * Container environment variables
   */
  environment_variables?: Array<{
    name: string;
    value: string;
  }>;
  /**
   * Deployment labels
   */
  labels?: Array<{
    name: string;
    value: string;
  }>;
  network?: {
    /**
     * Assign an IPv4 address to the deployment. One of 'none' (default), 'predefined' (allocate one from a set of IPv4 addresses in the global pool), 'account' (allocate one from a set of IPv4 addresses preassigned in the account pool). Only applicable to "public" mode.
     *
     */
    assign_ipv4?: "none" | "predefined" | "account";
    /**
     * Assign an IPv6 address to the deployment. One of 'predefined' (allocate one from a set of IPv6 addresses in the global pool), 'account' (allocate one from a set of IPv6 addresses preassigned in the account pool). The container will always be assigned to an IPv6 if the networking mode is "public".
     *
     */
    assign_ipv6?: "none" | "predefined" | "account";
    mode?: "public" | "private";
  };
  command?: string[];
  entrypoint?: string[];
  dns?: {
    /**
     * List of DNS servers that the deployment will use to resolve domain names. You can only specify a maximum of 3.
     */
    servers?: Array<string>;
    /**
     * The container resolver will append these domains to every resolve query. For example, if you have 'google.com',
     * and your deployment queries 'web', it will append 'google.com' to 'web' in the search query before trying 'web'.
     * Limited to 6 domains.
     */
    searches?: Array<string>;
  };
  ports?: Array<{
    /**
     * The name of the port. The port name should be unique for each deployment. Minimum length of 1 and maximum length of 15. No consecutive dashes. If the name is 'web-ui', the container will receive an environment variable as follows:
     * - CLOUDFLARE_PORT_WEB_UI: Port inside the container
     * - CLOUDFLARE_HOST_PORT_WEB_UI: Port outside the container
     * - CLOUDFLARE_HOST_IP_WEB_UI: Address of the external network interface the port is allocated on
     * - CLOUDFLARE_HOST_ADDR_WEB_UI: CLOUDFLARE_HOST_ADDR_WEB_UI ':' CLOUDFLARE_HOST_PORT_WEB_UI
     *
     */
    name: string;
    /**
     * Optional port number, it's assigned only if the user specified it. If it's not specified, the datacenter scheduler will decide it.
     */
    port?: number;
  }>;
  /**
   * Health and readiness checks for this deployment.
   */
  checks?: Array<{
    /**
     * Optional name for the check. If omitted, a name will be generated automatically.
     */
    name?: string;
    /**
     * The type of check to perform. A TCP check succeeds if it can connect to the provided port. An HTTP check succeeds if it receives a successful HTTP response (2XX)
     */
    type: "http" | "tcp";
    /**
     * Connect to the port using TLS
     */
    tls?: boolean;
    /**
     * The name of the port defined in the "ports" property of the deployment
     */
    port: string;
    /**
     * Configuration for HTTP checks. Only valid when "type" is "http"
     */
    http?: {
      method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
      /**
       * If the method is one of POST, PATCH or PUT, this is required. It's the body that will be passed to the HTTP healthcheck request.
       */
      body?: string;
      /**
       * Path that will be used to perform the healthcheck.
       */
      path?: string;
      /**
       * HTTP headers to include in the request.
       */
      headers?: Record<string, any>;
    };
    /**
     * How often the check should be performed
     */
    interval: Duration;
    /**
     * The amount of time to wait for the check to complete before considering the check to have failed
     */
    timeout: Duration;
    /**
     * Number of times to attempt the check before considering it to have failed
     */
    retries?: number;
    /**
     * The kind of check. A failed "healthy" check affects a deployment's "healthy" status, while a failed "ready" check affects a deployment's "ready" status.
     */
    kind: "health" | "ready";
  }>;
};
