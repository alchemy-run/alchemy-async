import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { type CoinbaseClientOptions } from "./client.ts";
import type { EvmAccount } from "./evm-account.ts";
import type { Address, FaucetConfig } from "./types.ts";
export interface EvmSmartAccountProps extends CoinbaseClientOptions {
    /**
     * Name for the smart account.
     * If not provided, inherits the name from the owner account.
     * This allows EOA and Smart Account to have matching names in CDP.
     * Used for identification in CDP.
     * Must contain only letters, numbers, and hyphens.
     * @default Inherits from owner account name
     */
    name?: string;
    /**
     * The owner account that controls this smart account.
     * Can be either an EvmAccount resource or an owner address.
     */
    owner: EvmAccount | Address;
    /**
     * Whether to adopt an existing smart account with the same name if it already exists.
     * Without adoption, creation will fail if a smart account with the same name exists.
     * With adoption, the existing smart account will be used.
     * @default false
     */
    adopt?: boolean;
    /**
     * Faucet configuration for development funding.
     * Declares which tokens this smart account should have.
     * Used by external funding scripts - not processed by the resource.
     *
     * @example
     * ```ts
     * faucet: {
     *   "base-sepolia": ["eth", "usdc"],
     *   "ethereum-sepolia": ["eth"]
     * }
     * ```
     */
    faucet?: FaucetConfig;
}
export interface EvmSmartAccount extends Resource<"coinbase::evm-smart-account"> {
    /**
     * The smart account name in CDP
     */
    name: string;
    /**
     * The smart account address (same across all EVM networks)
     */
    address: Address;
    /**
     * The owner account address
     */
    ownerAddress: Address;
    /**
     * Faucet configuration (passed through from props)
     */
    faucet?: FaucetConfig;
}
/**
 * Manages ERC-4337 smart accounts on Coinbase Developer Platform.
 * Smart accounts enable gasless transactions and advanced features like batch operations.
 *
 * @example
 * ## Create a smart account with an EVM account owner
 *
 * ```ts
 * const owner = await EvmAccount("owner", {
 *   name: "owner-account"
 * });
 *
 * const smartAccount = await EvmSmartAccount("my-smart-account", {
 *   name: "my-smart-account",
 *   owner: owner
 * });
 *
 * console.log("Smart account address:", smartAccount.address);
 * ```
 *
 * @example
 * ## Create a smart account with existing owner
 *
 * ```ts
 * const smartAccount = await EvmSmartAccount("my-smart-account", {
 *   name: "my-smart-account",
 *   owner: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" // Owner address
 * });
 * ```
 *
 * @example
 * ## Smart account with inherited name
 *
 * When name is omitted, the smart account inherits the owner's name
 *
 * ```ts
 * const owner = await EvmAccount("owner", {
 *   name: "my-app-wallet"
 * });
 *
 * // Smart account will also be named "my-app-wallet" in CDP
 * const smartAccount = await EvmSmartAccount("smart", {
 *   owner: owner
 *   // name is omitted, inherits "my-app-wallet" from owner
 * });
 *
 * console.log(smartAccount.name); // "my-app-wallet"
 * ```
 *
 * @example
 * ## Adopt an existing smart account
 *
 * ```ts
 * const smartAccount = await EvmSmartAccount("my-smart-account", {
 *   name: "existing-smart-account",
 *   owner: ownerAccount, // or "0x..." address
 *   adopt: true // Uses existing smart account if it exists
 * });
 * ```
 */
export declare const EvmSmartAccount: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EvmSmartAccount>, _id: string, props: EvmSmartAccountProps) => Promise<EvmSmartAccount>);
//# sourceMappingURL=evm-smart-account.d.ts.map