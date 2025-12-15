import { alchemy } from "../alchemy.ts";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { createNeonApi, type NeonApiOptions } from "./api.ts";
import type { NeonClient } from "./api/sdk.gen.ts";
import type * as neon from "./api/types.gen.ts";
import {
  formatConnectionUri,
  formatRole,
  type NeonConnectionUri,
  type NeonRole,
  waitForOperations,
} from "./utils.ts";

/**
 * A Neon region where projects can be provisioned
 */
export type NeonRegion =
  | "aws-us-east-1"
  | "aws-us-east-2"
  | "aws-us-west-2"
  | "aws-eu-central-1"
  | "aws-eu-west-2"
  | "aws-ap-southeast-1"
  | "aws-ap-southeast-2"
  | "aws-sa-east-1"
  | "azure-eastus2"
  | "azure-westus3"
  | "azure-gwc";

export type NeonPgVersion = 14 | 15 | 16 | 17 | 18;

/**
 * Properties for creating or updating a Neon project
 */
export interface NeonProjectProps extends NeonApiOptions {
  /**
   * When `true`, will adopt an existing project by `name`
   */
  adopt?: true;

  /**
   * Whether to delete the database when the resource is destroyed.
   * When false, the database will only be removed from the state but not deleted via API.
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
   * Region where the project will be provisioned
   * @default "aws-us-east-1"
   */
  region_id?: NeonRegion;

  /**
   * PostgreSQL version to use
   * @default 16
   */
  pg_version?: NeonPgVersion;

  /**
   * Default branch name
   * @default "main"
   */
  default_branch_name?: string;

  /**
   * Settings for the project
   */
  settings?: neon.ProjectSettingsData;

  /**
   * Default endpoint settings for the project
   */
  default_endpoint_settings?: neon.DefaultEndpointSettings;

  /**
   * History retention seconds for the project
   * @default 86400
   */
  history_retention_seconds?: number;
}

/**
 * Output returned after Neon project creation/update
 * IMPORTANT: The interface name MUST match the exported resource name
 */
export interface NeonProject {
  /**
   * The ID of the project
   */
  id: string;

  /**
   * Name of the Project.
   */
  name: string;

  /**
   * Time at which the project was created
   */
  created_at: string;

  /**
   * Time at which the project was last updated
   */
  updated_at: string;

  /**
   * Hostname for proxy access
   */
  proxy_host: string;

  /**
   * Region where the project is provisioned
   */
  region_id: NeonRegion;

  /**
   * Settings for the project
   */
  settings: neon.ProjectSettingsData | undefined;

  /**
   * Default endpoint settings for the project
   */
  default_endpoint_settings: neon.DefaultEndpointSettings | undefined;

  /**
   * History retention seconds for the project
   */
  history_retention_seconds: number;

  /**
   * PostgreSQL version used by the project
   */
  pg_version: NeonPgVersion;

  /**
   * Connection URIs for the databases
   */
  connection_uris: [NeonConnectionUri, ...NeonConnectionUri[]];

  /**
   * Database roles created with the project
   */
  roles: [NeonRole, ...NeonRole[]];

  /**
   * Databases created with the project
   */
  databases: [neon.Database, ...neon.Database[]];

  /**
   * Default branch information
   */
  branch: neon.Branch;

  /**
   * Compute endpoints for the project
   */
  endpoints: [neon.Endpoint, ...neon.Endpoint[]];
}

/**
 * Creates a Neon serverless PostgreSQL project.
 *
 * @example
 * // Create a basic Neon project with default settings:
 * const project = await NeonProject("my-project", {
 *   name: "My Project"
 * });
 *
 * @example
 * // Adopt an existing Neon project by name:
 * const project = await NeonProject("my-project", {
 *   adopt: true
 *   name: "adjective-noun-123",
 * });
 *
 * @example
 * // Create a Neon project in a specific region with a specific PostgreSQL version:
 * const euProject = await NeonProject("my-eu-project", {
 *   name: "My EU Project",
 *   region_id: "aws-eu-west-1",
 *   pg_version: 16,
 *   apiKey: alchemy.secret(process.env.NEON_API_KEY)
 * });
 *
 * @example
 * // Create a Neon project with a custom default branch name:
 * const devProject = await NeonProject("dev-project", {
 *   name: "Development Project",
 *   default_branch_name: "development"
 * });
 */
export const NeonProject = Resource(
  "neon::Project",
  async function (
    this: Context<NeonProject>,
    id: string,
    props: NeonProjectProps,
  ) {
    const api = createNeonApi(props);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    switch (this.phase) {
      case "create": {
        if (props.adopt) {
          try {
            return await fetchProject(api, { ...props, name });
          } catch (error) {
            if (!(error instanceof NeonProjectNotFound)) {
              throw error;
            }
            // project not found, continue with creation
          }
        }

        const { data } = await api.createProject({
          body: {
            project: {
              name,
              region_id: props.region_id,
              pg_version: props.pg_version,
              default_endpoint_settings: props.default_endpoint_settings,
              branch: {
                name: props.default_branch_name,
              },
              settings: props.settings,
              history_retention_seconds: props.history_retention_seconds,
            },
          },
        });

        // Branch and endpoints have fields that are updated after operations are complete.
        await waitForOperations(api, data.operations);
        const [branch, endpoints] = await Promise.all([
          api
            .getProjectBranch({
              path: {
                project_id: data.project.id,
                branch_id: data.branch.id,
              },
            })
            .then((res) => res.data.branch),
          api
            .listProjectEndpoints({
              path: {
                project_id: data.project.id,
              },
            })
            .then((res) => res.data.endpoints),
        ]);

        return {
          id: data.project.id,
          name: data.project.name,
          created_at: data.project.created_at,
          updated_at: data.project.updated_at,
          proxy_host: data.project.proxy_host,
          region_id: data.project.region_id as NeonRegion,
          pg_version: data.project.pg_version as NeonPgVersion,
          settings: data.project.settings,
          default_endpoint_settings: data.project.default_endpoint_settings,
          history_retention_seconds: data.project.history_retention_seconds,
          connection_uris: data.connection_uris.map(formatConnectionUri) as [
            NeonConnectionUri,
            ...NeonConnectionUri[],
          ],
          roles: data.roles.map(formatRole) as [NeonRole, ...NeonRole[]],
          databases: data.databases as [neon.Database, ...neon.Database[]],
          branch,
          endpoints: endpoints as [neon.Endpoint, ...neon.Endpoint[]],
        };
      }
      case "update": {
        const { data } = await api.updateProject({
          path: {
            project_id: this.output.id,
          },
          body: {
            project: {
              name,
              settings: props.settings,
              default_endpoint_settings: props.default_endpoint_settings,
              history_retention_seconds: props.history_retention_seconds,
            },
          },
        });
        return {
          ...this.output,
          name: data.project.name,
          updated_at: data.project.updated_at,
          proxy_host: data.project.proxy_host,
          region_id: data.project.region_id as NeonRegion,
          pg_version: data.project.pg_version as NeonPgVersion,
          settings: data.project.settings,
          default_endpoint_settings: data.project.default_endpoint_settings,
          history_retention_seconds: data.project.history_retention_seconds,
        };
      }

      case "delete": {
        if (props.delete !== false && this.output?.id) {
          const response = await api.deleteProject({
            path: {
              project_id: this.output.id,
            },
            throwOnError: false,
          });
          if (response.error && response.response.status !== 404) {
            throw new Error(
              `Failed to delete project: ${response.error.message}`,
              {
                cause: response.error,
              },
            );
          }
        }
        return this.destroy();
      }
    }
  },
);

/**
 * References an existing Neon project by name. You can use this to reference an existing NeonProject without adopting it.
 *
 * @example
 * const project = await NeonProjectRef({
 *   name: "my-project"
 * });
 *
 * @warning Project names must be unique when referencing existing projects. If multiple projects are found with the same name, an error will be thrown.
 */
export async function NeonProjectRef(
  props: NeonProjectProps & { name: string },
): Promise<NeonProject> {
  return await fetchProject(createNeonApi(props), props);
}

async function fetchProject(
  api: NeonClient,
  props: NeonProjectProps & { name: string },
): Promise<NeonProject> {
  const project = await api
    .listProjects({
      query: { search: props.name },
    })
    .then(({ data: { projects } }) => {
      if (!projects.length) {
        throw new NeonProjectNotFound(props.name);
      }
      if (projects.length > 1) {
        throw new Error(
          `Multiple projects found with name "${props.name}". Name must be unique when referencing existing projects.`,
        );
      }
      return projects[0];
    });
  const endpointsPromise = api
    .listProjectEndpoints({
      path: { project_id: project.id },
    })
    .then((res) => res.data.endpoints as [neon.Endpoint, ...neon.Endpoint[]]);
  const branch = await api
    .listProjectBranches({
      path: { project_id: project.id },
      query: { search: props.default_branch_name ?? "main" },
    })
    .then((res) => {
      if (!res.data.branches.length) {
        throw new Error(
          `Branch ${props.default_branch_name ?? "main"} does not exist in Neon project "${props.name}" (${project.id}).`,
        );
      }
      return res.data.branches[0];
    });
  const rolesPromise = api
    .listProjectBranchRoles({
      path: { project_id: project.id, branch_id: branch.id },
    })
    .then((res) => res.data.roles.map(formatRole) as [NeonRole, ...NeonRole[]]);
  const databases = await api
    .listProjectBranchDatabases({
      path: { project_id: project.id, branch_id: branch.id },
    })
    .then((res) => res.data.databases as [neon.Database, ...neon.Database[]]);
  const [connection_uris, endpoints, roles] = await Promise.all([
    Promise.all(databases.map(fetchConnectionUri)) as Promise<
      [NeonConnectionUri, ...NeonConnectionUri[]]
    >,
    endpointsPromise,
    rolesPromise,
  ]);
  return {
    id: project.id,
    name: project.name,
    created_at: project.created_at,
    updated_at: project.updated_at,
    proxy_host: project.proxy_host,
    region_id: project.region_id as NeonRegion,
    pg_version: project.pg_version as NeonPgVersion,
    settings: project.settings,
    default_endpoint_settings: project.default_endpoint_settings,
    history_retention_seconds: project.history_retention_seconds ?? 86400,
    connection_uris,
    roles,
    databases,
    branch,
    endpoints,
  };

  async function fetchConnectionUri(
    database: neon.Database,
  ): Promise<NeonConnectionUri> {
    const {
      data: { uri },
    } = await api.getConnectionUri({
      path: { project_id: project.id },
      query: {
        branch_id: database.branch_id,
        database_name: database.name,
        role_name: database.owner_name,
        pooled: false, // match default behavior from create endpoint (should this be true?)
      },
    });
    const url = new URL(uri);
    return {
      connection_uri: alchemy.secret(uri),
      connection_parameters: {
        database: database.name,
        host: url.host,
        port: 5432,
        user: url.username,
        password: alchemy.secret(url.password),
      },
    };
  }
}

class NeonProjectNotFound extends Error {
  constructor(name: string) {
    super(`Failed to find existing project "${name}".`);
  }
}
