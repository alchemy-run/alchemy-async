import { type Secret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a Secrets Store
 */
export interface SecretsStoreProps<S extends Record<string, Secret> | undefined = undefined> extends CloudflareApiOptions {
    /**
     * Name of the secrets store
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Secrets to store in the secrets store
     * Maps secret names to secret values (string) or Secret instances
     *
     * @example
     * ```ts
     * const store = await SecretsStore("my-store", {
     *   secrets: {
     *     API_KEY: "my-api-key-value",
     *     DATABASE_URL: alchemy.secret(process.env.DATABASE_URL)
     *   }
     * });
     * ```
     */
    secrets?: {
        [K in keyof S]: string | Secret;
    };
    /**
     * Whether to adopt an existing store with the same name if it exists
     * If true and a store with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to delete the store.
     * If set to false, the store will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
}
export declare function isSecretsStore(resource: any): resource is SecretsStore<any>;
export interface SecretsStore<S extends Record<string, Secret> | undefined = undefined> extends Omit<SecretsStoreProps<S>, "delete"> {
    /**
     * The unique identifier of the secrets store
     */
    id: string;
    /**
     * The name of the secrets store
     */
    name: string;
    /**
     * The secrets stored in this secrets store
     * Maps secret names to Secret instances created with alchemy.secret()
     */
    secrets?: S;
    /**
     * Timestamp when the secrets store was created
     */
    createdAt: number;
    /**
     * Timestamp when the secrets store was last modified
     */
    modifiedAt: number;
}
/**
 * A Cloudflare Secrets Store is a secure, centralized location for storing account-level secrets.
 *
 * @see https://developers.cloudflare.com/secrets-store/
 *
 * @example
 * // Create a basic secrets store
 * const store = await SecretsStore("my-secrets", {
 *   name: "production-secrets"
 * });
 *
 * @example
 * // Create a secrets store with initial secrets
 * const store = await SecretsStore("my-secrets", {
 *   name: "production-secrets",
 *   secrets: {
 *     API_KEY: alchemy.secret(process.env.API_KEY),
 *     DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
 *     JWT_SECRET: alchemy.secret(process.env.JWT_SECRET)
 *   }
 * });
 *
 * @example
 * // Adopt an existing store if it already exists
 * const existingStore = await SecretsStore("existing-store", {
 *   name: "existing-secrets-store",
 *   adopt: true,
 *   secrets: {
 *     NEW_SECRET: alchemy.secret("new-value")
 *   }
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the store in Cloudflare
 * const preservedStore = await SecretsStore("preserve-store", {
 *   name: "preserved-secrets-store",
 *   delete: false
 * });
 *
 * @example
 * // Use in a Worker binding to access secrets
 * const worker = await Worker("my-worker", {
 *   bindings: {
 *     SECRETS: store
 *   },
 *   code: `
 *     export default {
 *       async fetch(request, env) {
 *         const apiKey = await env.SECRETS.get("API_KEY");
 *         return new Response(apiKey ? "Secret found" : "No secret");
 *       }
 *     }
 *   `
 * });
 */
export declare function SecretsStore<const S extends Record<string, Secret> | undefined = undefined>(name: string, props?: SecretsStoreProps<S>): Promise<SecretsStore<S>>;
export declare namespace SecretsStore {
    const Default = "default_secrets_store";
}
export declare function createSecretsStore<S extends Record<string, Secret> | undefined = undefined>(api: CloudflareApi, props: SecretsStoreProps<S> & {
    name: string;
}): Promise<{
    id: string;
}>;
export declare function deleteSecretsStore(api: CloudflareApi, storeId: string): Promise<void>;
export declare function findSecretsStoreByName(api: CloudflareApi, name: string): Promise<{
    id: string;
    createdAt?: number;
} | null>;
export declare function insertSecrets<S extends Record<string, Secret> | undefined = undefined>(api: CloudflareApi, storeId: string, props: SecretsStoreProps<S>): Promise<void>;
export declare function deleteSecrets(api: CloudflareApi, storeId: string, secretNames: string[]): Promise<void>;
export declare function listSecrets(api: CloudflareApi, storeId: string): Promise<string[]>;
//# sourceMappingURL=secrets-store.d.ts.map