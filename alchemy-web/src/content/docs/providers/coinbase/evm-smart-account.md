---
title: EvmSmartAccount
description: Manage ERC-4337 smart accounts for gasless transactions on Coinbase Developer Platform
---

The `EvmSmartAccount` resource allows you to create and manage ERC-4337 smart accounts through the Coinbase Developer Platform. Smart accounts enable gasless transactions and advanced features like batch operations.

## Usage

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "owner-wallet"
});

const smartAccount = await EvmSmartAccount("smart", {
  name: "smart-wallet",
  owner: owner
});
```

## Properties

| Name | Type | Required | Description |
|------|------|----------|--------------|
| `owner` | `EvmAccount \| Address` | Yes | The owner account that controls this smart account |
| `name` | `string` | No | Name for the smart account in CDP. If omitted, inherits from owner account name. Must contain only letters, numbers, and hyphens |
| `adopt` | `boolean` | No | Use existing smart account with the same name if it exists. Default: `false` |
| `faucet` | `FaucetConfig` | No | Testnet tokens to request automatically on creation/update |
| `apiKeyId` | `Secret` | No | CDP API key ID (overrides environment variable) |
| `apiKeySecret` | `Secret` | No | CDP API key secret (overrides environment variable) |
| `walletSecret` | `Secret` | No | CDP wallet secret (overrides environment variable) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The smart account name in CDP |
| `address` | `Address` | The smart account address |
| `ownerAddress` | `Address` | The owner account address |
| `faucet` | `FaucetConfig` | Faucet configuration (if provided) |

## Examples

### Smart Account with EVM Owner

Create a smart account controlled by an EOA:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "owner-account"
});

const smartAccount = await EvmSmartAccount("my-smart-account", {
  name: "my-smart-account",
  owner: owner
});

console.log("Smart account address:", smartAccount.address);
```

### Smart Account with External Owner

Create a smart account with an existing owner address:

```typescript
import { EvmSmartAccount } from "alchemy/coinbase";

const smartAccount = await EvmSmartAccount("my-smart-account", {
  name: "my-smart-account",
  owner: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb" // Owner address
});
```

### Smart Account with Inherited Name

When name is omitted, the smart account inherits the owner's name. This pattern follows the [Base Account SDK's payment charge interface](https://github.com/base/account-sdk/blob/master/packages/account-sdk/src/interface/payment/charge.ts#L120):

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "my-app-wallet"
});

// Smart account will also be named "my-app-wallet" in CDP
const smartAccount = await EvmSmartAccount("smart", {
  owner: owner
  // name is omitted, inherits "my-app-wallet" from owner
});

console.log(smartAccount.name); // "my-app-wallet"
```

### Smart Account with Auto-Funding

Smart accounts automatically request testnet tokens when created with faucet configuration:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "owner-wallet"
});

const smartAccount = await EvmSmartAccount("smart", {
  name: "smart-wallet",
  owner: owner,
  faucet: {
    "base-sepolia": ["eth", "usdc"]
  }
});

// Smart account automatically receives ETH and USDC on Base Sepolia
```

### Adopt Existing Smart Account

Use an existing smart account instead of creating a new one:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "owner-wallet"
});

const smartAccount = await EvmSmartAccount("my-smart-account", {
  name: "existing-smart-account",
  owner: owner,
  adopt: true // Uses existing smart account if it exists
});
```

### Update Smart Account Name

Smart account names can be updated:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner = await EvmAccount("owner", {
  name: "owner-wallet"
});

// Initial creation
const smartAccount = await EvmSmartAccount("smart", {
  name: "original-name",
  owner: owner
});

// Later, update the name
const updated = await EvmSmartAccount("smart", {
  name: "new-name",
  owner: owner
});

console.log(updated.address === smartAccount.address); // true - same address
```

## Owner Changes

Changing the owner of a smart account triggers a replacement - a new smart account is created:

```typescript
import { EvmAccount, EvmSmartAccount } from "alchemy/coinbase";

const owner1 = await EvmAccount("owner1", { name: "owner-1" });
const owner2 = await EvmAccount("owner2", { name: "owner-2" });

// Initial smart account with owner1
const smart = await EvmSmartAccount("smart", {
  name: "smart-account",
  owner: owner1
});

// Changing owner creates a new smart account
const replaced = await EvmSmartAccount("smart", {
  name: "smart-account",
  owner: owner2 // Different owner
});

console.log(replaced.address !== smart.address); // true - new address
```


## Type Definitions

### FaucetConfig

```typescript
type FaucetNetwork = "base-sepolia" | "ethereum-sepolia";
type FaucetToken = "eth" | "usdc" | "eurc" | "cbbtc";
type FaucetConfig = Partial<Record<FaucetNetwork, FaucetToken[]>>;
```

### Address

```typescript
type Address = `0x${string}`; // Ethereum address format
```

## Notes

- **Name Validation**: Account names must contain only letters, numbers, and hyphens
- **Name Inheritance**: When name is omitted, inherits from owner account name
- **Owner Changes**: Changing the owner triggers replacement (new smart account created)
- **Auto-Funding**: Faucet requests are non-blocking - failures don't prevent account creation
- **Gasless Support**: Currently supported on Base Sepolia and Base Mainnet
- **Immutability**: Smart accounts remain in CDP even after being removed from Alchemy state