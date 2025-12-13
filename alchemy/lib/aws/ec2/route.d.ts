import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { InternetGateway } from "./internet-gateway.ts";
import type { NatGateway } from "./nat-gateway.ts";
import type { RouteTable } from "./route-table.ts";
/**
 * Properties for creating or updating a Route
 */
export interface RouteProps extends AwsClientProps {
    /**
     * The route table to add the route to
     */
    routeTable: RouteTable | string;
    /**
     * The destination CIDR block for the route
     * @example "0.0.0.0/0" for default route
     */
    destinationCidrBlock: string;
    /**
     * The target for the route (one of the following)
     */
    target: {
        internetGateway: InternetGateway | string;
    } | {
        natGateway: NatGateway | string;
    } | {
        instanceId: string;
    } | {
        networkInterfaceId: string;
    } | {
        vpcPeeringConnectionId: string;
    } | {
        transitGatewayId: string;
    };
    /**
     * Timeout configuration for Route operations
     * @default Route-specific sensible defaults (30 attempts, 1000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Route creation/update
 */
export interface Route extends RouteProps {
    /**
     * The ID of the route table
     */
    routeTableId: string;
    /**
     * The current state of the route
     */
    state: "active" | "blackhole";
    /**
     * The origin of the route
     */
    origin: "CreateRouteTable" | "CreateRoute" | "EnableVgwRoutePropagation";
}
/**
 * AWS Route Resource
 *
 * Creates and manages individual routes within route tables, directing traffic
 * to various targets like Internet Gateways, NAT Gateways, or instances.
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy Routes
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * // Create a default route to Internet Gateway
 * const publicRoute = await Route("public-default-route", {
 *   routeTable: publicRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { internetGateway: mainIgw }
 * });
 *
 * @example
 * // Create a default route to NAT Gateway for private subnets
 * const privateRoute = await Route("private-default-route", {
 *   routeTable: privateRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { natGateway: mainNat }
 * });
 *
 * @example
 * // Create Route with AWS credential overrides
 * const crossAccountRoute = await Route("cross-account-route", {
 *   routeTable: mainRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { internetGateway: mainIgw },
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 * });
 *
 * @example
 * // Create Route in different region with role assumption
 * const multiRegionRoute = await Route("multi-region-route", {
 *   routeTable: euRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { internetGateway: euIgw },
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "route-deployment",
 * });
 *
 * @example
 * // Create Route with explicit credentials
 * const explicitCredsRoute = await Route("explicit-creds-route", {
 *   routeTable: testRouteTable,
 *   destinationCidrBlock: "0.0.0.0/0",
 *   target: { internetGateway: testIgw },
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 * });
 *
 * @example
 * // Create a route to a specific instance
 * const instanceRoute = await Route("instance-route", {
 *   routeTable: "rtb-12345678",
 *   destinationCidrBlock: "10.1.0.0/16",
 *   target: { instanceId: "i-12345678" }
 * });
 *
 * @example
 * // Create a route to a network interface
 * const eniRoute = await Route("eni-route", {
 *   routeTable: mainRouteTable,
 *   destinationCidrBlock: "192.168.1.0/24",
 *   target: { networkInterfaceId: "eni-12345678" }
 * });
 *
 * @example
 * // Create a route to a VPC peering connection
 * const peeringRoute = await Route("peering-route", {
 *   routeTable: mainRouteTable,
 *   destinationCidrBlock: "10.2.0.0/16",
 *   target: { vpcPeeringConnectionId: "pcx-12345678" }
 * });
 *
 * @example
 * // Create a route to a Transit Gateway
 * const transitRoute = await Route("transit-route", {
 *   routeTable: mainRouteTable,
 *   destinationCidrBlock: "10.3.0.0/16",
 *   target: { transitGatewayId: "tgw-12345678" }
 * });
 *
 * @example
 * // Create a route with custom timeout configuration
 * const customRoute = await Route("custom-route", {
 *   routeTable: mainRouteTable,
 *   destinationCidrBlock: "172.16.0.0/16",
 *   target: { internetGateway: "igw-12345678" },
 *   timeout: {
 *     maxAttempts: 60,
 *     delayMs: 2000
 *   }
 * });
 *
 * @example
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This Route uses scope credentials (main-account, us-west-2)
 *   const mainRoute = await Route("main-route", {
 *     routeTable: mainRouteTable,
 *     destinationCidrBlock: "0.0.0.0/0",
 *     target: { internetGateway: mainIgw }
 *   });
 *
 *   // This Route overrides to use different account
 *   const crossAccountRoute = await Route("cross-account-route", {
 *     routeTable: crossRouteTable,
 *     destinationCidrBlock: "0.0.0.0/0",
 *     target: { internetGateway: crossIgw },
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *   });
 * });
 */
export declare const Route: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Route>, _id: string, props: RouteProps) => Promise<Route>);
/**
 * Route timeout constants
 */
export declare const ROUTE_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=route.d.ts.map