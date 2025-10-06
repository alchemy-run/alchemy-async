import type { CdpClient } from "@coinbase/cdp-sdk";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { importPeer } from "../util/peer.ts";

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
export async function createCdpClient(
  options: CoinbaseClientOptions = {},
): Promise<CdpClient> {
  const { CdpClient } = await importPeer(
    import("@coinbase/cdp-sdk"),
    "Coinbase resources",
  );

  // Build options object for CdpClient constructor
  const clientOptions: {
    apiKeyId?: string;
    apiKeySecret?: string;
    walletSecret?: string;
  } = {};

  // Only set values if explicitly provided, otherwise let CDP SDK use its defaults
  if (options.apiKeyId) {
    clientOptions.apiKeyId =
      typeof options.apiKeyId === "string"
        ? options.apiKeyId
        : options.apiKeyId.unencrypted;
  }

  if (options.apiKeySecret) {
    clientOptions.apiKeySecret = options.apiKeySecret.unencrypted;
  }

  if (options.walletSecret) {
    clientOptions.walletSecret = options.walletSecret.unencrypted;
  }

  // CDP SDK will automatically use environment variables if not provided:
  // CDP_API_KEY_ID, CDP_API_KEY_SECRET, CDP_WALLET_SECRET
  return new CdpClient(clientOptions);
}

/**
 * Handle CDP SDK deletion errors gracefully
 *
 * @param error The error from CDP SDK
 * @param resourceType The type of resource being deleted
 * @param resourceId The ID or name of the resource
 */
export function handleCdpDeleteError(
  _error: any,
  resourceType: string,
  resourceId?: string,
): void {
  // CDP SDK doesn't support deleting accounts, so we just log
  logger.log(
    `${resourceType} ${resourceId || "unknown"} cannot be deleted from CDP (CDP limitation)`,
  );
}

/**
 * Check if an error indicates the resource already exists
 *
 * @param error The error from CDP SDK
 * @returns True if the error indicates a conflict/already exists
 */
export function isCdpConflictError(error: any): boolean {
  return (
    error?.message?.toLowerCase()?.includes("already exists") ||
    error?.message?.toLowerCase()?.includes("duplicate") ||
    error?.code === "ALREADY_EXISTS" ||
    error?.code === "CONFLICT"
  );
}

/**
 * Verifies CDP authentication and provides helpful error messages
 *
 * @param client CDP client
 */
export async function verifyCdpAuth(client: CdpClient): Promise<void> {
  try {
    // Make a test request to check authentication
    // List accounts is a good test as it requires valid credentials
    await client.evm.listAccounts();
  } catch (error: any) {
    if (error.errorType === "unauthorized") {
      logger.error(
        "\n⚠️ Coinbase CDP authentication failed. Please check your credentials:",
      );
      logger.error("1. Ensure CDP_API_KEY_ID is set with your API Key ID");
      logger.error(
        "2. Ensure CDP_API_KEY_SECRET is set with your API Key Secret",
      );
      logger.error(
        "3. Ensure CDP_WALLET_SECRET is set with your Wallet Secret",
      );
      logger.error(
        "\nTo create API credentials, visit: https://portal.cdp.coinbase.com/",
      );
      logger.error(
        "Required permissions: Account management and transaction signing\n",
      );
      throw new Error("CDP authentication failed");
    }
    if (error.errorType === "unauthorized") {
      logger.error(
        "\n⚠️ Insufficient permissions. Your API key needs account management permissions.",
      );
      logger.error(
        "Make sure your API key has the required scopes for creating and managing accounts\n",
      );
      throw new Error("Insufficient CDP permissions");
    }
    throw error;
  }
}
