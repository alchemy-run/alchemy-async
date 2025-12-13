import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { Subnet } from "./subnet.ts";
/**
 * Properties for creating or updating a NAT Gateway
 */
export interface NatGatewayProps extends AwsClientProps {
    /**
     * The subnet to create the NAT Gateway in (must be a public subnet)
     */
    subnet: Subnet | string;
    /**
     * The allocation ID of an existing Elastic IP address
     * If not provided, a new Elastic IP will be allocated
     */
    allocationId?: string;
    /**
     * The connectivity type for the NAT Gateway
     * @default "public"
     */
    connectivityType?: "public" | "private";
    /**
     * Tags to apply to the NAT Gateway
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for NAT Gateway operations
     * @default NAT Gateway-specific sensible defaults (60 attempts, 5000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after NAT Gateway creation/update
 */
export interface NatGateway extends NatGatewayProps {
    /**
     * The ID of the NAT Gateway
     */
    natGatewayId: string;
    /**
     * The ID of the subnet the NAT Gateway is in
     */
    subnetId: string;
    /**
     * The ID of the VPC the NAT Gateway belongs to
     */
    vpcId: string;
    /**
     * The current state of the NAT Gateway
     */
    state: "pending" | "failed" | "available" | "deleting" | "deleted";
    /**
     * The allocation ID of the Elastic IP address
     */
    allocationId: string;
    /**
     * The public IP address of the NAT Gateway
     */
    publicIp?: string;
    /**
     * The private IP address of the NAT Gateway
     */
    privateIp?: string;
    /**
     * Whether the Elastic IP was created by this resource
     */
    createdElasticIp: boolean;
}
/**
 * AWS NAT Gateway Resource
 *
 * Creates and manages NAT Gateways that provide outbound internet access
 * for instances in private subnets. Automatically allocates an Elastic IP
 * if one is not provided. NAT Gateways are slow resources that can take
 * up to 10 minutes to become available.
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy NAT Gateways
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * ```typescript
 * // Create a NAT Gateway with automatic Elastic IP allocation
 * const natGateway = await NatGateway("main-nat", {
 *   subnet: publicSubnet,
 *   tags: {
 *     Name: "main-nat-gateway",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create NAT Gateway with AWS credential overrides
 * const crossAccountNat = await NatGateway("cross-account-nat", {
 *   subnet: publicSubnet,
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 *   tags: {
 *     Name: "cross-account-nat-gateway",
 *     Environment: "production"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create NAT Gateway in different region with role assumption
 * const multiRegionNat = await NatGateway("multi-region-nat", {
 *   subnet: euPublicSubnet,
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "nat-gateway-deployment",
 *   tags: {
 *     Name: "eu-nat-gateway",
 *     Region: "europe"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create NAT Gateway with explicit credentials
 * const explicitCredsNat = await NatGateway("explicit-creds-nat", {
 *   subnet: testPublicSubnet,
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 *   tags: {
 *     Name: "explicit-credentials-nat",
 *     Purpose: "testing"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a NAT Gateway with existing Elastic IP
 * const natGateway = await NatGateway("custom-nat", {
 *   subnet: "subnet-12345678",
 *   allocationId: "eipalloc-12345678",
 *   connectivityType: "public",
 *   tags: {
 *     Name: "custom-nat-gateway"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a private NAT Gateway (for VPC-to-VPC communication)
 * const privateNat = await NatGateway("private-nat", {
 *   subnet: privateSubnet,
 *   connectivityType: "private",
 *   tags: {
 *     Name: "private-nat-gateway",
 *     Type: "internal"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a NAT Gateway with custom timeout configuration
 * const slowNat = await NatGateway("slow-nat", {
 *   subnet: publicSubnet,
 *   timeout: {
 *     maxAttempts: 180, // Wait up to 15 minutes
 *     delayMs: 5000     // Check every 5 seconds
 *   },
 *   tags: {
 *     Name: "slow-nat-gateway"
 *   }
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This NAT Gateway uses scope credentials (main-account, us-west-2)
 *   const mainNat = await NatGateway("main-nat", {
 *     subnet: mainPublicSubnet,
 *     tags: { Name: "main-account-nat" }
 *   });
 *
 *   // This NAT Gateway overrides to use different account
 *   const crossAccountNat = await NatGateway("cross-account-nat", {
 *     subnet: crossPublicSubnet,
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *     tags: { Name: "secondary-account-nat" }
 *   });
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Use NAT Gateway in route table for private subnet internet access
 * const privateRoute = await Route("private-internet", {
 *   routeTable: privateRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   natGateway: natGateway,
 *   tags: {
 *     Name: "private-to-internet"
 *   }
 * });
 * ```
 */
export declare const NatGateway: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<NatGateway>, _id: string, props: NatGatewayProps) => Promise<NatGateway>);
/**
 * Non-retryable error for NAT Gateway operations
 */
export declare class NatGatewayNonRetryableError extends Error {
    constructor(message: string);
}
/**
 * NAT Gateway timeout constants
 */
export declare const NAT_GATEWAY_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=nat-gateway.d.ts.map