import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { Vpc } from "./vpc.ts";
/**
 * Properties for creating or updating a Subnet
 */
export interface SubnetProps extends AwsClientProps {
    /**
     * The VPC to create the subnet in
     */
    vpc: Vpc | string;
    /**
     * The CIDR block for the subnet
     */
    cidrBlock: string;
    /**
     * The availability zone for the subnet
     */
    availabilityZone: string;
    /**
     * Whether instances launched in this subnet should be assigned a public IP address
     * @default false
     */
    mapPublicIpOnLaunch?: boolean;
    /**
     * Tags to apply to the subnet
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for subnet operations
     * @default Subnet-specific sensible defaults (30 attempts, 1000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Subnet creation/update
 */
export interface Subnet extends SubnetProps {
    /**
     * The ID of the subnet
     */
    subnetId: string;
    /**
     * The ID of the VPC the subnet belongs to
     */
    vpcId: string;
    /**
     * The current state of the subnet
     */
    state: "pending" | "available";
    /**
     * The number of available IP addresses in the subnet
     */
    availableIpAddressCount: number;
    /**
     * Whether this is the default subnet for the availability zone
     */
    defaultForAz: boolean;
}
/**
 * AWS Subnet Resource
 *
 * Creates and manages subnets within a VPC. Subnets are used to segment
 * your VPC into smaller networks for organizing resources. Supports AWS
 * credential overrides for multi-account and cross-region deployments.
 *
 * @example
 * // Create a public subnet for web servers
 * const publicSubnet = await Subnet("public-subnet", {
 *   vpc: myVpc,
 *   cidrBlock: "10.0.1.0/24",
 *   availabilityZone: `${process.env.AWS_REGION}a` || "us-east-1a",
 *   mapPublicIpOnLaunch: true,
 *   tags: {
 *     Name: "public-subnet",
 *     Type: "public"
 *   }
 * });
 *
 * @example
 * // Create a private subnet for databases
 * const privateSubnet = await Subnet("private-subnet", {
 *   vpc: myVpc,
 *   cidrBlock: "10.0.2.0/24",
 *   availabilityZone: "us-west-2b",
 *   mapPublicIpOnLaunch: false,
 *   tags: {
 *     Name: "private-subnet",
 *     Type: "private"
 *   }
 * });
 *
 * @example
 * // Create a subnet with custom timeout configuration
 * const customSubnet = await Subnet("custom-subnet", {
 *   vpc: myVpc,
 *   cidrBlock: "10.0.3.0/24",
 *   availabilityZone: "us-west-2c",
 *   timeout: {
 *     maxAttempts: 50,
 *     delayMs: 500
 *   }
 * });
 *
 * @example
 * // Create a subnet with AWS credential overrides for cross-account deployment
 * const crossAccountSubnet = await Subnet("cross-account-subnet", {
 *   vpc: myVpc,
 *   cidrBlock: "10.1.1.0/24",
 *   availabilityZone: "us-east-1a",
 *   region: "us-east-1",
 *   profile: "production-account",
 *   mapPublicIpOnLaunch: true,
 *   tags: {
 *     Name: "cross-account-subnet",
 *     Account: "production"
 *   }
 * });
 *
 * @example
 * // Create a subnet in a different region with explicit credentials
 * const multiRegionSubnet = await Subnet("multi-region-subnet", {
 *   vpc: "vpc-12345678", // VPC ID from different region
 *   cidrBlock: "10.2.1.0/24",
 *   availabilityZone: "eu-west-1a",
 *   region: "eu-west-1",
 *   accessKeyId: alchemy.secret("AKIA..."),
 *   secretAccessKey: alchemy.secret("..."),
 *   mapPublicIpOnLaunch: false,
 *   tags: {
 *     Name: "eu-subnet",
 *     Region: "europe"
 *   }
 * });
 *
 * @example
 * // Using scope-level credentials with resource-level overrides
 * await alchemy.run("multi-account", {
 *   aws: {
 *     region: "us-west-2",
 *     profile: "staging"
 *   }
 * }, async () => {
 *   // This subnet uses staging credentials from scope
 *   const stagingSubnet = await Subnet("staging-subnet", {
 *     vpc: stagingVpc,
 *     cidrBlock: "10.0.1.0/24",
 *     availabilityZone: "us-west-2a"
 *   });
 *
 *   // This subnet overrides to use production credentials
 *   const prodSubnet = await Subnet("prod-subnet", {
 *     vpc: prodVpc,
 *     cidrBlock: "10.1.1.0/24",
 *     availabilityZone: "us-east-1a",
 *     profile: "production",
 *     region: "us-east-1"
 *   });
 * });
 */
export declare const Subnet: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Subnet>, _id: string, props: SubnetProps) => Promise<Subnet>);
/**
 * Subnet timeout constants
 */
export declare const SUBNET_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=subnet.d.ts.map