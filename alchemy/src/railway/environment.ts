import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Project } from "./project.ts";

/**
 * Properties for creating or updating a Railway Environment
 */
export interface EnvironmentProps extends RailwayApiOptions {
  /**
   * The project this environment belongs to
   */
  project: string | Project;

  /**
   * Name of the environment
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Whether to adopt an existing environment if one with the same name is found
   * @default false
   */
  adopt?: boolean;
}

/**
 * Output type for a Railway Environment
 */
export type Environment = Omit<EnvironmentProps, "adopt" | "project"> & {
  /**
   * The Railway environment ID
   */
  environmentId: string;

  /**
   * The project ID this environment belongs to
   */
  projectId: string;

  /**
   * Name of the environment
   */
  name: string;

  /**
   * Time the environment was created
   */
  createdAt: string;

  /**
   * Time the environment was last updated
   */
  updatedAt: string;
};

/**
 * Type guard for Railway Environment
 */
export function isEnvironment(resource: any): resource is Environment {
  return resource?.[ResourceKind] === "railway::Environment";
}

/**
 * Creates and manages a Railway environment within a project.
 *
 * @example
 * ## Create a staging environment
 *
 * Create a new environment in a Railway project.
 *
 * ```ts
 * const project = await Project("my-project", { name: "My App" });
 * const staging = await Environment("staging", {
 *   project,
 *   name: "staging",
 * });
 * ```
 *
 * @example
 * ## Create an environment with project ID
 *
 * Reference a project by its ID string.
 *
 * ```ts
 * const env = await Environment("dev", {
 *   project: "project-id-123",
 *   name: "development",
 * });
 * ```
 */
export const Environment = Resource(
  "railway::Environment",
  async function (
    this: Context<Environment>,
    id: string,
    props: EnvironmentProps,
  ): Promise<Environment> {
    const projectId =
      typeof props.project === "string"
        ? props.project
        : props.project.projectId;
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        environmentId: this.output?.environmentId ?? "",
        projectId,
        name,
        createdAt: this.output?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      const environmentId = this.output?.environmentId;
      if (environmentId) {
        await runRailwayDeleteMutation(() =>
          api.query(
            `mutation environmentDelete($id: String!) {
              environmentDelete(id: $id)
            }`,
            { id: environmentId },
          ),
        );
      }
      return this.destroy();
    }

    // Name is immutable — replace if changed
    if (this.phase === "update" && this.output?.name !== name) {
      return this.replace();
    }

    const environmentId = this.output?.environmentId;

    if (environmentId && this.output) {
      // Update — name is immutable, so just return current state
      return this.output;
    }

    // Create
    const adopt = props.adopt ?? this.scope.adopt;
    if (adopt) {
      const existing = await findEnvironmentByName(api, projectId, name);
      if (existing) {
        return existing;
      }
    }

    const data = await api.query<{
      environmentCreate: {
        id: string;
        name: string;
        createdAt: string;
        updatedAt: string;
      };
    }>(
      `mutation environmentCreate($input: EnvironmentCreateInput!) {
        environmentCreate(input: $input) {
          id
          name
          createdAt
          updatedAt
        }
      }`,
      {
        input: {
          name,
          projectId,
        },
      },
    );

    const env = data.environmentCreate;

    return {
      environmentId: env.id,
      projectId,
      name: env.name,
      createdAt: env.createdAt,
      updatedAt: env.updatedAt,
    };
  },
);

async function findEnvironmentByName(
  api: RailwayApi,
  projectId: string,
  name: string,
): Promise<Environment | undefined> {
  const data = await api.query<{
    environments: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          createdAt: string;
          updatedAt: string;
        };
      }>;
    };
  }>(
    `query environments($projectId: String!) {
      environments(projectId: $projectId) {
        edges {
          node {
            id
            name
            createdAt
            updatedAt
          }
        }
      }
    }`,
    { projectId },
  );

  const match = data.environments.edges.find((e) => e.node.name === name);
  if (!match) return undefined;

  return {
    environmentId: match.node.id,
    projectId,
    name: match.node.name,
    createdAt: match.node.createdAt,
    updatedAt: match.node.updatedAt,
  };
}
