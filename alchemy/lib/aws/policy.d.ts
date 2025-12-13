import type { Context } from "../context.ts";
/**
 * Type of effect for a policy statement
 */
export type Effect = "Allow" | "Deny";
/**
 * A single statement within an IAM policy document
 */
export interface PolicyStatement {
    /**
     * Optional identifier for the statement
     */
    Sid?: string;
    /**
     * Whether to allow or deny the specified actions
     */
    Effect: Effect;
    /**
     * Actions that the policy allows or denies
     */
    Action: string | string[];
    /**
     * Resources that the policy applies to
     */
    Resource?: string | string[];
    /**
     * Additional conditions for when the policy applies
     */
    Condition?: Record<string, Record<string, string | string[]>>;
    /**
     * AWS principals that the policy applies to
     */
    Principal?: Record<string, string | string[]>;
    /**
     * AWS principals that the policy explicitly does not apply to
     */
    NotPrincipal?: Record<string, string | string[]>;
    /**
     * Actions that are explicitly not included in this statement
     */
    NotAction?: string | string[];
    /**
     * Resources that are explicitly not included in this statement
     */
    NotResource?: string | string[];
}
/**
 * An IAM policy document containing one or more statements
 */
export interface PolicyDocument {
    /**
     * Policy language version (must be "2012-10-17")
     */
    Version: "2012-10-17";
    /**
     * List of policy statements
     */
    Statement: PolicyStatement[];
}
/**
 * Properties for creating or updating an IAM policy
 */
export interface PolicyProps {
    /**
     * Name of the policy
     *
     * @default ${app}-${stage}-${id}
     */
    policyName?: string;
    /**
     * Policy document defining the permissions
     */
    document: PolicyDocument;
    /**
     * Optional description of the policy's purpose
     */
    description?: string;
    /**
     * Optional path prefix for the policy
     */
    path?: string;
    /**
     * Optional resource tags
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after IAM policy creation/update
 */
export interface Policy extends PolicyProps {
    /**
     * ARN of the policy
     */
    arn: string;
    /**
     * Name of the Policy.
     */
    policyName: string;
    /**
     * ID of the default policy version
     */
    defaultVersionId: string;
    /**
     * Number of entities the policy is attached to
     */
    attachmentCount: number;
    /**
     * When the policy was created
     */
    createDate: Date;
    /**
     * When the policy was last updated
     */
    updateDate: Date;
    /**
     * Whether the policy can be attached to IAM users/roles
     */
    isAttachable: boolean;
}
/**
 * AWS IAM Policy Resource
 *
 * Creates and manages IAM policies that define permissions for AWS services and resources.
 * Supports automatic versioning and updates when policy content changes.
 *
 * @example
 * // Create a basic S3 bucket access policy
 * const s3Policy = await Policy("bucket-access", {
 *   policyName: "s3-bucket-access",
 *   document: {
 *     Version: "2012-10-17",
 *     Statement: [{
 *       Effect: "Allow",
 *       Action: [
 *         "s3:GetObject",
 *         "s3:PutObject"
 *       ],
 *       Resource: `${bucket.arn}/*`
 *     }]
 *   }
 * });
 *
 * @example
 * // Create a policy with multiple statements and conditions
 * const apiPolicy = await Policy("api-access", {
 *   policyName: "api-gateway-access",
 *   document: {
 *     Version: "2012-10-17",
 *     Statement: [
 *       {
 *         Sid: "InvokeAPI",
 *         Effect: "Allow",
 *         Action: "execute-api:Invoke",
 *         Resource: `${api.executionArn}/*`,
 *         Condition: {
 *           StringEquals: {
 *             "aws:SourceVpc": vpc.id
 *           }
 *         }
 *       },
 *       {
 *         Sid: "ReadLogs",
 *         Effect: "Allow",
 *         Action: [
 *           "logs:GetLogEvents",
 *           "logs:FilterLogEvents"
 *         ],
 *         Resource: `${api.logGroupArn}:*`
 *       }
 *     ]
 *   },
 *   description: "Allows invoking API Gateway endpoints and reading logs",
 *   tags: {
 *     Service: "API Gateway",
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a policy that denies access based on tags
 * const denyPolicy = await Policy("deny-production", {
 *   policyName: "deny-production-access",
 *   document: {
 *     Version: "2012-10-17",
 *     Statement: [{
 *       Effect: "Deny",
 *       Action: "*",
 *       Resource: "*",
 *       Condition: {
 *         StringEquals: {
 *           "aws:ResourceTag/Environment": "production"
 *         }
 *       }
 *     }]
 *   }
 * });
 */
export declare const Policy: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Policy>, id: string, props: PolicyProps) => Promise<Policy>);
//# sourceMappingURL=policy.d.ts.map