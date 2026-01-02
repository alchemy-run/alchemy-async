import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  extractResult,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";

/**
 * Properties for creating or updating a Railway project
 */
export interface ProjectProps extends RailwayApiOptions {
  /**
   * When `true`, will adopt an existing project by `name`
   */
  adopt?: true;

  /**
   * Whether to delete the project when the resource is destroyed.
   * @default true, unless the resource was adopted
   */
  delete?: boolean;

  /**
   * Name of the project
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Description of the project
   */
  description?: string;

  /**
   * Whether the project is public
   * @default false
   */
  isPublic?: boolean;

  /**
   * Team ID to create the project in (for team tokens)
   */
  teamId?: string;
}

/**
 * A Railway environment within a project
 */
export interface ProjectEnvironment {
  id: string;
  name: string;
}

/**
 * Output returned after Railway project creation/update
 */
export interface Project {
  /**
   * The ID of the project
   */
  id: string;

  /**
   * Name of the project
   */
  name: string;

  /**
   * Description of the project
   */
  description: string;

  /**
   * Whether the project is public
   */
  isPublic: boolean;

  /**
   * Time at which the project was created
   */
  createdAt: string;

  /**
   * Time at which the project was last updated
   */
  updatedAt: string;

  /**
   * Environments in the project
   */
  environments: ProjectEnvironment[];

  /**
   * Team ID if the project belongs to a team
   */
  teamId?: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface ProjectCreateResponse {
  projectCreate: {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    teamId?: string;
    environments: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
  };
}

interface ProjectUpdateResponse {
  projectUpdate: {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    teamId?: string;
    environments: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
  };
}

interface ProjectQueryResponse {
  project: {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    createdAt: string;
    updatedAt: string;
    teamId?: string;
    environments: {
      edges: Array<{
        node: {
          id: string;
          name: string;
        };
      }>;
    };
  };
}

interface ProjectsQueryResponse {
  projects: {
    edges: Array<{
      node: {
        id: string;
        name: string;
        description: string;
        isPublic: boolean;
        createdAt: string;
        updatedAt: string;
        teamId?: string;
        environments: {
          edges: Array<{
            node: {
              id: string;
              name: string;
            };
          }>;
        };
      };
    }>;
  };
}

const PROJECT_FIELDS = `
  id
  name
  description
  isPublic
  createdAt
  updatedAt
  teamId
  environments {
    edges {
      node {
        id
        name
      }
    }
  }
`;

/**
 * Type guard for Railway Project
 */
export function isProject(resource: any): resource is Project {
  return resource?.[ResourceKind] === "railway::Project";
}

/**
 * Creates a Railway project for deploying services.
 *
 * @example
 * // Create a basic Railway project:
 * const project = await Project("my-project", {
 *   name: "My App"
 * });
 *
 * @example
 * // Adopt an existing Railway project by name:
 * const project = await Project("my-project", {
 *   adopt: true,
 *   name: "existing-project-name",
 * });
 *
 * @example
 * // Create a project with description:
 * const project = await Project("my-project", {
 *   name: "My App",
 *   description: "Production application",
 *   apiToken: alchemy.secret(process.env.RAILWAY_API_TOKEN)
 * });
 */
export const Project = Resource(
  "railway::Project",
  async function (
    this: Context<Project>,
    id: string,
    props: ProjectProps,
  ): Promise<Project> {
    const api = createRailwayApi(props);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.request(
            `
            mutation projectDelete($id: String!) {
              projectDelete(id: $id)
            }
          `,
            { id: this.output.id },
          );
        } catch (error) {
          // Ignore 404 errors (project already deleted)
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
      const existingProject = await findProjectByName(api, name, props.teamId);
      if (existingProject) {
        return existingProject;
      }
      // Project not found, continue with creation
    }

    // Update existing project
    if (this.phase === "update" && this.output?.id) {
      const data = await api.request<ProjectUpdateResponse>(
        `
        mutation projectUpdate($id: String!, $input: ProjectUpdateInput!) {
          projectUpdate(id: $id, input: $input) {
            ${PROJECT_FIELDS}
          }
        }
      `,
        {
          id: this.output.id,
          input: {
            name,
            description: props.description ?? "",
            isPublic: props.isPublic ?? false,
          },
        },
      );

      const project = data.projectUpdate;
      return {
        id: project.id,
        name: project.name,
        description: project.description,
        isPublic: project.isPublic,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        teamId: project.teamId,
        environments: project.environments.edges.map((e) => ({
          id: e.node.id,
          name: e.node.name,
        })),
      };
    }

    // Create new project
    const data = await api.request<ProjectCreateResponse>(
      `
      mutation projectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          ${PROJECT_FIELDS}
        }
      }
    `,
      {
        input: {
          name,
          description: props.description ?? "",
          isPublic: props.isPublic ?? false,
          teamId: props.teamId,
        },
      },
    );

    const project = data.projectCreate;
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      isPublic: project.isPublic,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      teamId: project.teamId,
      environments: project.environments.edges.map((e) => ({
        id: e.node.id,
        name: e.node.name,
      })),
    };
  },
);

/**
 * Reference an existing Railway project by ID
 */
export async function ProjectRef(
  props: RailwayApiOptions & { projectId: string },
): Promise<Project> {
  const api = createRailwayApi(props);

  const data = await api.request<ProjectQueryResponse>(
    `
    query project($id: String!) {
      project(id: $id) {
        ${PROJECT_FIELDS}
      }
    }
  `,
    { id: props.projectId },
  );

  const project = data.project;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    isPublic: project.isPublic,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    teamId: project.teamId,
    environments: project.environments.edges.map((e) => ({
      id: e.node.id,
      name: e.node.name,
    })),
  };
}

async function findProjectByName(
  api: ReturnType<typeof createRailwayApi>,
  name: string,
  teamId?: string,
): Promise<Project | null> {
  const data = await api.request<ProjectsQueryResponse>(
    `
    query projects($teamId: String) {
      projects(teamId: $teamId) {
        edges {
          node {
            ${PROJECT_FIELDS}
          }
        }
      }
    }
  `,
    { teamId },
  );

  const matchingProject = data.projects.edges.find(
    (edge) => edge.node.name === name,
  );

  if (!matchingProject) {
    return null;
  }

  const project = matchingProject.node;
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    isPublic: project.isPublic,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    teamId: project.teamId,
    environments: project.environments.edges.map((e) => ({
      id: e.node.id,
      name: e.node.name,
    })),
  };
}
