import { type CloudflareApiOptions } from "./api.ts";
/**
 * Options for getting a Cloudflare account ID
 */
export interface GetCloudflareAccountIdOptions extends CloudflareApiOptions {
}
export type AccountId = string;
/**
 * Retrieves a Cloudflare Account ID for use with other Cloudflare resources.
 *
 * This function allows you to programmatically access your Cloudflare account ID,
 * which is required for many Cloudflare API operations.
 *
 * If accountId is provided in the options or via CLOUDFLARE_ACCOUNT_ID environment variable,
 * that value will be used. Otherwise, the account ID will be automatically retrieved
 * from the Cloudflare API.
 *
 * @example
 * // Get account ID from environment variables or API token
 * const accountId = await AccountId();
 *
 * @example
 * // Provide an API key and email directly
 * const accountId = await AccountId({
 *   apiKey: alchemy.secret(process.env.CLOUDFLARE_API_KEY),
 *   email: "user@example.com"
 * });
 *
 * @example
 * // Use the account ID with a Worker
 * import { Worker, AccountId } from "alchemy/cloudflare";
 *
 * const accountId = await AccountId();
 *
 * await Worker("my-worker", {
 *   name: "my-worker",
 *   script: "console.log('Hello, world!')",
 *   accountId
 * });
 */
export declare function AccountId(options?: GetCloudflareAccountIdOptions): Promise<string>;
//# sourceMappingURL=account-id.d.ts.map