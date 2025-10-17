#!/usr/bin/env bun
/**
 * Request testnet tokens from Coinbase faucet for accounts with faucet metadata
 *
 * Usage:
 *   bun node_modules/alchemy/src/coinbase/faucet.ts              # Fund all accounts with faucet config
 *   bun node_modules/alchemy/src/coinbase/faucet.ts dev          # Fund only accounts in dev scope
 *   bun node_modules/alchemy/src/coinbase/faucet.ts backend/dev  # Fund specific scope
 */

import { glob } from "glob";
import { access, readFile } from "node:fs/promises";
import { join } from "pathe";
import { createCdpClient } from "./client.ts";
import type { EvmAccount } from "./evm-account.ts";
import type { EvmSmartAccount } from "./evm-smart-account.ts";
import type { FaucetNetwork, FaucetToken } from "./types.ts";

// Track funded combinations to avoid duplicates within this run
const funded = new Set<string>();

// Get optional scope argument
const scope = process.argv[2];

// Initialize CDP client (uses CDP_* env vars automatically)
const cdp = await createCdpClient();

let stateFiles: string[];

if (scope) {
  // If scope provided, find matching directories
  const scopePath = join(".alchemy", scope);

  let scopeExists = false;
  try {
    await access(scopePath);
    scopeExists = true;
  } catch {
    scopeExists = false;
  }

  if (scopeExists) {
    // Exact match found
    console.log(`Using scope: ${scope}`);
    stateFiles = await glob("*.json", {
      cwd: scopePath,
      absolute: true,
    });
  } else {
    // Try to find directories that end with the provided scope
    // We need to find directories, so we'll look for JSON files and extract the directory paths
    const allFiles = await glob(`**/${scope}/*.json`, {
      cwd: ".alchemy",
    });

    // Extract unique directory paths
    const possibleScopes = [
      ...new Set(allFiles.map((f) => f.replace(/\/[^/]+\.json$/, ""))),
    ];

    if (possibleScopes.length === 0) {
      console.error(`No scope found matching: ${scope}`);
      process.exit(1);
    } else if (possibleScopes.length === 1) {
      // Found exactly one match
      const foundScope = possibleScopes[0];
      console.log(`Using scope: ${foundScope}`);
      stateFiles = await glob("*.json", {
        cwd: join(".alchemy", foundScope),
        absolute: true,
      });
    } else {
      // Multiple matches found - use all of them
      console.log(`Found ${possibleScopes.length} scopes matching '${scope}':`);
      for (const s of possibleScopes) {
        console.log(`  - ${s}`);
      }

      // Collect state files from all matching scopes
      stateFiles = [];
      for (const foundScope of possibleScopes) {
        const files = await glob("*.json", {
          cwd: join(".alchemy", foundScope),
          absolute: true,
        });
        stateFiles.push(...files);
      }
    }
  }
} else {
  // No scope provided, search all .alchemy subdirectories
  console.log("Searching all scopes for accounts with faucet configuration...");
  stateFiles = await glob("**/*.json", {
    cwd: ".alchemy",
    absolute: true,
  });
}

const allStates = (
  await Promise.all(
    stateFiles.map(async (file) => {
      try {
        const content = await readFile(file, "utf-8");
        return JSON.parse(content);
      } catch {
        return null;
      }
    }),
  )
).filter(Boolean);

const accounts = allStates
  .filter(
    (state) =>
      state?.kind?.startsWith("coinbase::evm") &&
      state.output &&
      (state.output as EvmAccount | EvmSmartAccount).faucet,
  )
  .map((state) => {
    const output = state.output as EvmAccount | EvmSmartAccount;
    return {
      address: output.address,
      name: output.name,
      faucet: output.faucet!,
    };
  });

if (accounts.length === 0) {
  console.log("No accounts with faucet configuration found");
  process.exit(0);
}

console.log(`Found ${accounts.length} accounts with faucet configuration\n`);

for (const account of accounts) {
  console.log(`Account: ${account.name} (${account.address})`);

  for (const [network, tokens] of Object.entries(account.faucet)) {
    for (const token of tokens) {
      const key = `${account.address}-${network}-${token}`;

      // Skip if already processed in this run
      if (funded.has(key)) {
        console.log(`  ⏭️  Skipping ${token} on ${network} (already requested)`);
        continue;
      }

      // Request tokens from faucet
      try {
        console.log(`  💧 Requesting ${token} on ${network}...`);

        const response = await cdp.evm.requestFaucet({
          address: account.address,
          network: network as FaucetNetwork,
          token: token as FaucetToken,
        });

        console.log(`  ✅ Funded: ${response.transactionHash}`);
        funded.add(key);

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error: any) {
        console.log(
          `  ❌ Error funding ${token} on ${network}: ${error.message}`,
        );
      }
    }
  }
  console.log();
}

console.log("✨ Funding complete!");
