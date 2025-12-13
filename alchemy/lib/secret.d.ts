import { inspect } from "node:util";
declare global {
    var __ALCHEMY_SECRETS__: {
        [name: string]: Secret;
    };
}
/**
 * Internal wrapper for sensitive values like API keys and credentials.
 * When stored in alchemy state files, the value is automatically encrypted
 * using the application's password. The password can be provided either:
 *
 * 1. Globally when initializing the alchemy application:
 * ```ts
 * const app = await alchemy("my-app", {
 *   password: process.env.SECRET_PASSPHRASE
 * });
 * ```
 *
 * 2. For a specific scope using alchemy.run:
 * ```ts
 * await alchemy.run("scope-name", {
 *   password: process.env.SECRET_PASSPHRASE
 * }, async () => {
 *   // Secrets in this scope will use this password
 *   alchemy.secret(process.env.MY_SECRET)
 * });
 * ```
 *
 * Without a password, secrets cannot be encrypted or decrypted, and operations
 * involving sensitive values will fail.
 *
 * @example
 * // In state file (.alchemy/app/prod/resource.json):
 * {
 *   "props": {
 *     "apiKey": {
 *       "@secret": "encrypted-value-here..." // encrypted using app password
 *     }
 *   }
 * }
 */
export declare class Secret<T = string> {
    readonly unencrypted: T;
    readonly name: string;
    /**
     * @internal
     */
    static all(): Secret<any>[];
    readonly type = "secret";
    constructor(unencrypted: T, name?: string);
    /**
     * Ensures that a value is wrapped in a Secret.
     */
    static wrap<T>(value: T | Secret<T>): Secret<T>;
    /**
     * Unwraps a Secret if it is wrapped, otherwise returns the value.
     */
    static unwrap<T, U = T>(value: T | Secret<U>): T | U;
    /**
     * Override toString to prevent accidental exposure of secret values
     */
    toString(): string;
    /**
     * Custom inspect implementation for console.log to prevent exposing secrets
     */
    [inspect.custom](): string;
}
/**
 * Type guard to check if a value is a Secret wrapper
 */
export declare function isSecret<T = string>(binding: any): binding is Secret<T>;
/**
 * Wraps a sensitive value so it will be encrypted when stored in state files.
 * Requires a password to be set either globally in the alchemy application options
 * or locally in an alchemy.run scope.
 *
 * @example
 * // Global password for all secrets
 * const app = await alchemy("my-app", {
 *   password: process.env.SECRET_PASSPHRASE
 * });
 *
 * const resource = await Resource("my-resource", {
 *   apiKey: alchemy.secret(process.env.API_KEY)
 * });
 *
 * @example
 * // Scoped password for specific secrets
 * await alchemy.run("secure-scope", {
 *   password: process.env.SCOPE_SECRET_PASSPHRASE
 * }, async () => {
 *   const resource = await Resource("my-resource", {
 *     apiKey: alchemy.secret(process.env.API_KEY)
 *   });
 * });
 *
 * @param unencrypted The sensitive value to encrypt in state files
 * @throws {Error} If the value is undefined
 * @throws {Error} If no password is set in the alchemy application options or current scope
 */
export declare function secret<S = string>(unencrypted: S | undefined, name?: string): Secret<S>;
export declare namespace secret {
    interface Env {
        [key: string]: Secret;
        (name: string, value?: string, error?: string): Secret;
    }
    const env: Env;
}
//# sourceMappingURL=secret.d.ts.map