import { XMLParser } from "fast-xml-parser";
import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import { ignore } from "../../util/ignore.ts";
import { logger } from "../../util/logger.ts";
import {
  mergeTimeoutConfig,
  type TimeoutConfig,
  waitForResourceState,
} from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { InternetGateway } from "./internet-gateway.ts";
import { callEC2Api, createEC2Client } from "./utils.ts";
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
export const InternetGatewayAttachment = Resource(
  "aws::InternetGatewayAttachment",
  async function (
    this: Context<InternetGatewayAttachment>,
    _id: string,
    props: InternetGatewayAttachmentProps,
  ): Promise<InternetGatewayAttachment> {
    // Create EC2 client with credential resolution handled internally
    const client = await createEC2Client(props);
    const timeoutConfig = mergeTimeoutConfig(
      INTERNET_GATEWAY_ATTACHMENT_TIMEOUT,
      props.timeout,
    );

    const internetGatewayId =
      typeof props.internetGateway === "string"
        ? props.internetGateway
        : props.internetGateway.internetGatewayId;
    const vpcId = typeof props.vpc === "string" ? props.vpc : props.vpc.vpcId;

    if (this.phase === "delete") {
      if (this.output?.internetGatewayId && this.output?.vpcId) {
        logger.log(
          `🗑️ Detaching Internet Gateway: ${this.output.internetGatewayId} from VPC: ${this.output.vpcId}`,
        );
        await ignore("Gateway.NotAttached", async () => {
          await ignore("InvalidInternetGatewayID.NotFound", async () => {
            await ignore("InvalidVpcID.NotFound", async () => {
              await callEC2Api(
                client,
                "DetachInternetGateway",
                parseInternetGatewayAttachmentXmlResponse,
                {
                  InternetGatewayId: this.output!.internetGatewayId,
                  VpcId: this.output!.vpcId,
                },
              );
            });
          });
        });

        const checkDetached = async () => {
          try {
            const response =
              await callEC2Api<DescribeInternetGatewaysApiResponse>(
                client,
                "DescribeInternetGateways",
                parseInternetGatewayAttachmentXmlResponse,
                {
                  "InternetGatewayId.1": this.output!.internetGatewayId,
                },
              );
            const igw = response.InternetGateways?.[0];
            if (!igw) {
              return undefined;
            }
            return igw.Attachments?.find(
              (att) => att.VpcId === this.output!.vpcId,
            );
          } catch (error: any) {
            if (error.code === "InvalidInternetGatewayID.NotFound") {
              return undefined;
            }
            throw error;
          }
        };

        await waitForResourceState(
          checkDetached,
          (attachment) => !attachment,
          timeoutConfig,
          `${this.output.internetGatewayId} to ${this.output.vpcId}`,
          "Internet Gateway Attachment",
          "to be detached",
        );

        logger.log(
          `  ✅ Internet Gateway ${this.output.internetGatewayId} detached from VPC ${this.output.vpcId}`,
        );
      }
      return this.destroy();
    }

    // Check if already attached
    if (this.phase === "update" && this.output?.internetGatewayId) {
      // Verify the attachment still exists
      const response = await callEC2Api<DescribeInternetGatewaysApiResponse>(
        client,
        "DescribeInternetGateways",
        parseInternetGatewayAttachmentXmlResponse,
        {
          "InternetGatewayId.1": this.output.internetGatewayId,
        },
      );

      const igw = response.InternetGateways?.[0];
      const attachment = igw?.Attachments?.find((att) => att.VpcId === vpcId);

      if (attachment) {
        return {
          internetGatewayId,
          vpcId,
          state: "attached",
          ...props,
        };
      }
    }

    // Check if already attached before creating
    const checkResponse = await callEC2Api<DescribeInternetGatewaysApiResponse>(
      client,
      "DescribeInternetGateways",
      parseInternetGatewayAttachmentXmlResponse,
      {
        "InternetGatewayId.1": internetGatewayId,
      },
    );

    const existingIgw = checkResponse.InternetGateways?.[0];
    const existingAttachment = existingIgw?.Attachments?.find(
      (att) => att.VpcId === vpcId,
    );

    if (!existingAttachment) {
      // Create the attachment only if it doesn't exist
      await callEC2Api(
        client,
        "AttachInternetGateway",
        parseInternetGatewayAttachmentXmlResponse,
        {
          InternetGatewayId: internetGatewayId,
          VpcId: vpcId,
        },
      );
    }

    // Wait for attachment to complete
    const checkAttached = async () => {
      try {
        const response = await callEC2Api<DescribeInternetGatewaysApiResponse>(
          client,
          "DescribeInternetGateways",
          parseInternetGatewayAttachmentXmlResponse,
          {
            "InternetGatewayId.1": internetGatewayId,
          },
        );
        const igw = response.InternetGateways?.[0];
        if (!igw) {
          return undefined;
        }
        return igw.Attachments?.find((att) => att.VpcId === vpcId);
      } catch (error: any) {
        if (error.code === "InvalidInternetGatewayID.NotFound") {
          return undefined;
        }
        throw error;
      }
    };

    const isAttached = (attachment: DescribedAttachment | undefined) => {
      return (
        attachment?.State === "attached" || attachment?.State === "available"
      );
    };

    await waitForResourceState(
      checkAttached,
      isAttached,
      timeoutConfig,
      `${internetGatewayId} to ${vpcId}`,
      "Internet Gateway Attachment",
      "to be attached",
    );

    return {
      internetGatewayId,
      vpcId,
      state: "attached",
      ...props,
    };
  },
);

/**
 * Possible states for an Internet Gateway attachment.
 */
type AttachmentState =
  | "attaching"
  | "attached"
  | "detaching"
  | "detached"
  | "available";

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
 * Represents a tag item parsed from the raw XML response.
 */
interface XmlTagItem {
  key: string;
  value: string;
}

/**
 * Represents an attachment item parsed from the raw XML response.
 */
interface XmlAttachmentItem {
  vpcId: string;
  state: AttachmentState;
}

/**
 * Represents an Internet Gateway item parsed from the raw XML response.
 */
interface XmlInternetGatewayItem {
  internetGatewayId: string;
  ownerId: string;
  attachmentSet?: {
    item: XmlAttachmentItem | XmlAttachmentItem[];
  };
  tagSet?: {
    item: XmlTagItem | XmlTagItem[];
  };
}

/**
 * Internet Gateway Attachment timeout constants
 */
export const INTERNET_GATEWAY_ATTACHMENT_TIMEOUT: TimeoutConfig = {
  maxAttempts: 60,
  delayMs: 2000, // 2 seconds - IGW attachments are usually fast
};

/**
 * Parse XML responses for Internet Gateway Attachment operations
 */
function parseInternetGatewayAttachmentXmlResponse<T>(xmlText: string): T {
  const parser = new XMLParser({
    ignoreAttributes: true,
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  });

  const parsed = parser.parse(xmlText);
  const result: Record<string, unknown> = {};

  // Handle success responses
  if (parsed.AttachInternetGatewayResponse) {
    result.success = true;
    result.return = parsed.AttachInternetGatewayResponse.return;
  }

  if (parsed.DetachInternetGatewayResponse) {
    result.success = true;
    result.return = parsed.DetachInternetGatewayResponse.return;
  }

  // Handle DescribeInternetGatewaysResponse
  if (parsed.DescribeInternetGatewaysResponse) {
    const internetGatewaySet =
      parsed.DescribeInternetGatewaysResponse.internetGatewaySet;
    if (internetGatewaySet?.item) {
      const igws: XmlInternetGatewayItem[] = Array.isArray(
        internetGatewaySet.item,
      )
        ? internetGatewaySet.item
        : [internetGatewaySet.item];

      result.InternetGateways = igws.map((igw): DescribedInternetGateway => {
        const attachments = igw.attachmentSet?.item
          ? Array.isArray(igw.attachmentSet.item)
            ? igw.attachmentSet.item
            : [igw.attachmentSet.item]
          : [];

        const tags = igw.tagSet?.item
          ? Array.isArray(igw.tagSet.item)
            ? igw.tagSet.item
            : [igw.tagSet.item]
          : [];

        return {
          InternetGatewayId: igw.internetGatewayId,
          State: "available", // IGWs are always available once created
          Attachments: attachments.map(
            (attachment): DescribedAttachment => ({
              VpcId: attachment.vpcId,
              State: attachment.state,
            }),
          ),
          Tags:
            tags.length > 0
              ? tags.map(
                  (tag): DescribedTag => ({
                    Key: tag.key,
                    Value: tag.value,
                  }),
                )
              : undefined,
          OwnerId: igw.ownerId,
        };
      });
    } else {
      result.InternetGateways = [];
    }
  }

  return result as T;
}
