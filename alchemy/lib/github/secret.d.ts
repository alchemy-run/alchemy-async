import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a GitHub Secret
 */
export interface GitHubSecretProps {
    /**
     * Repository owner (user or organization)
     */
    owner: string;
    /**
     * Repository name
     */
    repository: string;
    /**
     * Secret name
     */
    name: string;
    /**
     * Secret value (will be stored securely on GitHub)
     */
    value: Secret;
    /**
     * Optional environment name to create an environment secret
     * If set, the secret will be created in the specified environment instead of at the repository level
     */
    environment?: string;
    /**
     * Optional GitHub API token (overrides environment variable)
     * If not provided, will use GITHUB_TOKEN environment variable
     * Token must have 'repo' scope for private repositories
     * or 'public_repo' scope for public repositories
     */
    token?: Secret;
}
/**
 * Output returned after Secret creation/update
 */
export interface GitHubSecretOutput extends Omit<GitHubSecretProps, "value"> {
    /**
     * The ID of the resource
     */
    id: string;
    /**
     * Time at which the object was created/updated
     */
    updatedAt: string;
}
/**
 * Resource for managing GitHub repository and environment secrets
 *
 * Authentication is handled in the following order:
 * 1. `token` parameter in the resource props (if provided)
 * 2. `GITHUB_TOKEN` environment variable
 *
 * The token must have the following permissions:
 * - 'repo' scope for private repositories
 * - 'public_repo' scope for public repositories
 *
 * @example
 * // Create a repository secret using GITHUB_TOKEN environment variable:
 * const secret = await GitHubSecret("my-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   name: "API_KEY",
 *   value: alchemy.secret("my-secret-value")
 * });
 *
 * @example
 * // Create an environment secret:
 * const secret = await GitHubSecret("my-env-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   environmentName: "production",
 *   name: "DEPLOY_KEY",
 *   value: alchemy.secret("my-secret-deploy-key")
 * });
 *
 * @example
 * // Create a secret with a custom GitHub token:
 * const secret = await GitHubSecret("my-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   name: "API_KEY",
 *   value: alchemy.secret("my-secret-value"),
 *   token: alchemy.secret(process.env.CUSTOM_GITHUB_TOKEN)
 * });
 *
 * @example
 * // Create multiple secrets with environment variables:
 * const secrets = await Promise.all([
 *   GitHubSecret("aws-secret", {
 *     owner: "my-github-username",
 *     repository: "cloud-app",
 *     name: "AWS_ROLE_ARN",
 *     value: alchemy.secret(process.env.AWS_ROLE_ARN)
 *   }),
 *   GitHubSecret("cf-secret", {
 *     owner: "my-github-username",
 *     repository: "cloud-app",
 *     name: "CLOUDFLARE_API_KEY",
 *     value: alchemy.secret(process.env.CLOUDFLARE_API_KEY)
 *   })
 * ]);
 *
 * @example
 * // Create a secret in a secure scope with a password:
 * await alchemy.run("secure-scope", {
 *   password: process.env.SECRET_PASSPHRASE
 * }, async () => {
 *   const secret = await GitHubSecret("deploy-secret", {
 *     owner: "my-github-username",
 *     repository: "my-app",
 *     name: "DEPLOY_TOKEN",
 *     value: alchemy.secret(process.env.DEPLOY_TOKEN),
 *     token: alchemy.secret(process.env.GITHUB_TOKEN)
 *   });
 * });
 */
export declare const GitHubSecret: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<GitHubSecretOutput>, _id: string, props: GitHubSecretProps) => Promise<GitHubSecretOutput>);
//# sourceMappingURL=secret.d.ts.map