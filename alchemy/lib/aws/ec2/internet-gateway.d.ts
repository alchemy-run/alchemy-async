import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
/**
 * Properties for creating or updating an Internet Gateway
 */
export interface InternetGatewayProps extends AwsClientProps {
    /**
     * Tags to apply to the Internet Gateway
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for Internet Gateway operations
     * @default Internet Gateway-specific sensible defaults (60 attempts, 2000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Internet Gateway creation/update
 */
export interface InternetGateway extends InternetGatewayProps {
    /**
     * The ID of the Internet Gateway
     */
    internetGatewayId: string;
    /**
     * The current state of the Internet Gateway
     */
    state: "available";
    /**
     * Information about the VPCs attached to the Internet Gateway
     */
    attachments?: Array<{
        vpcId: string;
        state: "attaching" | "attached" | "detaching" | "detached";
    }>;
    /**
     * The ID of the AWS account that owns the Internet Gateway
     */
    ownerId?: string;
}
/**
 * AWS Internet Gateway Resource
 *
 * An Internet Gateway is a horizontally scaled, redundant, and highly available VPC component
 * that allows communication between your VPC and the internet. It serves two purposes:
 * 1. Provide a target in your VPC route tables for internet-routable traffic
 * 2. Perform network address translation (NAT) for instances with public IPv4 addresses
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy Internet Gateways
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * ```typescript
 * // Create a basic Internet Gateway
 * const igw = await InternetGateway("main-igw", {
 *   tags: {
 *     Name: "main-internet-gateway",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Internet Gateway with AWS credential overrides
 * const crossAccountIgw = await InternetGateway("cross-account-igw", {
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 *   tags: {
 *     Name: "cross-account-internet-gateway",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Internet Gateway in different region with role assumption
 * const multiRegionIgw = await InternetGateway("multi-region-igw", {
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "internet-gateway-deployment",
 *   tags: {
 *     Name: "eu-internet-gateway",
 *     Region: "europe"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Internet Gateway with explicit credentials
 * const explicitCredsIgw = await InternetGateway("explicit-creds-igw", {
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 *   tags: {
 *     Name: "explicit-credentials-igw",
 *     Purpose: "testing"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Internet Gateway with custom timeout configuration
 * const customIgw = await InternetGateway("custom-igw", {
 *   timeout: {
 *     maxAttempts: 90,
 *     delayMs: 1500
 *   },
 *   tags: {
 *     Name: "custom-timeout-igw",
 *     Purpose: "high-availability"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create Internet Gateway and attach to VPC
 * const vpc = await VPC("main-vpc", { cidrBlock: "10.0.0.0/16" });
 * const igw = await InternetGateway("vpc-igw", {
 *   tags: { Name: "vpc-internet-gateway" }
 * });
 * const attachment = await InternetGatewayAttachment("igw-attachment", {
 *   internetGatewayId: igw.internetGatewayId,
 *   vpcId: vpc.vpcId
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This IGW uses scope credentials (main-account, us-west-2)
 *   const mainIgw = await InternetGateway("main-igw", {
 *     tags: { Name: "main-account-igw" }
 *   });
 *
 *   // This IGW overrides to use different account
 *   const crossAccountIgw = await InternetGateway("cross-account-igw", {
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *     tags: { Name: "secondary-account-igw" }
 *   });
 * });
 * ```
 */
export declare const InternetGateway: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<InternetGateway>, _id: string, props: InternetGatewayProps) => Promise<InternetGateway>);
/**
 * Internet Gateway timeout constants
 */
export declare const INTERNET_GATEWAY_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=internet-gateway.d.ts.map