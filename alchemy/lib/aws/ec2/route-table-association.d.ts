import type { Context } from "../../context.ts";
import { type TimeoutConfig } from "../../util/timeout.ts";
import type { RouteTable } from "./route-table.ts";
import type { Subnet } from "./subnet.ts";
/**
 * Properties for creating or updating a Route Table Association
 */
export interface RouteTableAssociationProps {
    /**
     * The route table to associate
     */
    routeTable: RouteTable | string;
    /**
     * The subnet to associate with the route table
     * Either subnet or gateway must be specified, but not both
     */
    subnet?: Subnet | string;
    /**
     * The internet gateway or virtual private gateway to associate with the route table
     * Either subnet or gateway must be specified, but not both
     */
    gateway?: string;
    /**
     * Timeout configuration for Route Table Association operations
     * @default Route Table Association-specific sensible defaults (30 attempts, 1000ms delay)
     */
    timeout?: Partial<TimeoutConfig>;
}
/**
 * Output returned after Route Table Association creation/update
 */
export interface RouteTableAssociation extends RouteTableAssociationProps {
    /**
     * The ID of the route table association
     */
    associationId: string;
    /**
     * The ID of the route table
     */
    routeTableId: string;
    /**
     * The ID of the subnet (if associated with a subnet)
     */
    subnetId?: string;
    /**
     * The ID of the gateway (if associated with a gateway)
     */
    gatewayId?: string;
    /**
     * Whether this is the main route table association
     */
    isMain: boolean;
    /**
     * The state of the association
     */
    state: string;
}
/**
 * AWS Route Table Association Resource
 *
 * Creates and manages associations between route tables and subnets or gateways.
 * Each subnet can only be associated with one route table at a time. Route table
 * associations determine which route table controls the traffic for a subnet.
 *
 * @example
 * // Associate a subnet with a route table
 * const association = await RouteTableAssociation("subnet-association", {
 *   routeTable: myRouteTable,
 *   subnet: mySubnet
 * });
 *
 * @example
 * // Associate a subnet with a route table using IDs
 * const association = await RouteTableAssociation("subnet-association", {
 *   routeTable: "rtb-12345678",
 *   subnet: "subnet-12345678"
 * });
 *
 * @example
 * // Associate a gateway with a route table
 * const gatewayAssociation = await RouteTableAssociation("gateway-association", {
 *   routeTable: myRouteTable,
 *   gateway: "igw-12345678"
 * });
 *
 * @example
 * // Create association with custom timeout configuration
 * const customAssociation = await RouteTableAssociation("custom-association", {
 *   routeTable: myRouteTable,
 *   subnet: mySubnet,
 *   timeout: {
 *     maxAttempts: 60,
 *     delayMs: 2000
 *   }
 * });
 *
 * @example
 * // Associate multiple subnets with the same route table
 * const publicSubnets = [subnet1, subnet2, subnet3];
 * const associations = await Promise.all(
 *   publicSubnets.map((subnet, index) =>
 *     RouteTableAssociation(`public-association-${index}`, {
 *       routeTable: publicRouteTable,
 *       subnet: subnet
 *     })
 *   )
 * );
 *
 * @example
 * // Associate private subnets with a private route table
 * const privateAssociation1 = await RouteTableAssociation("private-association-1", {
 *   routeTable: privateRouteTable,
 *   subnet: privateSubnet1
 * });
 *
 * const privateAssociation2 = await RouteTableAssociation("private-association-2", {
 *   routeTable: privateRouteTable,
 *   subnet: privateSubnet2
 * });
 *
 * @example
 * // Handle association replacement scenarios
 * const newAssociation = await RouteTableAssociation("replaced-association", {
 *   routeTable: newRouteTable,
 *   subnet: existingSubnet // This will replace any existing association
 * });
 */
export declare const RouteTableAssociation: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RouteTableAssociation>, _id: string, props: RouteTableAssociationProps) => Promise<RouteTableAssociation>);
/**
 * Route Table Association timeout constants
 */
export declare const ROUTE_TABLE_ASSOCIATION_TIMEOUT: TimeoutConfig;
//# sourceMappingURL=route-table-association.d.ts.map