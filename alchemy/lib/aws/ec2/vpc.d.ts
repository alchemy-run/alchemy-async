import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
/**
 * Properties for creating or updating a VPC
 */
export interface VpcProps extends AwsClientProps {
    /**
     * The IPv4 network range for the VPC, in CIDR notation
     * @example "10.0.0.0/16"
     */
    cidrBlock: string;
    /**
     * Whether to enable DNS resolution for the VPC
     * @default true
     */
    enableDnsSupport?: boolean;
    /**
     * Whether to enable DNS hostnames for the VPC
     * @default true
     */
    enableDnsHostnames?: boolean;
    /**
     * The tenancy option for instances launched into the VPC
     * @default "default"
     */
    instanceTenancy?: "default" | "dedicated" | "host";
    /**
     * Additional IPv4 CIDR blocks to associate with the VPC
     * These will be associated after VPC creation
     */
    additionalCidrBlocks?: string[];
    /**
     * IPv6 CIDR block configuration
     */
    ipv6Config?: {
        /**
         * Whether to assign an Amazon-provided IPv6 CIDR block
         */
        amazonProvidedIpv6CidrBlock?: boolean;
        /**
         * The ID of an IPv6 address pool from which to allocate the IPv6 CIDR block
         */
        ipv6Pool?: string;
        /**
         * The netmask length of the IPv6 CIDR block
         * @default 56
         */
        ipv6CidrBlockNetworkBorderGroup?: string;
    };
    /**
     * Tags to apply to the VPC
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for VPC operations
     * @default VPC-specific sensible defaults (60 attempts, 2000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after VPC creation/update
 */
export interface Vpc extends VpcProps {
    /**
     * The ID of the VPC
     */
    vpcId: string;
    /**
     * The current state of the VPC
     */
    state: "pending" | "available";
    /**
     * Whether the VPC is the default VPC
     */
    isDefault: boolean;
    /**
     * The ID of the set of DHCP options associated with the VPC
     */
    dhcpOptionsId: string;
    /**
     * Information about the IPv4 CIDR blocks associated with the VPC
     */
    cidrBlockAssociationSet?: Array<{
        associationId: string;
        cidrBlock: string;
        cidrBlockState: {
            state: "associating" | "associated" | "disassociating" | "disassociated" | "failing" | "failed";
            statusMessage?: string;
        };
    }>;
    /**
     * Information about the IPv6 CIDR blocks associated with the VPC
     */
    ipv6CidrBlockAssociationSet?: Array<{
        associationId: string;
        ipv6CidrBlock: string;
        ipv6CidrBlockState: {
            state: "associating" | "associated" | "disassociating" | "disassociated" | "failing" | "failed";
            statusMessage?: string;
        };
        networkBorderGroup?: string;
        ipv6Pool?: string;
    }>;
    /**
     * The ID of the AWS account that owns the VPC
     */
    ownerId?: string;
}
/**
 * AWS VPC (Virtual Private Cloud) Resource
 *
 * Creates and manages Amazon VPC instances with configurable CIDR blocks,
 * DNS settings, and instance tenancy options. Supports AWS credential overrides
 * for multi-account and cross-region deployments.
 *
 * @example
 * // Create a basic VPC with default settings
 * const vpc = await Vpc("main-vpc", {
 *   cidrBlock: "10.0.0.0/16",
 *   tags: {
 *     Name: "main-vpc",
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a VPC with custom DNS settings
 * const vpc = await Vpc("custom-vpc", {
 *   cidrBlock: "172.16.0.0/16",
 *   enableDnsSupport: true,
 *   enableDnsHostnames: true,
 *   instanceTenancy: "default",
 *   tags: {
 *     Name: "custom-vpc"
 *   }
 * });
 *
 * @example
 * // Create a VPC with dedicated tenancy and custom timeout
 * const dedicatedVpc = await Vpc("dedicated-vpc", {
 *   cidrBlock: "192.168.0.0/16",
 *   instanceTenancy: "dedicated",
 *   enableDnsSupport: false,
 *   enableDnsHostnames: false,
 *   timeout: {
 *     maxAttempts: 90,
 *     delayMs: 3000
 *   },
 *   tags: {
 *     Name: "dedicated-vpc",
 *     Type: "isolated"
 *   }
 * });
 *
 * @example
 * // Create a VPC with AWS credential overrides for cross-account deployment
 * const crossAccountVpc = await Vpc("cross-account-vpc", {
 *   cidrBlock: "10.1.0.0/16",
 *   region: "us-east-1",
 *   profile: "production-account",
 *   tags: {
 *     Name: "cross-account-vpc",
 *     Account: "production"
 *   }
 * });
 *
 * @example
 * // Create a VPC in a different region with explicit credentials
 * const multiRegionVpc = await Vpc("multi-region-vpc", {
 *   cidrBlock: "10.2.0.0/16",
 *   region: "eu-west-1",
 *   accessKeyId: alchemy.secret("AKIA..."),
 *   secretAccessKey: alchemy.secret("..."),
 *   tags: {
 *     Name: "eu-vpc",
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
 *   // This VPC uses staging credentials from scope
 *   const stagingVpc = await Vpc("staging-vpc", {
 *     cidrBlock: "10.0.0.0/16"
 *   });
 *
 *   // This VPC overrides to use production credentials
 *   const prodVpc = await Vpc("prod-vpc", {
 *     cidrBlock: "10.1.0.0/16",
 *     profile: "production",
 *     region: "us-east-1"
 *   });
 * });
 */
export declare const Vpc: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Vpc>, _id: string, props: VpcProps) => Promise<Vpc>);
/**
 * VPC timeout constants
 */
export declare const VPC_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=vpc.d.ts.map