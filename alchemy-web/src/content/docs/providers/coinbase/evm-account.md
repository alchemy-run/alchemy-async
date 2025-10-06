---
title: EvmAccount
description: Manage EVM EOA (Externally Owned Accounts) on Coinbase Developer Platform
---

The `EvmAccount` resource allows you to create and manage EVM Externally Owned Accounts (EOAs) through the Coinbase Developer Platform.

## Usage

```typescript
import { EvmAccount } from "alchemy/coinbase";

const account = await EvmAccount("my-account", {
  name: "my-wallet"
});
```

## Properties

| Name | Type | Required | Description |
|------|------|----------|--------------|
| `name` | `string` | Yes | Name for the account in CDP. Must contain only letters, numbers, and hyphens |
| `privateKey` | `Secret<PrivateKey>` | No | Private key to import an existing account. Must be encrypted using `alchemy.secret()` |
| `adopt` | `boolean` | No | Use existing account with the same name if it exists. Default: `false` |
| `faucet` | `FaucetConfig` | No | Testnet tokens to request automatically on creation/update |
| `apiKeyId` | `Secret` | No | CDP API key ID (overrides environment variable) |
| `apiKeySecret` | `Secret` | No | CDP API key secret (overrides environment variable) |
| `walletSecret` | `Secret` | No | CDP wallet secret (overrides environment variable) |

## Outputs

| Name | Type | Description |
|------|------|-------------|
| `name` | `string` | The account name in CDP |
| `address` | `Address` | The EVM address |
| `faucet` | `FaucetConfig` | Faucet configuration (if provided) |

## Examples

### Basic Account Creation

```typescript
import { EvmAccount } from "alchemy/coinbase";

const account = await EvmAccount("my-account", {
  name: "my-wallet"
});

console.log("Account address:", account.address);
```

### Account with Auto-Funding

Accounts automatically request testnet tokens when created with faucet configuration:

```typescript
import { EvmAccount } from "alchemy/coinbase";

const account = await EvmAccount("test-account", {
  name: "test-wallet",
  faucet: {
    "base-sepolia": ["eth", "usdc"],
    "ethereum-sepolia": ["eth"]
  }
});

// Account automatically receives ETH and USDC on Base Sepolia, and ETH on Ethereum Sepolia
```

### Import Existing Account

Import an account using an encrypted private key:

```typescript
import { EvmAccount } from "alchemy/coinbase";
import alchemy from "alchemy";

const account = await EvmAccount("imported", {
  name: "imported-wallet",
  privateKey: alchemy.secret(process.env.PRIVATE_KEY)
});
```

### Adopt Existing Account

Use an existing account instead of creating a new one:

```typescript
import { EvmAccount } from "alchemy/coinbase";

const account = await EvmAccount("my-account", {
  name: "existing-wallet",
  adopt: true // Uses existing account if it exists
});
```

### Update Account Name

Account names can be updated:

```typescript
import { EvmAccount } from "alchemy/coinbase";

// Initial creation
const account = await EvmAccount("my-account", {
  name: "original-name"
});

// Later, update the name
const updated = await EvmAccount("my-account", {
  name: "new-name"
});

console.log(updated.address === account.address); // true - same address
```

### Update Faucet Configuration

Adding new tokens to faucet configuration automatically requests them:

```typescript
import { EvmAccount } from "alchemy/coinbase";

// Initial account with ETH on Base Sepolia
const account = await EvmAccount("my-account", {
  name: "test-account",
  faucet: {
    "base-sepolia": ["eth"]
  }
});

// Update to add USDC and Ethereum Sepolia
const updated = await EvmAccount("my-account", {
  name: "test-account",
  faucet: {
    "base-sepolia": ["eth", "usdc"],  // USDC will be automatically requested
    "ethereum-sepolia": ["eth"]        // ETH on new network will be requested
  }
});
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

### PrivateKey

```typescript
type PrivateKey = `0x${string}`; // Private key hex format
```

## Notes

- **Name Validation**: Account names must contain only letters, numbers, and hyphens
- **Auto-Funding**: Faucet requests are non-blocking - failures don't prevent account creation
- **Security**: Private keys must be encrypted using `alchemy.secret()` for security
- **Idempotent**: Importing the same private key multiple times returns the same account
- **Immutability**: Accounts remain in CDP even after being removed from Alchemy state