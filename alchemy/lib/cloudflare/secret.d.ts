import { type Secret as AlchemySecret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { SecretsStore } from "./secrets-store.ts";
/**
 * Properties for creating or updating a Secret in a Secrets Store (public interface)
 */
export interface SecretProps extends CloudflareApiOptions {
    /**
     * Name for the Secret.
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * The secrets store to add this secret to
     *
     * @default - the default-secret-store
     */
    store?: SecretsStore<any>;
    /**
     * The secret value to store
     * Can be a string or an existing Secret instance
     *
     * @example
     * ```ts
     * const secret = await Secret("api-key", {
     *   store: mySecretsStore,
     *   value: alchemy.secret(process.env.API_KEY)
     * });
     * ```
     */
    value: string | AlchemySecret;
    /**
     * Whether to delete the secret.
     * If set to false, the secret will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
}
export declare function isSecret(resource: any): resource is Secret;
export type Secret = Omit<SecretProps, "delete" | "value"> & {
    /**
     * The binding type for Cloudflare Workers
     */
    type: "secrets_store_secret";
    /**
     * The name of the secret
     */
    name: string;
    /**
     * The unique identifier of the secrets store this secret belongs to
     */
    storeId: string;
    /**
     * The secret value (as an alchemy Secret instance)
     */
    value: AlchemySecret;
    /**
     * Timestamp when the secret was created
     */
    createdAt: number;
    /**
     * Timestamp when the secret was last modified
     */
    modifiedAt: number;
};
/**
 * A Cloudflare Secret represents an individual secret stored in a Secrets Store.
 *
 * Use this resource to add individual secrets to an existing Secrets Store,
 * providing fine-grained control over secret management.
 *
 * @see https://developers.cloudflare.com/api/resources/secrets_store/subresources/stores/subresources/secrets/
 *
 * @example
 * // Create a secrets store first
 * const store = await SecretsStore("my-store", {
 *   name: "production-secrets"
 * });
 *
 * // Add individual secrets to the store
 * const apiKey = await Secret("api-key", {
 *   store: store,
 *   value: alchemy.secret(process.env.API_KEY)
 * });
 *
 * const dbUrl = await Secret("database-url", {
 *   store: store,
 *   value: process.env.DATABASE_URL
 * });
 *
 * @example
 * // Use in a Worker binding
 * const worker = await Worker("my-worker", {
 *   bindings: {
 *     SECRETS: store
 *   },
 *   code: `
 *     export default {
 *       async fetch(request, env) {
 *         const apiKey = await env.SECRETS.get("api-key");
 *         const dbUrl = await env.SECRETS.get("database-url");
 *         return new Response(\`API: \${apiKey ? "set" : "unset"}\`);
 *       }
 *     }
 *   `
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the secret in Cloudflare
 * const preservedSecret = await Secret("preserve-secret", {
 *   store: myStore,
 *   value: "preserved-value",
 *   delete: false
 * });
 */
export declare function Secret(name: string, props: SecretProps): Promise<Secret>;
/**
 * Insert or update a secret in a secrets store
 */
export declare function insertSecret(api: CloudflareApi, storeId: string, secretName: string, secretValue: AlchemySecret): Promise<void>;
/**
 * Delete a secret from a secrets store
 */
export declare function deleteSecret(api: CloudflareApi, storeId: string, secretName: string): Promise<void>;
//# sourceMappingURL=secret.d.ts.map