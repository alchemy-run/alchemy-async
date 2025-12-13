import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { InternetGateway } from "./internet-gateway.ts";
import type { Vpc } from "./vpc.ts";
/**
 * Properties for creating or updating an Internet Gateway Attachment
 */
export interface InternetGatewayAttachmentProps extends AwsClientProps {
    /**
     * The Internet Gateway to attach
     */
    internetGateway: InternetGateway | string;
    /**
     * The VPC to attach the Internet Gateway to
     */
    vpc: Vpc | string;
    /**
     * Timeout configuration for Internet Gateway Attachment operations
     * @default Internet Gateway Attachment-specific sensible defaults (60 attempts, 2000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Internet Gateway Attachment creation/update
 */
export interface InternetGatewayAttachment extends InternetGatewayAttachmentProps {
    /**
     * The ID of the Internet Gateway
     */
    internetGatewayId: string;
    /**
     * The ID of the VPC
     */
    vpcId: string;
    /**
     * The current state of the attachment
     */
    state: "attaching" | "attached" | "detaching" | "detached";
}
/**
 * AWS Internet Gateway Attachment Resource
 *
 * Manages the attachment of an Internet Gateway to a VPC, enabling internet connectivity
 * for the VPC. This is a separate resource to ensure proper dependency ordering and
 * lifecycle management between Internet Gateways and VPCs.
 *
 * An Internet Gateway attachment is required for any VPC that needs internet access.
 * The attachment creates a logical connection between the Internet Gateway and the VPC,
 * allowing traffic to flow between the VPC and the internet when combined with proper
 * routing configuration.
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy Internet Gateway Attachments
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * // Basic Internet Gateway attachment for internet connectivity
 * const vpc = await Vpc("main-vpc", {
 *   cidrBlock: "10.0.0.0/16"
 * });
 *
 * const igw = await InternetGateway("main-igw", {});
 *
 * const attachment = await InternetGatewayAttachment("main-igw-attachment", {
 *   internetGateway: igw,
 *   vpc: vpc
 * });
 *
 * @example
 * // Internet Gateway Attachment with AWS credential overrides
 * const crossAccountAttachment = await InternetGatewayAttachment("cross-account-attachment", {
 *   internetGateway: igw,
 *   vpc: vpc,
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 * });
 *
 * @example
 * // Internet Gateway Attachment in different region with role assumption
 * const multiRegionAttachment = await InternetGatewayAttachment("multi-region-attachment", {
 *   internetGateway: euIgw,
 *   vpc: euVpc,
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "igw-attachment-deployment",
 * });
 *
 * @example
 * // Internet Gateway Attachment with explicit credentials
 * const explicitCredsAttachment = await InternetGatewayAttachment("explicit-creds-attachment", {
 *   internetGateway: testIgw,
 *   vpc: testVpc,
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 * });
 *
 * @example
 * // Internet Gateway attachment with custom timeout configuration
 * // for environments with slower AWS API responses
 * const attachment = await InternetGatewayAttachment("slow-env-attachment", {
 *   internetGateway: "igw-1234567890abcdef0",
 *   vpc: "vpc-0987654321fedcba0",
 *   timeout: {
 *   maxAttempts: 120,
 *   delayMs: 3000
 * }
 * });
 *
 * @example
 * // Complete setup for a VPC with internet access including routing
 * const vpc = await Vpc("web-vpc", {
 *   cidrBlock: "10.0.0.0/16",
 *   enableDnsHostnames: true,
 *   enableDnsSupport: true
 * });
 *
 * const igw = await InternetGateway("web-igw", {});
 *
 * const attachment = await InternetGatewayAttachment("web-igw-attachment", {
 *   internetGateway: igw,
 *   vpc: vpc
 * });
 *
 * // Create public subnet and route table for internet access
 * const publicSubnet = await Subnet("public-subnet", {
 *   vpc: vpc,
 *   cidrBlock: "10.0.1.0/24",
 *   availabilityZone: "us-east-1a"
 * });
 *
 * const publicRouteTable = await RouteTable("public-rt", {
 *   vpc: vpc
 * });
 *
 * const internetRoute = await Route("internet-route", {
 *   routeTable: publicRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { internetGateway: igw }
 * });
 *
 * @example
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This Internet Gateway Attachment uses scope credentials (main-account, us-west-2)
 *   const mainAttachment = await InternetGatewayAttachment("main-attachment", {
 *     internetGateway: mainIgw,
 *     vpc: mainVpc
 *   });
 *
 *   // This Internet Gateway Attachment overrides to use different account
 *   const crossAccountAttachment = await InternetGatewayAttachment("cross-account-attachment", {
 *     internetGateway: crossIgw,
 *     vpc: crossVpc,
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *   });
 * });
 */
export declare const InternetGatewayAttachment: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<InternetGatewayAttachment>, _id: string, props: InternetGatewayAttachmentProps) => Promise<InternetGatewayAttachment>);
/**
 * Possible states for an Internet Gateway attachment.
 */
type AttachmentState = "attaching" | "attached" | "detaching" | "detached" | "available";
/**
 * Represents an attachment as described by the EC2 API.
 */
interface DescribedAttachment {
    VpcId: string;
    State: AttachmentState;
}
/**
 * Represents a tag as described by the EC2 API.
 */
interface DescribedTag {
    Key: string;
    Value: string;
}
/**
 * Represents an Internet Gateway as described by the EC2 API.
 */
interface DescribedInternetGateway {
    InternetGatewayId: string;
    State: "available";
    Attachments: DescribedAttachment[];
    Tags?: DescribedTag[];
    OwnerId: string;
}
/**
 * The structure of the response from the DescribeInternetGateways API call.
 */
export interface DescribeInternetGatewaysApiResponse {
    InternetGateways: DescribedInternetGateway[];
}
/**
 * Internet Gateway Attachment timeout constants
 */
export declare const INTERNET_GATEWAY_ATTACHMENT_TIMEOUT: TimeoutConfig;
export {};
//# sourceMappingURL=internet-gateway-attachment.d.ts.map