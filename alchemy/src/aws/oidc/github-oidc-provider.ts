import { OIDCProvider, type OIDCProviderProps } from "./oidc-provider.ts";

/**
 * Default thumbprint for GitHub's OIDC provider
 * This is the certificate thumbprint that GitHub uses to sign OIDC tokens
 * @see https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services#adding-the-identity-provider-to-aws
 */
const DEFAULT_GITHUB_THUMBPRINT = "6938fd4d98bab03faadb97b34396831e3780aea1";

/**
 * Properties for configuring GitHub-specific OIDC provider
 * Simplified version of OIDCProviderProps that omits the thumbprint
 * since it's automatically set to GitHub's known value
 */
export interface GitHubOIDCProviderProps extends Omit<
  OIDCProviderProps,
  "thumbprint"
> {
  /**
   * The GitHub organization or user that owns the repository
   * Example: "my-org" or "my-username"
   */
  owner: string;

  /**
   * The name of the GitHub repository
   * Example: "my-repo"
   */
  repository: string;
}

export type GitHubOIDCProvider = ReturnType<typeof GitHubOIDCProvider>;

/**
 * GitHub-specific OIDC Provider Resource
 *
 * A simplified wrapper around OIDCProvider that automatically sets the correct
 * thumbprint for GitHub Actions. This is the recommended way to set up OIDC
 * authentication for GitHub Actions workflows.
 *
 * @example
 * // Create a GitHub OIDC provider for all branches
 * const provider = await GitHubOIDCProvider("github", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   roleArn: "arn:aws:iam::123456789012:role/github-actions"
 * });
 *
 * @example
 * // Create a GitHub OIDC provider with branch and environment restrictions
 * const provider = await GitHubOIDCProvider("github-restricted", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   branches: ["main", "prod"],
 *   environments: ["staging", "production"],
 *   roleArn: "arn:aws:iam::123456789012:role/github-actions",
 *   maxSessionDuration: 7200
 * });
 *
 * @example
 * // Complete setup with IAM role and OIDC provider
 * import { Role, getAccountId } from "../aws";
 *
 * // Get the AWS account ID
 * const accountId = await getAccountId();
 *
 * // Create the IAM role that GitHub Actions will assume
 * const githubRole = await Role("github-oidc-role", {
 *   roleName: "github-actions-role",
 *   assumeRolePolicy: {
 *     Version: "2012-10-17",
 *     Statement: [
 *       {
 *         Sid: "GitHubOIDC",
 *         Effect: "Allow",
 *         Principal: {
 *           Federated: `arn:aws:iam::${accountId}:oidc-provider/token.actions.githubusercontent.com`
 *         },
 *         Action: "sts:AssumeRoleWithWebIdentity",
 *         Condition: {
 *           StringEquals: {
 *             "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
 *           },
 *           StringLike: {
 *             "token.actions.githubusercontent.com:sub": "repo:my-org/my-repo:*"
 *           }
 *         }
 *       }
 *     ]
 *   },
 *   // Add required managed policies or inline policies for your use case
 *   managedPolicyArns: ["arn:aws:iam::aws:policy/ReadOnlyAccess"]
 * });
 *
 * // Create the OIDC provider using the role
 * const provider = await GitHubOIDCProvider("github-oidc", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   roleArn: githubRole.arn
 * });
 */
export const GitHubOIDCProvider = async (
  id: string,
  props: GitHubOIDCProviderProps,
) => {
  return OIDCProvider(id, {
    owner: props.owner,
    repository: props.repository,
    roleArn: props.roleArn,
    branches: props.branches,
    environments: props.environments,
    thumbprint: DEFAULT_GITHUB_THUMBPRINT,
  });
};
