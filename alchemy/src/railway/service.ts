import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isProject, type Project } from "./project.ts";

/**
 * Source configuration for deploying from a GitHub repository
 */
export interface GitHubSource {
  /**
   * GitHub repository in format "owner/repo"
   */
  repo: string;

  /**
   * Branch to deploy from
   * @default main
   */
  branch?: string;
}

/**
 * Source configuration for deploying from a Docker image
 */
export interface DockerSource {
  /**
   * Docker image to deploy (e.g., "nginx:latest")
   */
  image: string;
}

/**
 * Properties for creating or updating a Railway service
 */
export interface ServiceProps extends RailwayApiOptions {
  /**
   * The project to create the service in
   */
  project: string | Project;

  /**
   * The environment to deploy to (if not specified, deploys to all environments)
   */
  environment?: string | Environment;

  /**
   * Name of the service
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Source to deploy from - either a GitHub repo or Docker image
   */
  source?: GitHubSource | DockerSource;

  /**
   * Build command to run before starting the service
   */
  buildCommand?: string;

  /**
   * Command to start the service
   */
  startCommand?: string;

  /**
   * Root directory containing the application code (relative to repo root)
   */
  rootDirectory?: string;

  /**
   * Number of replicas to run
   * @default 1
   */
  numReplicas?: number;

  /**
   * Health check path for HTTP services
   */
  healthcheckPath?: string;

  /**
   * Health check timeout in seconds
   */
  healthcheckTimeout?: number;

  /**
   * Whether to enable the restart policy
   * @default true
   */
  restartPolicyType?: "ON_FAILURE" | "ALWAYS" | "NEVER";

  /**
   * Maximum number of restart retries
   */
  restartPolicyMaxRetries?: number;

  /**
   * When `true`, will adopt an existing service by `name`
   */
  adopt?: true;

  /**
   * Whether to delete the service when the resource is destroyed.
   * @default true
   */
  delete?: boolean;
}

/**
 * Domain associated with a service
 */
export interface ServiceDomain {
  id: string;
  domain: string;
}

/**
 * Output returned after Railway service creation/update
 */
export interface Service {
  /**
   * The ID of the service
   */
  id: string;

  /**
   * Name of the service
   */
  name: string;

  /**
   * The project ID this service belongs to
   */
  projectId: string;

  /**
   * Time at which the service was created
   */
  createdAt: string;

  /**
   * Time at which the service was last updated
   */
  updatedAt: string;

  /**
   * Domains associated with the service
   */
  domains: ServiceDomain[];

  /**
   * Icon for the service (if set)
   */
  icon?: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface ServiceCreateResponse {
  serviceCreate: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    icon?: string;
  };
}

interface ServiceUpdateResponse {
  serviceUpdate: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    icon?: string;
  };
}

interface ServiceQueryResponse {
  service: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
    icon?: string;
    serviceDomains: {
      id: string;
      domain: string;
    }[];
  };
}

interface ServicesQueryResponse {
  project: {
    services: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          projectId: string;
          createdAt: string;
          updatedAt: string;
          icon?: string;
          serviceDomains: {
            id: string;
            domain: string;
          }[];
        };
      }>;
    };
  };
}

const SERVICE_FIELDS = `
  id
  name
  projectId
  createdAt
  updatedAt
  icon
`;

/**
 * Type guard for Railway Service
 */
export function isService(resource: any): resource is Service {
  return resource?.[ResourceKind] === "railway::Service";
}

/**
 * Get the project ID from a project reference
 */
function getProjectId(project: string | Project): string {
  if (isProject(project)) {
    return project.id;
  }
  return project;
}

/**
 * Get the environment ID from an environment reference
 */
function getEnvironmentId(
  environment: string | Environment | undefined,
): string | undefined {
  if (environment === undefined) {
    return undefined;
  }
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Check if source is a GitHub source
 */
function isGitHubSource(
  source: GitHubSource | DockerSource | undefined,
): source is GitHubSource {
  return source !== undefined && "repo" in source;
}

/**
 * Check if source is a Docker source
 */
function isDockerSource(
  source: GitHubSource | DockerSource | undefined,
): source is DockerSource {
  return source !== undefined && "image" in source;
}

/**
 * Creates a Railway service for deploying applications.
 *
 * @example
 * // Deploy from a GitHub repository:
 * const api = await Service("api", {
 *   project: project,
 *   source: {
 *     repo: "myorg/api",
 *     branch: "main"
 *   },
 *   startCommand: "npm start"
 * });
 *
 * @example
 * // Deploy from a Docker image:
 * const nginx = await Service("nginx", {
 *   project: project,
 *   source: {
 *     image: "nginx:latest"
 *   }
 * });
 *
 * @example
 * // Deploy with build configuration:
 * const app = await Service("app", {
 *   project: project,
 *   source: { repo: "myorg/app" },
 *   buildCommand: "npm run build",
 *   startCommand: "npm start",
 *   rootDirectory: "packages/api"
 * });
 */
export const Service = Resource(
  "railway::Service",
  async function (
    this: Context<Service>,
    id: string,
    props: ServiceProps,
  ): Promise<Service> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.request(
            `
            mutation serviceDelete($id: String!) {
              serviceDelete(id: $id)
            }
          `,
            { id: this.output.id },
          );
        } catch (error) {
          // Ignore 404 errors (service already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // Handle adoption
    if (this.phase === "create" && props.adopt) {
      const existingService = await findServiceByName(api, projectId, name);
      if (existingService) {
        return existingService;
      }
      // Service not found, continue with creation
    }

    // Update existing service
    if (this.phase === "update" && this.output?.id) {
      // Update the service
      const data = await api.request<ServiceUpdateResponse>(
        `
        mutation serviceUpdate($id: String!, $input: ServiceUpdateInput!) {
          serviceUpdate(id: $id, input: $input) {
            ${SERVICE_FIELDS}
          }
        }
      `,
        {
          id: this.output.id,
          input: {
            name,
          },
        },
      );

      // Update service instance if environment is specified
      if (environmentId) {
        await updateServiceInstance(api, this.output.id, environmentId, props);
      }

      // Fetch domains
      const serviceData = await fetchService(api, this.output.id);

      return {
        id: data.serviceUpdate.id,
        name: data.serviceUpdate.name,
        projectId: data.serviceUpdate.projectId,
        createdAt: data.serviceUpdate.createdAt,
        updatedAt: data.serviceUpdate.updatedAt,
        icon: data.serviceUpdate.icon,
        domains: serviceData.domains,
      };
    }

    // Build source input
    let sourceInput: Record<string, unknown> | undefined;
    if (isGitHubSource(props.source)) {
      sourceInput = {
        repo: props.source.repo,
      };
    } else if (isDockerSource(props.source)) {
      sourceInput = {
        image: props.source.image,
      };
    }

    // Create new service
    const createInput: Record<string, unknown> = {
      name,
      projectId,
    };

    if (sourceInput) {
      createInput.source = sourceInput;
    }

    if (environmentId) {
      createInput.environmentId = environmentId;
    }

    if (props.source && isGitHubSource(props.source) && props.source.branch) {
      createInput.branch = props.source.branch;
    }

    const data = await api.request<ServiceCreateResponse>(
      `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          ${SERVICE_FIELDS}
        }
      }
    `,
      { input: createInput },
    );

    // Update service instance with build/start commands if provided
    if (
      environmentId &&
      (props.buildCommand || props.startCommand || props.rootDirectory)
    ) {
      await updateServiceInstance(
        api,
        data.serviceCreate.id,
        environmentId,
        props,
      );
    }

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
      createdAt: data.serviceCreate.createdAt,
      updatedAt: data.serviceCreate.updatedAt,
      icon: data.serviceCreate.icon,
      domains: [],
    };
  },
);

/**
 * Update service instance configuration
 */
async function updateServiceInstance(
  api: ReturnType<typeof createRailwayApi>,
  serviceId: string,
  environmentId: string,
  props: ServiceProps,
): Promise<void> {
  const input: Record<string, unknown> = {};

  if (props.buildCommand !== undefined) {
    input.buildCommand = props.buildCommand;
  }
  if (props.startCommand !== undefined) {
    input.startCommand = props.startCommand;
  }
  if (props.rootDirectory !== undefined) {
    input.rootDirectory = props.rootDirectory;
  }
  if (props.numReplicas !== undefined) {
    input.numReplicas = props.numReplicas;
  }
  if (props.healthcheckPath !== undefined) {
    input.healthcheckPath = props.healthcheckPath;
  }
  if (props.healthcheckTimeout !== undefined) {
    input.healthcheckTimeout = props.healthcheckTimeout;
  }
  if (props.restartPolicyType !== undefined) {
    input.restartPolicyType = props.restartPolicyType;
  }
  if (props.restartPolicyMaxRetries !== undefined) {
    input.restartPolicyMaxRetries = props.restartPolicyMaxRetries;
  }

  if (Object.keys(input).length === 0) {
    return;
  }

  await api.request(
    `
    mutation serviceInstanceUpdate($serviceId: String!, $environmentId: String!, $input: ServiceInstanceUpdateInput!) {
      serviceInstanceUpdate(serviceId: $serviceId, environmentId: $environmentId, input: $input)
    }
  `,
    {
      serviceId,
      environmentId,
      input,
    },
  );
}

/**
 * Fetch service with domains
 */
async function fetchService(
  api: ReturnType<typeof createRailwayApi>,
  serviceId: string,
): Promise<Service> {
  const data = await api.request<ServiceQueryResponse>(
    `
    query service($id: String!) {
      service(id: $id) {
        ${SERVICE_FIELDS}
        serviceDomains {
          id
          domain
        }
      }
    }
  `,
    { id: serviceId },
  );

  return {
    id: data.service.id,
    name: data.service.name,
    projectId: data.service.projectId,
    createdAt: data.service.createdAt,
    updatedAt: data.service.updatedAt,
    icon: data.service.icon,
    domains: data.service.serviceDomains.map((d) => ({
      id: d.id,
      domain: d.domain,
    })),
  };
}

/**
 * Find service by name in a project
 */
async function findServiceByName(
  api: ReturnType<typeof createRailwayApi>,
  projectId: string,
  name: string,
): Promise<Service | null> {
  const data = await api.request<ServicesQueryResponse>(
    `
    query services($projectId: String!) {
      project(id: $projectId) {
        services {
          edges {
            node {
              ${SERVICE_FIELDS}
              serviceDomains {
                id
                domain
              }
            }
          }
        }
      }
    }
  `,
    { projectId },
  );

  const matchingService = data.project.services.edges.find(
    (edge) => edge.node.name === name,
  );

  if (!matchingService) {
    return null;
  }

  const service = matchingService.node;
  return {
    id: service.id,
    name: service.name,
    projectId: service.projectId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    icon: service.icon,
    domains: service.serviceDomains.map((d) => ({
      id: d.id,
      domain: d.domain,
    })),
  };
}

/**
 * Reference an existing Railway service by ID
 */
export async function ServiceRef(
  props: RailwayApiOptions & { serviceId: string },
): Promise<Service> {
  const api = createRailwayApi(props);
  return fetchService(api, props.serviceId);
}
