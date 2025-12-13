import { AsyncLocalStorage } from "node:async_hooks";
import util from "node:util";
import type { Phase } from "./alchemy.ts";
import { DestroyStrategy } from "./destroy.ts";
import { ResourceID, type PendingResource, type Resource, type ResourceProps } from "./resource.ts";
import type { StateStore, StateStoreType } from "./state.ts";
import { type LoggerApi } from "./util/cli.ts";
import { type IdempotentSpawnOptions } from "./util/idempotent-spawn.ts";
import { AsyncMutex } from "./util/mutex.ts";
export declare class RootScopeStateAttemptError extends Error {
    constructor();
}
export interface ScopeOptions extends ProviderCredentials {
    stage?: string;
    parent: Scope | undefined | null;
    scopeName: string;
    password?: string;
    stateStore?: StateStoreType;
    quiet?: boolean;
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
     * Whether to create a tunnel for supported resources.
     *
     * @default false
     */
    tunnel?: boolean;
    /**
     * Apply updates to resources even if there are no changes.
     *
     * @default false
     */
    force?: boolean;
    /**
     * The strategy to use when destroying resources.
     *
     * @default "sequential"
     */
    destroyStrategy?: DestroyStrategy;
    /**
     * Whether to disable telemetry for the scope.
     *
     * @default false
     */
    noTrack?: boolean;
    /**
     * The logger to use for the scope.
     */
    logger?: LoggerApi;
    /**
     * The path to the .alchemy directory.
     *
     * @default "./.alchemy"
     */
    dotAlchemy?: string;
    /**
     * Whether to adopt resources if they already exist but are not yet managed by your Alchemy app.
     *
     * @default false
     */
    adopt?: boolean;
    /**
     * The path to the root directory of the project.
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
    /**
     * @internal
     * The timestamp when the scope was started.
     */
    startedAt?: DOMHighResTimeStamp;
}
/**
 * Base interface for provider credentials that can be extended by each provider.
 * This allows providers to add their own credential properties without modifying the core scope interface.
 *
 * Provider credentials cannot conflict with core ScopeOptions properties.
 *
 * Providers can extend this interface using module augmentation:
 *
 * @example
 * ```typescript
 * // In aws/scope-extensions.ts
 * declare module "../scope.ts" {
 *   interface ProviderCredentials {
 *     aws?: AwsClientProps;
 *   }
 * }
 * ```
 */
export interface ProviderCredentials extends Record<string, unknown> {
}
export type PendingDeletions = Array<{
    resource: Resource<string>;
    oldProps?: ResourceProps;
}>;
export declare const DEFAULT_STAGE: string;
declare global {
    var __ALCHEMY_STORAGE__: AsyncLocalStorage<Scope>;
}
declare const ScopeSymbol: unique symbol;
export declare function isScope(value: any): value is Scope;
export declare class Scope {
    readonly [ScopeSymbol] = true;
    static readonly KIND: "alchemy::Scope";
    static storage: AsyncLocalStorage<Scope>;
    static getScope(): Scope | undefined;
    static get root(): Scope;
    static get current(): Scope;
    readonly resources: Map<string, PendingResource<unknown>>;
    readonly children: Map<ResourceID, Scope>;
    readonly stage: string;
    readonly name: string;
    readonly scopeName: string;
    readonly parent: Scope | undefined;
    readonly password: string | undefined;
    readonly state: StateStore;
    readonly stateStore: StateStoreType;
    readonly quiet: boolean;
    readonly phase: Phase;
    readonly local: boolean;
    readonly watch: boolean;
    readonly tunnel: boolean;
    readonly force: boolean;
    readonly adopt: boolean;
    readonly destroyStrategy: DestroyStrategy;
    readonly logger: LoggerApi;
    readonly noTrack: boolean;
    readonly dataMutex: AsyncMutex;
    readonly rootDir: string;
    readonly dotAlchemy: string;
    readonly isSelected: boolean | undefined;
    readonly profile: string | undefined;
    readonly startedAt: DOMHighResTimeStamp;
    readonly providerCredentials: ProviderCredentials;
    private isErrored;
    private isSkipped;
    private finalized;
    private deferred;
    private cleanups;
    get appName(): string;
    constructor(options: ScopeOptions);
    has(id: string, type?: string): Promise<boolean>;
    createPhysicalName(id: string, delimiter?: string): string;
    spawn<E extends ((line: string) => string | undefined) | undefined>(id: string, options: Omit<IdempotentSpawnOptions, "log" | "stateFile"> & {
        extract?: E;
    }): Promise<E extends undefined ? undefined : string>;
    exec(id: string, command: string): Promise<{
        exitCode: number;
        stdout: string;
        stderr: string;
    }>;
    /**
     * @internal
     */
    clear(): void;
    get root(): Scope;
    deleteResource(resourceID: ResourceID): Promise<void>;
    private _seq;
    seq(): number;
    get chain(): string[];
    fail(): void;
    skip(): void;
    init(): Promise<void>;
    deinit(): Promise<void>;
    fqn(resourceID: ResourceID): string;
    /**
     * Centralizes the "lock → locate the right scope → hand the caller a live
     * ScopeState instance and a persist() helper".
     *
     * @param fn   Your operation on the scope state.
     *             • `state` is already resolved and, if we're at the root, created.
     *             • `persist` will write the (possibly-mutated) state back.
     */
    private withScopeState;
    set<T>(key: string, value: T): Promise<void>;
    get<T>(key: string): Promise<T>;
    delete(key: string): Promise<void>;
    run<T>(fn: (scope: Scope) => Promise<T>): Promise<T>;
    [util.inspect.custom](): string;
    [Symbol.asyncDispose](): Promise<void>;
    finalize(options?: {
        force?: boolean;
        noop?: boolean;
    }): Promise<void>;
    destroyPendingDeletions(): Promise<void>;
    /**
     * Defers execution of a function until the Alchemy application finalizes.
     */
    defer<T>(fn: () => Promise<T>): Promise<T>;
    /**
     * Run all cleanup functions registered with `onCleanup`.
     * This should only be called on the root scope.
     */
    cleanup(): Promise<void>;
    /**
     * Register a cleanup function that will be called when the process exits.
     * This should only be called on the root scope.
     */
    onCleanup(fn: () => Promise<void>): void;
    /**
     * Returns a string representation of the scope.
     */
    toString(): string;
}
declare global {
    var __ALCHEMY_SCOPE__: typeof Scope;
}
export {};
//# sourceMappingURL=scope.d.ts.map