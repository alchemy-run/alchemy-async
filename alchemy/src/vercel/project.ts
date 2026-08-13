import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { isSecret, type Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { createVercelApi, type VercelApi } from "./api.ts";
import type { VercelEnvironments, VercelFrameworks } from "./vercel.types.ts";

export type EnvironmentVariable = {
  /**
   * The key of the environment variable
   */
  key: string;

  /**
   * The target environment
   */
  target: VercelEnvironments;

  /**
   * The Git branch
   */
  gitBranch?: string;

  /**
   * The type of environment variable.
   *
   * Defaults to `plain` when `value` is a `string`, and `encrypted` when `value` is a `Secret`.
   */
  type?: "encrypted" | "plain" | "sensitive";

  /**
   * The value of the environment variable
   */
  value: Secret | string;
} & (
  | { type?: "plain" | "system"; value: string }
  | { type?: "encrypted" | "sensitive"; value: Secret }
);

/**
 * Properties for creating or updating a Project
 */
export interface ProjectProps {
  /**
   * The desired name for the project
   *
   * Maximum length: `100`
   * Example: `a-project-name`
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Opt-in to preview toolbar on the project level
   */
  enablePreviewFeedback?: boolean;

  /**
   * Opt-in to production toolbar on the project level
   */
  enableProductionFeedback?: boolean;

  /**
   * The build command for this project. When `null` is used this value will be automatically detected
   */
  buildCommand?: string;

  commandForIgnoringBuildStep?: string;

  /**
   * The dev command for this project. When `null` is used this value will be automatically detected
   */
  devCommand?: string;

  /**
   * Collection of ENV Variables the Project will use
   */
  environmentVariables?: Array<EnvironmentVariable>;

  /**
   * The framework that is being used for this project. When `null` is used no framework is selected
   */
  framework?: VercelFrameworks;

  /**
   * The Git Repository that will be connected to the project. When this is defined, any pushes to the specified connected Git Repository will be automatically deployed
   */
  gitRepository?: {
    /**
     * The Git Provider of the repository
     */
    type: "github" | "gitlab" | "bitbucket";

    /**
     * The name of the git repository. For example: `vercel/next.js`
     */
    repo: string;
  };

  /**
   * The install command for this project. When `null` is used this value will be automatically detected
   */
  installCommand?: string;

  /**
   * The output directory of the build. When `null` is used this value will be automatically detected
   */
  outputDirectory?: string;

  /**
   * Specifies whether the source code and logs of the deployments for this project should be public or not
   */
  publicSource?: boolean;

  /**
   * The name of a directory or relative path to the source code of your project. When `null` is used it will default to the project root
   */
  rootDirectory?: string;

  /**
   * The region to deploy Serverless Functions in this project
   */
  serverlessFunctionRegion?: string;

  /**
   * Specifies whether Zero Config Failover is enabled for this project.
   */
  serverlessFunctionZeroConfigFailover?: boolean;

  /**
   * OpenID Connect JSON Web Token generation configuration.
   */
  oidcTokenConfig?: {
    /**
     * Whether or not to generate OpenID Connect JSON Web Tokens.
     */
    enabled: boolean;

    /**
     * team: `https://oidc.vercel.com/[team_slug]` global: `https://oidc.vercel.com`
     */
    issuerMode: "team" | "global";
  };

  /**
   * Opt-in to skip deployments when there are no changes to the root directory and its dependencies
   */
  enableAffectedProjectsDeployments?: boolean;

  /**
   * Resource configuration
   */
  resourceConfig?: {
    /**
     * Whether fluid is enabled
     */
    fluid?: boolean;

    /**
     * Default regions for functions
     */
    functionDefaultRegions?: string[];

    /**
     * Default timeout for functions
     */
    functionDefaultTimeout?: number;

    /**
     * Default memory type for functions
     */
    functionDefaultMemoryType?: "standard_legacy" | "standard" | "performance";

    /**
     * Whether function zero config failover is enabled
     */
    functionZeroConfigFailover?: boolean;

    /**
     * Whether elastic concurrency is enabled
     */
    elasticConcurrencyEnabled?: boolean;

    /**
     * The build machine type
     */
    buildMachineType?: "enhanced" | "ultra";
  };
}

/**
 * Output returned after Project creation/update
 */
export interface Project extends ProjectProps {
  /**
   * The ID of the project
   */
  id: string;

  /**
   * The name for the project
   */
  name: string;

  /**
   * The account ID that the project belongs to
   */
  accountId: string;

  /**
   * The time at which the project was created
   */
  createdAt: number;

  /**
   * The time at which the project was last updated
   */
  updatedAt: number;

  /**
   * The latest deployment of the project
   */
  latestDeployment?: {
    /**
     * The ID of the deployment
     */
    id: string;

    /**
     * The URL of the deployment
     */
    url: string;
  };
}

const decryptEnvironmentVariable = (envVar: EnvironmentVariable) => {
  let { type, value } = envVar;

  // Decrypt Secret & default `type`
  if (isSecret(value)) {
    value = value.unencrypted;
    type ??= "encrypted";
  } else {
    // Otherwise, default to `plain`
    type ??= "plain";
  }

  return { ...envVar, type, value };
};

/**
 * Create and manage Vercel projects.
 *
 * @example
 * // With accessToken
 * const project = await Project("my-app", {
 *   accessToken: alchemy.secret(process.env.VERCEL_ACCESS_TOKEN),
 *   name: "my-app",
 *   framework: "astro",
 * });
 *
 * @example
 * // With GitHub
 * const project = await Project("my-app", {
 *   name: "my-app",
 *   framework: "nextjs",
 *   gitRepository: {
 *     type: "github",
 *     repo: "username/my-app",
 *   },
 * });
 *
 * @example
 * // With plain text environment variable
 * const project = await Project("my-app", {
 *   name: "my-app",
 *   environmentVariables: [
 *     {
 *       key: "PUBLIC_URL",
 *       target: ["production", "preview", "development"],
 *       value: "https://example.com",
 *     },
 *   ],
 * });
 *
 * @example
 * // With encrypted environment variable
 * const project = await Project("my-app", {
 *   name: "my-app",
 *   environmentVariables: [
 *     {
 *       key: "DATABASE_URL",
 *       target: ["production", "preview"],
 *       value: alchemy.secret("DATABASE_URL"),
 *     },
 *   ],
 * });
 *
 * @example
 * // With sensitive environment variable
 * const project = await Project("my-app", {
 *   name: "my-app",
 *   environmentVariables: [
 *     {
 *       key: "DATABASE_URL",
 *       target: ["production", "preview"],
 *       type: "sensitive",
 *       value: alchemy.secret("DATABASE_URL"),
 *     },
 *   ],
 * });
 *
 * @example
 * // With custom build settings
 * const project = await Project("my-app", {
 *   name: "my-app",
 *   buildCommand: "npm run build",
 *   outputDirectory: "dist",
 *   installCommand: "npm install",
 *   devCommand: "npm run dev",
 * });
 */
export const Project = Resource(
  "vercel::Project",
  async function (
    this: Context<Project>,
    id: string,
    { accessToken, ...props }: ProjectProps & { accessToken?: Secret },
  ): Promise<Project> {
    // it's possible that `this.output.name` is undefined because a previous version
    // of alchemy had a bug where it didn't set the name on the output
    // so, we try to find the project by ID and use the name from the API response
    const lookupName = async () => {
      if (!this.output) {
        return undefined;
      } else if (this.output.name) {
        return this.output.name;
      }
      const name = await getProjectName(
        await createVercelApi({
          baseUrl: "https://api.vercel.com/v9",
          accessToken,
        }),
        this.output.id,
      );
      if (name) {
        this.output.name = name;
      }
      return name;
    };

    const projectName =
      props.name ?? (await lookupName()) ?? this.scope.createPhysicalName(id);

    switch (this.phase) {
      case "delete": {
        const api = await createVercelApi({
          baseUrl: "https://api.vercel.com/v9",
          accessToken,
        });

        try {
          if (this.output?.id) {
            await api.delete(`/projects/${this.output.id}`);
          }
        } catch (error) {
          logger.error("Error deleting project:", error);
        }

        return this.destroy();
      }

      case "update": {
        const api = await createVercelApi({
          baseUrl: "https://api.vercel.com/v9",
          accessToken,
        });

        if (!this.output?.id) {
          throw new Error(
            `Cannot update project ${id}: missing previous output.id`,
          );
        }

        const { environmentVariables, ...updateProps }: any = { ...props };
        // 409 Conflict: Can't update these properties, so remove them from the updateProps
        delete updateProps.name;
        delete updateProps.environmentVariables;
        delete updateProps.gitRepository;
        delete updateProps.resourceConfig;

        const response = await api.patch(
          `/projects/${this.output.id}`,
          updateProps,
        );
        const data = (await response.json()) as Project;

        if (environmentVariables) {
          const envApi = await createVercelApi({
            baseUrl: "https://api.vercel.com/v10",
            accessToken,
          });

          await updateEnvironmentVariables(envApi, this.output, props);
        }

        return {
          id: data.id,
          name: projectName,
          accountId: data.accountId,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          latestDeployment: data.latestDeployment,
          ...props,
        };
      }

      case "create": {
        const api = await createVercelApi({
          baseUrl: "https://api.vercel.com/v11",
          accessToken,
        });

        const project = await createProject(api, props);

        return this.create({ ...props, ...project });
      }
    }
  },
);

export async function createProject(api: VercelApi, props: ProjectProps) {
  const response = await api.post("/projects", {
    ...props,
    environmentVariables: props.environmentVariables?.map(
      decryptEnvironmentVariable,
    ),
  });

  const data = (await response.json()) as Project;

  return data;
}

export async function updateEnvironmentVariables(
  api: VercelApi,
  output: Project,
  props: ProjectProps,
) {
  if (!props.environmentVariables) {
    return;
  }

  // Update explicitly set environment variables
  await api.post(
    `/projects/${output.id}/env?upsert=true`,
    props.environmentVariables.map(decryptEnvironmentVariable),
  );

  // Find previous env vars that are not in the new list and delete them
  const { envs } = (await api
    .get(`/projects/${output.id}/env`)
    .then((res) => res.json())) as {
    envs: Array<{ id: string; key: string }>;
  };

  for (const previousEnv of envs) {
    if (
      props.environmentVariables.some(
        (envVar) => envVar.key === previousEnv.key,
      )
    ) {
      continue;
    }

    await api.delete(`/projects/${output.id}/env/${previousEnv.id}`);
  }
}

async function getProjectName(
  api: VercelApi,
  id: string,
): Promise<string | undefined> {
  const response = await api.get(`/v9/projects/${id}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  return ((await response.json()) as { name: string }).name;
}
