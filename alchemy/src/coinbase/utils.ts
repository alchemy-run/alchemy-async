/**
 * Utility functions for Coinbase CDP resources
 */

/**
 * Validates that a CDP account name follows the required format.
 * CDP only allows letters, numbers, and hyphens in account names.
 * Names cannot start or end with a hyphen.
 *
 * @param name - The account name to validate
 * @throws Error if the name contains invalid characters or starts/ends with hyphen
 */
export function validateAccountName(name: string): void {
  if (!/^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(name)) {
    throw new Error(
      `Invalid account name '${name}'. CDP only allows letters, numbers, and hyphens. Names cannot start or end with a hyphen.`,
    );
  }
}
