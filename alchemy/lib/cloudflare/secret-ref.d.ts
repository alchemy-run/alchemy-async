import { type CloudflareApiOptions } from "./api.ts";
import { SecretsStore } from "./secrets-store.ts";
/**
 * Properties for referencing an existing Secret in a Secrets Store (without managing its value)
 */
export interface SecretRefProps extends CloudflareApiOptions {
    name: string;
    store?: SecretsStore;
}
export type SecretRef = {
    type: "secrets_store_secret";
    name: string;
    storeId: string;
};
/**
 * SecretRef references an existing secret by name in a Secrets Store.
 *
 * It does not create or update the secret value – use {@link Secret} for that.
 *
 * Behavior:
 * - Resolves the target secrets store ID (defaults to Cloudflare's `default_secrets_store`, creating/adopting if needed)
 * - Exposes a binding of type `secrets_store_secret` usable in Worker bindings
 * - Update with a different name will trigger resource replacement
 * - Delete is a no-op in Cloudflare (resource removed from state only)
 *
 * @example
 * // Reference an existing secret in the default store and bind to a Worker
 * const apiKeyRef = await SecretRef("api-key-ref", { name: "API_KEY" });
 * const worker = await Worker("my-worker", {
 *   entrypoint: "./src/worker.ts",
 *   url: true,
 *   bindings: {
 *     API_KEY: apiKeyRef,
 *   },
 * });
 */
export declare function SecretRef(props: SecretRefProps): Promise<SecretRef>;
//# sourceMappingURL=secret-ref.d.ts.map