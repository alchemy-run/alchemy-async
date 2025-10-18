import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { createCdpClient, type CoinbaseClientOptions } from "./client.ts";
import type { EvmAccount } from "./evm-account.ts";
import type {
  Address,
  FaucetConfig,
  FaucetNetwork,
  FaucetToken,
} from "./types.ts";
import { validateAccountName } from "./utils.ts";

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

export interface EvmSmartAccount
  extends Resource<"coinbase::evm-smart-account"> {
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
export const EvmSmartAccount = Resource(
  "coinbase::evm-smart-account",
  async function (
    this: Context<EvmSmartAccount>,
    _id: string,
    props: EvmSmartAccountProps,
  ): Promise<EvmSmartAccount> {
    // Initialize CDP client with credentials from props or environment
    const cdp = await createCdpClient({
      apiKeyId: props.apiKeyId,
      apiKeySecret: props.apiKeySecret,
      walletSecret: props.walletSecret,
    });

    // Get owner address
    const ownerAddress =
      typeof props.owner === "string" ? props.owner : props.owner.address;

    // Get owner account for CDP operations
    // When owner is an address string, we use it to get the account
    const ownerAccount =
      typeof props.owner === "string"
        ? await cdp.evm.getAccount({ address: props.owner })
        : await cdp.evm.getAccount({ address: props.owner.address });

    // If no name provided, inherit from owner
    // this mean that if you pass only { owner } the created smartAccount will be same name as the EOA owner
    // this to support https://github.com/base/account-sdk/blob/master/packages/account-sdk/src/interface/payment/charge.ts#L120
    let accountName = props.name ? props.name : ownerAccount.name;
    if (!accountName) {
      throw new Error(
        `Smart account requires a name. Either provide 'name' in props or ensure the owner account has a name. Owner address: ${ownerAddress}`,
      );
    }

    // Validate account name format
    validateAccountName(accountName);

    // Handle update phase
    if (this.phase === "update" && this.output) {
      // Check if owner changed (which would require replacement)
      if (ownerAddress !== this.output.ownerAddress) {
        this.replace();
      }
      // Check if name changed
      if (accountName !== this.output.name) {
        await cdp.evm.updateSmartAccount({
          address: this.output.address,
          owner: ownerAccount,
          update: {
            name: accountName,
          },
        });

        return {
          ...this.output,
          name: accountName,
          // faucet: props.faucet, not sure we need this?
        };
      }
      // Update faucet configuration if changed
      if (JSON.stringify(props.faucet) !== JSON.stringify(this.output.faucet)) {
        // Only fund NEW combinations that weren't in the previous config
        try {
          // Get all old combinations
          const oldCombinations = new Set(
            Object.entries(this.output.faucet ?? {}).flatMap(
              ([network, tokens]) =>
                tokens.map((token) => `${network}:${token}`),
            ),
          );

          // Get all new combinations
          const newCombinations = Object.entries(props.faucet ?? {}).flatMap(
            ([network, tokens]) =>
              tokens.map((token) => ({
                network: network as FaucetNetwork,
                token: token as FaucetToken,
                key: `${network}:${token}`,
              })),
          );

          // Filter to only combinations that are actually new
          const toFund = newCombinations.filter(
            ({ key }) => !oldCombinations.has(key),
          );

          if (toFund.length > 0) {
            await Promise.all(
              toFund.map(({ network, token }) =>
                cdp.evm
                  .requestFaucet({
                    address: this.output.address,
                    network,
                    token,
                  })
                  .catch((err) => {
                    console.warn(
                      `⚠️ Failed to request ${token} on ${network} for smart account ${this.output.address}: ${err.message}`,
                    );
                    return null;
                  }),
              ),
            );

            console.log(
              `💧 Requested ${toFund.length} new faucet fund${
                toFund.length === 1 ? "" : "s"
              } for smart account ${this.output.address}`,
            );
          }
        } catch (error: any) {
          console.warn(
            `⚠️ Failed to request additional faucet funds for smart account ${this.output.address}: ${error.message}`,
          );
          // Continue - don't break the update
        }

        return {
          ...this.output,
          faucet: props.faucet,
        };
      }
      return this.output;
    }

    // Handle delete phase
    if (this.phase === "delete") {
      // CDP SDK doesn't support deleting accounts
      // Accounts remain in CDP but are no longer tracked by Alchemy
      console.log(`🗑️ Untracking Smart Account: ${this.output?.address}`);
      return this.destroy();
    }

    let smartAccount;

    // Check for adoption or use getOrCreate pattern
    const adopt = props.adopt ?? this.scope.adopt;
    if (adopt) {
      // With adoption, use getOrCreateSmartAccount which returns existing if it exists
      smartAccount = await cdp.evm.getOrCreateSmartAccount({
        name: accountName,
        owner: ownerAccount,
      });
    } else {
      // Without adoption, create a new smart account
      try {
        smartAccount = await cdp.evm.createSmartAccount({
          name: accountName,
          owner: ownerAccount,
        });
      } catch (error: any) {
        // Provide helpful error message if smart account already exists
        if (error.errorType === "already_exists") {
          throw new Error(
            `Smart account with name '${accountName}' already exists. Use adopt: true to use the existing smart account.`,
          );
        }
        // Rethrow other errors unchanged
        throw error;
      }
    }

    // Fund the smart account if faucet configuration is provided
    if (props.faucet) {
      try {
        const combinations = Object.entries(props.faucet).flatMap(
          ([network, tokens]) =>
            tokens.map((token) => ({
              network: network as FaucetNetwork,
              token: token as FaucetToken,
            })),
        );

        await Promise.all(
          combinations.map(({ network, token }) =>
            cdp.evm
              .requestFaucet({
                address: smartAccount.address,
                network,
                token,
              })
              .catch((err) => {
                console.warn(
                  `⚠️ Failed to request ${token} on ${network} for smart account ${smartAccount.address}: ${err.message}`,
                );
                return null;
              }),
          ),
        );

        console.log(
          `💧 Requested faucet funds for smart account ${smartAccount.address}`,
        );
      } catch (error: any) {
        console.warn(
          `⚠️ Failed to request faucet funds for smart account ${smartAccount.address}: ${error.message}`,
        );
        // Continue - don't break account creation
      }
    }

    // Return smart account details
    return {
      name: accountName,
      address: smartAccount.address,
      ownerAddress,
      faucet: props.faucet,
    } as EvmSmartAccount;
  },
);
