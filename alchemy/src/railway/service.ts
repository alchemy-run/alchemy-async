import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { RailwayApi, RailwayError, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Environment } from "./environment.ts";
import type { Project } from "./project.ts";

/**
 * Source configuration for a Railway service
 */
export interface ServiceSource {
  /**
   * GitHub repository URL (e.g. "owner/repo")
   */
  repo?: string;

  /**
   * Docker image to deploy
   */
  image?: string;
}

export type ServiceDeploymentTriggerProvider = "github";

export interface ServiceDeploymentTrigger {
  /**
   * Branch to trigger deployments from (e.g. "main")
   */
  branch: string;

  /**
   * Trigger provider
   *
   * @default "github"
   */
  provider?: ServiceDeploymentTriggerProvider;

  /**
   * Repository to watch (owner/repo). Defaults to source.repo.
   */
  repository?: string;

  /**
   * Optional root directory for trigger-scoped builds.
   */
  rootDirectory?: string;

  /**
   * Whether to require check suites on trigger.
   */
  checkSuites?: boolean;
}

/**
 * Properties for creating or updating a Railway Service
 */
export interface ServiceProps extends RailwayApiOptions {
  /**
   * The project this service belongs to
   */
  project: string | Project;

  /**
   * Name of the service
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Source configuration (repo or image)
   */
  source?: ServiceSource;

  /**
   * Deployment trigger configuration for repository-based deployments.
   */
  deploymentTrigger?: ServiceDeploymentTrigger;

  /**
   * Build command for the service
   */
  buildCommand?: string;

  /**
   * Start command for the service
   */
  startCommand?: string;

  /**
   * Healthcheck path
   */
  healthcheckPath?: string;

  /**
   * Number of replicas
   */
  numReplicas?: number;

  /**
   * Cron schedule expression
   */
  cronSchedule?: string;

  /**
   * Region for the service instance
   */
  region?: string;

  /**
   * The environment to configure the service instance in.
   * If not provided, uses the project's default production environment.
   */
  environment?: string | Environment;

  /**
   * Whether to adopt an existing service if one with the same name is found
   * @default false
   */
  adopt?: boolean;
}

/**
 * Output type for a Railway Service
 */
export type Service = Omit<
  ServiceProps,
  "adopt" | "project" | "environment" | "deploymentTrigger"
> & {
  /**
   * The Railway service ID
   */
  serviceId: string;

  /**
   * The project ID this service belongs to
   */
  projectId: string;

  /**
   * The environment ID used for instance config
   */
  environmentId: string;

  /**
   * Name of the service
   */
  name: string;

  /**
   * Time the service was created
   */
  createdAt: string;

  /**
   * Time the service was last updated
   */
  updatedAt: string;

  /**
   * Managed deployment trigger ID
   */
  deploymentTriggerId?: string;

  /**
   * Managed deployment trigger branch
   */
  deploymentTriggerBranch?: string;

  /**
   * Managed deployment trigger provider
   */
  deploymentTriggerProvider?: ServiceDeploymentTriggerProvider;

  /**
   * Managed deployment trigger repository
   */
  deploymentTriggerRepository?: string;
};

/**
 * Type guard for Railway Service
 */
export function isService(resource: any): resource is Service {
  return resource?.[ResourceKind] === "railway::Service";
}

/**
 * Creates and manages a Railway service within a project.
 *
 * @example
 * ## Create a service from a Docker image
 *
 * Deploy a service using a Docker image.
 *
 * ```ts
 * const project = await Project("my-project", { name: "My App" });
 * const service = await Service("api", {
 *   project,
 *   name: "api-service",
 *   source: { image: "nginx:latest" },
 * });
 * ```
 *
 * @example
 * ## Create a service with build and start commands
 *
 * Configure a service with custom commands.
 *
 * ```ts
 * const service = await Service("web", {
 *   project: "project-id",
 *   name: "web-app",
 *   source: { repo: "myorg/myrepo" },
 *   buildCommand: "npm run build",
 *   startCommand: "npm start",
 *   healthcheckPath: "/health",
 *   numReplicas: 2,
 * });
 * ```
 */
export const Service = Resource(
  "railway::Service",
  async function (
    this: Context<Service>,
    id: string,
    props: ServiceProps,
  ): Promise<Service> {
    const projectId =
      typeof props.project === "string"
        ? props.project
        : props.project.projectId;
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const desiredDeploymentTrigger = resolveDesiredDeploymentTrigger(props);

    // Resolve environment ID (without API call for local mode)
    const resolvedEnvironmentId = props.environment
      ? typeof props.environment === "string"
        ? props.environment
        : props.environment.environmentId
      : this.output?.environmentId;

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        serviceId: this.output?.serviceId ?? "",
        projectId,
        environmentId: resolvedEnvironmentId ?? "",
        name,
        source: props.source,
        buildCommand: props.buildCommand,
        startCommand: props.startCommand,
        healthcheckPath: props.healthcheckPath,
        numReplicas: props.numReplicas,
        cronSchedule: props.cronSchedule,
        region: props.region,
        createdAt: this.output?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const api = new RailwayApi(props);

    // Resolve environment ID via API if not provided
    let environmentId: string;
    if (resolvedEnvironmentId) {
      environmentId = resolvedEnvironmentId;
    } else {
      // Get the default production environment
      environmentId = await getDefaultEnvironmentId(api, projectId);
    }

    if (this.phase === "delete") {
      const serviceId = this.output?.serviceId;
      if (serviceId) {
        await runRailwayDeleteMutation(() =>
          api.query(
            `mutation serviceDelete($id: String!) {
              serviceDelete(id: $id)
            }`,
            { id: serviceId },
          ),
        );
      }
      return this.destroy();
    }

    const serviceId = this.output?.serviceId;

    if (serviceId && this.output) {
      // Source is immutable — replace if changed
      // Guard: if prevSource is undefined (old state format), skip comparison
      const prevSource = this.output.source;
      if (
        prevSource &&
        props.source &&
        (props.source.repo !== prevSource.repo ||
          props.source.image !== prevSource.image)
      ) {
        return this.replace();
      }

      // Update service name only if changed
      let updatedAt = this.output.updatedAt;
      if (name !== this.output.name) {
        const data = await api.query<{
          serviceUpdate: { id: string; updatedAt: string };
        }>(
          `mutation serviceUpdate($id: String!, $input: ServiceUpdateInput!) {
            serviceUpdate(id: $id, input: $input) {
              id
              updatedAt
            }
          }`,
          {
            id: serviceId,
            input: { name },
          },
        );
        updatedAt = data.serviceUpdate.updatedAt;
      }

      // Update service instance config
      await updateServiceInstance(api, serviceId, environmentId, props);

      let managedDeploymentTrigger: ManagedDeploymentTriggerOutput | undefined;
      if (desiredDeploymentTrigger) {
        managedDeploymentTrigger = await reconcileDeploymentTrigger({
          api,
          serviceId,
          projectId,
          environmentId,
          desired: desiredDeploymentTrigger,
          previousTriggerId: this.output.deploymentTriggerId,
        });
      } else if (this.output.deploymentTriggerId) {
        await deleteDeploymentTrigger(api, this.output.deploymentTriggerId);
      }

      return {
        serviceId: this.output.serviceId,
        projectId: this.output.projectId,
        environmentId: this.output.environmentId,
        createdAt: this.output.createdAt,
        updatedAt,
        name,
        source: props.source,
        buildCommand: props.buildCommand,
        startCommand: props.startCommand,
        healthcheckPath: props.healthcheckPath,
        numReplicas: props.numReplicas,
        cronSchedule: props.cronSchedule,
        region: props.region,
        ...toDeploymentTriggerOutput(managedDeploymentTrigger),
      };
    }

    // Create
    const adopt = props.adopt ?? this.scope.adopt;
    if (adopt) {
      const existing = await findServiceByName(api, projectId, name);
      if (existing) {
        // Update instance config on adopt
        await updateServiceInstance(
          api,
          existing.serviceId,
          environmentId,
          props,
        );

        const managedDeploymentTrigger = desiredDeploymentTrigger
          ? await reconcileDeploymentTrigger({
              api,
              serviceId: existing.serviceId,
              projectId,
              environmentId,
              desired: desiredDeploymentTrigger,
            })
          : undefined;

        return {
          ...existing,
          environmentId,
          source: props.source,
          buildCommand: props.buildCommand,
          startCommand: props.startCommand,
          healthcheckPath: props.healthcheckPath,
          numReplicas: props.numReplicas,
          cronSchedule: props.cronSchedule,
          region: props.region,
          ...toDeploymentTriggerOutput(managedDeploymentTrigger),
        };
      }
    }

    const input: Record<string, any> = {
      name,
      projectId,
    };

    if (props.source?.repo) {
      input.source = { repo: props.source.repo };
    } else if (props.source?.image) {
      input.source = { image: props.source.image };
    }

    let service: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
    };

    try {
      const data = await api.query<{
        serviceCreate: {
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
        };
      }>(
        `mutation serviceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
            name
            createdAt
            updatedAt
          }
        }`,
        { input },
      );
      service = data.serviceCreate;
    } catch (error) {
      // If the service already exists and adopt is enabled, fall back to adopting
      if (adopt && isServiceAlreadyExistsError(error)) {
        const existing = await findServiceByName(api, projectId, name);
        if (existing) {
          await updateServiceInstance(
            api,
            existing.serviceId,
            environmentId,
            props,
          );

          const managedDeploymentTrigger = desiredDeploymentTrigger
            ? await reconcileDeploymentTrigger({
                api,
                serviceId: existing.serviceId,
                projectId,
                environmentId,
                desired: desiredDeploymentTrigger,
              })
            : undefined;

          return {
            ...existing,
            environmentId,
            source: props.source,
            buildCommand: props.buildCommand,
            startCommand: props.startCommand,
            healthcheckPath: props.healthcheckPath,
            numReplicas: props.numReplicas,
            cronSchedule: props.cronSchedule,
            region: props.region,
            ...toDeploymentTriggerOutput(managedDeploymentTrigger),
          };
        }
      }
      throw error;
    }

    // Configure service instance
    await updateServiceInstance(api, service.id, environmentId, props);
    const managedDeploymentTrigger = desiredDeploymentTrigger
      ? await reconcileDeploymentTrigger({
          api,
          serviceId: service.id,
          projectId,
          environmentId,
          desired: desiredDeploymentTrigger,
        })
      : undefined;

    return {
      serviceId: service.id,
      projectId,
      environmentId,
      name: service.name,
      source: props.source,
      buildCommand: props.buildCommand,
      startCommand: props.startCommand,
      healthcheckPath: props.healthcheckPath,
      numReplicas: props.numReplicas,
      cronSchedule: props.cronSchedule,
      region: props.region,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
      ...toDeploymentTriggerOutput(managedDeploymentTrigger),
    };
  },
);

interface DesiredDeploymentTrigger {
  provider: ServiceDeploymentTriggerProvider;
  repository: string;
  branch: string;
  rootDirectory?: string;
  checkSuites?: boolean;
}

interface DeploymentTrigger {
  id: string;
  provider: string;
  repository: string;
  branch: string;
  serviceId?: string | null;
  checkSuites: boolean;
}

interface ManagedDeploymentTriggerOutput {
  id: string;
  provider: ServiceDeploymentTriggerProvider;
  repository: string;
  branch: string;
}

function resolveDesiredDeploymentTrigger(
  props: ServiceProps,
): DesiredDeploymentTrigger | undefined {
  const trigger = props.deploymentTrigger;
  if (!trigger) return undefined;

  const provider = trigger.provider ?? "github";
  if (provider !== "github") {
    throw new Error(
      `Unsupported deployment trigger provider "${provider}". Currently only "github" is supported.`,
    );
  }

  const repository = (trigger.repository ?? props.source?.repo)?.trim();
  if (!repository) {
    throw new Error(
      "deploymentTrigger requires source.repo or deploymentTrigger.repository.",
    );
  }

  const branch = trigger.branch?.trim();
  if (!branch) {
    throw new Error("deploymentTrigger.branch is required.");
  }

  return {
    provider,
    repository,
    branch,
    rootDirectory: trigger.rootDirectory,
    checkSuites: trigger.checkSuites,
  };
}

function toDeploymentTriggerOutput(
  managed: ManagedDeploymentTriggerOutput | undefined,
): Pick<
  Service,
  | "deploymentTriggerId"
  | "deploymentTriggerBranch"
  | "deploymentTriggerProvider"
  | "deploymentTriggerRepository"
> {
  return {
    deploymentTriggerId: managed?.id,
    deploymentTriggerBranch: managed?.branch,
    deploymentTriggerProvider: managed?.provider,
    deploymentTriggerRepository: managed?.repository,
  };
}

async function reconcileDeploymentTrigger({
  api,
  serviceId,
  projectId,
  environmentId,
  desired,
  previousTriggerId,
}: {
  api: RailwayApi;
  serviceId: string;
  projectId: string;
  environmentId: string;
  desired: DesiredDeploymentTrigger;
  previousTriggerId?: string;
}): Promise<ManagedDeploymentTriggerOutput> {
  const triggers = await listServiceRepoTriggers(api, serviceId);
  const previousTrigger = previousTriggerId
    ? triggers.find((trigger) => trigger.id === previousTriggerId)
    : undefined;
  const matchingTrigger = triggers.find(
    (trigger) =>
      trigger.provider === desired.provider &&
      trigger.repository === desired.repository &&
      (!trigger.serviceId || trigger.serviceId === serviceId),
  );
  const managedTrigger = previousTrigger ?? matchingTrigger;

  if (!managedTrigger) {
    return await createDeploymentTrigger(api, {
      serviceId,
      projectId,
      environmentId,
      desired,
    });
  }

  const shouldUpdate =
    managedTrigger.branch !== desired.branch ||
    managedTrigger.repository !== desired.repository ||
    (desired.checkSuites !== undefined &&
      managedTrigger.checkSuites !== desired.checkSuites);

  if (!shouldUpdate) {
    return {
      id: managedTrigger.id,
      branch: managedTrigger.branch,
      provider: desired.provider,
      repository: managedTrigger.repository,
    };
  }

  return await updateDeploymentTrigger(api, managedTrigger.id, desired);
}

async function listServiceRepoTriggers(
  api: RailwayApi,
  serviceId: string,
): Promise<DeploymentTrigger[]> {
  const data = await api.query<{
    service: {
      repoTriggers: {
        edges: Array<{
          node: DeploymentTrigger;
        }>;
      };
    };
  }>(
    `query service($id: String!) {
      service(id: $id) {
        repoTriggers(first: 50) {
          edges {
            node {
              id
              provider
              repository
              branch
              serviceId
              checkSuites
            }
          }
        }
      }
    }`,
    { id: serviceId },
  );

  return data.service.repoTriggers.edges.map((edge) => edge.node);
}

async function createDeploymentTrigger(
  api: RailwayApi,
  {
    serviceId,
    projectId,
    environmentId,
    desired,
  }: {
    serviceId: string;
    projectId: string;
    environmentId: string;
    desired: DesiredDeploymentTrigger;
  },
): Promise<ManagedDeploymentTriggerOutput> {
  const input: Record<string, any> = {
    provider: desired.provider,
    repository: desired.repository,
    branch: desired.branch,
    projectId,
    environmentId,
    serviceId,
  };
  if (desired.rootDirectory !== undefined) {
    input.rootDirectory = desired.rootDirectory;
  }
  if (desired.checkSuites !== undefined) {
    input.checkSuites = desired.checkSuites;
  }

  const data = await api.query<{
    deploymentTriggerCreate: {
      id: string;
      branch: string;
      provider: string;
      repository: string;
    };
  }>(
    `mutation deploymentTriggerCreate($input: DeploymentTriggerCreateInput!) {
      deploymentTriggerCreate(input: $input) {
        id
        branch
        provider
        repository
      }
    }`,
    { input },
  );

  return {
    id: data.deploymentTriggerCreate.id,
    branch: data.deploymentTriggerCreate.branch,
    provider: desired.provider,
    repository: data.deploymentTriggerCreate.repository,
  };
}

async function updateDeploymentTrigger(
  api: RailwayApi,
  triggerId: string,
  desired: DesiredDeploymentTrigger,
): Promise<ManagedDeploymentTriggerOutput> {
  const input: Record<string, any> = {
    branch: desired.branch,
    repository: desired.repository,
  };
  if (desired.rootDirectory !== undefined) {
    input.rootDirectory = desired.rootDirectory;
  }
  if (desired.checkSuites !== undefined) {
    input.checkSuites = desired.checkSuites;
  }

  const data = await api.query<{
    deploymentTriggerUpdate: {
      id: string;
      branch: string;
      provider: string;
      repository: string;
    };
  }>(
    `mutation deploymentTriggerUpdate($id: String!, $input: DeploymentTriggerUpdateInput!) {
      deploymentTriggerUpdate(id: $id, input: $input) {
        id
        branch
        provider
        repository
      }
    }`,
    {
      id: triggerId,
      input,
    },
  );

  return {
    id: data.deploymentTriggerUpdate.id,
    branch: data.deploymentTriggerUpdate.branch,
    provider: desired.provider,
    repository: data.deploymentTriggerUpdate.repository,
  };
}

async function deleteDeploymentTrigger(
  api: RailwayApi,
  triggerId: string,
): Promise<void> {
  await runRailwayDeleteMutation(async () => {
    try {
      await api.query(
        `mutation deploymentTriggerDelete($id: String!) {
          deploymentTriggerDelete(id: $id)
        }`,
        { id: triggerId },
      );
    } catch (error) {
      if (isDeploymentTriggerMissingError(error)) {
        return;
      }
      throw error;
    }
  });
}

function isDeploymentTriggerMissingError(error: unknown): boolean {
  if (!(error instanceof RailwayError)) {
    return false;
  }

  return error.errors.some((e) =>
    /deployment trigger .*not found|could not find deployment trigger|not found/i.test(
      e.message,
    ),
  );
}

async function updateServiceInstance(
  api: RailwayApi,
  serviceId: string,
  environmentId: string,
  props: ServiceProps,
): Promise<void> {
  const input: Record<string, any> = {};
  if (props.buildCommand !== undefined) input.buildCommand = props.buildCommand;
  if (props.startCommand !== undefined) input.startCommand = props.startCommand;
  if (props.healthcheckPath !== undefined)
    input.healthcheckPath = props.healthcheckPath;
  if (props.numReplicas !== undefined) input.numReplicas = props.numReplicas;
  if (props.cronSchedule !== undefined) input.cronSchedule = props.cronSchedule;
  if (props.region !== undefined) input.region = props.region;

  if (Object.keys(input).length === 0) return;

  await api.query(
    `mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }`,
    { serviceId, environmentId, input },
  );
}

async function getDefaultEnvironmentId(
  api: RailwayApi,
  projectId: string,
): Promise<string> {
  const data = await api.query<{
    environments: {
      edges: Array<{ node: { id: string; name: string } }>;
    };
  }>(
    `query environments($projectId: String!) {
      environments(projectId: $projectId) {
        edges {
          node {
            id
            name
          }
        }
      }
    }`,
    { projectId },
  );

  const production = data.environments.edges.find(
    (e) => e.node.name === "production",
  );
  if (production) return production.node.id;

  if (data.environments.edges.length > 0) {
    return data.environments.edges[0].node.id;
  }

  throw new Error(
    `No environments found for project ${projectId}. Create an environment first.`,
  );
}

async function findServiceByName(
  api: RailwayApi,
  projectId: string,
  name: string,
): Promise<
  | Pick<
      Service,
      "serviceId" | "projectId" | "name" | "createdAt" | "updatedAt"
    >
  | undefined
> {
  const data = await api.query<{
    project: {
      services: {
        edges: Array<{
          node: {
            id: string;
            name: string;
            createdAt: string;
            updatedAt: string;
          };
        }>;
      };
    };
  }>(
    `query project($id: String!) {
      project(id: $id) {
        services {
          edges {
            node {
              id
              name
              createdAt
              updatedAt
            }
          }
        }
      }
    }`,
    { id: projectId },
  );

  const match = data.project.services.edges.find((e) => e.node.name === name);
  if (!match) return undefined;

  return {
    serviceId: match.node.id,
    projectId,
    name: match.node.name,
    createdAt: match.node.createdAt,
    updatedAt: match.node.updatedAt,
  };
}


function isServiceAlreadyExistsError(error: unknown): boolean {
  if (!(error instanceof RailwayError)) {
    return false;
  }
  return error.errors.some((e) => /already exists/i.test(e.message));
}
