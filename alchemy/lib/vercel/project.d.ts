import type { Context } from "../context.ts";
import { type Secret } from "../secret.ts";
import { type VercelApi } from "./api.ts";
type TargetEnvironment = "production" | "preview" | "development";
export type EnvironmentVariable = {
    /**
     * The key of the environment variable
     */
    key: string;
    /**
     * The target environment
     */
    target: TargetEnvironment[];
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
} & ({
    type?: "plain" | "system";
    value: string;
} | {
    type?: "encrypted" | "sensitive";
    value: Secret;
});
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
    framework?: "blitzjs" | "nextjs" | "gatsby" | "remix" | "react-router" | "astro" | "hexo" | "eleventy" | "docusaurus-2" | "docusaurus" | "preact" | "solidstart-1" | "solidstart" | "dojo" | "ember" | "vue" | "scully" | "ionic-angular" | "angular" | "polymer" | "svelte" | "sveltekit" | "sveltekit-1" | "ionic-react" | "create-react-app" | "gridsome" | "umijs" | "sapper" | "saber" | "stencil" | "nuxtjs" | "redwoodjs" | "hugo" | "jekyll" | "brunch" | "middleman" | "zola" | "hydrogen" | "vite" | "vitepress" | "vuepress" | "parcel" | "fasthtml" | "sanity-v3" | "sanity" | "storybook" | (string & {});
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
export declare const Project: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Project>, id: string, { accessToken, ...props }: ProjectProps & {
    accessToken?: Secret;
}) => Promise<Project>);
export declare function createProject(api: VercelApi, props: ProjectProps): Promise<Project>;
export declare function updateEnvironmentVariables(api: VercelApi, output: Project, props: ProjectProps): Promise<void>;
export {};
//# sourceMappingURL=project.d.ts.map