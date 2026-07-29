import type * as cf from "@cloudflare/workers-types";
import * as workers from "@distilled.cloud/cloudflare/workers";
import type * as Config from "effect/Config";
import type { ConfigError } from "effect/Config";
import * as Context from "effect/Context";
import * as Data from "effect/Data";
import * as Effect from "effect/Effect";
import type * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { type MemoOptions } from "../../Command/Memo.ts";
import type { Dependencies } from "../../Dependencies.ts";
import type { InputProps } from "../../Input.ts";
import type { Named, Tag } from "../../Named.ts";
import type * as Output from "../../Output.ts";
import {
  Platform,
  type Main,
  type MainRpc,
  type MakeShape,
  type PlatformProps,
  type PlatformServices,
} from "../../Platform.ts";
import {
  isResourceOfType,
  Resource,
  type ResourceClassLike,
} from "../../Resource.ts";
import type { Rpc } from "../../Rpc.ts";
import type { RuntimeContext } from "../../RuntimeContext.ts";
import type { Self } from "../../Self.ts";
import { CloudflareEnvironment } from "../CloudflareEnvironment.ts";
import type { Container } from "../Containers/Container.ts";
import type { DevContainerImage } from "../Containers/ContainerApplication.ts";
import type { DevOrigin } from "../Hyperdrive/Connection.ts";
import type { Providers } from "../Providers.ts";
import type { DispatchNamespace } from "../WorkersForPlatforms/DispatchNamespace.ts";
import type { WorkflowExport } from "../Workflows/Workflow.ts";
import type { Reference as ZoneReference } from "../Zone/lookup.ts";
import { type Assets, type AssetsProps } from "./Assets.ts";
import { type DurableObjectExport } from "./DurableObject.ts";
import { Request } from "./Request.ts";
import { bindWorkerAsyncBindings } from "./WorkerAsyncBindings.ts";
import type {
  WorkerBinding,
  WorkerBindingResource,
  WorkerBindings,
} from "./WorkerBinding.ts";
import { type ModuleRule, type WorkerBuildOptions } from "./WorkerBundle.ts";
import {
  makeWorkerRuntimeContext,
  type WorkerRuntimeContext,
} from "./WorkerRuntimeContext.ts";

export const WorkerTypeId = "Cloudflare.Worker";
export type WorkerTypeId = typeof WorkerTypeId;

export const isWorker = <T>(value: T): value is T & Worker =>
  isResourceOfType(value, WorkerTypeId);

export class WorkerEnvironment extends Context.Service<
  WorkerEnvironment,
  Record<string, any>
>()("Cloudflare.Workers.WorkerEnvironment") {}

export class CachePurgeError extends Data.TaggedError("CachePurgeError")<{
  message: string;
  cause?: unknown;
}> {}

/**
 * Effect-native view of the Workers Cache runtime API on the execution
 * context (`ctx.cache`). Only available when the Worker has Workers Cache
 * enabled (the `cache` prop or `yield* Cloudflare.cache()`).
 */
export interface WorkerExecutionContextCache {
  /**
   * Purge cached responses by `Cache-Tag`, path prefix, or everything.
   */
  purge(
    options: cf.CachePurgeOptions,
  ): Effect.Effect<cf.CachePurgeResult, CachePurgeError, RuntimeContext>;
}

export class WorkerExecutionContext extends Context.Service<
  WorkerExecutionContext,
  {
    /**
     * Run an Effect in the background without blocking the response, keeping
     * the Worker alive until it settles. The Effect runs with the caller's
     * full context (services, tracing), and the resulting promise is
     * registered with workerd's `ctx.waitUntil`.
     */
    waitUntil<A, E, R>(
      effect: Effect.Effect<A, E, R>,
    ): Effect.Effect<void, never, R | RuntimeContext>;
    /**
     * Forward the request to the origin if the Worker throws an unhandled
     * exception, instead of returning an error page.
     */
    passThroughOnException(): Effect.Effect<void, never, RuntimeContext>;
    /**
     * The Workers Cache runtime API (`ctx.cache`).
     */
    readonly cache: WorkerExecutionContextCache;
    /**
     * The raw workerd ExecutionContext, for interop with async APIs.
     */
    readonly raw: cf.ExecutionContext;
  }
>()("Cloudflare.Workers.WorkerExecutionContext") {}

export const fromExecutionContext = (
  ctx: cf.ExecutionContext,
): WorkerExecutionContext["Service"] => ({
  raw: ctx,
  waitUntil: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    Effect.gen(function* () {
      const context = yield* Effect.context<R>();
      // Register the promise with workerd un-awaited — waitUntil extends the
      // invocation's lifetime without blocking the response.
      yield* Effect.sync(() =>
        ctx.waitUntil(Effect.runPromise(effect.pipe(Effect.provide(context)))),
      );
    }),
  passThroughOnException: () => Effect.sync(() => ctx.passThroughOnException()),
  cache: {
    purge: (options) =>
      ctx.cache
        ? Effect.tryPromise({
            try: () => ctx.cache!.purge(options),
            catch: (cause) =>
              new CachePurgeError({
                message:
                  cause instanceof Error
                    ? cause.message
                    : "Unknown cache purge error",
                cause,
              }),
          })
        : Effect.fail(
            new CachePurgeError({
              message:
                "ctx.cache is not available — enable Workers Cache on this " +
                "Worker (the `cache` prop or `yield* Cloudflare.cache()`) " +
                "and note it is not supported in local dev.",
            }),
          ),
  },
});

/**
 * A {@link WorkerExecutionContext} whose methods resolve the live per-event
 * context from the calling fiber at call time. Provided during the Worker's
 * init phase (plan and runtime module init) so the service can be yielded
 * and closed over in the top-level closure; every method is colored with
 * `RuntimeContext`, so it can only be *run* inside a handler, where the
 * bridge provides the real per-event context that these methods defer to.
 */
export const deferredExecutionContext: WorkerExecutionContext["Service"] = {
  get raw(): cf.ExecutionContext {
    throw new Error(
      "WorkerExecutionContext.raw is only available inside a request handler",
    );
  },
  waitUntil: <A, E, R>(effect: Effect.Effect<A, E, R>) =>
    liveExecutionContext.pipe(
      Effect.flatMap((live) => live.waitUntil(effect)),
    ) as Effect.Effect<void, never, R | RuntimeContext>,
  passThroughOnException: () =>
    liveExecutionContext.pipe(
      Effect.flatMap((live) => live.passThroughOnException()),
    ) as Effect.Effect<void, never, RuntimeContext>,
  cache: {
    purge: (options) =>
      liveExecutionContext.pipe(
        Effect.flatMap((live) => live.cache.purge(options)),
      ) as Effect.Effect<cf.CachePurgeResult, CachePurgeError, RuntimeContext>,
  },
};

const liveExecutionContext = WorkerExecutionContext.pipe(
  Effect.flatMap((live) =>
    live === deferredExecutionContext
      ? Effect.die(
          new Error(
            "WorkerExecutionContext can only be used inside a request handler",
          ),
        )
      : Effect.succeed(live),
  ),
);

export type WorkerEvent = Exclude<
  {
    [type in keyof cf.ExportedHandler]: {
      kind: "Cloudflare.Workers.WorkerEvent";
      type: type;
      input: Parameters<Exclude<cf.ExportedHandler[type], undefined>>[0];
      env: Parameters<Exclude<cf.ExportedHandler[type], undefined>>[1];
      context: Parameters<Exclude<cf.ExportedHandler[type], undefined>>[2];
    };
  }[keyof cf.ExportedHandler],
  undefined
>;

export const isWorkerEvent = (value: any): value is WorkerEvent =>
  value?.kind === "Cloudflare.Workers.WorkerEvent";

/**
 * Assets configuration that includes a pre-computed hash.
 * When hash is provided, it's used directly for diffing instead of computing from directory contents.
 * This is useful when integrating with Build resources that produce a deterministic hash.
 */
export interface AssetsWithHash extends AssetsProps {
  /**
   * Pre-computed hash of the assets. When provided, this hash is used for diffing
   * to determine if the worker needs to be redeployed.
   */
  hash: string;
}

export interface WorkerObservability extends Exclude<
  workers.PutScriptRequest["metadata"]["observability"],
  undefined
> {}

export interface WorkerLimits extends Exclude<
  workers.PutScriptRequest["metadata"]["limits"],
  undefined
> {}

export interface WorkerCache extends Exclude<
  workers.PutScriptRequest["metadata"]["cache"],
  undefined
> {}

export type WorkerPlacement = Exclude<
  workers.PutScriptRequest["metadata"]["placement"],
  undefined
>;

export const ExportedHandlerMethods = [
  "fetch",
  "tail",
  "trace",
  "tailStream",
  "scheduled",
  "test",
  "email",
  "queue",
] as const satisfies (keyof cf.ExportedHandler)[];

export type WorkerServices =
  | Worker
  | Request
  | WorkerExecutionContext
  | WorkerEnvironment
  | CloudflareEnvironment
  | Container.Application<any>
  | Self;

export type WorkerShape<Req = never> = Main<WorkerServices | Req> &
  MainRpc<WorkerServices | Req>;

export type WorkerEnv = Record<
  string,
  | string
  | number
  | boolean
  | null
  | readonly unknown[]
  | { readonly [key: string]: unknown }
  | Redacted.Redacted<string>
>;

export type WorkerBindingProps = {
  [bindingName in string]:
    | WorkerBindingResource
    | Effect.Effect<WorkerBindingResource, any, any>;
};

type Unwrap<T> = T extends Output.Output<infer A, infer _Req> ? A : T;

// NOTE: `Worker<NormalizedBindings<...>>` must provably satisfy the
// `WorkerBindings` constraint for *generic* `Bindings`, which restricts the
// shapes usable here: conditional checks on the naked parameter `T` and an
// outermost `Extract<..., WorkerBindingResource>` are provable; e.g.
// `Unwrap<T> extends ...` as a check type is not.
export type NormalizedBindings<
  Bindings extends WorkerBindingProps = {},
  AssetsConfig extends WorkerAssetsConfig | undefined = undefined,
> = {
  [B in keyof Bindings]: Bindings[B] extends Effect.Effect<
    infer T extends WorkerBindingResource,
    any,
    any
  >
    ? T extends Redacted.Redacted<infer V> | Config.Config<infer V>
      ? V
      : Unwrap<T>
    : Extract<Unwrap<Bindings[B]>, WorkerBindingResource>;
} & (undefined extends AssetsConfig ? {} : { ASSETS: Assets });

export type WorkerAssetsConfig = string | AssetsProps | AssetsWithHash;

/**
 * Fine-grained control over the Worker's `workers.dev` surface. The two
 * toggles are independent on the Cloudflare API.
 */
export interface WorkersDevConfig {
  /**
   * Serve the Worker at its stable `workers.dev` URL
   * (`https://<worker-name>.<account-subdomain>.workers.dev`).
   * @default true
   */
  enabled?: boolean;
  /**
   * Enable version preview URLs — a distinct
   * `https://<version-prefix>-<worker-name>.<account-subdomain>.workers.dev`
   * URL per uploaded version, plus stable aliased preview URLs
   * (`https://<alias>-...`) for versions uploaded with an alias.
   *
   * When previews are enabled but {@link enabled} is `false`, the current
   * version's preview URL becomes the Worker's primary `url` output.
   * @default true
   */
  previewsEnabled?: boolean;
}

/**
 * The Worker's custom-domain configuration: one canonical hostname, plus
 * optional aliases that also serve the Worker and redirect hostnames that
 * 301 to the canonical name.
 */
export interface WorkerDomainConfig {
  /**
   * The canonical hostname (e.g. `"example.com"`). Attached to the Worker
   * as a Cloudflare custom domain — DNS record and edge certificate are
   * managed automatically. The Cloudflare zone is inferred from the
   * hostname and must already exist in the account.
   *
   * When set, `https://<name>` is the Worker's primary `url` output.
   */
  name: string;
  /**
   * Additional hostnames that serve the Worker (e.g. `"www.example.com"`,
   * `"api.example.com"`). Each is attached as its own custom domain.
   * Order matters: aliases follow `name` in the `urls` output.
   */
  aliases?: string[];
  /**
   * Hostnames that permanently redirect (HTTP 301, path and query
   * preserved) to {@link name} — e.g. `"old.example.com"`. Each is
   * attached as a custom domain (for DNS + TLS) with a redirect rule in
   * the zone's `http_request_dynamic_redirect` phase, which runs before
   * the Worker — redirected requests never invoke it. Redirect hostnames
   * serve no content, so they appear in the `domain` output but never in
   * `urls`.
   */
  redirects?: string[];
}

export interface WorkerRouteConfig {
  /**
   * URL pattern to match incoming requests against, e.g.
   * `"subdomain.example.com/*"` or `"example.com/api/*"`.
   */
  pattern: string;
  /**
   * Cloudflare zone ID. Equivalent to Wrangler's `zone_id`.
   */
  zoneId?: string;
  /**
   * Cloudflare zone name, e.g. `"example.com"`. Equivalent to Wrangler's
   * `zone_name`.
   */
  zoneName?: string;
  /**
   * Zone reference — a zone ID, zone name, or `{ zoneId, name? }` object.
   * Alternative to `zoneId` / `zoneName`.
   */
  zone?: ZoneReference;
}

/**
 * Versioning configuration for a Worker deploy — controls Worker
 * [versions and gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/).
 *
 * Two modes, selected by {@link parent}:
 *
 * - **Version worker** (`parent` set): instead of creating its own script,
 *   this Worker uploads an immutable *version* to the referenced parent
 *   Worker's script. With `traffic: 0` (the default) the parent's live
 *   deployment is untouched and the version is reachable only at its
 *   preview URL (`<version-prefix>-<name>.<subdomain>.workers.dev`) —
 *   the PR-preview use case. With `traffic > 0` the version becomes a
 *   canary taking that percentage of the parent's traffic.
 * - **Gradual rollout** (`parent` omitted): when this Worker deploys
 *   itself, the newly uploaded version receives {@link traffic} percent
 *   and the currently-live version keeps the remainder, instead of the
 *   default 100% cutover.
 */
/**
 * Where the per-user affinity key comes from — see
 * {@link WorkerVersionOptions.affinity}. Exactly one of {@link cookie},
 * {@link header}, or {@link expression} must be set (or use the `"ip"`
 * shorthand instead of this object).
 */
export interface WorkerVersionAffinityConfig {
  /**
   * Pin by the value of this cookie (e.g. a session id). Requests without
   * the cookie are not pinned unless {@link fallback} is set.
   */
  cookie?: string;
  /**
   * Pin by the value of this request header — e.g. an API token or an
   * identity header your auth layer already injects
   * (`Cf-Access-Jwt-Assertion` carries the whole Cloudflare Access JWT,
   * which pins per user without parsing any claims). Header names are
   * case-insensitive.
   */
  header?: string;
  /**
   * Raw [Rules-language](https://developers.cloudflare.com/ruleset-engine/rules-language/)
   * expression producing the affinity key string — the escape hatch when
   * neither a cookie nor a whole header is the right identifier, e.g. a
   * single JWT claim via API Shield's token configurations:
   * `lookup_json_string(http.request.jwt.claims["<config-id>"][0], "sub")`.
   * Mutually exclusive with {@link cookie} / {@link header} /
   * {@link fallback}.
   */
  expression?: string;
  /**
   * What to do when the {@link cookie} / {@link header} is absent from a
   * request: `"ip"` pins by client IP instead, so anonymous users are
   * sticky too. Omitted, unmatched requests are routed by the deployment
   * percentages independently.
   */
  fallback?: "ip";
}

/**
 * Affinity source for {@link WorkerVersionOptions.affinity}: a
 * {@link WorkerVersionAffinityConfig}, or `"ip"` to pin every request by
 * client IP.
 */
export type WorkerVersionAffinity = "ip" | WorkerVersionAffinityConfig;

export interface WorkerVersionOptions {
  /**
   * The Worker that owns the script this version is uploaded to. Accepts a
   * Worker reference — typically `yield* Cloudflare.Worker.ref(id, { stage,
   * stack })` for a Worker deployed in another stage/stack, or a
   * locally-declared Worker — or a literal script name as an escape hatch.
   *
   * When set, this resource does not create a script of its own: it
   * uploads a version (code + bindings + compatibility settings) to the
   * parent's script. Script-level settings apply immediately to *all*
   * versions of the parent, so they cannot be set on a version worker —
   * `name`, `assets`, `namespace`, `crons`, `domain`, `routes`, `tags`,
   * `logpush`, `observability`, `placement`, `limits`, and `subdomain` are
   * rejected, as are locally-hosted Durable Object or Workflow classes
   * (their migrations would mutate the parent).
   *
   * Changing the parent replaces the resource (a version belongs to
   * exactly one script).
   */
  parent?: string | Worker;
  /**
   * Percentage of traffic (0–100) the newly uploaded version receives; the
   * currently-live version keeps the remainder. Cloudflare deployments
   * split between at most two versions, so one canary can be active per
   * script at a time.
   *
   * With {@link parent} set, defaults to `0`: the version is
   * preview-URL-only and the parent's live deployment is untouched.
   * Without `parent`, defaults to `100` (today's full cutover); `0` means
   * "upload the version without deploying it" (the equivalent of
   * `wrangler versions upload`).
   *
   * Note that a subsequent full deploy of the parent (or of this Worker
   * itself, at the default 100) resets traffic to 100% of its own new
   * version.
   */
  traffic?: number;
  /**
   * Preview-URL alias for the uploaded version. Aliased preview URLs
   * (`<alias>-<name>.<subdomain>.workers.dev`) are stable — each upload
   * with the same alias re-points the URL at the new version — which is
   * what makes them useful as shareable PR-preview links and lets
   * `Worker.URL` resolve before the version exists.
   *
   * For a version worker ({@link parent} set) an alias is derived
   * automatically from the stack, stage, and logical id, so every version
   * worker gets a stable preview URL out of the box; set this to override
   * it. Must start with a lowercase letter, contain only lowercase
   * letters, digits, and dashes, and `<alias>-<worker-name>` must fit in
   * 63 characters (a DNS label).
   */
  alias?: string;
  /**
   * Keep each user on one version for the duration of a rollout. Gradual
   * deployments route every request independently by percentage, so
   * consecutive requests from the same user can bounce between versions;
   * affinity pins them by setting the `Cloudflare-Workers-Version-Key`
   * request header — which Cloudflare hashes into a deterministic version
   * assignment — from a stable per-user identifier, via a zone
   * [Transform Rule](https://developers.cloudflare.com/rules/transform/request-header-modification/)
   * Alchemy manages for you.
   *
   * Sources: `{ cookie: "session_id" }`, `{ header: "authorization" }`,
   * `"ip"` (client IP), or a raw Rules-language `{ expression }` (e.g. a
   * JWT claim). Cookie/header sources accept `fallback: "ip"` so requests
   * missing the identifier still stick. See {@link WorkerVersionAffinity}.
   *
   * The rule lives on the Cloudflare zone(s) the Worker's traffic flows
   * through — its `domain` and/or `routes`, or the *parent's* when
   * {@link parent} is set — scoped to the hostnames serving the Worker.
   * It requires zone traffic: a workers.dev-only Worker fails the deploy
   * with a config error (set the header from your client instead).
   * Alchemy owns only its tagged rules in the shared
   * `http_request_late_transform` phase entrypoint (other rules pass
   * through untouched) and removes them when `affinity` is removed or the
   * resource is destroyed. Define affinity at most once per script — the
   * version key is script-wide, so a parent and its canary should not
   * both declare one.
   *
   * As a rollout ramps, pinned users only ever move forward to the new
   * version, never back — unless you roll back.
   */
  affinity?: WorkerVersionAffinity;
  /**
   * Human-readable annotation attached to the uploaded version, shown in
   * the Cloudflare dashboard and `wrangler versions list`.
   */
  message?: string;
  /**
   * Machine-readable tag annotation attached to the uploaded version
   * (e.g. a git commit SHA or PR number).
   */
  tag?: string;
}

export interface WorkerProps<
  Bindings extends WorkerBindingProps = any,
  Assets extends WorkerAssetsConfig | undefined =
    | WorkerAssetsConfig
    | undefined,
> extends PlatformProps {
  /**
   * Worker name override. If omitted, Alchemy derives a deterministic physical
   * name from the stack, stage, and logical ID.
   */
  name?: string;
  /**
   * Deploy this Worker into a Workers for Platforms dispatch namespace as a
   * "user worker" — a customer Worker that a platform Worker dispatches to at
   * runtime via a dynamic-dispatch binding — instead of as a regular
   * account-level Worker.
   *
   * Accepts the namespace name or a {@link DispatchNamespace} resource. The
   * Worker's put/read/delete switch from the account-level
   * `/workers/scripts` endpoints to the dispatch-namespace
   * `/workers/dispatch/namespaces/:namespace/scripts` endpoints.
   *
   * User workers are not directly routable: they have no `workers.dev`
   * subdomain, custom domains, or cron triggers, so {@link url},
   * {@link domain}, and {@link crons} are ignored when this is set. Changing
   * the namespace (or moving a Worker in or out of one) replaces the Worker,
   * since an account-level script and a dispatch-namespace script are
   * distinct cloud resources.
   *
   * @see https://developers.cloudflare.com/cloudflare-for-platforms/workers-for-platforms/
   */
  namespace?: string | DispatchNamespace;
  /**
   * Worker versions & gradual deployments. Set `version.parent` to upload
   * this Worker as a preview/canary *version* of another Worker's script
   * instead of creating its own; set `version.traffic` below 100 to
   * gradually roll out a deploy of this Worker's own script. See
   * {@link WorkerVersionOptions}.
   */
  version?: WorkerVersionOptions;
  /**
   * Controls the Worker's `workers.dev` surface.
   *
   * - `true` (the default) — serve the Worker at its stable `workers.dev`
   *   URL and enable version preview URLs.
   * - `false` — no `workers.dev` URLs at all.
   * - An object — toggle the stable URL and version previews independently,
   *   e.g. `{ enabled: false, previewsEnabled: true }` keeps the stable URL
   *   off while each deployed version stays reachable at its preview URL.
   *
   * @default true
   */
  workersDev?: boolean | WorkersDevConfig;
  /**
   * Static assets to serve. Can be:
   * - A string path to the assets directory
   * - An AssetsProps object with directory and config
   * - An object with path and hash (e.g., from a Build resource)
   *
   * When neither {@link main} nor {@link script} is provided, the Worker is
   * deployed **assets-only**: no script is uploaded at all and Cloudflare's
   * asset layer serves every request, applying `htmlHandling` /
   * `notFoundHandling` (including single-page-application fallback) itself.
   */
  assets?: Assets;
  /** @internal used by Cloudflare.Website.Vite resource */
  vite?: ViteOptions;
  logpush?: boolean;
  /**
   * Cloudflare Workers Observability settings. Controls Workers Logs
   * (`logs`) and Workers Traces (`traces`), each with their own
   * `enabled`, `headSamplingRate`, and `persist` toggles.
   *
   * If omitted, defaults to `{ enabled: true, logs: { enabled: true,
   * invocationLogs: true } }`. Traces are off by default — opt in via
   * `traces: { enabled: true, ... }`.
   */
  observability?: WorkerObservability;
  /**
   * Workers Cache settings. When `enabled` is `true`, Cloudflare checks a
   * regionally tiered cache in front of the Worker on every HTTP request —
   * cache hits are served from the edge without invoking the Worker at all.
   * The Worker controls what gets cached via standard response headers
   * (`Cache-Control`, `Cache-Tag`, `Vary`), including
   * `stale-while-revalidate`.
   *
   * Set `crossVersionCache: true` to share cached responses across Worker
   * versions (by default the cache is scoped to a single version, so every
   * deploy starts cold).
   *
   * If omitted, Workers Cache is disabled — unless the Worker's init phase
   * enables it via `yield* Cloudflare.cache()`, which is the preferred way
   * for Effect-native Workers (and also returns the runtime purge client).
   * When both are set, this prop takes precedence.
   *
   * @see https://blog.cloudflare.com/workers-cache/
   */
  cache?: WorkerCache;
  tags?: string[];
  /**
   * Path to the Worker's entry module. Bundled with rolldown before
   * upload. Mutually exclusive with {@link script} — provide at most one.
   * Omit both (with {@link assets} set) to deploy an assets-only Worker.
   *
   * A `.py` entry deploys a Python Worker instead: no bundling runs — the
   * entry plus every sibling `.py` file upload as Python modules, the
   * `python_workers` compatibility flag is added, and dependencies from
   * `pyproject.toml` (or a prebuilt `python_modules/` directory) are
   * vendored alongside. See the Python Workers section above.
   */
  main?: string;
  /**
   * Raw module source for the Worker. When provided, bundling is bypassed
   * entirely and this string is uploaded as a single ESM module
   * (`main.js`). Useful for tiny inline workers (tests, fixtures,
   * one-offs) and any case where you've already produced the final
   * bundle elsewhere. Mutually exclusive with {@link main}.
   */
  script?: string;
  compatibility?: {
    date?: string;
    flags?: ("nodejs_compat" | "nodejs_als" | (string & {}))[];
  };
  limits?: WorkerLimits;
  placement?: WorkerPlacement;
  /**
   * Tracks Durable Object and Workflow exports for Effect-native Workers only.
   * Populated automatically from bindings; do not set manually.
   * @internal
   */
  exports?: Record<string, DurableObjectExport | WorkflowExport>;
  /**
   * Environment variables and native Cloudflare Bindings to bind to
   * the Worker. Accepts:
   *
   * - Resource references (R2 bucket, KV namespace, D1 database,
   *   another Worker, Durable Object, etc.) — emitted as the
   *   corresponding native binding.
   * - `effect/Config` values (`Config.redacted`, `Config.string`,
   *   `Config.number`, …) — resolved at deploy time and bound as
   *   `secret_text` on Cloudflare regardless of the `Config`
   *   constructor used. See
   *   [Secrets & env](/cloudflare/security/secrets-env).
   * - Literal values — routed by shape: `Redacted<string>` →
   *   `secret_text`, `string` → `plain_text`, anything else → `json`.
   * - `Output` values that resolve to a plain env value (e.g.
   *   `Alchemy.makeRandom`) — classified at deploy time by their
   *   resolved value using the literal rules above. Whole-resource
   *   Outputs (`Output.of(bucket)`) are rejected at deploy time; bind
   *   the resource itself instead.
   *
   * In Effect-native Workers you can alternatively `yield*` a
   * `Config` in the Init phase to register the binding implicitly;
   * `env` is the only option for async (non-Effect) Workers.
   */
  env?: Bindings;
  /**
   * Cron expressions that trigger the Worker's scheduled handler.
   *
   * This is how async (non-Effect) Workers configure Cron Triggers — the
   * entry module exports its own `scheduled` handler and this prop attaches
   * the schedules at deploy time. Effect-native Workers usually skip this
   * prop and call `Cloudflare.Workers.cron(expression, handler)` in the Init
   * phase instead, which attaches the expression and registers the runtime
   * listener in one step.
   *
   * Pass an empty array to remove all Cron Triggers.
   */
  crons?: string[];
  /**
   * The Worker's custom domain: one canonical hostname, plus optional
   * `aliases` that also serve the Worker and `redirects` that 301 to the
   * canonical name. A bare string is shorthand for `{ name }`. The
   * Cloudflare zone is inferred from each hostname — the zone must already
   * exist in the account.
   *
   * When set, `https://<name>` becomes the Worker's primary `url` output,
   * ranking above the `workers.dev` URL. See {@link WorkerDomainConfig}.
   *
   * Omitting the prop leaves custom domains unmanaged — attachments made
   * outside Alchemy are preserved. Pass `null` to explicitly detach every
   * custom domain (and remove their redirect rules).
   */
  domain?: string | WorkerDomainConfig | null;
  /**
   * Zone routes that map URL patterns to this Worker. Equivalent to Wrangler's
   * `routes` array — provide `zoneName` or `zoneId` (or `zone`) alongside each
   * `pattern`. When the zone is omitted, it is inferred from the pattern's
   * hostname.
   */
  routes?: WorkerRouteConfig[];
  /**
   * Extra bundler options applied on top of the standard rolldown
   * input/output options used to build this Worker. Includes the generic
   * bundle extras (pure-annotation packages, bundle analyzer) plus an
   * `output` field of rolldown output overrides (e.g. `codeSplitting`
   * groups) merged over Alchemy's defaults. See {@link WorkerBuildOptions}.
   */
  build?: WorkerBuildOptions;
  /**
   * Whether to bundle {@link main} with rolldown before upload.
   *
   * Set to `false` when `main` already points at a complete,
   * runtime-ready ESM Worker produced by an external tool (OpenNext,
   * a separate rolldown/esbuild pipeline, etc.). The entry and every
   * file around it matching {@link rules} are uploaded byte-for-byte —
   * no bundling, no minification, no transformation. Module names are
   * the files' POSIX paths relative to the entry's directory, matching
   * Wrangler's `no_bundle` contract.
   *
   * Re-bundling such artifacts is unsafe: dynamic `import()` calls the
   * upstream tool relies on can be rewritten in ways that break runtime
   * behavior.
   *
   * Durable Object and Workflow classes must be exported by the prebuilt
   * entry itself — {@link exports} is not applied when `bundle` is
   * `false`.
   *
   * @default true
   */
  bundle?: boolean;
  /**
   * Module rules selecting which files in the directory containing
   * {@link main} are uploaded as additional modules when {@link bundle}
   * is `false`. Each rule's globs are matched against POSIX-style paths
   * relative to that directory, mirroring Wrangler's `rules`
   * configuration. When provided, these rules replace
   * {@link defaultModuleRules}.
   *
   * @default defaultModuleRules — ESModule (`**\/*.js`, `**\/*.mjs`), CompiledWasm (`**\/*.wasm`), Text (`**\/*.txt`, `**\/*.html`, `**\/*.sql`), Data (`**\/*.bin`)
   */
  rules?: ModuleRule[];
  /**
   * Options for the local dev server that runs this Worker under `alchemy dev`.
   * Each Worker is served on its own port.
   *
   * Use `{ mode: "external" }` to skip starting a local Worker entirely —
   * useful when an external dev server (e.g. one spawned via `Command.Dev`)
   * is serving the content this Worker would otherwise host.
   */
  dev?:
    | {
        /**
         * Run this Worker in `workerd` locally (the default).
         * @default "worker"
         */
        mode?: "worker";
        /**
         * Host the local dev server binds to.
         * @default "localhost"
         */
        host?: string;
        /**
         * Port the local dev server listens on. If the port is unavailable,
         * the next free port is used unless {@link strictPort} is `true`.
         * @default 1337
         */
        port?: number;
        /**
         * When `true`, fail instead of falling back to another port if
         * {@link port} is already in use.
         * @default false
         */
        strictPort?: boolean;
      }
    | {
        /**
         * Don't start a local Worker; an external dev server is running instead.
         */
        mode: "external";
        /**
         * URL the external dev server is reachable at, if applicable.
         * This will be returned as the `url` attribute of the Worker resource.
         */
        url?: string;
      };
}

export interface ViteOptions {
  /**
   * Overrides the module that becomes the deployed Worker entry, forwarded
   * to the Cloudflare Vite plugin's `main` option. Relative paths resolve
   * from the Vite root (`rootDir`).
   *
   * By default the entry environment's own entry (the server bundle the
   * framework produces) is deployed. Point `main` at a custom module when
   * the deployed Worker must export more than the framework's fetch
   * handler — e.g. Durable Object classes or additional handlers wrapping
   * the framework handler.
   *
   * @example
   * ```typescript
   * vite: { main: "worker/index.ts" }
   * ```
   */
  main?: string;
  /**
   * Root directory passed to Vite's `root` option.
   * Defaults to the current working directory (`process.cwd()`).
   */
  rootDir?: string;
  /**
   * Controls which files are hashed to decide whether a rebuild is needed.
   * By default every non-gitignored file in `cwd` is hashed, plus the nearest
   * lockfile. Provide explicit globs to narrow the scope.
   *
   * @see {@link MemoOptions}
   */
  memo?: MemoOptions & {
    /**
     * Configure additional workspaces to hash.
     * By default, auto-detects workspaces during Vite build, then hashes all
     * non-gitignored files in the workspace plus the nearest lockfile.
     * @default "auto"
     */
    workspaces?:
      | "auto"
      | Array<
          MemoOptions & {
            /**
             * The working directory to hash, relative to the Vite root.
             */
            cwd: string;
          }
        >;
  };
  /**
   * Selects which Vite environments make up the deployed Worker, for
   * frameworks that build more than one (e.g. React Server Components).
   *
   * A single-environment SSR build needs no configuration. For a
   * multi-environment build, point `entry` at the environment that
   * produces the server entry chunk and list the remaining server-side
   * environments in `children` so their chunks are bundled alongside it.
   * The `client` environment is always treated as static assets.
   *
   * @example React Router / React Server Components
   * ```typescript
   * viteEnvironments: { entry: "rsc", children: ["ssr"] }
   * ```
   *
   * @default { entry: "ssr", children: [] }
   */
  viteEnvironments?: {
    entry?: string;
    children?: string[];
  };
}

export type Worker<Bindings extends WorkerBindings = any> = Resource<
  WorkerTypeId,
  WorkerProps<Bindings>,
  {
    workerId: string;
    workerName: string;
    /**
     * The Workers for Platforms dispatch namespace this Worker was deployed
     * into, or `undefined` for a regular account-level Worker.
     */
    namespace: string | undefined;
    logpush: boolean | undefined;
    /**
     * The most significant URL the Worker is reachable at — always
     * `urls[0]`, or `undefined` when the Worker is not reachable at any
     * URL (e.g. a dispatch-namespace user worker). Ranking: the canonical
     * custom domain, then aliases, then the stable `workers.dev` URL; a
     * version worker's `url` is its aliased preview URL; under
     * `alchemy dev` it is the local dev server's URL.
     */
    url: string | undefined;
    /**
     * Every URL that serves this Worker, most significant first —
     * `[https://<domain.name>?, ...aliases, <workers.dev URL>?,
     * <version preview URLs>?]`, or the local dev server's
     * `[localhost, ...LAN]` URLs under `alchemy dev`. Redirect hostnames
     * never appear (they don't serve the Worker). Useful wholesale, e.g.
     * as a CORS allow-list.
     */
    urls: string[];
    /**
     * The Worker's resolved custom-domain configuration — canonical
     * `name`, `aliases`, and `redirects` as deployed — or `undefined`
     * when no custom domain is configured.
     */
    domain:
      | { name: string; aliases: string[]; redirects: string[] }
      | undefined;
    tags: string[] | undefined;
    durableObjectNamespaces: Record<string, string>;
    accountId: string;
    routes: { id: string; pattern: string; zoneId: string }[];
    crons: string[];
    /**
     * The parent script name this Worker uploads versions to, when this
     * resource is a version worker (`version.parent` set). `undefined` for
     * a Worker that owns its own script — including one deploying with a
     * gradual rollout. This is the discriminator `read`/`delete` use to
     * avoid treating the parent's script as this resource's own.
     */
    versionOf?: string | undefined;
    /**
     * The id of the version uploaded by the most recent deploy. Only set
     * when versioning is in play: always for a version worker
     * (`version.parent`), and for a self-owned Worker when a gradual
     * rollout (`version.traffic` < 100) deployed via the versions API.
     */
    versionId?: string | undefined;
    /**
     * The preview-URL alias attached to the uploaded version — the
     * user-provided `version.alias`, or the auto-derived stable alias for
     * a version worker. The aliased preview URL
     * (`<alias>-<name>.<subdomain>.workers.dev`) is stable across
     * deploys and is the version worker's primary `url`.
     */
    versionAlias?: string | undefined;
    /**
     * The id of the deployment created by the most recent deploy, when the
     * deploy created one through the deployments API (a version with
     * `traffic > 0`). Preview-only versions (`traffic: 0`) have no
     * deployment.
     */
    deploymentId?: string | undefined;
    /**
     * The Cloudflare zone ids currently holding this resource's
     * `version.affinity` transform rules (tagged
     * `alchemy:worker:<script>:affinity` in the shared
     * `http_request_late_transform` phase entrypoint). Tracked so removing
     * the `affinity` prop — or destroying the resource — cleans the rules
     * out of exactly those zones. Empty/absent when no affinity is
     * configured.
     */
    affinityZoneIds?: string[] | undefined;
    hash?: {
      assets: string | undefined;
      bundle: string | undefined;
      input: string | undefined;
      additionalWorkspaces: string[] | undefined;
      // Hash of the deploy-time metadata surface (compatibility, env,
      // bindings, asset config, limits, observability, ...) so metadata-only
      // edits trigger an update (#745). Optional: state written before this
      // field existed has no `metadata`, which reads as a one-time update on
      // the first diff after upgrading (the apply backfills it).
      metadata?: string | undefined;
    };
  },
  {
    bindings?: WorkerBinding[];
    /**
     * Workers Cache settings contributed by `yield* Cloudflare.cache()`.
     * Merged into the upload metadata's `cache_options`; an explicit
     * `WorkerProps.cache` takes precedence.
     */
    cache?: WorkerCache;
    containers?: { className: string; dev: DevContainerImage | undefined }[];
    crons?: string[];
    hyperdrives?: Record<string, Required<DevOrigin>>;
    dev?: { remote?: boolean };
  },
  Providers
>;

/** The env key the resolved URL is injected under when `yield*`-ed. */
const SELF_URL_BINDING_NAME = "WORKER_URL";

/**
 * Effect-native accessor for the Worker's own URL. The value is injected as an
 * env binding that only exists at the *exec* phase on the deployed Worker, so
 * reading it is deferred behind an Effect that requires {@link RuntimeContext}.
 * Yield it inside a handler to obtain the URL string.
 */
export type URLAccessor = Effect.Effect<string, never, RuntimeContext>;

/**
 * The type of {@link URL} (`Worker.URL`).
 *
 * It is a real `Effect` — `yield* Worker.URL` inside a Worker init attaches
 * the binding and resolves the deferred {@link URLAccessor} — but it also
 * carries the `~alchemy/Kind` marker statically, so when it is declared on a
 * Worker's `env` the binding machinery recognises it as a `self_url` binding
 * (`isSelfUrl`) instead of running it.
 *
 * Defined in this module (not its own file): the effect closes over the
 * `Worker` tag and `WorkerEnvironment`, and a separate module would form a
 * value cycle with Worker.ts that the deploy bundler's scope hoisting turns
 * into a startup crash.
 */
export interface URLEffect extends Effect.Effect<
  URLAccessor,
  never,
  WorkerEnvironment | Worker
> {
  "~alchemy/Kind": "Cloudflare.Workers.URL";
}

/**
 * A Worker's own public URL, injected as a binding on that same Worker. At
 * deploy time Alchemy resolves the URL the Worker will be served at (its first
 * custom domain if any, otherwise its `workers.dev` URL) and injects it as a
 * plain-text env binding, so the running Worker knows its own public address.
 *
 * Declare it on a Worker's `env` (it flows through `InferEnv` → `string`) or
 * `yield*` it inside an Effect-native Worker to attach the binding and obtain
 * a deferred {@link URLAccessor}. It is also exposed as
 * `Cloudflare.Worker.URL`.
 *
 * Because the URL is resolved *before* the bundle is built, a `VITE_`-prefixed
 * env key holding `Worker.URL` is inlined into the client bundle as
 * `import.meta.env.VITE_*` — the canonical way to give a Vite frontend its own
 * public URL.
 */
export const URL: URLEffect = Object.assign(
  Effect.gen(function* () {
    // Deploy-time only: register the binding on the host Worker. The provider
    // lowers the `self_url` sentinel into a plain-text binding holding the
    // resolved URL just before upload.
    if (!globalThis.__ALCHEMY_RUNTIME__) {
      yield* (yield* Worker).bind`${SELF_URL_BINDING_NAME}`({
        bindings: [{ type: "self_url", name: SELF_URL_BINDING_NAME }],
      });
    }
    // Captured at init; the deferred read only runs at exec phase (the
    // accessor is colored with RuntimeContext), where env is populated.
    const env = yield* WorkerEnvironment;
    return Effect.sync(
      () => (env as Record<string, string>)[SELF_URL_BINDING_NAME]!,
    ) as URLAccessor;
  }),
  { "~alchemy/Kind": "Cloudflare.Workers.URL" as const },
);

/**
 * Returns true when the value is the `Worker.URL` binding (keyed on the
 * static `~alchemy/Kind` marker — the value is a real Effect, so every
 * env-resolution site must check this before `Effect.isEffect`).
 */
export const isSelfUrl = (value: unknown): value is URLEffect =>
  typeof value === "object" &&
  value !== null &&
  "~alchemy/Kind" in value &&
  (value as URLEffect)["~alchemy/Kind"] === "Cloudflare.Workers.URL";

/**
 * A Cloudflare Worker host with deploy-time binding support and runtime export
 * collection.
 *
 * A Worker follows a two-phase pattern. The outer `Effect.gen` runs at
 * deploy time to bind resources (KV, R2, Durable Objects, etc.). It returns
 * an object whose properties are the Worker's runtime handlers — `fetch` for
 * HTTP requests and any additional RPC methods.
 *
 * ```typescript
 * Effect.gen(function* () {
 *   // Phase 1: bind resources (runs at deploy time)
 *   const kv = yield* Cloudflare.KV.ReadWriteNamespace(MyKV);
 *
 *   return {
 *     // Phase 2: runtime handlers (runs on each request)
 *     fetch: Effect.gen(function* () {
 *       const value = yield* kv.get("key");
 *       return HttpServerResponse.text(value ?? "not found");
 *     }),
 *   };
 * })
 * ```
 *
 * There are three ways to define a Worker, from simplest to most
 * flexible. See the [Functions & Servers](/infrastructure-as-effects/functions-and-servers)
 * page for the full explanation.
 *
 * - **Async** — plain `async fetch` handler, no Effect runtime in the bundle.
 * - **Effect** — Effect implementation passed directly, single file.
 * - **Layer** — class and `.make()` in a single file; Rolldown tree-shakes `.make()` from consumers.
 * @resource
 * @product Workers
 * @category Workers & Compute
 * @section Async Workers
 * You don't have to use Effect for your runtime code. If you create
 * a Worker resource with `main` pointing at a file but provide no
 * `Effect.gen` implementation, Alchemy bundles and deploys that file
 * as-is. Your handler is a plain `async fetch` — no Effect runtime
 * is included in the bundle.
 *
 * Use the `env` prop to declare which resources, `Config` values,
 * and literal env vars are available at runtime, and
 * `Cloudflare.InferEnv` to extract a fully typed `env` object from
 * them.
 *
 * See the [Workers guide](/cloudflare/compute/workers)
 * for a comprehensive walkthrough of all binding types (R2, D1,
 * Durable Objects, Assets, and more).
 *
 * @example Defining an async Worker in your stack
 * ```typescript
 * // alchemy.run.ts
 * const db = yield* Cloudflare.D1.Database("DB");
 * const bucket = yield* Cloudflare.R2.Bucket("Bucket");
 *
 * export type WorkerEnv = Cloudflare.InferEnv<typeof Worker>;
 *
 * export const Worker = Cloudflare.Worker("Worker", {
 *   main: "./src/worker.ts",
 *   env: { db, bucket },
 * });
 * ```
 *
 * @example Writing the async handler
 * ```typescript
 * // src/worker.ts
 * import type { WorkerEnv } from "../alchemy.run.ts";
 *
 * export default {
 *   async fetch(request: Request, env: WorkerEnv) {
 *     if (request.method === "GET") {
 *       const object = await env.bucket.get("key");
 *       return new Response(object?.body ?? null);
 *     }
 *     return new Response("Not Found", { status: 404 });
 *   },
 * };
 * ```
 *
 * @section Python Workers
 * Point `main` at a `.py` file to deploy a
 * [Python Worker](https://developers.cloudflare.com/workers/languages/python/)
 * (open beta). There is no bundling step — the entry and every sibling
 * `.py` module upload as-is and are interpreted by Pyodide, and the
 * `python_workers` compatibility flag is added automatically. Like async
 * Workers, Python Workers take no inline Effect implementation; declare
 * bindings with the `env` prop and read them from `self.env` in Python.
 *
 * Dependencies come from `pyproject.toml` next to the entry: Alchemy
 * vendors `[project.dependencies]` with [uv](https://docs.astral.sh/uv/)
 * against the Pyodide wheel index and uploads them under
 * `python_modules/`. If a `python_modules/` directory already exists
 * (e.g. produced by `pywrangler sync`), it is uploaded as-is and uv is
 * not invoked.
 *
 * See the [Python Workers guide](/cloudflare/compute/python-workers)
 * for the full walkthrough.
 *
 * @example Defining a Python Worker in your stack
 * ```typescript
 * // alchemy.run.ts
 * const kv = yield* Cloudflare.KV.Namespace("Cache");
 *
 * export const Worker = Cloudflare.Worker("Worker", {
 *   main: "./src/worker.py",
 *   env: { CACHE: kv },
 * });
 * ```
 *
 * @example Writing the Python handler
 * ```python
 * # src/worker.py
 * from workers import Response, WorkerEntrypoint
 *
 * class Default(WorkerEntrypoint):
 *     async def fetch(self, request):
 *         cached = await self.env.CACHE.get("greeting")
 *         return Response(cached or "Hello from Python!")
 * ```
 *
 * @example Vendoring dependencies with pyproject.toml
 * ```toml
 * # src/pyproject.toml — vendored with uv on deploy
 * [project]
 * name = "my-worker"
 * version = "0.1.0"
 * requires-python = ">=3.13"
 * dependencies = ["humanize"]
 * ```
 *
 * @section Effect Workers
 * Pass the Effect implementation as the third argument. This is the
 * simplest Effect-based approach — everything lives in one file.
 * Convenient for standalone Workers that don't need to be referenced
 * by other Workers.
 *
 * @example Worker Effect
 * ```typescript
 * export default class MyWorker extends Cloudflare.Worker<MyWorker>()(
 *   "MyWorker",
 *   { main: import.meta.url },
 *   Effect.gen(function* () {
 *     // init: bind resources
 *     const kv = yield* Cloudflare.KV.ReadWriteNamespace(MyKV);
 *
 *     return {
 *       // runtime: use them
 *       fetch: Effect.gen(function* () {
 *         const value = yield* kv.get("key");
 *         return HttpServerResponse.text(value ?? "not found");
 *       }),
 *     };
 *   }),
 * ) {}
 * ```
 *
 * @section Worker Layer
 * When two Workers need to reference each other (e.g. WorkerA calls
 * WorkerB and vice versa), or you simply want optimal tree-shaking,
 * define the Worker class separately from its `.make()` call. The
 * class is a lightweight identifier; `.make()` provides the runtime
 * implementation as an `export default`. Rolldown treats `.make()`
 * as pure, so any Worker that imports the class to bind it will not
 * pull in the `.make()` dependencies — the bundler tree-shakes
 * them away entirely.
 *
 * The class and `.make()` can live in the same file. This is the
 * same pattern used by `Container` and `DurableObject`,
 * and is recommended for any cross-Worker or cross-DO bindings.
 *
 * @example Worker Layer (class + .make() in one file)
 * ```typescript
 * // src/WorkerB.ts — the tag carries the name + RPC shape; props live
 * // on `.make()`.
 * export class WorkerB extends Cloudflare.Worker<
 *   WorkerB,
 *   { greet: (name: string) => Effect.Effect<string> }
 * >()("WorkerB") {}
 *
 * export default WorkerB.make(
 *   { main: import.meta.url },
 *   Effect.gen(function* () {
 *     // init: bind resources
 *     const kv = yield* Cloudflare.KV.ReadWriteNamespace(MyKV);
 *
 *     return {
 *       // runtime: use them
 *       greet: (name: string) =>
 *         Effect.gen(function* () {
 *           yield* kv.put("last-greeted", name);
 *           return `Hello ${name}`;
 *         }),
 *     };
 *   }),
 * );
 * ```
 *
 * @example Binding a Worker Layer from another Worker
 * ```typescript
 * // src/WorkerA.ts — imports WorkerB; bundler tree-shakes .make()
 * import WorkerB from "./WorkerB.ts";
 *
 * export default class WorkerA extends Cloudflare.Worker<WorkerA>()(
 *   "WorkerA",
 *   { main: import.meta.url },
 *   Effect.gen(function* () {
 *     const b = yield* Cloudflare.Workers.bindWorker(WorkerB);
 *     return {
 *       fetch: Effect.gen(function* () {
 *         return yield* b.greet("world");
 *       }),
 *     };
 *   }),
 * ) {}
 * ```
 *
 * @section Configuration
 * The props object controls compatibility flags, static assets, and
 * build options. These are evaluated at deploy time.
 *
 * @example Enabling Node.js compatibility
 * ```typescript
 * {
 *   main: import.meta.url,
 *   compatibility: {
 *     flags: ["nodejs_compat"],
 *     date: "2026-03-17",
 *   },
 * }
 * ```
 *
 * @example Serving static assets
 * ```typescript
 * {
 *   main: import.meta.url,
 *   assets: "./public",
 * }
 * ```
 *
 * @example Assets-only Worker (static site)
 * Omit `main` and `script` entirely to deploy a static site: no Worker
 * code is uploaded — Cloudflare's asset layer serves every request and
 * applies `htmlHandling` / `notFoundHandling` (including SPA fallback)
 * itself, exactly like an assets-only `wrangler deploy`.
 * ```typescript
 * const site = yield* Cloudflare.Worker("Site", {
 *   assets: {
 *     directory: "./public",
 *     htmlHandling: "drop-trailing-slash",
 *     notFoundHandling: "404-page",
 *   },
 *   domain: "static.example.com",
 * });
 * ```
 *
 * @example Zone routes
 * ```typescript
 * {
 *   main: import.meta.filename,
 *   routes: [
 *     { pattern: "api.example.com/*", zoneName: "example.com" },
 *     { pattern: "example.com/api/*", zoneId: "<YOUR_ZONE_ID>" },
 *   ],
 * }
 * ```
 *
 * @example Deploying a prebuilt Worker without bundling
 * When `main` already points at a complete, runtime-ready ESM bundle
 * produced by an external tool (e.g. OpenNext), set `bundle: false` to
 * upload it byte-for-byte. The entry's directory is walked recursively
 * and every file matching the module rules (by default `.js`, `.mjs`,
 * `.wasm`, `.txt`, `.html`, `.sql`, and `.bin`) is uploaded as an
 * additional module named by its path relative to that directory.
 * ```typescript
 * {
 *   main: "./.open-next/worker.js",
 *   bundle: false,
 *   assets: "./.open-next/assets",
 * }
 * ```
 *
 * @section URLs & Domains
 * Every URL that serves the Worker is collected in `worker.urls`, most
 * significant first, and `worker.url` is always `urls[0]`. The ranking:
 * the canonical custom domain (`domain.name`), then aliases in declared
 * order, then the stable `workers.dev` URL, then version preview URLs.
 * Under `alchemy dev`, `urls` is the local dev server's
 * `[localhost, ...LAN]` addresses instead. Redirect hostnames never
 * appear in `urls` — they serve no content.
 *
 * The `workersDev` prop controls the `workers.dev` surface (`true` by
 * default = stable URL + version previews; `false` = neither; object form
 * toggles independently), and the `domain` prop attaches custom domains —
 * DNS records and edge certificates are managed automatically.
 *
 * @example Custom domain with aliases and redirects
 * ```typescript
 * const worker = yield* Cloudflare.Worker("Api", {
 *   main: "./src/api.ts",
 *   domain: {
 *     name: "example.com",
 *     aliases: ["www.example.com"],
 *     redirects: ["old.example.com"], // 301 → https://example.com
 *   },
 * });
 * // worker.url  === "https://example.com"
 * // worker.urls === ["https://example.com", "https://www.example.com",
 * //                  "https://<name>.<account>.workers.dev"]
 * ```
 *
 * @example workers.dev toggles
 * ```typescript
 * // No workers.dev URLs at all:
 * { main: "./src/api.ts", workersDev: false, domain: "api.example.com" }
 *
 * // Previews only — each deploy's version preview URL becomes worker.url:
 * { main: "./src/api.ts", workersDev: { enabled: false, previewsEnabled: true } }
 * ```
 *
 * @example All URLs as a CORS allow-list
 * ```typescript
 * const site = yield* Cloudflare.Worker("Site", {
 *   main: "./src/site.ts",
 *   domain: { name: "example.com", aliases: ["www.example.com"] },
 * });
 * const api = yield* Cloudflare.Worker("Api", {
 *   main: "./src/api.ts",
 *   env: { ALLOWED_ORIGINS: site.urls },
 * });
 * ```
 *
 * @section Versions & Gradual Deployments
 * The `version` prop maps Cloudflare's
 * [versions and gradual deployments](https://developers.cloudflare.com/workers/configuration/versions-and-deployments/)
 * onto Alchemy stages. A Worker with `version.parent` set uploads an
 * immutable *version* to the parent Worker's script instead of creating its
 * own — by default with no traffic, reachable only at its preview URL
 * (`worker.url`), which is the PR-preview workflow. Give it `traffic` to
 * run it as a canary, or use `version.traffic` on a normal Worker to roll
 * out its own deploys gradually.
 *
 * A version worker's `url` is its *aliased* preview URL
 * (`<alias>-<name>.<subdomain>.workers.dev`) — the alias is derived from
 * the stack, stage, and logical id (override with `version.alias`), so the
 * URL is stable across deploys and always points at the latest uploaded
 * version. The per-version URL (`<version-prefix>-...`) is also returned
 * in `domains`. Because the aliased URL is known before the version
 * exists, `Worker.URL` works on version workers and resolves to it.
 *
 * A version carries code, bindings, and compatibility settings. Script-level
 * settings (routes, domains, crons, tags, observability, …) belong to the
 * parent and are rejected on version workers, as are locally-hosted Durable
 * Object or Workflow classes. Preview URLs require the parent's workers.dev
 * subdomain to be enabled (the default).
 *
 * @example PR preview: a version of another stage's Worker
 * ```typescript
 * // The staging stage deploys the real Worker; a PR stage uploads its
 * // code as a zero-traffic version of staging's script and gets back a
 * // stable preview URL.
 * const parent = yield* Cloudflare.Worker.ref("MyWorker", {
 *   stage: "staging",
 * });
 * const preview = yield* Cloudflare.Worker("MyWorker", {
 *   main: "./src/worker.ts",
 *   version: { parent, message: `PR #${process.env.PR_NUMBER}` },
 * });
 * // preview.url -> https://<alias>-<name>.<subdomain>.workers.dev
 * // (stable across deploys; re-points at each newly uploaded version)
 * ```
 *
 * @example Canary: send 10% of the parent's traffic to a version
 * ```typescript
 * const parent = yield* Cloudflare.Worker.ref("MyWorker", { stage: "prod" });
 * yield* Cloudflare.Worker("MyWorker", {
 *   main: "./src/worker.ts",
 *   version: { parent, traffic: 10 },
 * });
 * ```
 *
 * @example Gradual rollout of a Worker's own deploy
 * ```typescript
 * // The new version takes 25% of traffic; the previously-live version
 * // keeps 75%. Bump traffic (or remove the prop) and re-deploy to promote.
 * yield* Cloudflare.Worker("MyWorker", {
 *   main: "./src/worker.ts",
 *   version: { traffic: 25 },
 * });
 * ```
 *
 * @section The Worker's own URL
 * `Worker.URL` injects the URL a Worker is served at as a binding on that
 * same Worker — the first custom `domain` if one is configured, otherwise
 * its `workers.dev` URL, always equal to the resource's `url` attribute.
 * Under `alchemy dev` it resolves to the local dev server's URL.
 *
 * @example Read the Worker's own URL inside a handler
 * ```typescript
 * Cloudflare.Worker(
 *   "Api",
 *   { main: import.meta.url },
 *   Effect.gen(function* () {
 *     // Attaches the binding and returns a deferred accessor.
 *     const url = yield* Cloudflare.Worker.URL;
 *
 *     return {
 *       fetch: Effect.gen(function* () {
 *         const publicUrl = yield* url;
 *         return Response.json({ url: publicUrl });
 *       }),
 *     };
 *   }).pipe(Effect.provide(Cloudflare.Workers.URLBinding)),
 * );
 * ```
 *
 * @example Inject the URL into an async Worker's env
 * `InferEnv` types the entry as `string`. A `VITE_`-prefixed key on a
 * vite-built Worker is additionally inlined into the client bundle as
 * `import.meta.env.VITE_PUBLIC_URL` at build time.
 * ```typescript
 * export const Worker = Cloudflare.Worker("Worker", {
 *   main: "./src/worker.ts",
 *   env: { PUBLIC_URL: Cloudflare.Worker.URL },
 * });
 *
 * export type WorkerEnv = Cloudflare.InferEnv<typeof Worker>;
 * //   { PUBLIC_URL: string }
 * ```
 *
 * @section Observability
 * Cloudflare Workers Observability is on by default — `logs.enabled` and
 * `logs.invocationLogs` are turned on if you don't pass an `observability`
 * prop. Pass the prop yourself to tune sampling, enable persistence, or
 * turn on the new `traces` channel (the same toggle the dashboard's
 * Observability tab writes).
 *
 * Field names match the Cloudflare API (camelCased): `headSamplingRate`,
 * `invocationLogs`, etc.
 *
 * @example Enabling logs and traces
 * ```typescript
 * {
 *   main: import.meta.url,
 *   observability: {
 *     enabled: true,
 *     headSamplingRate: 1,
 *     logs: {
 *       enabled: true,
 *       invocationLogs: true,
 *       headSamplingRate: 1,
 *       persist: true,
 *     },
 *     traces: {
 *       enabled: true,
 *       headSamplingRate: 1,
 *       persist: true,
 *     },
 *   },
 * }
 * ```
 *
 * @section Workers Cache
 * Workers Cache puts a regionally tiered cache in front of the Worker —
 * cache hits are served from the edge without invoking the Worker (and
 * without billing CPU time). In an Effect-native Worker, enable it by
 * yielding `Cloudflare.cache()` in the init phase, which also returns the
 * runtime purge client; async Workers use the `cache` prop instead. Control
 * what gets cached from your handlers via standard response headers:
 * `Cache-Control` (including `stale-while-revalidate`), `Cache-Tag` for
 * tag-based purging, and `Vary` for content negotiation.
 *
 * The cache is scoped to a single Worker version by default, so every
 * deploy starts cold. Set `crossVersionCache: true` to share cached
 * responses across versions.
 *
 * @example Enabling and purging the cache in an Effect Worker
 * ```typescript
 * Effect.gen(function* () {
 *   // init: enable Workers Cache on this Worker
 *   const { purge } = yield* Cloudflare.cache({ crossVersionCache: true });
 *
 *   return {
 *     fetch: Effect.gen(function* () {
 *       const request = yield* HttpServerRequest;
 *       if (request.url.startsWith("/invalidate")) {
 *         yield* purge({ tags: ["products"] });
 *         return HttpServerResponse.text("purged");
 *       }
 *       return HttpServerResponse.text("hello", {
 *         headers: {
 *           "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
 *           "Cache-Tag": "products,product:123",
 *         },
 *       });
 *     }),
 *   };
 * })
 * ```
 *
 * @example Enabling Workers Cache on an async Worker
 * ```typescript
 * {
 *   main: "./src/worker.ts",
 *   cache: {
 *     enabled: true,
 *     crossVersionCache: true,
 *   },
 * }
 * ```
 *
 * @section Background Work & Scopes
 * Each incoming event (fetch, RPC call, scheduled run) gets its own Effect
 * `Scope`. When the handler finishes, the bridge closes that scope and
 * registers the close promise with workerd's `ctx.waitUntil` — so
 * finalizers added with `Effect.addFinalizer` inside a handler run *after*
 * the response is sent, without blocking it, and the Worker stays alive
 * until they settle. Streaming responses transfer the scope to the stream,
 * so those finalizers run when the stream completes instead.
 *
 * For ad-hoc background work, `WorkerExecutionContext.waitUntil(effect)`
 * forks an Effect with the caller's full context and keeps the invocation
 * alive until it settles. The context can be yielded once in the init
 * closure and used from any handler; its methods are `RuntimeContext`-
 * colored, so they can only run inside a handler.
 *
 * The init closure is evaluated once per isolate: the bridge builds the
 * Worker's layer stack on the first event and every later event reuses the
 * built services. Resolve services, bind resources, build handlers there —
 * one-shot I/O that caches a plain value (e.g. fetching a secret for a
 * client) is fine, but nothing disposable: the build scope is never closed
 * (workerd has no isolate-teardown hook), so a finalizer added in the init
 * closure never runs, and I/O-backed objects (sockets, response bodies) are
 * pinned to the request that created them. Anything that needs cleanup
 * belongs in a handler, where `Effect.addFinalizer` attaches to the
 * per-event scope.
 *
 * @example Post-response cleanup with a scope finalizer
 * ```typescript
 * return {
 *   fetch: Effect.gen(function* () {
 *     // runs after this response is sent, kept alive by waitUntil
 *     yield* Effect.addFinalizer(() => flushMetrics().pipe(Effect.ignore));
 *     return HttpServerResponse.text("ok");
 *   }),
 * };
 * ```
 *
 * @example Background work with waitUntil
 * ```typescript
 * // init
 * const exec = yield* Cloudflare.WorkerExecutionContext;
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     // respond now; the audit write completes in the background
 *     yield* exec.waitUntil(writeAuditLog(event));
 *     return HttpServerResponse.text("accepted", { status: 202 });
 *   }),
 * };
 * ```
 *
 * @section R2 Bucket
 * Bind an R2 bucket in the init phase with `Cloudflare.R2.ReadWriteBucket`.
 * The returned handle exposes `get`, `put`, `delete`, and `list`
 * methods you can call in your runtime handlers.
 *
 * @example Binding and using R2
 * ```typescript
 * // init
 * const bucket = yield* Cloudflare.R2.ReadWriteBucket(MyBucket);
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     const request = yield* HttpServerRequest;
 *     const key = request.url.split("/").pop()!;
 *
 *     if (request.method === "GET") {
 *       const object = yield* bucket.get(key);
 *       return object
 *         ? HttpServerResponse.text(yield* object.text())
 *         : HttpServerResponse.empty({ status: 404 });
 *     }
 *
 *     yield* bucket.put(key, request.stream);
 *     return HttpServerResponse.empty({ status: 201 });
 *   }),
 * };
 * ```
 *
 * @section KV Namespace
 * Bind a KV namespace with `Cloudflare.KV.ReadWriteNamespace`. KV provides
 * eventually-consistent, low-latency key-value reads replicated
 * globally across Cloudflare's edge.
 *
 * @example Binding and using KV
 * ```typescript
 * // init
 * const kv = yield* Cloudflare.KV.ReadWriteNamespace(MyKV);
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     const value = yield* kv.get("my-key");
 *     return HttpServerResponse.text(value ?? "not found");
 *   }),
 * };
 * ```
 *
 * @section D1 Database
 * Bind a D1 database with `Cloudflare.D1.QueryDatabase`. D1 is a
 * serverless SQLite database — use `prepare` to build parameterized
 * queries and `all`, `first`, or `run` to execute them.
 *
 * @example Binding and querying D1
 * ```typescript
 * // init
 * const db = yield* Cloudflare.D1.QueryDatabase(MyDatabase);
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     const results = yield* db
 *       .prepare("SELECT * FROM users WHERE id = ?")
 *       .bind(userId)
 *       .all();
 *     return yield* HttpServerResponse.json(results);
 *   }),
 * };
 * ```
 *
 * @section Durable Objects
 * Yield a `DurableObject` class in the init phase to get a
 * namespace handle. Call `getByName` or `getById` to get a typed RPC
 * stub, then call its methods from your runtime handlers.
 *
 * @example Using a Durable Object
 * ```typescript
 * // init
 * const counters = yield* Counter;
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     const counter = counters.getByName("user-123");
 *     const value = yield* counter.increment();
 *     return HttpServerResponse.text(String(value));
 *   }),
 * };
 * ```
 *
 * @section Containers
 * Containers run long-lived processes alongside Durable Objects.
 * Provide `Cloudflare.Containers.layer(Sandbox, …)` on a DO's init to
 * bind, start, and monitor the container; then `yield* Sandbox`
 * resolves the **running** instance. Call its typed methods or use
 * `getTcpPort` to make HTTP requests to its exposed ports.
 *
 * @example Running a Container from a Durable Object
 * ```typescript
 * export default class Agent extends Cloudflare.DurableObject<Agent>()(
 *   "Agents",
 *   Effect.gen(function* () {
 *     const sandbox = yield* Sandbox;
 *
 *     return Effect.gen(function* () {
 *       return {
 *         exec: (cmd: string) => sandbox.exec(cmd),
 *         health: () =>
 *           Effect.gen(function* () {
 *             const { fetch } = yield* sandbox.getTcpPort(3000);
 *             const res = yield* fetch(
 *               HttpClientRequest.get("http://container/health"),
 *             );
 *             return yield* res.text;
 *           }),
 *       };
 *     });
 *   }).pipe(
 *     Effect.provide(
 *       Cloudflare.Containers.layer(Sandbox, { enableInternet: true }),
 *     ),
 *   ),
 * ) {}
 * ```
 *
 * @section Dynamic Workers
 * `WorkerLoader` lets you spin up ephemeral Workers at runtime
 * from inline JavaScript modules. This is useful for sandboxing
 * user-provided code or running untrusted scripts in isolation.
 *
 * @example Loading a dynamic Worker
 * ```typescript
 * // init
 * const loader = yield* Cloudflare.WorkerLoader("Loader");
 *
 * return {
 *   fetch: Effect.gen(function* () {
 *     const worker = yield* loader.load({
 *       compatibilityDate: "2026-01-28",
 *       mainModule: "worker.js",
 *       modules: {
 *         "worker.js": `export default {
 *           async fetch(req) { return new Response("sandboxed"); }
 *         }`,
 *       },
 *     });
 *
 *     const res = yield* worker.fetch(
 *       HttpClientRequest.get("https://worker/"),
 *     );
 *     return HttpServerResponse.fromClientResponse(res);
 *   }),
 * };
 * ```
 */
export const Worker: ResourceClassLike<Worker> &
  Effect.Effect<
    Worker & WorkerRuntimeContext & RuntimeContext,
    never,
    Worker
  > & {
    <Self, Shape extends WorkerShape, Deps = never>(): {
      <const Id extends string>(
        id: Id,
      ): Effect.Effect<
        Worker & Rpc<Self> & Dependencies<Deps>,
        never,
        Self | Extract<Deps, Container.Application<any>> | Providers
      > &
        Named<Id> & {
          new (_: never): MakeShape<Shape, WorkerShape> & Named<Id> & Tag;
          of(shape: Shape & WorkerShape): MakeShape<Shape, WorkerShape>;
          make<PropsReq = never, InitReq = never>(
            props:
              | InputProps<WorkerProps>
              | Effect.Effect<InputProps<WorkerProps>, ConfigError, PropsReq>,
            impl: Effect.Effect<Shape, ConfigError, InitReq>,
          ): Layer.Layer<
            Self,
            never,
            | Extract<Deps, Container.Application<any>>
            | Providers
            | Exclude<InitReq, Self | WorkerServices>
          >;
        };
    };
    <Self>(): {
      <
        const Id extends string,
        Shape extends WorkerShape,
        Req extends
          | WorkerServices
          | Container.Application<any>
          | PlatformServices
          | Tag,
      >(
        id: Id,
        props: InputProps<WorkerProps>,
        impl: Effect.Effect<Shape, ConfigError, Req>,
      ): Effect.Effect<
        Worker & Rpc<Self>,
        never,
        Extract<Req, Container.Application<any>> | Providers
      > &
        Named<Id> & {
          new (): MakeShape<Shape, WorkerShape> & Named<Id> & Tag;
        };
      /**
       * Class form without an implementation — an external Worker (a plain
       * bundled `main`, a raw `script`, or an assets-only Worker with no
       * script at all):
       *
       * ```typescript
       * export class Site extends Cloudflare.Worker<Site>()("Site", {
       *   assets: { directory: "./public" },
       * }) {}
       * ```
       */
      <const Id extends string, Req = never>(
        id: Id,
        props:
          | InputProps<WorkerProps>
          | Effect.Effect<InputProps<WorkerProps>, ConfigError, Req>,
      ): Effect.Effect<Worker & Rpc<{}>, never, Req | Providers> &
        Named<Id> & {
          new (): Named<Id> & Tag;
        };
    };
    <
      const Bindings extends WorkerBindingProps = {},
      const Assets extends WorkerAssetsConfig | undefined = undefined,
      Req = never,
    >(
      id: string,
      props:
        | InputProps<WorkerProps<Bindings, Assets>>
        | Effect.Effect<
            InputProps<WorkerProps<Bindings, Assets>>,
            ConfigError,
            Req
          >,
    ): Effect.Effect<
      Worker<{
        [binding in keyof NormalizedBindings<
          Bindings,
          Assets
        >]: NormalizedBindings<Bindings, Assets>[binding];
      }> &
        Rpc<{}>,
      never,
      Req | Providers
    >;
    <
      const Id extends string,
      Shape extends WorkerShape,
      Req extends
        | WorkerServices
        | Container.Application<any>
        | PlatformServices,
    >(
      id: string,
      props: InputProps<WorkerProps>,
      impl: Effect.Effect<Shape, ConfigError, Req>,
    ): Effect.Effect<
      Worker & Rpc<Shape>,
      never,
      Extract<Req, Container.Application<any>> | Providers
    > &
      Named<Id>;
    /**
     * The Worker's own public URL, injected as a binding on that same Worker.
     * Declare it on `env` (`env: { VITE_PUBLIC_URL: Worker.URL }`) or
     * `yield*` it inside an Effect-native Worker to obtain a deferred
     * accessor. See {@link URLEffect}.
     */
    readonly URL: URLEffect;
  } = Platform(
  WorkerTypeId,
  {
    // Both hooks are wrapped in arrows so the imported references are resolved
    // at call time rather than at module-load time. Worker.ts forms import
    // cycles with both WorkerAsyncBindings.ts (which imports `isWorker` here)
    // and WorkerRuntimeContext.ts (which imports `WorkerTypeId`/`WorkerEnvironment`
    // here). Reading either binding eagerly here hits TDZ when Bun loads the
    // package from node_modules in a different module-init order than the local
    // workspace.
    onCreate: (resource, props) =>
      bindWorkerAsyncBindings(resource as Worker, props),
    createRuntimeContext: (id) => makeWorkerRuntimeContext(id),
  },
  { URL },
);
