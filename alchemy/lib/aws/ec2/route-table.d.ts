import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { AwsClientProps } from "../client-props.ts";
import type { Vpc } from "./vpc.ts";
/**
 * Properties for creating or updating a Route Table
 */
export interface RouteTableProps extends AwsClientProps {
    /**
     * The VPC to create the route table in
     */
    vpc: Vpc | string;
    /**
     * Tags to apply to the route table
     */
    tags?: Record<string, string>;
    /**
     * Timeout configuration for Route Table operations
     * @default Route Table-specific sensible defaults (30 attempts, 1000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Route Table creation/update
 */
export interface RouteTable extends RouteTableProps {
    /**
     * The ID of the route table
     */
    routeTableId: string;
    /**
     * The ID of the VPC the route table belongs to
     */
    vpcId: string;
}
/**
 * AWS Route Table Resource
 *
 * Creates and manages route tables that control the routing of network traffic
 * within a VPC. Route tables contain rules (routes) that determine where network
 * traffic is directed. Subnet associations are managed separately using the
 * RouteTableAssociation resource.
 *
 * Supports AWS credential overrides at the resource level, allowing you to deploy Route Tables
 * to different AWS accounts or regions than the default scope configuration.
 *
 * @example
 * // Create a basic route table
 * const routeTable = await RouteTable("main-route-table", {
 *   vpc: myVpc,
 *   tags: {
 *     Name: "main-route-table",
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a public route table for internet access
 * const publicRouteTable = await RouteTable("public-routes", {
 *   vpc: myVpc,
 *   tags: {
 *     Name: "public-route-table",
 *     Type: "public",
 *     Purpose: "internet-access"
 *   }
 * });
 *
 * @example
 * // Create Route Table with AWS credential overrides
 * const crossAccountRouteTable = await RouteTable("cross-account-rt", {
 *   vpc: mainVpc,
 *   // Override AWS credentials for this specific resource
 *   region: "us-east-1",
 *   profile: "production-account",
 *   tags: {
 *     Name: "cross-account-route-table",
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create Route Table in different region with role assumption
 * const multiRegionRouteTable = await RouteTable("multi-region-rt", {
 *   vpc: euVpc,
 *   region: "eu-west-1",
 *   roleArn: "arn:aws:iam::123456789012:role/CrossRegionRole",
 *   roleSessionName: "route-table-deployment",
 *   tags: {
 *     Name: "eu-route-table",
 *     Region: "europe"
 *   }
 * });
 *
 * @example
 * // Create Route Table with explicit credentials
 * const explicitCredsRouteTable = await RouteTable("explicit-creds-rt", {
 *   vpc: testVpc,
 *   accessKeyId: alchemy.secret("AKIAIOSFODNN7EXAMPLE"),
 *   secretAccessKey: alchemy.secret("wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"),
 *   region: "us-west-2",
 *   tags: {
 *     Name: "explicit-credentials-rt",
 *     Purpose: "testing"
 *   }
 * });
 *
 * @example
 * // Create a private route table for internal traffic
 * const privateRouteTable = await RouteTable("private-routes", {
 *   vpc: myVpc,
 *   tags: {
 *     Name: "private-route-table",
 *     Type: "private",
 *     Purpose: "internal-only"
 *   }
 * });
 *
 * @example
 * // Create a route table with custom timeout configuration
 * const customRouteTable = await RouteTable("custom-routes", {
 *   vpc: myVpc,
 *   timeout: {
 *     maxAttempts: 45,
 *     delayMs: 1500
 *   },
 *   tags: {
 *     Name: "custom-timeout-route-table"
 *   }
 * });
 *
 * @example
 * // Multi-account deployment with scope-level and resource-level overrides
 * await alchemy.run("production", {
 *   aws: { region: "us-west-2", profile: "main-account" }
 * }, async () => {
 *   // This Route Table uses scope credentials (main-account, us-west-2)
 *   const mainRouteTable = await RouteTable("main-rt", {
 *     vpc: mainVpc,
 *     tags: { Name: "main-account-rt" }
 *   });
 *
 *   // This Route Table overrides to use different account
 *   const crossAccountRouteTable = await RouteTable("cross-account-rt", {
 *     vpc: crossVpc,
 *     profile: "secondary-account",
 *     region: "us-east-1", // Also override region
 *     tags: { Name: "secondary-account-rt" }
 *   });
 * });
 */
export declare const RouteTable: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RouteTable>, _id: string, props: RouteTableProps) => Promise<RouteTable>);
/**
 * Route Table timeout constants
 */
export declare const ROUTE_TABLE_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=route-table.d.ts.map