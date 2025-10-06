import path from "node:path";
import { execArgv } from "node:process";
import { onExit } from "signal-exit";
import { isReplacedSignal } from "./apply.ts";
import { DestroyStrategy, destroy, isDestroyedSignal } from "./destroy.ts";
import { env } from "./env.ts";
import {
  ResourceFQN,
  ResourceID,
  ResourceKind,
  ResourceScope,
  ResourceSeq,
  type PendingResource,
} from "./resource.ts";
import { DEFAULT_STAGE, Scope, type ProviderCredentials } from "./scope.ts";
import { secret } from "./secret.ts";
import type { StateStoreType } from "./state.ts";
import type { LoggerApi } from "./util/cli.ts";
import { ALCHEMY_ROOT } from "./util/root-dir.ts";

/**
 * Type alias for semantic highlighting of `alchemy` as a type keyword
 */
export type alchemy = Alchemy;

export const alchemy: Alchemy = _alchemy as any;

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

_alchemy.destroy = destroy;
_alchemy.run = run;
_alchemy.secret = secret;
_alchemy.env = env;

/**
 * Implementation of the alchemy function.
 */
async function _alchemy(
  appName: string,
  options?: Omit<AlchemyOptions, "appName">,
): Promise<Scope> {
  const cliArgs = process.argv.slice(2);
  // user may select a specific app to auto-enable read mode for any other app
  const app = parseOption("--app");
  function parseOption<D extends string | undefined>(
    option: string,
    defaultValue?: D,
  ): D {
    const i = cliArgs.indexOf(option);
    return (
      i !== -1 && i + 1 < cliArgs.length ? cliArgs[i + 1] : defaultValue
    ) as D;
  }
  const cliOptions = {
    phase:
      app && app !== appName
        ? "read"
        : cliArgs.includes("--destroy")
          ? "destroy"
          : cliArgs.includes("--read")
            ? "read"
            : "up",
    local: cliArgs.includes("--local") || cliArgs.includes("--dev"),
    watch: cliArgs.includes("--watch") || execArgv.includes("--watch"),
    quiet: cliArgs.includes("--quiet"),
    force: cliArgs.includes("--force"),
    tunnel: cliArgs.includes("--tunnel"),
    // Parse stage argument (--stage my-stage) functionally and inline as a property declaration
    stage: (function parseStage() {
      const i = cliArgs.indexOf("--stage");
      return i !== -1 && i + 1 < cliArgs.length
        ? cliArgs[i + 1]
        : process.env.STAGE;
    })(),
    password: process.env.ALCHEMY_PASSWORD,
    adopt: cliArgs.includes("--adopt"),
    rootDir: path.resolve(parseOption("--root-dir", ALCHEMY_ROOT)),
    profile: parseOption("--profile"),
  } satisfies Partial<AlchemyOptions>;
  const mergedOptions = {
    ...cliOptions,
    ...options,
  };
  if (
    mergedOptions.stateStore === undefined &&
    process.env.CI &&
    process.env.ALCHEMY_CI_STATE_STORE_CHECK !== "false"
  ) {
    throw new Error(`You are running Alchemy in a CI environment with the default local state store. 
This can lead to orphaned infrastructure and is rarely what you want to do.

Instead, you should choose a persistent state store:
1. CloudflareStateStore (https://alchemy.run/concepts/state/#cloudflare-state-store)
2. S3StateStore (https://alchemy.run/providers/aws/s3-state-store/)

You can read more about State and State Stores here: https://alchemy.run/concepts/state/#customizing-state-storage

If this is a mistake, you can disable this check by setting the ALCHEMY_CI_STATE_STORE_CHECK=false.
`);
  }

  const phase = mergedOptions?.phase ?? "up";
  const root = new Scope({
    ...mergedOptions,
    parent: undefined,
    scopeName: appName,
    phase,
    password: mergedOptions?.password ?? process.env.ALCHEMY_PASSWORD,
    noTrack: mergedOptions?.noTrack ?? false,
    isSelected: app === undefined ? undefined : app === appName,
  });
  onExit((code) => {
    root.cleanup().then(() => {
      code = code === 130 ? 0 : (code ?? 0);
      process.exit(code);
    });
    return true;
  });
  const stageName = mergedOptions?.stage ?? DEFAULT_STAGE;
  const stage = new Scope({
    ...mergedOptions,
    parent: root,
    scopeName: stageName,
    stage: stageName,
  });
  Scope.storage.enterWith(root);
  Scope.storage.enterWith(stage);
  if (mergedOptions?.phase === "destroy") {
    await destroy(stage);
    return process.exit(0);
  }
  return root;
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
  // TODO(sam): this is an awful hack to differentiate between naked scopes and resources
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
async function run<T>(
  ...args:
    | [id: string, fn: (this: Scope, scope: Scope) => Promise<T>]
    | [
        id: string,
        options: RunOptions,
        fn: (this: Scope, scope: Scope) => Promise<T>,
      ]
): Promise<T> {
  const [id, options, fn] =
    typeof args[1] === "function"
      ? [args[0], undefined, args[1]]
      : (args as [
          string,
          RunOptions,
          (this: Scope, scope: Scope) => Promise<T>,
        ]);
  const _scope = new Scope({
    ...options,
    parent: options?.parent,
    scopeName: id,
    noTrack: options?.noTrack ?? false,
  });
  let noop = options?.noop ?? false;
  try {
    if (options?.isResource !== true && _scope.parent) {
      // TODO(sam): this is an awful hack to differentiate between naked scopes and resources
      const seq = _scope.parent.seq();
      const output = {
        [ResourceID]: id,
        [ResourceFQN]: "",
        [ResourceKind]: Scope.KIND,
        [ResourceScope]: _scope,
        [ResourceSeq]: seq,
        [DestroyStrategy]: options?.destroyStrategy ?? "sequential",
      } as const;
      const resource = {
        kind: Scope.KIND,
        id,
        seq,
        data: {},
        fqn: "",
        props: {},
        status: "created",
        output,
      } as const;
      const prev = await _scope.parent!.state.get(id);
      if (!prev) {
        await _scope.parent!.state.set(id, resource);
      } else if (prev.kind !== Scope.KIND) {
        throw new Error(
          `Tried to create a Scope that conflicts with a Resource (${prev.kind}): ${id}`,
        );
      }
      _scope.parent!.resources.set(
        id,
        Object.assign(Promise.resolve(resource), output) as PendingResource,
      );
    }
    return await _scope.run(async () => fn.bind(_scope)(_scope));
  } catch (error) {
    if (!(isDestroyedSignal(error) || isReplacedSignal(error))) {
      _scope.fail();
    }
    if (isDestroyedSignal(error)) {
      noop = noop || error.noop;
    }
    throw error;
  } finally {
    await _scope.finalize({
      noop,
    });
  }
}
