import type { Context } from "../context.ts";
import { type Secret } from "../secret.ts";
/**
 * Base properties shared by all SSM Parameter types
 */
interface SSMParameterBaseProps {
    /**
     * Name of the parameter
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Description of the parameter's purpose
     */
    description?: string;
    /**
     * KMS Key ID for SecureString parameters
     * If not specified, uses the default KMS key for SSM
     */
    keyId?: string;
    /**
     * Parameter tier (Standard or Advanced)
     * Default: "Standard"
     */
    tier?: "Standard" | "Advanced";
    /**
     * Policies to apply to the parameter (JSON string)
     */
    policies?: string;
    /**
     * Data type for String parameters
     */
    dataType?: "text" | "aws:ec2:image";
    /**
     * Resource tags for the parameter
     */
    tags?: Record<string, string>;
}
/**
 * Properties for creating or updating an SSM Parameter
 */
export type SSMParameterProps = (SSMParameterBaseProps & {
    /**
     * Type of parameter - SecureString for encrypted values
     */
    type: "SecureString";
    /**
     * Secret value that will be encrypted in AWS SSM and in alchemy state files
     */
    value: Secret;
}) | (SSMParameterBaseProps & {
    /**
     * Type of parameter - StringList for arrays of strings
     */
    type: "StringList";
    /**
     * Array of strings that will be stored as comma-separated values
     */
    value: string[];
}) | (SSMParameterBaseProps & {
    /**
     * Type of parameter - String for plain text values
     * Default: "String"
     */
    type?: "String";
    /**
     * Plain text value of the parameter
     */
    value: string;
});
/**
 * Output returned after SSM Parameter creation/update
 */
export type SSMParameter = {
    /**
     * ARN of the parameter
     */
    arn: string;
    /**
     * Name of the SSM Parameter.
     */
    name: string;
    /**
     * Version of the parameter
     */
    version: number;
    /**
     * Last modified date
     */
    lastModifiedDate: Date;
} & SSMParameterProps;
/**
 * AWS SSM Parameter Store Parameter Resource
 *
 * Creates and manages SSM parameters with support for different parameter types,
 * encryption, and automatic tag management. Uses discriminated union types to
 * ensure SecureString parameters always use Secret values and StringList uses arrays.
 *
 * @example
 * // Create a basic string parameter
 * const basicParam = await SSMParameter("app-config", {
 *   name: "/myapp/config/database-url",
 *   value: "postgresql://localhost:5432/myapp",
 *   description: "Database connection URL",
 *   tags: {
 *     Environment: "production",
 *     Application: "myapp"
 *   }
 * });
 *
 * @example
 * // Create a secure string parameter for secrets
 * const secretParam = await SSMParameter("app-secret", {
 *   name: "/myapp/secrets/api-key",
 *   value: alchemy.secret("super-secret-api-key"),
 *   type: "SecureString",
 *   description: "Third-party API key",
 *   tags: {
 *     Environment: "production",
 *     Secret: "true"
 *   }
 * });
 *
 * @example
 * // Create a parameter with custom KMS key
 * const encryptedParam = await SSMParameter("encrypted-config", {
 *   name: "/myapp/config/encrypted",
 *   value: alchemy.secret("sensitive-configuration-data"),
 *   type: "SecureString",
 *   keyId: "alias/myapp-kms-key",
 *   description: "Encrypted configuration data",
 *   tier: "Advanced",
 *   tags: {
 *     Environment: "production",
 *     Encrypted: "true"
 *   }
 * });
 *
 * @example
 * // Create a string list parameter
 * const listParam = await SSMParameter("server-list", {
 *   name: "/myapp/config/servers",
 *   value: ["server1.example.com", "server2.example.com", "server3.example.com"],
 *   type: "StringList",
 *   description: "List of application servers",
 *   tags: {
 *     Environment: "production",
 *     Type: "configuration"
 *   }
 * });
 */
export declare const SSMParameter: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<SSMParameter>, id: string, props: SSMParameterProps) => Promise<SSMParameter>);
export {};
//# sourceMappingURL=ssm-parameter.d.ts.map