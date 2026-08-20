import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import {
  hasRailwayErrorPattern,
  runRailwayDeleteMutation,
} from "./delete-retry.ts";

/**
 * Properties for creating or updating a Railway Project
 */
export interface ProjectProps extends RailwayApiOptions {
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
   * The workspace ID to create the project in.
   * Falls back to `RAILWAY_WORKSPACE_ID` env var, then auto-detects the first workspace.
   */
  workspaceId?: string;

  /**
   * Whether to adopt an existing project if one with the same name is found
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the project when removed from Alchemy
   * @default true
   */
  delete?: boolean;
}

/**
 * Output type for a Railway Project
 */
export type Project = Omit<ProjectProps, "adopt" | "delete" | "workspaceId"> & {
  /**
   * The Railway project ID
   */
  projectId: string;

  /**
   * Name of the project
   */
  name: string;

  /**
   * The default environment ID (production)
   */
  defaultEnvironmentId: string;

  /**
   * Time the project was created
   */
  createdAt: string;

  /**
   * Time the project was last updated
   */
  updatedAt: string;
};

/**
 * Type guard for Railway Project
 */
export function isProject(resource: any): resource is Project {
  return resource?.[ResourceKind] === "railway::Project";
}

/**
 * Creates and manages a Railway project.
 *
 * @example
 * ## Create a basic project
 *
 * Create a new Railway project with default settings.
 *
 * ```ts
 * const project = await Project("my-project", {
 *   name: "My App",
 * });
 * ```
 *
 * @example
 * ## Create a project with description
 *
 * Create a Railway project with a description.
 *
 * ```ts
 * const project = await Project("my-project", {
 *   name: "My App",
 *   description: "Production application",
 * });
 * ```
 *
 * @example
 * ## Adopt an existing project
 *
 * Adopt a project that already exists in Railway.
 *
 * ```ts
 * const project = await Project("my-project", {
 *   name: "existing-project-name",
 *   adopt: true,
 * });
 * ```
 */
export const Project = Resource(
  "railway::Project",
  async function (
    this: Context<Project>,
    id: string,
    props: ProjectProps,
  ): Promise<Project> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);
    const adopt = props.adopt ?? this.scope.adopt;

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        projectId: this.output?.projectId ?? "",
        name,
        description: props.description,
        defaultEnvironmentId: this.output?.defaultEnvironmentId ?? "",
        createdAt: this.output?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      const projectId = this.output?.projectId;
      if (props.delete !== false && projectId) {
        await runRailwayDeleteMutation(() =>
          api.query(
            `mutation projectDelete($id: String!) {
              projectDelete(id: $id)
            }`,
            { id: projectId },
          ),
        );
      }
      return this.destroy();
    }

    if (this.output?.projectId) {
      // Update
      const data = await api.query<{
        projectUpdate: {
          id: string;
          name: string;
          description: string;
          updatedAt: string;
        };
      }>(
        `mutation projectUpdate($id: String!, $input: ProjectUpdateInput!) {
          projectUpdate(id: $id, input: $input) {
            id
            name
            description
            updatedAt
          }
        }`,
        {
          id: this.output.projectId,
          input: {
            name,
            description: props.description ?? null,
          },
        },
      );

      return {
        projectId: this.output.projectId,
        defaultEnvironmentId: this.output.defaultEnvironmentId,
        createdAt: this.output.createdAt,
        name: data.projectUpdate.name,
        description: data.projectUpdate.description,
        updatedAt: data.projectUpdate.updatedAt,
      };
    }

    // Create

    let project: ProjectFragment | undefined;

    if (adopt) {
      project = await findProjectByName(api, name);
    }

    if (!project) {
      const workspaceId = await resolveWorkspaceId(api, props.workspaceId);
      project = await createProject(api, {
        name,
        description: props.description,
        workspaceId,
      });
    }

    const defaultEnv = project.environments.edges.find(
      (e) => e.node.name === "production",
    );

    return {
      projectId: project.id,
      name: project.name,
      description: project.description,
      defaultEnvironmentId:
        defaultEnv?.node.id ?? project.environments.edges[0]?.node.id ?? "",
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  },
);

const PROJECT_FRAGMENT = `
  id
  name
  description
  createdAt
  updatedAt
  environments {
    edges {
      node {
        id
        name
      }
    }
  }
`;

interface ProjectFragment {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  environments: {
    edges: Array<{ node: { id: string; name: string } }>;
  };
}

async function findProjectByName(
  api: RailwayApi,
  name: string,
): Promise<ProjectFragment | undefined> {
  const data = await api.query<{
    projects: {
      edges: Array<{
        node: ProjectFragment;
      }>;
    };
  }>(
    `query {
      projects {
        edges {
          node {
            ${PROJECT_FRAGMENT}
          }
        }
      }
    }`,
  );
  return data.projects.edges.find((e) => e.node.name === name)?.node;
}

async function createProject(
  api: RailwayApi,
  input: { name: string; description: string | undefined; workspaceId: string },
): Promise<ProjectFragment> {
  return await withExponentialBackoff(
    async () => {
      const data = await api.query<{
        projectCreate: ProjectFragment;
      }>(
        `mutation projectCreate($input: ProjectCreateInput!) {
    projectCreate(input: $input) {
      ${PROJECT_FRAGMENT}
    }
  }`,
        { input },
      );
      return data.projectCreate;
    },
    // handle "Whoa there pal! Only one project can be created per user every 30s. Try again in a sec"
    (error) => hasRailwayErrorPattern(error, ["try again in a sec"]),
    10,
    5000,
  );
}

async function resolveWorkspaceId(
  api: RailwayApi,
  workspaceId?: string,
): Promise<string> {
  if (workspaceId) return workspaceId;

  const envWorkspaceId = process.env.RAILWAY_WORKSPACE_ID;
  if (envWorkspaceId) return envWorkspaceId;

  const data = await api.query<{
    me: {
      workspaces: Array<{ id: string; name: string }>;
    };
  }>(
    `query {
      me {
        workspaces {
          id
          name
        }
      }
    }`,
  );

  if (!data.me.workspaces.length) {
    throw new Error(
      "No Railway workspaces found. Create a workspace or provide a workspaceId.",
    );
  }

  return data.me.workspaces[0].id;
}
