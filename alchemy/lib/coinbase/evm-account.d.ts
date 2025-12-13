import type { Context } from "../context.ts";
import type { Secret } from "../index.ts";
import { Resource } from "../resource.ts";
import { type CoinbaseClientOptions } from "./client.ts";
import type { Address, FaucetConfig, PrivateKey } from "./types.ts";
export type { FaucetConfig, FaucetNetwork, FaucetToken } from "./types.ts";
export interface EvmAccountProps extends CoinbaseClientOptions {
    /**
     * Name for the account.
     * Used for identification in CDP.
     * Must contain only letters, numbers, and hyphens.
     */
    name: string;
    /**
     * Optional private key to import an existing account.
     * Must be a hex string (starting with 0x) encrypted using alchemy.secret().
     * If not provided, a new account will be created or existing one will be used.
     *
     * @example
     * ```ts
     * privateKey: alchemy.secret(process.env.PRIVATE_KEY)
     * ```
     */
    privateKey?: Secret<PrivateKey>;
    /**
     * Whether to adopt an existing account with the same name if it already exists.
     * Without adoption, creation will fail if an account with the same name exists.
     * With adoption, the existing account will be used.
     * @default false
     */
    adopt?: boolean;
    /**
     * Faucet configuration for development funding.
     * Declares which tokens this account should have.
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
export interface EvmAccount extends Resource<"coinbase::evm-account"> {
    /**
     * The account name in CDP
     */
    name: string;
    /**
     * The EVM address (same across all EVM networks)
     */
    address: Address;
    /**
     * Faucet configuration (passed through from props)
     */
    faucet?: FaucetConfig;
}
/**
 * Manages EVM EOA (Externally Owned Accounts) on Coinbase Developer Platform.
 *
 * @example
 * ## Create a new EVM account
 *
 * ```ts
 * const account = await EvmAccount("my-account", {
 *   name: "my-account"
 * });
 *
 * console.log("Account address:", account.address);
 * ```
 *
 * @example
 * ## Create account with funding metadata
 *
 * Declare what tokens this account needs for development
 *
 * ```ts
 * const account = await EvmAccount("test-account", {
 *   name: "test-account",
 *   faucet: {
 *     "base-sepolia": ["eth", "usdc"],
 *     "ethereum-sepolia": ["eth"]
 *   }
 * });
 *
 * // Account automatically requests tokens on creation
 * // The faucet script can be used for bulk funding operations
 * ```
 *
 * @example
 * ## Import an existing account
 *
 * Import an existing EVM account using a private key
 *
 * ```ts
 * const account = await EvmAccount("imported-account", {
 *   name: "imported-account",
 *   privateKey: alchemy.secret(process.env.COINBASE_PRIVATE_KEY)
 * });
 * ```
 *
 * @example
 * ## Adopt an existing account
 *
 * Use an existing account with the same name if it exists
 *
 * ```ts
 * const account = await EvmAccount("my-account", {
 *   name: "existing-account",
 *   adopt: true // Uses existing account if it exists
 * });
 * ```
 */
export declare const EvmAccount: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<EvmAccount>, _id: string, props: EvmAccountProps) => Promise<EvmAccount>);
//# sourceMappingURL=evm-account.d.ts.map