import type { Context } from "../context.ts";
/**
 * Properties for creating or updating a GitHub Repository Environment
 */
export interface RepositoryEnvironmentProps {
    /**
     * Repository owner (user or organization)
     */
    owner: string;
    /**
     * Repository name
     */
    repository: string;
    /**
     * Environment name
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Wait timer before allowing deployments to proceed (in minutes)
     * Must be between 0 and 43200 (30 days)
     * @default 0
     */
    waitTimer?: number;
    /**
     * Determine whether to prevent self-reviews on pull requests
     * Note: Requires at least one reviewer when enabled
     * @default false
     */
    preventSelfReview?: boolean;
    /**
     * Determine whether administrators can bypass deployment protection rules
     * @default true
     */
    adminBypass?: boolean;
    /**
     * Required reviewers for deployments to this environment
     */
    reviewers?: {
        /**
         * GitHub usernames or user IDs that can approve deployments
         * Can be numeric IDs or string usernames (which will be resolved to IDs)
         */
        users?: Array<number | string>;
        /**
         * GitHub team names or team IDs that can approve deployments
         * Can be numeric IDs or string team names (which will be resolved to IDs)
         * Note: For team names, should be in the format "org/team-name"
         */
        teams?: Array<number | string>;
    };
    /**
     * Deployment branch policy for the environment
     */
    deploymentBranchPolicy?: {
        /**
         * Whether to restrict deployments to protected branches
         * @default false
         */
        protectedBranches?: boolean;
        /**
         * Whether to allow custom branch policies
         * When true, specific branch patterns can be specified using createDeploymentBranchPolicy
         * @default false
         */
        customBranchPolicies?: boolean;
    };
    /**
     * Branch patterns for deployment when customBranchPolicies is true
     * For example: ["main", "releases/*"]
     * @default []
     */
    branchPatterns?: string[];
    /**
     * Optional GitHub API token (overrides environment variable)
     * If not provided, will use GITHUB_TOKEN environment variable
     * @default process.env.GITHUB_TOKEN
     */
    token?: string;
}
/**
 * Output returned after Repository Environment creation/update
 */
export interface RepositoryEnvironment extends RepositoryEnvironmentProps {
    /**
     * The ID of the resource
     */
    id: string;
    /**
     * Environment name
     */
    name: string;
    /**
     * The numeric ID of the environment in GitHub
     */
    environmentId: number;
    /**
     * Time at which the object was created/updated
     */
    updatedAt: string;
}
/**
 * Resource for managing GitHub repository environments
 *
 * Note: If preventSelfReview is true, at least one reviewer must be specified.
 *
 * Branch policies are efficiently managed with proper diffing:
 * - Only manages branch patterns configured through this resource
 * - Preserves any manually added branch patterns outside this resource
 * - When updating, only modifies patterns that have changed from previous state
 * - Compares against previous resource state, not current environment state
 * - Safely handles policy type changes
 *
 * @example
 * // Create a basic environment with no protection rules
 * const devEnv = await RepositoryEnvironment("dev-environment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   name: "development"
 * });
 *
 * @example
 * // Create a production environment with approval requirements
 * const prodEnv = await RepositoryEnvironment("prod-environment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   name: "production",
 *   waitTimer: 10, // 10 minute delay
 *   preventSelfReview: true,
 *   reviewers: {
 *     teams: ["platform-team"], // team name
 *     users: ["security-admin"] // username
 *   },
 *   deploymentBranchPolicy: {
 *     protectedBranches: true,
 *     customBranchPolicies: false
 *   }
 * });
 *
 * @example
 * // Create an environment with reviewer IDs
 * const stagingEnv = await RepositoryEnvironment("staging-environment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   name: "staging",
 *   reviewers: {
 *     teams: [1234567], // team ID
 *     users: [7654321]  // user ID
 *   },
 *   deploymentBranchPolicy: {
 *     protectedBranches: false,
 *     customBranchPolicies: true
 *   },
 *   branchPatterns: ["main", "release/*"]
 * });
 */
export declare const RepositoryEnvironment: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RepositoryEnvironment>, id: string, props: RepositoryEnvironmentProps) => Promise<RepositoryEnvironment>);
//# sourceMappingURL=repository-environment.d.ts.map