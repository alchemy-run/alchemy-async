import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isProject, type Project } from "./project.ts";

/**
 * Properties for creating or updating a Railway environment
 */
export interface EnvironmentProps extends RailwayApiOptions {
  /**
   * The project to create the environment in
   */
  project: string | Project;

  /**
   * Name of the environment
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Source environment ID to copy configuration from
   * If not provided, creates an empty environment
   */
  sourceEnvironmentId?: string;

  /**
   * Whether to delete the environment when the resource is destroyed.
   * @default true
   */
  delete?: boolean;
}

/**
 * Output returned after Railway environment creation/update
 */
export interface Environment {
  /**
   * The ID of the environment
   */
  id: string;

  /**
   * Name of the environment
   */
  name: string;

  /**
   * The project ID this environment belongs to
   */
  projectId: string;

  /**
   * Time at which the environment was created
   */
  createdAt: string;

  /**
   * Time at which the environment was last updated
   */
  updatedAt: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface EnvironmentCreateResponse {
  environmentCreate: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface EnvironmentQueryResponse {
  environment: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };
}

const ENVIRONMENT_FIELDS = `
  id
  name
  projectId
  createdAt
  updatedAt
`;

/**
 * Type guard for Railway Environment
 */
export function isEnvironment(resource: any): resource is Environment {
  return resource?.[ResourceKind] === "railway::Environment";
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
 * Creates a Railway environment for deploying services to different stages.
 *
 * @example
 * // Create a staging environment:
 * const staging = await Environment("staging", {
 *   project: project,
 *   name: "staging"
 * });
 *
 * @example
 * // Create an environment from an existing one:
 * const preview = await Environment("preview", {
 *   project: project,
 *   name: "preview",
 *   sourceEnvironmentId: production.id
 * });
 */
export const Environment = Resource(
  "railway::Environment",
  async function (
    this: Context<Environment>,
    id: string,
    props: EnvironmentProps,
  ): Promise<Environment> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.request(
            `
            mutation environmentDelete($id: String!) {
              environmentDelete(id: $id)
            }
          `,
            { id: this.output.id },
          );
        } catch (error) {
          // Ignore 404 errors (environment already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // Updates to environments are limited - name changes require delete/create
    if (this.phase === "update" && this.output?.id) {
      // Check if name changed (requires replacement)
      if (this.output.name !== name) {
        return this.replace();
      }
      // No other updatable fields, return current state
      return this.output;
    }

    // Create new environment
    const data = await api.request<EnvironmentCreateResponse>(
      `
      mutation environmentCreate($input: EnvironmentCreateInput!) {
        environmentCreate(input: $input) {
          ${ENVIRONMENT_FIELDS}
        }
      }
    `,
      {
        input: {
          name,
          projectId,
          sourceEnvironmentId: props.sourceEnvironmentId,
        },
      },
    );

    const env = data.environmentCreate;
    return {
      id: env.id,
      name: env.name,
      projectId: env.projectId,
      createdAt: env.createdAt,
      updatedAt: env.updatedAt,
    };
  },
);

/**
 * Reference an existing Railway environment by ID
 */
export async function EnvironmentRef(
  props: RailwayApiOptions & { environmentId: string },
): Promise<Environment> {
  const api = createRailwayApi(props);

  const data = await api.request<EnvironmentQueryResponse>(
    `
    query environment($id: String!) {
      environment(id: $id) {
        ${ENVIRONMENT_FIELDS}
      }
    }
  `,
    { id: props.environmentId },
  );

  const env = data.environment;
  return {
    id: env.id,
    name: env.name,
    projectId: env.projectId,
    createdAt: env.createdAt,
    updatedAt: env.updatedAt,
  };
}
