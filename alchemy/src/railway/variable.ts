import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Secret } from "../secret.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isProject, type Project } from "./project.ts";
import { isService, type Service } from "./service.ts";

/**
 * Properties for creating or updating a Railway variable
 */
export interface VariableProps extends RailwayApiOptions {
  /**
   * The project to create the variable in
   */
  project: string | Project;

  /**
   * The environment to create the variable in
   */
  environment: string | Environment;

  /**
   * The service to attach the variable to (optional for shared variables)
   */
  service?: string | Service;

  /**
   * Name of the variable
   */
  name: string;

  /**
   * Value of the variable
   */
  value: string | Secret;

  /**
   * Whether to delete the variable when the resource is destroyed.
   * @default true
   */
  delete?: boolean;
}

/**
 * Output returned after Railway variable creation/update
 */
export interface Variable {
  /**
   * The name of the variable
   */
  name: string;

  /**
   * The value of the variable (wrapped as Secret)
   */
  value: Secret;

  /**
   * The project ID this variable belongs to
   */
  projectId: string;

  /**
   * The environment ID this variable belongs to
   */
  environmentId: string;

  /**
   * The service ID this variable is attached to (if service-specific)
   */
  serviceId?: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface VariableUpsertResponse {
  variableUpsert: boolean;
}

interface VariablesQueryResponse {
  variables: Record<string, string>;
}

/**
 * Type guard for Railway Variable
 */
export function isVariable(resource: any): resource is Variable {
  return resource?.[ResourceKind] === "railway::Variable";
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
function getEnvironmentId(environment: string | Environment): string {
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Get the service ID from a service reference
 */
function getServiceId(
  service: string | Service | undefined,
): string | undefined {
  if (service === undefined) {
    return undefined;
  }
  if (isService(service)) {
    return service.id;
  }
  return service;
}

/**
 * Creates a Railway environment variable.
 *
 * @example
 * // Create a service-specific variable:
 * const dbUrl = await Variable("db-url", {
 *   project: project,
 *   environment: production,
 *   service: apiService,
 *   name: "DATABASE_URL",
 *   value: database.connectionUrl
 * });
 *
 * @example
 * // Create a shared variable (available to all services):
 * const apiKey = await Variable("api-key", {
 *   project: project,
 *   environment: production,
 *   name: "API_KEY",
 *   value: alchemy.secret(process.env.API_KEY)
 * });
 *
 * @example
 * // Use Railway reference syntax:
 * const redisUrl = await Variable("redis-url", {
 *   project: project,
 *   environment: production,
 *   service: apiService,
 *   name: "REDIS_URL",
 *   value: "${{Redis.REDIS_URL}}"
 * });
 */
export const Variable = Resource(
  "railway::Variable",
  async function (
    this: Context<Variable>,
    id: string,
    props: VariableProps,
  ): Promise<Variable> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const serviceId = getServiceId(props.service);
    const value = Secret.unwrap(props.value);

    if (this.phase === "delete") {
      if (props.delete !== false) {
        try {
          await api.request(
            `
            mutation variableDelete($input: VariableDeleteInput!) {
              variableDelete(input: $input)
            }
          `,
            {
              input: {
                projectId,
                environmentId,
                serviceId,
                name: props.name,
              },
            },
          );
        } catch (error) {
          // Ignore 404 errors (variable already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // Upsert the variable (works for both create and update)
    await api.request<VariableUpsertResponse>(
      `
      mutation variableUpsert($input: VariableUpsertInput!) {
        variableUpsert(input: $input)
      }
    `,
      {
        input: {
          projectId,
          environmentId,
          serviceId,
          name: props.name,
          value,
        },
      },
    );

    return {
      name: props.name,
      value: Secret.wrap(props.value),
      projectId,
      environmentId,
      serviceId,
    };
  },
);

/**
 * Fetch all variables for a project/environment/service
 */
export async function getVariables(
  props: RailwayApiOptions & {
    projectId: string;
    environmentId: string;
    serviceId?: string;
  },
): Promise<Record<string, string>> {
  const api = createRailwayApi(props);

  const data = await api.request<VariablesQueryResponse>(
    `
    query variables($projectId: String!, $environmentId: String!, $serviceId: String) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }
  `,
    {
      projectId: props.projectId,
      environmentId: props.environmentId,
      serviceId: props.serviceId,
    },
  );

  return data.variables;
}
