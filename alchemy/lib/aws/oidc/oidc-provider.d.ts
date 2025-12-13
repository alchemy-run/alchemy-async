import type { Context } from "../../context.ts";
/**
 * Properties for configuring an AWS OIDC provider for GitHub Actions
 */
export interface OIDCProviderProps {
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
    /**
     * Optional list of branches to restrict access to
     * If not provided, all branches will be allowed
     * Example: ["main", "prod"]
     */
    branches?: string[];
    /**
     * Optional list of environments to restrict access to
     * If not provided, all environments will be allowed
     * Example: ["staging", "production"]
     */
    environments?: string[];
    /**
     * The ARN of the IAM role to be assumed
     * Format: arn:aws:iam::account-id:role/role-name
     */
    roleArn: string;
    /**
     * Optional maximum session duration in seconds
     * Default: 3600 (1 hour)
     * Range: 900-43200 seconds (15 minutes to 12 hours)
     */
    maxSessionDuration?: number;
    /**
     * Thumbprint for the OIDC provider
     * Used to verify the identity provider's server certificate
     */
    thumbprint: string;
    /**
     * Optional AWS region
     * @default AWS_REGION environment variable
     */
    region?: string;
}
/**
 * Output returned after OIDC provider configuration
 */
export interface OIDCProvider extends OIDCProviderProps {
    /**
     * The ARN of the OIDC provider
     * Format: arn:aws:iam::account-id:oidc-provider/token.actions.githubusercontent.com
     */
    providerArn: string;
    /**
     * Time at which the provider was created
     * Unix timestamp in milliseconds
     */
    createdAt: number;
}
export declare const OIDCProvider: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<OIDCProvider>, _id: string, props: OIDCProviderProps) => Promise<{
    providerArn: string;
    createdAt: number;
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
    /**
     * Optional list of branches to restrict access to
     * If not provided, all branches will be allowed
     * Example: ["main", "prod"]
     */
    branches?: string[];
    /**
     * Optional list of environments to restrict access to
     * If not provided, all environments will be allowed
     * Example: ["staging", "production"]
     */
    environments?: string[];
    /**
     * The ARN of the IAM role to be assumed
     * Format: arn:aws:iam::account-id:role/role-name
     */
    roleArn: string;
    /**
     * Optional maximum session duration in seconds
     * Default: 3600 (1 hour)
     * Range: 900-43200 seconds (15 minutes to 12 hours)
     */
    maxSessionDuration?: number;
    /**
     * Thumbprint for the OIDC provider
     * Used to verify the identity provider's server certificate
     */
    thumbprint: string;
    /**
     * Optional AWS region
     * @default AWS_REGION environment variable
     */
    region?: string;
}>);
//# sourceMappingURL=oidc-provider.d.ts.map