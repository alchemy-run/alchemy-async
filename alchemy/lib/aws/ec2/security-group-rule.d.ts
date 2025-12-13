import type { Context } from "../../context.ts";
import type { SecurityGroup } from "./security-group.ts";
/**
 * Properties for creating or updating a Security Group Rule
 */
export interface SecurityGroupRuleProps {
    /**
     * The security group to apply the rule to.
     */
    securityGroup: SecurityGroup | string;
    /**
     * The type of rule, either 'ingress' (inbound) or 'egress' (outbound).
     */
    type: "ingress" | "egress";
    /**
     * The IP protocol name (tcp, udp, icmp, icmpv6) or number.
     * Use '-1' to specify all protocols.
     */
    protocol: string;
    /**
     * The start of the port range for the rule.
     * For ICMP, this is the ICMP type number. A value of -1 indicates all types.
     */
    fromPort: number;
    /**
     * The end of the port range for the rule.
     * For ICMP, this is the ICMP code. A value of -1 indicates all codes.
     */
    toPort: number;
    /**
     * The IPv4 CIDR ranges to allow.
     */
    cidrBlocks?: string[];
    /**
     * The source security group IDs to allow.
     */
    sourceSecurityGroups?: (SecurityGroup | string)[];
    /**
     * A description for the rule.
     */
    description?: string;
}
/**
 * Output returned after Security Group Rule creation/update
 */
export interface SecurityGroupRule extends SecurityGroupRuleProps {
    /**
     * A unique identifier for the rule resource.
     */
    ruleId: string;
}
/**
 * AWS Security Group Rule Resource
 *
 * Manages a single ingress or egress rule for a security group.
 *
 * @example
 * // A rule to allow HTTP traffic from anywhere
 * const httpRule = await SecurityGroupRule("web-sg-http-rule", {
 *   securityGroup: webSecurityGroup,
 *   type: "ingress",
 *   protocol: "tcp",
 *   fromPort: 80,
 *   toPort: 80,
 *   cidrBlocks: ["0.0.0.0/0"],
 *   description: "Allow HTTP access from anywhere"
 * });
 *
 * @example
 * // A rule to allow a database security group to receive traffic
 * // from a web server security group on the MySQL port.
 * const dbAccessRule = await SecurityGroupRule("db-access-from-web", {
 *   securityGroup: dbSecurityGroup,
 *   type: "ingress",
 *   protocol: "tcp",
 *   fromPort: 3306,
 *   toPort: 3306,
 *   sourceSecurityGroups: [webSecurityGroup],
 *   description: "Allow MySQL access from web servers"
 * });
 */
export declare const SecurityGroupRule: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<SecurityGroupRule>, _id: string, props: SecurityGroupRuleProps) => Promise<SecurityGroupRule>);
//# sourceMappingURL=security-group-rule.d.ts.map