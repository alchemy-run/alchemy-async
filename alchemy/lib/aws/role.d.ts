import type { Context } from "../context.ts";
import type { PolicyDocument } from "./policy.ts";
/**
 * Properties for creating or updating an IAM role
 */
export interface RoleProps {
    /**
     * Name of the IAM role
     *
     * @default ${app}-${stage}-${id}
     */
    roleName?: string;
    /**
     * Policy that defines which entities can assume this role
     */
    assumeRolePolicy: PolicyDocument;
    /**
     * Optional description of the role's purpose
     */
    description?: string;
    /**
     * Optional path prefix for the role
     */
    path?: string;
    /**
     * Maximum session duration in seconds when assumed
     * Default: 3600 seconds (1 hour)
     */
    maxSessionDuration?: number;
    /**
     * ARN of the policy used to set the permissions boundary
     */
    permissionsBoundary?: string;
    /**
     * Inline policies to embed in the role
     * Each policy must have a unique name and policy document
     */
    policies?: Array<{
        policyName: string;
        policyDocument: PolicyDocument;
    }>;
    /**
     * List of managed policy ARNs to attach to the role
     */
    managedPolicyArns?: string[];
    /**
     * Resource tags for the role
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after IAM role creation/update
 */
export interface Role extends RoleProps {
    /**
     * ARN of the role
     */
    arn: string;
    /**
     * Name of the Role.
     */
    roleName: string;
    /**
     * Unique identifier for the role
     */
    uniqueId: string;
    /**
     * The stable and unique string identifying the role
     */
    roleId: string;
    /**
     * When the role was created
     */
    createDate: Date;
}
/**
 * AWS IAM Role Resource
 *
 * Creates and manages IAM roles with support for inline policies, managed policies,
 * and automatic cleanup of attached policies during deletion.
 *
 * @example
 * // Create a basic Lambda execution role with inline policy
 * const basicRole = await Role("lambda-role", {
 *   roleName: "lambda-role",
 *   assumeRolePolicy: {
 *     Version: "2012-10-17",
 *     Statement: [{
 *       Effect: "Allow",
 *       Principal: {
 *         Service: "lambda.amazonaws.com"
 *       },
 *       Action: "sts:AssumeRole"
 *     }]
 *   },
 *   description: "Basic Lambda execution role",
 *   tags: {
 *     Environment: "production"
 *   },
 *   policies: [{
 *     policyName: "logs",
 *     policyDocument: {
 *       Version: "2012-10-17",
 *       Statement: [{
 *         Effect: "Allow",
 *         Action: [
 *           "logs:CreateLogGroup",
 *           "logs:CreateLogStream",
 *           "logs:PutLogEvents"
 *         ],
 *         Resource: "*"
 *       }]
 *     }
 *   }]
 * });
 *
 * @example
 * // Create a role with AWS managed policies
 * const managedRole = await Role("readonly-role", {
 *   roleName: "readonly-role",
 *   assumeRolePolicy: {
 *     Version: "2012-10-17",
 *     Statement: [{
 *       Effect: "Allow",
 *       Principal: {
 *         Service: "lambda.amazonaws.com"
 *       },
 *       Action: "sts:AssumeRole"
 *     }]
 *   },
 *   description: "Role with managed policies",
 *   managedPolicyArns: [
 *     "arn:aws:iam::aws:policy/ReadOnlyAccess"
 *   ],
 *   tags: {
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a role with multiple inline policies and custom session duration
 * const customRole = await Role("custom-role", {
 *   roleName: "custom-role",
 *   assumeRolePolicy: {
 *     Version: "2012-10-17",
 *     Statement: [{
 *       Effect: "Allow",
 *       Principal: {
 *         Service: "lambda.amazonaws.com"
 *       },
 *       Action: "sts:AssumeRole"
 *     }]
 *   },
 *   description: "Role with multiple policies",
 *   maxSessionDuration: 7200,
 *   policies: [
 *     {
 *       policyName: "logs",
 *       policyDocument: {
 *         Version: "2012-10-17",
 *         Statement: [{
 *           Effect: "Allow",
 *           Action: [
 *             "logs:CreateLogGroup",
 *             "logs:CreateLogStream",
 *             "logs:PutLogEvents"
 *           ],
 *           Resource: "*"
 *         }]
 *       }
 *     },
 *     {
 *       policyName: "s3",
 *       policyDocument: {
 *         Version: "2012-10-17",
 *         Statement: [{
 *           Effect: "Allow",
 *           Action: "s3:ListBucket",
 *           Resource: "*"
 *         }]
 *       }
 *     }
 *   ],
 *   tags: {
 *     Environment: "production",
 *     Updated: "true"
 *   }
 * });
 */
export declare const Role: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Role>, id: string, props: RoleProps) => Promise<Role>);
//# sourceMappingURL=role.d.ts.map