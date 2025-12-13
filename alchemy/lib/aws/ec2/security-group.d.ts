import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { Vpc } from "./vpc.ts";
/**
 * Security Group timeout constants
 */
export declare const SECURITY_GROUP_TIMEOUT: TimeoutConfig;
/**
 * Properties for creating or updating a Security Group
 */
export interface SecurityGroupProps extends AwsClientProps {
    /**
     * The VPC to create the security group in.
     */
    vpc: Vpc | string;
    /**
     * The name of the security group.
     *
     * @default ${app}-${stage}-${id}
     */
    groupName?: string;
    /**
     * The description of the security group.
     */
    description: string;
    /**
     * Tags to apply to the security group.
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for Security Group operations.
     * @default Security Group-specific sensible defaults (30 attempts, 1000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Security Group creation/update
 */
export interface SecurityGroup extends SecurityGroupProps {
    /**
     * The ID of the security group.
     */
    groupId: string;
    /**
     * The name of the security group.
     */
    groupName: string;
    /**
     * The ID of the VPC the security group belongs to.
     */
    vpcId: string;
    /**
     * The AWS account ID that owns the security group.
     */
    ownerId: string;
}
/**
 * AWS Security Group Resource
 *
 * Creates and manages security groups. Acts as a virtual firewall for EC2
 * instances and other AWS resources. Rules are managed separately using the
 * `SecurityGroupRule` resource.
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy Security Groups
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * ```typescript
 * // Create a basic web server security group
 * const webSecurityGroup = await SecurityGroup("web-sg", {
 *   vpc: mainVpc,
 *   groupName: "web-server-sg",
 *   description: "Security group for web servers",
 *   tags: {
 *     Name: "web-server-security-group",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Security Group with AWS credential overrides
 * const crossAccountSg = await SecurityGroup("cross-account-sg", {
 *   vpc: mainVpc,
 *   groupName: "cross-account-security-group",
 *   description: "Security group in different account",
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 *   tags: {
 *     Name: "cross-account-sg",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Security Group in different region with role assumption
 * const multiRegionSg = await SecurityGroup("multi-region-sg", {
 *   vpc: euVpc,
 *   groupName: "eu-security-group",
 *   description: "Security group in EU region",
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "security-group-deployment",
 *   tags: {
 *     Name: "eu-security-group",
 *     Region: "europe"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Security Group with explicit credentials
 * const explicitCredsSg = await SecurityGroup("explicit-creds-sg", {
 *   vpc: testVpc,
 *   groupName: "test-security-group",
 *   description: "Security group with explicit credentials",
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 *   tags: {
 *     Name: "explicit-credentials-sg",
 *     Purpose: "testing"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Security Group with rules (rules managed separately)
 * const webSg = await SecurityGroup("web-sg", {
 *   vpc: mainVpc,
 *   groupName: "web-server-sg",
 *   description: "Security group for web servers",
 *   tags: { Name: "web-server-security-group" }
 * });
 *
 * // Separately, define a rule to allow HTTP traffic
 * const httpRule = await SecurityGroupRule("web-sg-http-rule", {
 *   securityGroup: webSg,
 *   type: "ingress",
 *   protocol: "tcp",
 *   fromPort: 80,
 *   toPort: 80,
 *   cidrBlocks: ["0.0.0.0/0"],
 *   description: "Allow HTTP access from anywhere"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This SG uses scope credentials (main-account, us-west-2)
 *   const mainSg = await SecurityGroup("main-sg", {
 *     vpc: mainVpc,
 *     groupName: "main-account-sg",
 *     description: "Security group in main account",
 *     tags: { Name: "main-account-sg" }
 *   });
 *
 *   // This SG overrides to use different account
 *   const crossAccountSg = await SecurityGroup("cross-account-sg", {
 *     vpc: crossVpc,
 *     groupName: "secondary-account-sg",
 *     description: "Security group in secondary account",
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *     tags: { Name: "secondary-account-sg" }
 *   });
 * });
 * ```
 */
export declare const SecurityGroup: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<SecurityGroup>, id: string, props: SecurityGroupProps) => Promise<SecurityGroup>);
//# sourceMappingURL=security-group.d.ts.map