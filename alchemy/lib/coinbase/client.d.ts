import type { CdpClient } from "@coinbase/cdp-sdk";
import type { Secret } from "../secret.ts";
export interface CoinbaseClientOptions {
    /**
     * CDP API Key ID. If not provided, falls back to CDP_API_KEY_ID environment variable.
     */
    apiKeyId?: Secret<string> | string;
    /**
     * CDP API Key Secret. If not provided, falls back to CDP_API_KEY_SECRET environment variable.
     * Must be wrapped in alchemy.secret() for security.
     */
    apiKeySecret?: Secret<string>;
    /**
     * CDP Wallet Secret. If not provided, falls back to CDP_WALLET_SECRET environment variable.
     * Must be wrapped in alchemy.secret() for security.
     */
    walletSecret?: Secret<string>;
}
/**
 * Create an authenticated CDP client
 *
 * The CDP SDK automatically looks for these environment variables:
 * - CDP_API_KEY_ID
 * - CDP_API_KEY_SECRET
 * - CDP_WALLET_SECRET
 *
 * You can override them by passing values in the options.
 *
 * @param options Options for creating the client
 * @returns An authenticated CDP client
 */
export declare function createCdpClient(options?: CoinbaseClientOptions): Promise<CdpClient>;
/**
 * Handle CDP SDK deletion errors gracefully
 *
 * @param error The error from CDP SDK
 * @param resourceType The type of resource being deleted
 * @param resourceId The ID or name of the resource
 */
export declare function handleCdpDeleteError(_error: any, resourceType: string, resourceId?: string): void;
/**
 * Check if an error indicates the resource already exists
 *
 * @param error The error from CDP SDK
 * @returns True if the error indicates a conflict/already exists
 */
export declare function isCdpConflictError(error: any): boolean;
/**
 * Verifies CDP authentication and provides helpful error messages
 *
 * @param client CDP client
 */
export declare function verifyCdpAuth(client: CdpClient): Promise<void>;
//# sourceMappingURL=client.d.ts.map