import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type CloudflareApiOptions } from "./api.ts";
import { type PermissionGroupName } from "./permission-groups.ts";
/**
 * Permission group for a token policy
 */
export type TokenPolicyPermissionGroup = {
    /**
     * ID of the permission group
     */
    id: string;
    /**
     * Optional metadata for the permission group
     */
    meta?: Record<string, any>;
};
/**
 * Policy that defines what the token can access
 */
export interface TokenPolicy {
    /**
     * Effect of the policy
     */
    effect: "allow" | "deny";
    /**
     * Permission groups to include in the policy
     */
    permissionGroups: (PermissionGroupName | TokenPolicyPermissionGroup)[];
    /**
     * Resources the policy applies to
     */
    resources: {
        [key in TokenPolicyResourceKey]?: string;
    };
}
/**
 * @see https://developers.cloudflare.com/fundamentals/api/reference/permissions/
 */
type TokenPolicyResourceKey = "com.cloudflare.edge.r2.bucket" | `com.cloudflare.edge.r2.bucket.${string}` | `com.cloudflare.api.account` | `com.cloudflare.api.account.${string}` | `com.cloudflare.api.account.zone.${string}` | `com.cloudflare.api.user.${string}` | (string & {});
/**
 * Condition for token usage (e.g., IP restrictions)
 */
export interface TokenCondition {
    /**
     * IP address conditions
     */
    requestIp?: {
        /**
         * IP ranges to allow
         */
        in?: string[];
        /**
         * IP ranges to deny
         */
        notIn?: string[];
    };
}
/**
 * Properties for creating or updating an Account API Token
 */
export interface AccountApiTokenProps extends CloudflareApiOptions {
    /**
     * Name of the token
     */
    name?: string;
    /**
     * Policies that define what the token can access
     */
    policies: TokenPolicy[];
    /**
     * Optional expiration date for the token (ISO format)
     */
    expiresOn?: string;
    /**
     * Optional "not before" date (token is not valid before this date) (ISO format)
     */
    notBefore?: string;
    /**
     * Optional conditions for token use (like IP restrictions)
     */
    condition?: TokenCondition;
}
/**
 * Output returned after Account API Token creation/update
 */
export interface AccountApiToken {
    /**
     * The ID of the token
     *
     * Equiv. to ACCESS_KEY_ID
     */
    id: string;
    /**
     * Name of the token
     */
    name: string;
    /**
     * Status of the token
     */
    status: string;
    /**
     * Actual token value (only available on creation)
     * Stored as a Secret for security
     *
     * Equiv. to SECRET_ACCESS_KEY
     */
    value?: Secret;
    /**
     * Access key ID for the token
     *
     * An alias of {@link id}
     */
    accessKeyId: Secret;
    /**
     * Secret access key for the token
     *
     * The SHA-256 hash of the token {@link value}
     *
     * @see https://developers.cloudflare.com/r2/api/tokens/#get-s3-api-credentials-from-an-api-token
     */
    secretAccessKey: Secret;
}
/**
 * Creates a Cloudflare Account API Token with specified permissions.
 *
 * Note: Requires a Cloudflare API Key or Token with admin-level account access.
 * The OAuth token from `wrangler login` is NOT sufficient for this operation.
 * You must use an API token with permission to manage account API tokens.
 *
 * @see https://developers.cloudflare.com/api/resources/accounts/subresources/tokens/methods/create/
 *
 * @example
 * // Create a token with read-only permissions for specific zones
 * const readOnlyToken = await AccountApiToken("readonly-token", {
 *   name: "Readonly Zone Token",
 *   policies: [
 *     {
 *       effect: "allow",
 *       permissionGroups: ["Zone Read", "Analytics Read"],
 *       resources: {
 *         "com.cloudflare.api.account.zone.22b1de5f1c0e4b3ea97bb1e963b06a43": "*",
 *         "com.cloudflare.api.account.zone.eb78d65290b24279ba6f44721b3ea3c4": "*"
 *       }
 *     }
 *   ],
 *   expiresOn: "2024-12-31T23:59:59Z"
 * });
 *
 * @example
 * // Create a token with time and IP restrictions
 * const restrictedToken = await AccountApiToken("restricted-token", {
 *   name: "Restricted Access Token",
 *   policies: [
 *     {
 *       effect: "allow",
 *       permissionGroups: ["Worker Routes Edit"],
 *       resources: {
 *         "com.cloudflare.api.account.worker.route.*": "*"
 *       }
 *     }
 *   ],
 *   notBefore: "2023-01-01T00:00:00Z",
 *   expiresOn: "2023-12-31T23:59:59Z",
 *   condition: {
 *     requestIp: {
 *       in: ["192.168.1.0/24", "10.0.0.0/8"],
 *       notIn: ["192.168.1.100/32"]
 *     }
 *   }
 * });
 *
 * @example
 * // Create a token with bucket access permissions
 * const storageToken = await AccountApiToken("account-access-token", {
 *   name: "alchemy-account-access-token",
 *   policies: [
 *     {
 *       effect: "allow",
 *       permissionGroups: ["Workers R2 Storage Write"],
 *       resources: {
 *         "com.cloudflare.api.account": "*",
 *       },
 *     },
 *   ],
 * });
 */
export declare const AccountApiToken: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<AccountApiToken>, id: string, props: AccountApiTokenProps) => Promise<AccountApiToken>);
export {};
//# sourceMappingURL=account-api-token.d.ts.map