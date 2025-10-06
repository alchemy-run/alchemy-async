import { AsyncLocalStorage } from "node:async_hooks";
import path from "node:path";
import util from "node:util";
import pc from "picocolors";
import type { Phase } from "./alchemy.ts";
import { destroy, destroyAll, DestroyStrategy } from "./destroy.ts";
import {
  ResourceFQN,
  ResourceID,
  ResourceKind,
  ResourceScope,
  ResourceSeq,
  type PendingResource,
  type Resource,
  type ResourceProps,
} from "./resource.ts";
import type { State, StateStore, StateStoreType } from "./state.ts";
import { FileSystemStateStore } from "./state/file-system-state-store.ts";
import { InstrumentedStateStore } from "./state/instrumented-state-store.ts";
import {
  createDummyLogger,
  createLoggerInstance,
  type LoggerApi,
} from "./util/cli.ts";
import {
  idempotentSpawn,
  type IdempotentSpawnOptions,
} from "./util/idempotent-spawn.ts";
import { logger } from "./util/logger.ts";
import { AsyncMutex } from "./util/mutex.ts";
import { ALCHEMY_ROOT } from "./util/root-dir.ts";
import { createAndSendEvent } from "./util/telemetry.ts";

export class RootScopeStateAttemptError extends Error {
  constructor() {
    super("Root scope cannot contain state");
  }
}

export interface ScopeOptions extends ProviderCredentials {
  stage?: string;
  parent: Scope | undefined;
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
  // Provider credentials should not conflict with core scope properties
  // TypeScript will enforce this at compile time when providers extend this interface
}

export type PendingDeletions = Array<{
  resource: Resource<string>;
  oldProps?: ResourceProps;
}>;

// TODO: support browser
export const DEFAULT_STAGE =
  process.env.ALCHEMY_STAGE ??
  process.env.USER ??
  process.env.USERNAME ??
  "dev";

declare global {
  var __ALCHEMY_STORAGE__: AsyncLocalStorage<Scope>;
}

const ScopeSymbol = Symbol.for("alchemy::Scope");

export function isScope(value: any): value is Scope {
  return value instanceof Scope || value?.[ScopeSymbol] === true;
}

export class Scope {
  readonly [ScopeSymbol] = true;

  public static readonly KIND = "alchemy::Scope" as const;

  public static storage = (globalThis.__ALCHEMY_STORAGE__ ??=
    new AsyncLocalStorage<Scope>());

  public static getScope(): Scope | undefined {
    return Scope.storage.getStore();
  }

  public static get root(): Scope {
    return Scope.current.root;
  }

  public static get current(): Scope {
    const scope = Scope.getScope();
    if (!scope) throw new Error("Not running within an Alchemy Scope");
    return scope;
  }

  public readonly resources = new Map<ResourceID, PendingResource>();
  public readonly children: Map<ResourceID, Scope> = new Map();
  public readonly stage: string;
  public readonly name: string;
  public readonly scopeName: string;
  public readonly parent: Scope | undefined;
  public readonly password: string | undefined;
  public readonly state: StateStore;
  public readonly stateStore: StateStoreType;
  public readonly quiet: boolean;
  public readonly phase: Phase;
  public readonly local: boolean;
  public readonly watch: boolean;
  public readonly tunnel: boolean;
  public readonly force: boolean;
  public readonly adopt: boolean;
  public readonly destroyStrategy: DestroyStrategy;
  public readonly logger: LoggerApi;
  public readonly noTrack: boolean;
  public readonly dataMutex: AsyncMutex;
  public readonly rootDir: string;
  public readonly dotAlchemy: string;
  public readonly isSelected: boolean | undefined;
  public readonly profile: string | undefined;

  // Provider credentials for scope-level credential overrides
  public readonly providerCredentials: ProviderCredentials;

  private isErrored = false;
  private isSkipped = false;
  private finalized = false;
  private startedAt = performance.now();
  private deferred: (() => Promise<any>)[] = [];
  private cleanups: (() => Promise<void>)[] = [];

  public get appName(): string {
    if (this.parent) {
      return this.parent.appName;
    }
    return this.scopeName;
  }

  constructor(options: ScopeOptions) {
    // Extract core scope options first
    const {
      scopeName,
      parent,
      stage,
      password,
      stateStore,
      quiet,
      phase,
      local,
      watch,
      tunnel,
      force,
      destroyStrategy,
      logger,
      adopt,
      dotAlchemy,
      rootDir,
      isSelected,
      noTrack,
      profile,
      ...providerCredentials
    } = options;

    this.scopeName = scopeName;
    this.name = this.scopeName;
    this.parent = parent ?? Scope.getScope();
    this.rootDir = rootDir ?? this.parent?.rootDir ?? ALCHEMY_ROOT;
    this.isSelected = isSelected ?? this.parent?.isSelected;

    this.dotAlchemy =
      dotAlchemy ??
      this.parent?.dotAlchemy ??
      path.resolve(this.rootDir, ".alchemy");

    // Store provider credentials (TypeScript ensures no conflicts with core options)
    this.providerCredentials = providerCredentials as ProviderCredentials;

    const isChild = this.parent !== undefined;
    if (this.scopeName?.includes(":") && isChild) {
      // TODO(sam): relax this constraint once we move to SQLite3 store
      throw new Error(
        `Scope name "${this.scopeName}" cannot contain double colons`,
      );
    }

    this.stage = stage ?? this.parent?.stage ?? DEFAULT_STAGE;
    this.profile = profile ?? this.parent?.profile;
    this.parent?.children.set(this.scopeName!, this);
    this.quiet = quiet ?? this.parent?.quiet ?? false;
    if (this.parent && !this.scopeName) {
      throw new Error("Scope name is required when creating a child scope");
    }
    this.password = password ?? this.parent?.password;
    this.noTrack = noTrack ?? this.parent?.noTrack ?? false;
    const resolvedPhase = phase ?? this.parent?.phase;
    if (resolvedPhase === undefined) {
      throw new Error("Phase is required");
    }
    this.phase = resolvedPhase;

    this.logger = this.quiet
      ? createDummyLogger()
      : createLoggerInstance(
          {
            phase: this.phase,
            stage: this.stage,
            appName: this.appName ?? "",
          },
          logger,
        );

    this.local = local ?? this.parent?.local ?? false;
    this.watch = watch ?? this.parent?.watch ?? false;
    this.tunnel = tunnel ?? this.parent?.tunnel ?? false;
    this.force = force ?? this.parent?.force ?? false;
    this.adopt = adopt ?? this.parent?.adopt ?? false;
    this.destroyStrategy =
      destroyStrategy ?? this.parent?.destroyStrategy ?? "sequential";
    if (this.local) {
      this.logger.warnOnce(
        "Development mode is in beta. Please report any issues to https://github.com/sam-goodwin/alchemy/issues.",
      );
    }

    this.stateStore =
      stateStore ??
      this.parent?.stateStore ??
      ((scope) => new FileSystemStateStore(scope));
    this.state = new InstrumentedStateStore(this.stateStore(this));
    this.dataMutex = new AsyncMutex();
  }

  public async has(id: string, type?: string): Promise<boolean> {
    const state = await this.state.get(id);
    return state !== undefined && (type === undefined || state.kind === type);
  }

  public createPhysicalName(id: string, delimiter = "-"): string {
    const app = this.appName;
    const stage = this.stage;
    return [app, ...this.chain.slice(2), id, stage]
      .map((s) => s.replaceAll(/[^a-z0-9_-]/gi, delimiter))
      .join(delimiter);
  }

  public async spawn<
    E extends ((line: string) => string | undefined) | undefined,
  >(
    // TODO(sam): validate uniqueness? Ensure a flat .logs/${id}.log dir? Or nest in scope dirs?
    id: string,
    options: Omit<IdempotentSpawnOptions, "log" | "stateFile"> & {
      extract?: E;
    },
  ): Promise<E extends undefined ? undefined : string> {
    const logsDir = path.join(this.dotAlchemy, "logs");
    const pidsDir = path.join(this.dotAlchemy, "pids");

    const result = await idempotentSpawn({
      log: path.join(logsDir, `${id}.log`),
      stateFile: path.join(pidsDir, `${id}.pid.json`),
      ...options,
    });
    this.onCleanup(result.stop);
    return result.extracted as any;
  }

  /**
   * @internal
   */
  public clear() {
    for (const child of this.children.values()) {
      child.clear();
    }
    this.resources.clear();
    this.children.clear();
  }

  public get root(): Scope {
    let root: Scope = this;
    while (root.parent) {
      root = root.parent;
    }
    return root;
  }

  public async deleteResource(resourceID: ResourceID) {
    await this.state.delete(resourceID);
    this.resources.delete(resourceID);
  }

  private _seq = 0;

  public seq() {
    return this._seq++;
  }

  public get chain(): string[] {
    // Since the root scope name is the same as the app name, this ensures
    // the root scope chain is "<app-name>" instead of "<app-name>/<app-name>".
    if (
      !this.parent &&
      this.appName &&
      this.scopeName &&
      this.appName === this.scopeName
    ) {
      return [this.appName];
    }

    const thisScope = this.scopeName ? [this.scopeName] : [];
    if (this.parent) {
      return [...this.parent.chain, ...thisScope];
    }

    const app = this.appName ? [this.appName] : [];
    return [...app, ...thisScope];
  }

  public fail() {
    this.logger.error("Scope failed", this.chain.join("/"));
    this.isErrored = true;
  }

  public skip() {
    this.isSkipped = true;
  }

  public async init() {
    await Promise.all([this.state.init?.()]);
  }

  public async deinit() {
    await this.parent?.state.delete(this.scopeName!);
    await this.state.deinit?.();
  }

  public fqn(resourceID: ResourceID): string {
    return [...this.chain, resourceID].join("/");
  }

  /**
   * Centralizes the "lock → locate the right scope → hand the caller a live
   * ScopeState instance and a persist() helper".
   *
   * @param fn   Your operation on the scope state.
   *             • `state` is already resolved and, if we're at the root, created.
   *             • `persist` will write the (possibly-mutated) state back.
   */
  private async withScopeState<R>(
    fn: (
      state: State<string, ResourceProps | undefined, Resource<string>>, // current state for this.scopeName
      persist: (
        next: State<string, ResourceProps | undefined, Resource<string>>,
      ) => Promise<void>, // helper to save changes
    ) => Promise<R>,
  ): Promise<R> {
    return this.dataMutex.lock(async () => {
      // 1. We must know where to look.
      if (!this.parent || !this.scopeName) {
        throw new RootScopeStateAttemptError();
      }

      // 2. Pull (or lazily create) the state bucket we care about.
      const isRoot = this.parent.scopeName === this.root.scopeName;
      const state =
        (await this.parent.state.get(this.scopeName)) ??
        (isRoot
          ? {
              //todo(michael): should this have a different type cause its root?
              kind: "alchemy::Scope",
              id: this.scopeName!,
              fqn: this.root.fqn(this.scopeName!),
              seq: this.seq(),
              status: "created",
              data: {},
              output: {
                [ResourceID]: this.scopeName!,
                [ResourceFQN]: this.root.fqn(this.scopeName!),
                [ResourceKind]: "alchemy::Scope",
                [ResourceScope]: this,
                [ResourceSeq]: this.seq(),
                [DestroyStrategy]: this.destroyStrategy,
              },
              props: {},
            }
          : undefined);

      if (!state) throw new RootScopeStateAttemptError();

      return fn(state, (updated) =>
        this.parent!.state.set(this.scopeName!, updated),
      );
    });
  }

  public async set<T>(key: string, value: T): Promise<void> {
    await this.withScopeState<void>(async (state, persist) => {
      state.data[key] = value;
      await persist(state); // only one line to save!
    });
  }

  public get<T>(key: string): Promise<T> {
    return this.withScopeState<T>(async (state) => state.data[key]);
  }

  public async delete(key: string): Promise<void> {
    return this.withScopeState<void>(async (state, persist) => {
      delete state.data[key];
      await persist(state);
    });
  }

  public async run<T>(fn: (scope: Scope) => Promise<T>): Promise<T> {
    return Scope.storage.run(this, () => fn(this));
  }

  [util.inspect.custom]() {
    return `Scope(${this.chain.join("/")})`;
  }

  [Symbol.asyncDispose]() {
    return this.finalize();
  }

  public async finalize(options?: { force?: boolean; noop?: boolean }) {
    const shouldForce =
      options?.force ||
      this.parent === undefined ||
      this?.parent?.scopeName === this.root.scopeName;
    if (this.phase === "read") {
      createAndSendEvent({
        event: "alchemy.success",
        duration: performance.now() - this.startedAt,
      });
      return;
    }
    if (this.finalized && !shouldForce) {
      return;
    }
    this.finalized = true;
    // trigger and await all deferred promises
    await Promise.all(this.deferred.map((fn) => fn()));
    if (!this.isErrored && !this.isSkipped) {
      // TODO: need to detect if it is in error
      const resourceIds = await this.state.list();

      const aliveIds = new Set(this.resources.keys());
      const orphanIds = Array.from(
        resourceIds.filter((id) => !aliveIds.has(id)),
      );

      if (shouldForce) {
        await this.destroyPendingDeletions();
        await Promise.all(
          Array.from(this.children.values()).map((child) =>
            child.finalize({
              force: shouldForce,
              noop: options?.noop,
            }),
          ),
        );
      }

      const orphans = await Promise.all(
        orphanIds.map(async (id) => (await this.state.get(id))!.output),
      ).then((orphans) =>
        orphans.filter(
          (orphan) =>
            //we never want to mark the stage scope as an orphan
            !(
              orphan[ResourceKind] === "alchemy::Scope" &&
              orphan[ResourceFQN] === this.root.fqn(this.stage)
            ),
        ),
      );
      await destroyAll(orphans, {
        quiet: this.quiet,
        strategy: this.destroyStrategy,
        force: shouldForce,
        noop: options?.noop,
      });
      createAndSendEvent({
        event: "alchemy.success",
        duration: performance.now() - this.startedAt,
      });
    } else if (this.isErrored) {
      this.logger.warn("Scope is in error, skipping finalize");
      createAndSendEvent(
        {
          event: "alchemy.error",
          duration: performance.now() - this.startedAt,
        },
        new Error("Scope failed"),
      );
    }

    if (!this.parent && process.env.ALCHEMY_TEST_KILL_ON_FINALIZE) {
      await this.cleanup();
      process.exit(0);
    }
  }

  public async destroyPendingDeletions() {
    const pendingDeletions =
      (await this.get<PendingDeletions>("pendingDeletions").catch((e) => {
        if (e instanceof RootScopeStateAttemptError) {
          return [];
        }
        throw e;
      })) ?? [];

    //todo(michael): remove once we deprecate doss; see: https://github.com/sam-goodwin/alchemy/issues/585
    let hasCorruptedResources = false;
    if (pendingDeletions) {
      for (const { resource, oldProps } of pendingDeletions) {
        //todo(michael): ugly hack due to the way scope is serialized
        const realResource = this.resources.get(resource[ResourceID])!;
        resource[ResourceScope] = realResource?.[ResourceScope] ?? this;
        if (realResource == null && resource[ResourceID] == null) {
          logger.warn(
            "A replaced resource pending deletion is corrupted and will NOT be deleted. This is likely a bug with the state store.",
          );
          hasCorruptedResources = true;
          continue;
        }
        await destroy(resource, {
          quiet: this.quiet,
          strategy: "sequential",
          replace: {
            props: oldProps,
            output: resource,
          },
        });
      }
    }
    if (hasCorruptedResources) {
      const newPendingDeletions =
        (await this.get<PendingDeletions>("pendingDeletions").catch(
          () => [],
        )) ?? [];
      await this.set(
        "pendingDeletions",
        newPendingDeletions.filter((d) => d.resource[ResourceID] != null),
      );
    }
  }

  /**
   * Defers execution of a function until the Alchemy application finalizes.
   */
  public defer<T>(fn: () => Promise<T>): Promise<T> {
    let _resolve: (value: T) => void;
    let _reject: (reason?: any) => void;
    const promise = new Promise<T>((resolve, reject) => {
      _resolve = resolve;
      _reject = reject;
    });
    this.deferred.push(() => {
      if (!this.finalized) {
        throw new Error(
          "Attempted to await a deferred Promise before finalization",
        );
      }
      // lazily trigger the worker on first await
      return this.run(() => fn()).then(_resolve, _reject);
    });
    return promise;
  }

  /**
   * Run all cleanup functions registered with `onCleanup`.
   * This should only be called on the root scope.
   */
  public async cleanup() {
    if (this.parent || this.cleanups.length === 0) return;
    this.logger.log(pc.gray("Exiting..."));
    await Promise.allSettled(this.cleanups.map((cleanup) => cleanup()));
  }

  /**
   * Register a cleanup function that will be called when the process exits.
   * This should only be called on the root scope.
   */
  public onCleanup(fn: () => Promise<void>) {
    if (this.parent) {
      this.root.onCleanup(fn);
      return;
    }
    this.cleanups.push(fn);
  }

  /**
   * Returns a string representation of the scope.
   */
  public toString() {
    return `Scope(
  chain=${this.chain.join("/")},
  resources=[${Array.from(this.resources.values())
    .map((r) => r[ResourceID])
    .join(",\n  ")}]
)`;
  }
}

declare global {
  // for runtime
  // TODO(sam): maybe inject is a better way to achieve this
  var __ALCHEMY_SCOPE__: typeof Scope;
}

globalThis.__ALCHEMY_SCOPE__ = Scope;
