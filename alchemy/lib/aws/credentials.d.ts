import type { AwsClientProps } from "./client-props.ts";
/**
 * Get global AWS configuration from environment variables.
 * This provides the base layer of AWS credential configuration.
 */
export declare function getGlobalAwsConfig(): AwsClientProps;
/**
 * Resolve AWS credentials using three-tier resolution: global → scope → resource.
 *
 * This function implements a comprehensive credential resolution system that allows
 * for flexible AWS credential management across different levels of your application.
 * It enables multi-account and multi-region deployments by providing a consistent
 * way to override credentials at different scopes.
 *
 * The resolution follows this precedence order:
 * 1. Resource-level credentials (highest priority)
 * 2. Scope-level credentials (medium priority)
 * 3. Global environment variables (lowest priority)
 *
 * Supported credential properties include:
 * - `region`: AWS region (e.g., 'us-west-2', 'eu-central-1')
 * - `profile`: AWS profile name from credentials file
 * - `accessKeyId`: AWS access key ID
 * - `secretAccessKey`: AWS secret access key
 * - `sessionToken`: AWS session token for temporary credentials
 * - `roleArn`: AWS role ARN to assume
 * - `roleSessionName`: Session name when assuming a role
 * - `externalId`: External ID when assuming a role
 *
 * @param resourceProps - Resource-level AWS credential properties (optional)
 * @returns Resolved AWS client properties with validation
 *
 * @throws {Error} When scope contains invalid AWS configuration
 * @throws {Error} When resource properties contain invalid AWS configuration
 *
 * @example
 * ```typescript
 * // Basic usage with resource-level credentials
 * const credentials = resolveAwsCredentials({
 *   region: "us-west-2",
 *   profile: "production"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Usage with scope-level credentials
 * await alchemy.run("my-app", {
 *   aws: {
 *     region: "eu-west-1",
 *     profile: "staging"
 *   }
 * }, async () => {
 *   // Resources created here will use the scope credentials by default
 *   const vpc = await Vpc("main-vpc", {
 *     cidrBlock: "10.0.0.0/16"
 *   });
 *
 *   // Resources can override scope credentials
 *   const crossRegionSubnet = await Subnet("cross-region-subnet", {
 *     vpc,
 *     cidrBlock: "10.0.1.0/24",
 *     region: "us-east-1" // Override scope region
 *   });
 * });
 * ```
 */
export declare function resolveAwsCredentials(resourceProps?: AwsClientProps): Promise<AwsClientProps>;
//# sourceMappingURL=credentials.d.ts.map