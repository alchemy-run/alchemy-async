import { isSecret, type Secret } from "../../secret.ts";
import type { Bindings } from "../bindings.ts";

/**
 * Extract string and Secret bindings from a Bindings object
 *
 * This utility filters a Bindings object to return only string values
 * and optionally Secret objects. All other binding types (workers, KV, R2, etc.)
 * are excluded from the result.
 *
 * @param bindings - The bindings object to filter
 * @param includeSecrets - Whether to include Secret objects in the result
 * @returns A record containing only string values and Secret objects (if includeSecrets is true)
 *
 * @example
 * ```typescript
 * const filtered = extractStringAndSecretBindings(props.bindings, true);
 * // Returns: { API_KEY: Secret(...), DEBUG: "true" }
 * // Excludes: { CACHE: KVNamespace, STORAGE: R2Bucket }
 * ```
 */
export function extractStringAndSecretBindings(
  bindings: Bindings,
  includeSecrets: boolean,
): Record<string, string | Secret> {
  return Object.fromEntries(
    Object.entries(bindings ?? {}).flatMap(([key, value]) => {
      if (typeof value === "string" || (isSecret(value) && includeSecrets)) {
        return [[key, value]];
      }
      return [];
    }),
  );
}

/**
 * Unencrypt all Secret values in an environment object
 *
 * Takes a record that may contain Secret objects and returns a new record
 * with all Secret values replaced by their unencrypted string values.
 * Non-Secret values are passed through unchanged. Undefined values are filtered out.
 *
 * @param env - The environment object that may contain Secret values
 * @returns A new record with all Secrets replaced by their unencrypted values
 *
 * @example
 * ```typescript
 * const env = { API_KEY: Secret("abc123"), DEBUG: "true" };
 * const unencrypted = unencryptSecrets(env);
 * // Returns: { API_KEY: "abc123", DEBUG: "true" }
 * ```
 */
export function unencryptSecrets(
  env: Record<string, string | Secret | undefined>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(env ?? {}).flatMap(([key, value]) => {
      if (isSecret(value)) {
        return [[key, value.unencrypted]];
      }
      if (typeof value === "string") {
        return [[key, value]];
      }
      return [];
    }),
  );
}

/**
 * Filter bindings to strings and unencrypt secrets in one operation
 *
 * This is a convenience function that combines extractStringAndSecretBindings
 * and unencryptSecrets. It filters bindings to strings/secrets and immediately
 * unencrypts any Secret values.
 *
 * Useful for preparing environment variables for dev/build commands where
 * secrets need to be decrypted and all resource bindings need to be excluded.
 *
 * @param bindings - The bindings object to filter
 * @param includeSecrets - Whether to include (and unencrypt) Secret objects
 * @returns A record containing only string values with all secrets unencrypted
 *
 * @example
 * ```typescript
 * const env = filterStringBindings(props.bindings, true);
 * // Input: { API_KEY: Secret("abc"), DEBUG: "true", CACHE: KVNamespace }
 * // Returns: { API_KEY: "abc", DEBUG: "true" }
 * ```
 */
export function filterStringBindings(
  bindings: Bindings,
  includeSecrets: boolean,
): Record<string, string> {
  const extracted = extractStringAndSecretBindings(bindings, includeSecrets);
  return unencryptSecrets(extracted);
}
