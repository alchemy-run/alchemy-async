import type { Context } from "../context.ts";
/**
 * Properties for creating or updating a policy attachment
 */
export interface PolicyAttachmentProps {
    /**
     * ARN of the IAM policy to attach
     */
    policyArn: string;
    /**
     * Name of the IAM role to attach the policy to
     */
    roleName: string;
}
/**
 * Output returned after policy attachment creation/update
 */
export interface PolicyAttachment extends PolicyAttachmentProps {
}
/**
 * AWS IAM Policy Attachment Resource
 *
 * Attaches an IAM policy to a role, enabling the role to use the permissions defined in the policy.
 *
 * @example
 * // Attach an AWS managed policy to a role
 * const adminAccess = await PolicyAttachment("admin-policy", {
 *   policyArn: "arn:aws:iam::aws:policy/AdministratorAccess",
 *   roleName: role.name
 * });
 *
 * @example
 * // Attach a custom policy to a role
 * const customPolicy = await PolicyAttachment("custom-policy", {
 *   policyArn: policy.arn,
 *   roleName: role.name
 * });
 *
 * @example
 * // Attach multiple policies to a role
 * const s3Access = await PolicyAttachment("s3-access", {
 *   policyArn: "arn:aws:iam::aws:policy/AmazonS3FullAccess",
 *   roleName: role.name
 * });
 *
 * const sqsAccess = await PolicyAttachment("sqs-access", {
 *   policyArn: "arn:aws:iam::aws:policy/AmazonSQSFullAccess",
 *   roleName: role.name
 * });
 */
export declare const PolicyAttachment: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<PolicyAttachment>, _id: string, props: PolicyAttachmentProps) => Promise<PolicyAttachmentProps>);
//# sourceMappingURL=policy-attachment.d.ts.map