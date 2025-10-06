import { describe, expect } from "vitest";
import { EvmAccount } from "../../src/coinbase/evm-account.ts";
import { EvmSmartAccount } from "../../src/coinbase/evm-smart-account.ts";
import { validateAccountName } from "../../src/coinbase/utils.ts";
import { destroy } from "../../src/destroy.ts";
import alchemy from "../../src/index.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Coinbase", () => {
  describe("validateAccountName", () => {
    test("accepts valid names", async () => {
      // Valid names should not throw
      expect(() => validateAccountName("valid-name")).not.toThrow();
      expect(() => validateAccountName("name-with-hyphens")).not.toThrow();
      expect(() => validateAccountName("name123")).not.toThrow();
      expect(() => validateAccountName("123name")).not.toThrow();
      expect(() => validateAccountName("UPPERCASE")).not.toThrow();
      expect(() => validateAccountName("lowercase")).not.toThrow();
      expect(() => validateAccountName("MixedCase123")).not.toThrow();
      expect(() => validateAccountName("a")).not.toThrow(); // single character is valid pattern
      expect(() =>
        validateAccountName("very-long-name-with-many-characters-123456789"),
      ).not.toThrow(); // let CDP handle length
    });

    test("rejects invalid names", async () => {
      // Names with spaces
      expect(() => validateAccountName("name with spaces")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );

      // Names with underscores
      expect(() => validateAccountName("name_with_underscores")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );

      // Names with special characters
      expect(() => validateAccountName("name@special")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );
      expect(() => validateAccountName("name.with.dots")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );
      expect(() => validateAccountName("name!")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );

      // Names starting with hyphen
      expect(() => validateAccountName("-name")).toThrow(
        /cannot start or end with a hyphen/,
      );
      expect(() => validateAccountName("-")).toThrow(
        /cannot start or end with a hyphen/,
      );

      // Names ending with hyphen
      expect(() => validateAccountName("name-")).toThrow(
        /cannot start or end with a hyphen/,
      );

      // Names both starting and ending with hyphen
      expect(() => validateAccountName("-name-")).toThrow(
        /cannot start or end with a hyphen/,
      );

      // Empty name
      expect(() => validateAccountName("")).toThrow(
        /CDP only allows letters, numbers, and hyphens/,
      );
    });
  });

  describe.skip("EvmAccount", () => {
    test("create standard EVM account", async (scope) => {
      const accountId = `${BRANCH_PREFIX}-standard-account`;
      let account: EvmAccount;

      try {
        // Create account
        account = (await EvmAccount(accountId, {
          name: "test-standard-account",
        })) as EvmAccount;

        expect(account).toMatchObject({
          id: accountId,
          type: "coinbase::evm-account",
          name: "test-standard-account",
        });
        expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

        // Update account (should return existing)
        const updatedAccount = (await EvmAccount(accountId, {
          name: "test-standard-account",
        })) as EvmAccount;

        expect(updatedAccount).toMatchObject({
          id: accountId,
          name: account.name,
          address: account.address,
        });
      } finally {
        await destroy(scope);
        // Note: Accounts persist in CDP but are no longer tracked by Alchemy
        console.log(`✅ Account ${account!.address} is no longer tracked`);
      }
    });

    describe.skipIf(!process.env.TEST_COINBASE_PRIVATE_KEY)(
      "import existing EVM account",
      () => {
        test("import with private key", async (scope) => {
          const accountId = `${BRANCH_PREFIX}-imported-account`;
          let account: EvmAccount;

          try {
            // Import account with private key
            account = (await EvmAccount(accountId, {
              name: "imported-account",
              privateKey: alchemy.secret(
                process.env.TEST_COINBASE_PRIVATE_KEY as `0x${string}`,
              ),
            })) as EvmAccount;

            expect(account).toMatchObject({
              id: accountId,
              type: "coinbase::evm-account",
              name: "imported-account",
            });
            expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
          } finally {
            await destroy(scope);
            console.log(`✅ Account ${account!.address} is no longer tracked`);
          }
        });
      },
    );

    test("update account name", async (scope) => {
      const accountId = `${BRANCH_PREFIX}-update-test`;
      let account: EvmAccount;

      try {
        // Create account
        account = (await EvmAccount(accountId, {
          name: "original-name",
        })) as EvmAccount;

        const originalAddress = account.address;

        // Update name
        const updatedAccount = (await EvmAccount(accountId, {
          name: "updated-name",
        })) as EvmAccount;

        expect(updatedAccount.name).toBe("Updated Name");
        // Address should remain the same
        expect(updatedAccount.address).toBe(originalAddress);
      } finally {
        await destroy(scope);
        console.log(`✅ Account ${account!.address} is no longer tracked`);
      }
    });

    test("adopt existing account", async (scope) => {
      const accountName = `${BRANCH_PREFIX}-adoptable-account`;
      const adopterId = `${BRANCH_PREFIX}-adopter`;

      try {
        // First create an account to adopt
        const originalAccount = (await EvmAccount(`${BRANCH_PREFIX}-original`, {
          name: accountName,
        })) as EvmAccount;

        // Adopt it with adopt flag
        const adoptedAccount = (await EvmAccount(adopterId, {
          name: accountName,
          adopt: true,
        })) as EvmAccount;

        expect(adoptedAccount).toMatchObject({
          id: adopterId,
          type: "coinbase::evm-account",
          name: accountName,
        });
        // Should have the same address as the original
        expect(adoptedAccount.address).toBe(originalAccount.address);
      } finally {
        await destroy(scope);
      }
    });

    test("create account with faucet metadata", async (scope) => {
      const accountId = `${BRANCH_PREFIX}-faucet-account`;
      let account: EvmAccount;

      try {
        // Create account with faucet metadata
        account = (await EvmAccount(accountId, {
          name: "faucet-test-account",
          faucet: {
            "base-sepolia": ["eth", "usdc"],
            "ethereum-sepolia": ["eth"],
          },
        })) as EvmAccount;

        expect(account).toMatchObject({
          id: accountId,
          type: "coinbase::evm-account",
          name: "faucet-test-account",
        });
        expect(account.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

        // Check faucet metadata is preserved
        expect(account.faucet).toEqual({
          "base-sepolia": ["eth", "usdc"],
          "ethereum-sepolia": ["eth"],
        });
      } finally {
        await destroy(scope);
        console.log(`✅ Account ${account!.address} is no longer tracked`);
      }
    });

    test("update account with faucet metadata", async (scope) => {
      const accountId = `${BRANCH_PREFIX}-faucet-update`;
      let account: EvmAccount;

      try {
        // Create account with initial faucet metadata
        account = (await EvmAccount(accountId, {
          name: "faucet-update-test",
          faucet: {
            "base-sepolia": ["eth"],
          },
        })) as EvmAccount;

        expect(account.faucet).toEqual({
          "base-sepolia": ["eth"],
        });

        // Update with different faucet metadata
        const updatedAccount = (await EvmAccount(accountId, {
          name: "faucet-update-test",
          faucet: {
            "base-sepolia": ["eth", "usdc"],
            "ethereum-sepolia": ["eth"],
          },
        })) as EvmAccount;

        // Should have updated metadata
        expect(updatedAccount.faucet).toEqual({
          "base-sepolia": ["eth", "usdc"],
          "ethereum-sepolia": ["eth"],
        });
      } finally {
        await destroy(scope);
        console.log(`✅ Account ${account!.address} is no longer tracked`);
      }
    });

    test("fail without adoption when account exists", async (scope) => {
      const accountName = `${BRANCH_PREFIX}-existing-account`;

      try {
        // First create an account
        await EvmAccount(`${BRANCH_PREFIX}-first`, {
          name: accountName,
        });

        // Try to create another with the same name without adoption
        await expect(
          EvmAccount(`${BRANCH_PREFIX}-second`, {
            name: accountName,
            // adopt: false is the default
          }),
        ).rejects.toThrow(/already exists/);
      } finally {
        await destroy(scope);
      }
    });

    describe.skipIf(!process.env.TEST_COINBASE_PRIVATE_KEY)(
      "privateKey must be Secret type for security",
      () => {
        test("create with valid secret privateKey", async (scope) => {
          const accountId = `${BRANCH_PREFIX}-type-safety-test`;

          try {
            // This should work - privateKey is properly encrypted with alchemy.secret
            const validAccount = (await EvmAccount(accountId, {
              name: "type-safety-test",
              privateKey: alchemy.secret(
                process.env.TEST_COINBASE_PRIVATE_KEY as `0x${string}`,
              ),
            })) as EvmAccount;

            expect(validAccount).toMatchObject({
              id: accountId,
              type: "coinbase::evm-account",
              name: "type-safety-test",
            });
          } finally {
            await destroy(scope);
          }
        });
      },
    );
  });

  describe.skip("EvmSmartAccount", () => {
    test("create smart account with EVM owner", async (scope) => {
      const ownerAccountId = `${BRANCH_PREFIX}-owner-account`;
      const smartAccountId = `${BRANCH_PREFIX}-smart-account`;
      let ownerAccount: EvmAccount;
      let smartAccount: EvmSmartAccount;

      try {
        // Create owner account first
        ownerAccount = (await EvmAccount(ownerAccountId, {
          name: "owner-account",
        })) as EvmAccount;

        // Create smart account
        smartAccount = (await EvmSmartAccount(smartAccountId, {
          name: "smart-account",
          owner: ownerAccount,
        })) as EvmSmartAccount;

        expect(smartAccount).toMatchObject({
          id: smartAccountId,
          type: "coinbase::evm-smart-account",
          name: "smart-account",
          ownerAddress: ownerAccount.address,
        });
        expect(smartAccount.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      } finally {
        await destroy(scope);
        console.log(
          `✅ Smart account ${smartAccount!.address} is no longer tracked`,
        );
        console.log(
          `✅ Owner account ${ownerAccount!.address} is no longer tracked`,
        );
      }
    });

    test("owner change triggers replacement", async (scope) => {
      const owner1Id = `${BRANCH_PREFIX}-owner1`;
      const owner2Id = `${BRANCH_PREFIX}-owner2`;
      const smartAccountId = `${BRANCH_PREFIX}-smart-replace`;
      let owner1: EvmAccount;
      let owner2: EvmAccount;
      let smartAccount: EvmSmartAccount;

      try {
        // Create two owner accounts
        owner1 = (await EvmAccount(owner1Id, {
          name: "owner-1",
        })) as EvmAccount;
        owner2 = (await EvmAccount(owner2Id, {
          name: "owner-2",
        })) as EvmAccount;

        // Create smart account with first owner
        smartAccount = (await EvmSmartAccount(smartAccountId, {
          name: "smart-account",
          owner: owner1,
        })) as EvmSmartAccount;

        const originalAddress = smartAccount.address;

        // Change owner (should trigger replacement)
        const replacedAccount = (await EvmSmartAccount(smartAccountId, {
          name: "smart-account",
          owner: owner2,
        })) as EvmSmartAccount;

        expect(replacedAccount.ownerAddress).toBe(owner2.address);
        // Address should be different after replacement
        expect(replacedAccount.address).not.toBe(originalAddress);
      } finally {
        await destroy(scope);
        console.log("✅ Accounts are no longer tracked");
      }
    });

    test("create smart account with owner by address", async (scope) => {
      const ownerName = `${BRANCH_PREFIX}-owner-by-address`;
      const smartAccountId = `${BRANCH_PREFIX}-smart-with-address`;
      let smartAccount: EvmSmartAccount;

      try {
        // Create owner first
        const owner = (await EvmAccount(`${smartAccountId}-owner`, {
          name: ownerName,
        })) as EvmAccount;

        // Create smart account with owner by address (string)
        smartAccount = (await EvmSmartAccount(smartAccountId, {
          name: `${BRANCH_PREFIX}-smart-account`,
          owner: owner.address,
        })) as EvmSmartAccount;

        expect(smartAccount).toMatchObject({
          id: smartAccountId,
          type: "coinbase::evm-smart-account",
          ownerAddress: owner.address,
        });
      } finally {
        await destroy(scope);
        console.log(
          `✅ Smart account ${smartAccount!.address} is no longer tracked`,
        );
      }
    });

    test("adopt existing smart account", async (scope) => {
      const ownerName = `${BRANCH_PREFIX}-smart-owner`;
      const smartName = `${BRANCH_PREFIX}-adoptable-smart`;
      const adopterId = `${BRANCH_PREFIX}-smart-adopter`;

      try {
        // Create owner
        const owner = (await EvmAccount(`${BRANCH_PREFIX}-owner-for-adopt`, {
          name: ownerName,
        })) as EvmAccount;

        // Create original smart account
        const original = (await EvmSmartAccount(
          `${BRANCH_PREFIX}-original-smart`,
          {
            name: smartName,
            owner: owner,
          },
        )) as EvmSmartAccount;

        // Adopt it with adopt flag
        const adopted = (await EvmSmartAccount(adopterId, {
          name: smartName,
          owner: owner,
          adopt: true,
        })) as EvmSmartAccount;

        expect(adopted).toMatchObject({
          id: adopterId,
          type: "coinbase::evm-smart-account",
          name: smartName,
          address: original.address,
          ownerAddress: owner.address,
        });
      } finally {
        await destroy(scope);
      }
    });

    test("smart account inherits owner name when name is omitted", async (scope) => {
      const ownerName = `${BRANCH_PREFIX}-inherited-owner`;
      const smartAccountId = `${BRANCH_PREFIX}-smart-inherited`;
      let owner: EvmAccount;
      let smartAccount: EvmSmartAccount;

      try {
        // Create owner account with a name
        owner = (await EvmAccount(`${BRANCH_PREFIX}-owner-with-name`, {
          name: ownerName,
        })) as EvmAccount;

        // Create smart account without specifying name - should inherit from owner
        smartAccount = (await EvmSmartAccount(smartAccountId, {
          owner: owner,
          // name is intentionally omitted
        })) as EvmSmartAccount;

        expect(smartAccount).toMatchObject({
          id: smartAccountId,
          type: "coinbase::evm-smart-account",
          name: ownerName, // Should inherit owner's name
          ownerAddress: owner.address,
        });
        expect(smartAccount.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

        // Verify that updating still works with inherited name
        const updated = (await EvmSmartAccount(smartAccountId, {
          owner: owner,
          // name still omitted
        })) as EvmSmartAccount;

        expect(updated.name).toBe(ownerName);
        expect(updated.address).toBe(smartAccount.address);
      } finally {
        await destroy(scope);
        console.log(
          `✅ Smart account ${smartAccount!.address} with inherited name is no longer tracked`,
        );
      }
    });
  });
});
