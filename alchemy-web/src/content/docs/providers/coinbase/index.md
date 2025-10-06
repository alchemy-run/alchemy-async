---
title: Coinbase Provider
description: Manage blockchain accounts and smart contracts on Coinbase Developer Platform
---

The Coinbase provider brings blockchain resources as first-class citizens to Infrastructure as Code. Just as you provision databases, servers, and CDNs, you can now declaratively manage blockchain accounts and smart contracts through Alchemy, powered by the Coinbase Developer Platform (CDP) SDK.

## Resources

The Coinbase provider includes the following resources:

- [EvmAccount](/providers/coinbase/evm-account/) - Manage EVM EOA (Externally Owned Accounts)
- [EvmSmartAccount](/providers/coinbase/evm-smart-account/) - Manage ERC-4337 smart accounts for gasless transactions

## Prerequisites

1. **CDP API Keys**: Obtain API credentials from the [Coinbase Developer Platform Portal](https://portal.cdp.coinbase.com/)

2. **Authentication**: Set up your CDP credentials as environment variables:

```bash
export CDP_API_KEY_ID=your-api-key-id
export CDP_API_KEY_SECRET=your-api-key-secret
export CDP_WALLET_SECRET=your-wallet-secret
```

## Example

Here's a complete example of using the Coinbase provider to create accounts with automatic testnet funding:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";
import alchemy from "alchemy";

// Create an EOA (Externally Owned Account)
const ownerAccount = await EvmAccount("owner", {
  name: "my-wallet",
  faucet: {
    "base-sepolia": ["eth", "usdc"],
    "ethereum-sepolia": ["eth"]
  }
});

// Create a smart account controlled by the EOA
const smartAccount = await EvmSmartAccount("smart", {
  owner: ownerAccount,
  // Name is optional - inherits from owner if not specified
  faucet: {
    "base-sepolia": ["eth", "usdc"]
  }
});

// Import an existing account with a private key
const treasuryAccount = await EvmAccount("treasury", {
  name: "treasury-wallet",
  privateKey: alchemy.secret(process.env.TREASURY_PRIVATE_KEY)
});

// Create a smart account with an external owner
const externalSmartAccount = await EvmSmartAccount("external-smart", {
  name: "external-smart-wallet",
  owner: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb", // Owner address
  adopt: true // Use existing smart account if it already exists
});

console.log("EOA Address:", ownerAccount.address);
console.log("Smart Account Address:", smartAccount.address);
console.log("Treasury Address:", treasuryAccount.address);
```

## Automatic Funding

When you provide a `faucet` configuration, accounts automatically request testnet tokens on creation and updates. This eliminates the need to manually fund accounts for development:

```typescript
const account = await EvmAccount("test", {
  name: "test-account",
  faucet: {
    "base-sepolia": ["eth", "usdc"],
    "ethereum-sepolia": ["eth"]
  }
});
// Account is automatically funded with ETH and USDC on Base Sepolia, and ETH on Ethereum Sepolia
```

## Faucet Script

For bulk funding operations or re-funding existing accounts, use the included faucet script:

### Setup

Add to your `package.json`:

```json
{
  "scripts": {
    "faucet": "bun node_modules/alchemy/src/coinbase/faucet.ts"
  }
}
```

### Usage

```bash
# Fund all accounts with faucet configuration
bun run faucet

# Fund only accounts in 'dev' stage
bun run faucet dev

# Fund specific scope
bun run faucet backend/dev
```

The script:
- Discovers all Coinbase accounts with `faucet` metadata
- Requests tokens from CDP faucet for each configured network/token pair
- Handles rate limiting automatically
- Tracks funded combinations to avoid duplicates

## Key Features

### Resource Immutability
Due to the immutable nature of blockchain, `EvmAccount` and `EvmSmartAccount` resources persist in CDP even after running `alchemy destroy`. When destroyed, accounts are removed from Alchemy's state tracking but continue to exist in the Coinbase Developer Platform.

### Account Name Validation
The provider validates that account names contain only letters, numbers, and hyphens. CDP will provide detailed validation errors for any additional requirements like length restrictions.

### Smart Account Name Inheritance
When creating a smart account without specifying a name, it inherits the owner account's name. This creates matching names in CDP for both EOA and smart account pairs. This pattern follows the [Base Account SDK's payment charge interface](https://github.com/base/account-sdk/blob/master/packages/account-sdk/src/interface/payment/charge.ts#L120), ensuring compatibility when using Coinbase's payment infrastructure

### Resource Adoption
Use the `adopt: true` flag to use existing accounts instead of creating new ones:

```typescript
const account = await EvmAccount("my-account", {
  name: "existing-account",
  adopt: true // Uses existing account if it exists
});
```

## Security

Private keys must be encrypted using `alchemy.secret()` to ensure they are never exposed in state files:

```typescript
// ✅ Correct - Private key is encrypted
const account = await EvmAccount("secure", {
  name: "secure-wallet",
  privateKey: alchemy.secret(process.env.PRIVATE_KEY)
});

// ❌ Wrong - Never pass plain text private keys
// This will cause a TypeScript error
```

## Additional Resources

- [Coinbase Developer Platform Documentation](https://docs.cdp.coinbase.com/)
- [CDP SDK TypeScript Reference](https://coinbase.github.io/cdp-sdk/typescript/)
- [Base Network Documentation](https://docs.base.org/)
- [ERC-4337 Account Abstraction](https://eips.ethereum.org/EIPS/eip-4337)