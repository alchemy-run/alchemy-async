/**
 * Common types for Coinbase CDP resources
 */

/**
 * Ethereum address format (20 bytes, 40 hex chars)
 */
export type Address = `0x${string}`;

/**
 * Private key format (32 bytes, 64 hex chars)
 */
export type PrivateKey = `0x${string}`;

/**
 * Transaction hash format (32 bytes, 64 hex chars)
 */
export type TransactionHash = `0x${string}`;

/**
 * Supported testnet networks for faucet requests
 */
export type FaucetNetwork = "base-sepolia" | "ethereum-sepolia";

/**
 * Supported tokens for faucet requests
 */
export type FaucetToken = "eth" | "usdc" | "eurc" | "cbbtc";

/**
 * Faucet configuration for requesting testnet tokens
 */
export type FaucetConfig = Partial<Record<FaucetNetwork, FaucetToken[]>>;
