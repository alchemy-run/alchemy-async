import { DestroyStrategy, destroy } from "./destroy.ts";
import { env } from "./env.ts";
import { type ProviderCredentials, Scope } from "./scope.ts";
import { secret } from "./secret.ts";
import type { StateStoreType } from "./state.ts";
import type { LoggerApi } from "./util/cli.ts";
/**
 * Type alias for semantic highlighting of `alchemy` as a type keyword
 */
export type alchemy = Alchemy;
export declare const alchemy: Alchemy;
/**
 * The Alchemy interface provides core functionality and is augmented by providers.
 * Supports both application scoping with secrets and template string interpolation.
 * Automatically parses CLI arguments for common options.
 *
 * @example
 * // Simple usage with automatic CLI argument parsing
 * const app = await alchemy("my-app");
 * // Now supports: --destroy, --read, --quiet, --stage my-stage
 * // Environment variables: PASSWORD, ALCHEMY_PASSWORD, ALCHEMY_STAGE, USER
 *
 * @example
 * // Create an application scope with explicit options (overrides CLI args)
 * const app = await alchemy("github:alchemy", {
 *   stage: "prod",
 *   phase: "up",
 *   // Required for encrypting/decrypting secrets
 *   password: process.env.SECRET_PASSPHRASE
 * });
 *
 * // Create a resource with encrypted secrets
 * const resource = await Resource("my-resource", {
 *   apiKey: alchemy.secret(process.env.API_KEY)
 * });
 *
 * await app.finalize();
 */
export interface Alchemy {
    run: typeof run;
    destroy: typeof destroy;
    /**
     * Get an environment variable and error if it's not set.
     */
    env: typeof env;
    /**
     * Creates an encrypted secret that can be safely stored in state files.
     * Requires a password to be set either globally in the application options
     * or locally in the current scope.
     */
    secret: typeof secret;
    /**
     * Creates a new application scope with the given name and options.
     * Used to create and manage resources with proper secret handling.
     * Automatically parses CLI arguments: --destroy, --read, --quiet, --stage <name>
     * Environment variables: PASSWORD, ALCHEMY_PASSWORD, ALCHEMY_STAGE, USER
     *
     * @example
     * // Simple usage with CLI argument parsing
     * const app = await alchemy("my-app");
     *
     * @example
     * // With explicit options (overrides CLI args)
     * const app = await alchemy("my-app", {
     *   stage: "prod",
     *   // Required for encrypting/decrypting secrets
     *   password: process.env.SECRET_PASSPHRASE
     * });
     */
    (appName: string, options?: Omit<AlchemyOptions, "appName">): Promise<Scope>;
}
export type Phase = "up" | "destroy" | "read";
export interface AlchemyOptions {
    /**
     * The name of the application.
     */
    appName?: string;
    /**
     * Determines whether the resources will be created/updated or deleted.
     *
     * @default "up"
     */
    phase?: Phase;
    /**
     * Determines if resources should be simulated locally (where possible)
     *
     * @default - `true` if ran with `alchemy dev` or `bun ./alchemy.run.ts --dev`
     */
    local?: boolean;
    /**
     * Determines if local changes to resources should be reactively pushed to the local or remote environment.
     *
     * @default - `true` if ran with `alchemy dev`, `alchemy watch`, `bun --watch ./alchemy.run.ts`
     */
    watch?: boolean;
    /**
     * Apply updates to resources even if there are no changes.
     *
     * @default false
     */
    force?: boolean;
    /**
     * Whether to create a tunnel for supported resources.
     *
     * @default false
     */
    tunnel?: boolean;
    /**
     * Name to scope the resource state under (e.g. `.alchemy/{stage}/..`).
     *
     * @default - your POSIX username
     */
    stage?: string;
    /**
     * If true, will not prune resources that were dropped from the root stack.
     *
     * @default true
     */
    destroyOrphans?: boolean;
    /**
     * A custom state store to use instead of the default file system store.
     */
    stateStore?: StateStoreType;
    /**
     * A custom scope to use as a parent.
     */
    parent?: Scope;
    /**
     * The strategy to use when destroying resources.
     *
     * @default "sequential"
     */
    destroyStrategy?: DestroyStrategy;
    /**
     * If true, children of the resource will not be destroyed (but their state will be deleted).
     */
    noop?: boolean;
    /**
     * If true, will not print any Create/Update/Delete messages.
     *
     * @default false
     */
    quiet?: boolean;
    /**
     * A passphrase to use to encrypt/decrypt secrets.
     * Required if using alchemy.secret() in this scope.
     */
    password?: string;
    /**
     * Whether to stop sending anonymous telemetry data to the Alchemy team.
     * You can also opt out by setting the `DO_NOT_TRACK` or `ALCHEMY_TELEMETRY_DISABLED` environment variables to a truthy value.
     *
     * @default false
     */
    noTrack?: boolean;
    /**
     * A custom logger instance to use for this scope.
     * If not provided, the default fallback logger will be used.
     */
    logger?: LoggerApi;
    /**
     * Whether to adopt resources if they already exist but are not yet managed by your Alchemy app.
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * The root directory of the project.
     *
     * @default process.cwd()
     */
    rootDir?: string;
    /**
     * The Alchemy profile to use for authoriziing requests.
     */
    profile?: string;
    /**
     * Whether this is the application that was selected with `--app`
     *
     * `true` if the application was selected with `--app`
     * `false` if the application was not selected with `--app`
     * `undefined` if the program was not run with `--app`
     */
    isSelected?: boolean;
}
export interface RunOptions extends AlchemyOptions, ProviderCredentials {
    /**
     * @default false
     */
    isResource?: boolean;
}
/**
 * Run a function in a new scope asynchronously.
 * Useful for isolating secret handling with a specific password.
 *
 * @example
 * // Run operations in a scope with its own password
 * await alchemy.run("secure-scope", {
 *   password: process.env.SCOPE_PASSWORD
 * }, async () => {
 *   // Secrets in this scope will use this password
 *   const resource = await Resource("my-resource", {
 *     apiKey: alchemy.secret(process.env.API_KEY)
 *   });
 * });
 */
declare function run<T>(...args: [id: string, fn: (this: Scope, scope: Scope) => Promise<T>] | [
    id: string,
    options: RunOptions,
    fn: (this: Scope, scope: Scope) => Promise<T>
]): Promise<T>;
export {};
//# sourceMappingURL=alchemy.d.ts.map