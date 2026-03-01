import { poll } from "../util/poll.ts";
import { extractToken, type PlanetScaleProps } from "./api.ts";
import type { Branch } from "./branch.ts";
import type { Database } from "./database.ts";

/**
 * Base libraries that PlanetScale always includes in shared_preload_libraries.
 * These are managed internally and should not be toggled by users.
 * @internal
 */
const BASE_LIBRARIES = ["pg_pscale_utils", "pg_readonly", "pgextwlist"];

/**
 * Configuration for the pg_cron extension.
 * Schedules and runs PostgreSQL commands inside the database.
 */
export interface PgCronConfig {
  /**
   * The database in which pg_cron metadata is kept.
   * @default "postgres"
   */
  databaseName?: string;
  /**
   * Whether to launch active jobs when pg_cron starts.
   * @default "on"
   */
  launchActiveJobs?: "on" | "off";
  /**
   * Minimum message level for pg_cron log messages.
   * @default "warning"
   */
  logMinMessages?: "error" | "warning" | "notice" | "info" | "log" | "debug";
  /**
   * Whether to log each job run into the job_run_details table.
   * @default "on"
   */
  logRun?: "on" | "off";
  /**
   * Whether to log the SQL statement of each job.
   * @default "on"
   */
  logStatement?: "on" | "off";
  /**
   * Maximum number of concurrently running jobs.
   * @default 1
   */
  maxRunningJobs?: number;
}

/**
 * Configuration for the pg_duckdb extension.
 * Embeds DuckDB inside PostgreSQL for analytical queries.
 */
export interface PgDuckdbConfig {
  /**
   * The PostgreSQL role used by DuckDB.
   * @default "pscale_superuser"
   */
  postgresRole?: string;
  /**
   * Memory limit for DuckDB. 0 means unlimited.
   * @default "0"
   */
  memoryLimit?: string;
}

/**
 * Configuration for the pg_hint_plan extension.
 * Controls query execution plans using hints in SQL comments.
 */
export interface PgHintPlanConfig {
  /**
   * Whether to enable hint processing.
   * @default "on"
   */
  enableHint?: "on" | "off";
  /**
   * Whether to enable the hint table feature.
   * @default "off"
   */
  enableHintTable?: "on" | "off";
  /**
   * Message level for hint parsing messages.
   * @default "info"
   */
  parseMessages?: "error" | "warning" | "notice" | "info" | "log" | "debug";
  /**
   * Controls debug output of query plans.
   * @default "off"
   */
  debugPrint?: "off" | "on" | "detailed" | "verbose";
  /**
   * Message level for debug output.
   * @default "info"
   */
  messageLevel?: "error" | "warning" | "notice" | "info" | "log" | "debug";
}

/**
 * Configuration for the pg_partman background worker extension.
 * Automates partition management for time-based and serial-based partitioning.
 */
export interface PgPartmanBgwConfig {
  /**
   * How often (in seconds) the background worker runs maintenance.
   * @default 3600
   */
  interval?: number;
  /**
   * The database to connect to for maintenance.
   * @default "postgres"
   */
  dbname?: string;
  /**
   * The role to use when connecting.
   * @default "postgres"
   */
  role?: string;
  /**
   * Whether to run ANALYZE on partitions after maintenance.
   * @default "off"
   */
  analyze?: "on" | "off";
  /**
   * Whether to use pg_jobmon for logging.
   * @default "on"
   */
  jobmon?: "on" | "off";
}

/**
 * Configuration for the pg_squeeze extension.
 * Removes dead tuples from tables with minimal locking.
 */
export interface PgSqueezeConfig {
  /**
   * Maximum time (in milliseconds) to hold an exclusive lock during processing. 0 means no limit.
   * @default 0
   */
  maxXlockTime?: number;
  /**
   * Databases in which the squeeze worker auto-starts, comma-separated.
   * @default "postgres"
   */
  workerAutostart?: string;
  /**
   * Number of squeeze workers per database.
   * @default 1
   */
  workersPerDatabase?: number;
}

/**
 * Configuration for the pg_stat_statements extension.
 * Tracks planning and execution statistics of all SQL statements.
 */
export interface PgStatStatementsConfig {
  /**
   * Maximum number of statements tracked.
   * @default 5000
   */
  max?: number;
  /**
   * Which statements to track.
   * @default "top"
   */
  track?: "top" | "all";
  /**
   * Whether to track utility commands.
   * @default "on"
   */
  trackUtility?: "on" | "off";
  /**
   * Whether to track planning statistics.
   * @default "off"
   */
  trackPlanning?: "on" | "off";
  /**
   * Whether to save statistics across server restarts.
   * @default "on"
   */
  save?: "on" | "off";
}

/**
 * Configuration for the timescaledb extension.
 * Provides time-series data support for PostgreSQL.
 */
export interface TimescaledbConfig {
  /**
   * Log level for the background worker.
   * @default "warning"
   */
  bgwLogLevel?: "error" | "warning" | "notice" | "info" | "log" | "debug";
  /**
   * Enable chunk append optimization.
   * @default "on"
   */
  enableChunkAppend?: "on" | "off";
  /**
   * Enable chunk skipping optimization.
   * @default "off"
   */
  enableChunkSkipping?: "on" | "off";
  /**
   * Enable constraint-aware append optimization.
   * @default "on"
   */
  enableConstraintAwareAppend?: "on" | "off";
  /**
   * Enable constraint exclusion optimization.
   * @default "on"
   */
  enableConstraintExclusion?: "on" | "off";
  /**
   * Enable custom hash aggregate optimization.
   * @default "off"
   */
  enableCustomHashagg?: "on" | "off";
  /**
   * Enable deprecation warnings.
   * @default "on"
   */
  enableDeprecationWarnings?: "on" | "off";
  /**
   * Enable event triggers.
   * @default "off"
   */
  enableEventTriggers?: "on" | "off";
  /**
   * Enable foreign key propagation.
   * @default "on"
   */
  enableForeignKeyPropagation?: "on" | "off";
  /**
   * Enable logging of job execution.
   * @default "off"
   */
  enableJobExecutionLogging?: "on" | "off";
  /**
   * Enable now() constification.
   * @default "on"
   */
  enableNowConstify?: "on" | "off";
  /**
   * Enable query optimizations.
   * @default "on"
   */
  enableOptimizations?: "on" | "off";
  /**
   * Enable ordered append optimization.
   * @default "on"
   */
  enableOrderedAppend?: "on" | "off";
  /**
   * Enable parallel chunk append optimization.
   * @default "on"
   */
  enableParallelChunkAppend?: "on" | "off";
  /**
   * Enable qual propagation optimization.
   * @default "on"
   */
  enableQualPropagation?: "on" | "off";
  /**
   * Enable runtime exclusion optimization.
   * @default "on"
   */
  enableRuntimeExclusion?: "on" | "off";
  /**
   * Enable tiered reads.
   * @default "on"
   */
  enableTieredReads?: "on" | "off";
  /**
   * Enable TSS callbacks.
   * @default "on"
   */
  enableTssCallbacks?: "on" | "off";
  /**
   * Maximum number of cached chunks per hypertable.
   * @default 1024
   */
  maxCachedChunksPerHypertable?: number;
  /**
   * Maximum number of open chunks per insert.
   * @default 1024
   */
  maxOpenChunksPerInsert?: number;
  /**
   * Whether the database is being restored from a backup.
   * @default "off"
   */
  restoring?: "on" | "off";
}

/**
 * Configuration for the pgvector extension.
 * Provides vector similarity search for PostgreSQL.
 */
export interface PgvectorConfig {
  /**
   * Size of the dynamic candidate list for HNSW search.
   * @default 40
   */
  hnswEfSearch?: number;
  /**
   * Whether to enable iterative scan for HNSW indexes.
   * @default "off"
   */
  hnswIterativeScan?: "off" | "relaxed_order" | "strict_order";
  /**
   * Maximum number of tuples to scan with HNSW iterative scan.
   * @default 20000
   */
  hnswMaxScanTuples?: number;
  /**
   * Memory multiplier for HNSW scans.
   * @default 1
   */
  hnswScanMemMultiplier?: number;
  /**
   * Number of probes for IVFFlat index search.
   * @default 1
   */
  ivfflatProbes?: number;
  /**
   * Whether to enable iterative scan for IVFFlat indexes.
   * @default "off"
   */
  ivfflatIterativeScan?: "off" | "relaxed_order" | "strict_order";
  /**
   * Maximum number of probes for IVFFlat iterative scan.
   * @default 32768
   */
  ivfflatMaxProbes?: number;
}

/**
 * Configuration for the pginsights extension.
 * Provides query performance insights.
 */
export interface PgInsightsConfig {
  /**
   * Whether to collect raw (un-normalized) queries.
   * @default "off"
   */
  rawQueries?: "on" | "off";
  /**
   * Whether to normalize schema names in queries.
   * @default "off"
   */
  normalizeSchemaNames?: "on" | "off";
}

/**
 * PostgreSQL database extensions configuration.
 *
 * Each property represents an extension. If present (even as `{}`), the extension
 * is enabled with the given config (or defaults). If absent/undefined, the extension
 * is disabled.
 */
export interface DatabaseExtensions {
  /**
   * pg_cron - Job scheduler for PostgreSQL.
   * Schedules and runs PostgreSQL commands on a recurring basis.
   */
  pgCron?: PgCronConfig;
  /**
   * pg_duckdb - Embedded DuckDB for analytical queries.
   */
  pgDuckdb?: PgDuckdbConfig;
  /**
   * pg_hint_plan - Query plan hints.
   * Controls execution plans using hints in SQL comments.
   */
  pgHintPlan?: PgHintPlanConfig;
  /**
   * pg_partman (background worker) - Partition management automation.
   */
  pgPartmanBgw?: PgPartmanBgwConfig;
  /**
   * pg_squeeze - Dead tuple removal with minimal locking.
   */
  pgSqueeze?: PgSqueezeConfig;
  /**
   * pg_stat_statements - Query execution statistics tracking.
   */
  pgStatStatements?: PgStatStatementsConfig;
  /**
   * pg_strict - Stricter SQL behavior for PostgreSQL.
   * This extension has no configurable parameters.
   */
  pgStrict?: Record<string, never>;
  /**
   * timescaledb - Time-series data support.
   */
  timescaledb?: TimescaledbConfig;
  /**
   * pgvector - Vector similarity search.
   */
  vector?: PgvectorConfig;
  /**
   * pginsights - Query performance insights.
   */
  pgInsights?: PgInsightsConfig;
}

/**
 * A single change within an extensions diff: add, remove, or update.
 * @internal
 */
export interface ExtensionDiffEntry {
  /**
   * The shared_preload_libraries name (e.g. "pg_cron", "vector").
   */
  library: string;
  /**
   * "add" = extension is being enabled,
   * "remove" = extension is being disabled,
   * "update" = extension params changed (stays enabled).
   */
  action: "add" | "remove" | "update";
  /**
   * The pgconf parameter key-value pairs to send for this extension.
   * Empty for "remove" actions.
   */
  params: Record<string, string>;
}

/**
 * Result of diffing two DatabaseExtensions objects.
 * @internal
 */
export interface ExtensionsDiff {
  /**
   * Individual changes per extension.
   */
  changes: ExtensionDiffEntry[];
  /**
   * True if there are any changes at all.
   */
  hasChanges: boolean;
}

// ---------------------------------------------------------------------------
// Mapping from our camelCase config keys to the pgconf parameter names
// ---------------------------------------------------------------------------

/** @internal */
interface ParamMapping {
  library: string;
  params: Record<string, string>;
}

function mapPgCron(config: PgCronConfig): ParamMapping {
  return {
    library: "pg_cron",
    params: {
      "cron.database_name": config.databaseName ?? "postgres",
      "cron.launch_active_jobs": config.launchActiveJobs ?? "on",
      "cron.log_min_messages": config.logMinMessages ?? "warning",
      "cron.log_run": config.logRun ?? "on",
      "cron.log_statement": config.logStatement ?? "on",
      "cron.max_running_jobs": String(config.maxRunningJobs ?? 1),
    },
  };
}

function mapPgDuckdb(config: PgDuckdbConfig): ParamMapping {
  return {
    library: "pg_duckdb",
    params: {
      "duckdb.postgres_role": config.postgresRole ?? "pscale_superuser",
      "duckdb.memory_limit": config.memoryLimit ?? "0",
    },
  };
}

function mapPgHintPlan(config: PgHintPlanConfig): ParamMapping {
  return {
    library: "pg_hint_plan",
    params: {
      "pg_hint_plan.enable_hint": config.enableHint ?? "on",
      "pg_hint_plan.enable_hint_table": config.enableHintTable ?? "off",
      "pg_hint_plan.parse_messages": config.parseMessages ?? "info",
      "pg_hint_plan.debug_print": config.debugPrint ?? "off",
      "pg_hint_plan.message_level": config.messageLevel ?? "info",
    },
  };
}

function mapPgPartmanBgw(config: PgPartmanBgwConfig): ParamMapping {
  return {
    library: "pg_partman_bgw",
    params: {
      "pg_partman_bgw.interval": String(config.interval ?? 3600),
      "pg_partman_bgw.dbname": config.dbname ?? "postgres",
      "pg_partman_bgw.role": config.role ?? "postgres",
      "pg_partman_bgw.analyze": config.analyze ?? "off",
      "pg_partman_bgw.jobmon": config.jobmon ?? "on",
    },
  };
}

function mapPgSqueeze(config: PgSqueezeConfig): ParamMapping {
  return {
    library: "pg_squeeze",
    params: {
      "squeeze.max_xlock_time": String(config.maxXlockTime ?? 0),
      "squeeze.worker_autostart": config.workerAutostart ?? "postgres",
      "squeeze.workers_per_database": String(config.workersPerDatabase ?? 1),
    },
  };
}

function mapPgStatStatements(config: PgStatStatementsConfig): ParamMapping {
  return {
    library: "pg_stat_statements",
    params: {
      "pg_stat_statements.max": String(config.max ?? 5000),
      "pg_stat_statements.track": config.track ?? "top",
      "pg_stat_statements.track_utility": config.trackUtility ?? "on",
      "pg_stat_statements.track_planning": config.trackPlanning ?? "off",
      "pg_stat_statements.save": config.save ?? "on",
    },
  };
}

function mapTimescaledb(config: TimescaledbConfig): ParamMapping {
  return {
    library: "timescaledb",
    params: {
      "timescaledb.bgw_log_level": config.bgwLogLevel ?? "warning",
      "timescaledb.enable_chunk_append": config.enableChunkAppend ?? "on",
      "timescaledb.enable_chunk_skipping": config.enableChunkSkipping ?? "off",
      "timescaledb.enable_constraint_aware_append":
        config.enableConstraintAwareAppend ?? "on",
      "timescaledb.enable_constraint_exclusion":
        config.enableConstraintExclusion ?? "on",
      "timescaledb.enable_custom_hashagg": config.enableCustomHashagg ?? "off",
      "timescaledb.enable_deprecation_warnings":
        config.enableDeprecationWarnings ?? "on",
      "timescaledb.enable_event_triggers": config.enableEventTriggers ?? "off",
      "timescaledb.enable_foreign_key_propagation":
        config.enableForeignKeyPropagation ?? "on",
      "timescaledb.enable_job_execution_logging":
        config.enableJobExecutionLogging ?? "off",
      "timescaledb.enable_now_constify": config.enableNowConstify ?? "on",
      "timescaledb.enable_optimizations": config.enableOptimizations ?? "on",
      "timescaledb.enable_ordered_append": config.enableOrderedAppend ?? "on",
      "timescaledb.enable_parallel_chunk_append":
        config.enableParallelChunkAppend ?? "on",
      "timescaledb.enable_qual_propagation":
        config.enableQualPropagation ?? "on",
      "timescaledb.enable_runtime_exclusion":
        config.enableRuntimeExclusion ?? "on",
      "timescaledb.enable_tiered_reads": config.enableTieredReads ?? "on",
      "timescaledb.enable_tss_callbacks": config.enableTssCallbacks ?? "on",
      "timescaledb.max_cached_chunks_per_hypertable": String(
        config.maxCachedChunksPerHypertable ?? 1024,
      ),
      "timescaledb.max_open_chunks_per_insert": String(
        config.maxOpenChunksPerInsert ?? 1024,
      ),
      "timescaledb.restoring": config.restoring ?? "off",
    },
  };
}

function mapVector(config: PgvectorConfig): ParamMapping {
  return {
    library: "vector",
    params: {
      "hnsw.ef_search": String(config.hnswEfSearch ?? 40),
      "hnsw.iterative_scan": config.hnswIterativeScan ?? "off",
      "hnsw.max_scan_tuples": String(config.hnswMaxScanTuples ?? 20000),
      "hnsw.scan_mem_multiplier": String(config.hnswScanMemMultiplier ?? 1),
      "ivfflat.probes": String(config.ivfflatProbes ?? 1),
      "ivfflat.iterative_scan": config.ivfflatIterativeScan ?? "off",
      "ivfflat.max_probes": String(config.ivfflatMaxProbes ?? 32768),
    },
  };
}

function mapPgInsights(config: PgInsightsConfig): ParamMapping {
  return {
    library: "pginsights",
    params: {
      "pginsights.raw_queries": config.rawQueries ?? "off",
      "pginsights.normalize_schema_names": config.normalizeSchemaNames ?? "off",
    },
  };
}

/**
 * Converts a DatabaseExtensions object into a map of library name -> pgconf params.
 * Only includes extensions that are present (enabled).
 * @internal
 */
export function extensionsToParamMappings(
  extensions: DatabaseExtensions,
): Map<string, Record<string, string>> {
  const mappings = new Map<string, Record<string, string>>();

  if (extensions.pgCron !== undefined) {
    const m = mapPgCron(extensions.pgCron);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgDuckdb !== undefined) {
    const m = mapPgDuckdb(extensions.pgDuckdb);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgHintPlan !== undefined) {
    const m = mapPgHintPlan(extensions.pgHintPlan);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgPartmanBgw !== undefined) {
    const m = mapPgPartmanBgw(extensions.pgPartmanBgw);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgSqueeze !== undefined) {
    const m = mapPgSqueeze(extensions.pgSqueeze);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgStatStatements !== undefined) {
    const m = mapPgStatStatements(extensions.pgStatStatements);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgStrict !== undefined) {
    mappings.set("pg_strict", {});
  }
  if (extensions.timescaledb !== undefined) {
    const m = mapTimescaledb(extensions.timescaledb);
    mappings.set(m.library, m.params);
  }
  if (extensions.vector !== undefined) {
    const m = mapVector(extensions.vector);
    mappings.set(m.library, m.params);
  }
  if (extensions.pgInsights !== undefined) {
    const m = mapPgInsights(extensions.pgInsights);
    mappings.set(m.library, m.params);
  }

  return mappings;
}

/**
 * Computes the diff between two extension configurations.
 *
 * @param current - The currently active extensions (or `undefined`/`{}` if none)
 * @param desired - The desired extensions configuration
 * @returns An ExtensionsDiff describing what needs to change
 *
 * @example
 * ```ts
 * const diff = diffExtensions(
 *   { pgCron: { maxRunningJobs: 1 } },
 *   { pgCron: { maxRunningJobs: 5 }, vector: {} },
 * );
 * // diff.changes = [
 * //   { library: "pg_cron", action: "update", params: { "cron.max_running_jobs": "5" } },
 * //   { library: "vector", action: "add", params: {} },
 * // ]
 * ```
 */
export function diffExtensions(
  current: DatabaseExtensions | undefined,
  desired: DatabaseExtensions | undefined,
): ExtensionsDiff {
  const currentMappings = extensionsToParamMappings(current ?? {});
  const desiredMappings = extensionsToParamMappings(desired ?? {});

  const changes: ExtensionDiffEntry[] = [];

  // Find additions and updates
  for (const [library, desiredParams] of desiredMappings) {
    const currentParams = currentMappings.get(library);
    if (!currentParams) {
      // Extension is being added
      changes.push({ library, action: "add", params: desiredParams });
    } else {
      // Extension exists — check if params changed
      const paramsChanged =
        JSON.stringify(sortedEntries(currentParams)) !==
        JSON.stringify(sortedEntries(desiredParams));
      if (paramsChanged) {
        changes.push({ library, action: "update", params: desiredParams });
      }
    }
  }

  // Find removals
  for (const [library] of currentMappings) {
    if (!desiredMappings.has(library)) {
      changes.push({ library, action: "remove", params: {} });
    }
  }

  return {
    changes,
    hasChanges: changes.length > 0,
  };
}

function sortedEntries(obj: Record<string, string>): [string, string][] {
  return Object.entries(obj).sort(([a], [b]) => a.localeCompare(b));
}

// ---------------------------------------------------------------------------
// API interaction — reverse-engineered from PlanetScale dashboard HAR captures
// ---------------------------------------------------------------------------

/**
 * Options for updating database extensions.
 */
export interface UpdateExtensionsOptions extends PlanetScaleProps {
  /**
   * The organization name.
   * @default process.env.PLANETSCALE_ORGANIZATION
   */
  organization?: string;
  /**
   * The database name or Database resource.
   */
  database: string | Database;
  /**
   * The branch name or Branch resource.
   * @default "main"
   */
  branch?: string | Branch;
  /**
   * The base URL of the PlanetScale API.
   * @default "https://api.planetscale.com/v1"
   */
  baseUrl?: string;
}

function resolveOptions(opts: UpdateExtensionsOptions): {
  organization: string;
  database: string;
  branch: string;
  baseUrl: string;
  token: string;
} {
  const organization =
    opts.organization ??
    (typeof opts.database !== "string"
      ? opts.database.organization
      : undefined) ??
    process.env.PLANETSCALE_ORGANIZATION ??
    process.env.PLANETSCALE_ORG_ID;

  if (!organization) {
    throw new Error(
      "PlanetScale organization is required. Please set the `organization` property or the `PLANETSCALE_ORGANIZATION` environment variable.",
    );
  }

  const database =
    typeof opts.database === "string" ? opts.database : opts.database.name;
  const branch = !opts.branch
    ? "main"
    : typeof opts.branch === "string"
      ? opts.branch
      : opts.branch.name;
  const baseUrl = opts.baseUrl ?? "https://api.planetscale.com/v1";
  const token = extractToken(opts);

  return { organization, database, branch, baseUrl, token };
}

/**
 * Builds the multipart/form-data body for a change request that sets extensions.
 *
 * The API expects:
 * - `_method=PATCH`
 * - `queued=1` (for queue phase) or `update=1` (for apply phase)
 * - `parameters[pgconf][shared_preload_libraries][]` repeated for each library
 * - `parameters[pgconf][<param.name>]=<param.value>` for each config param
 *
 * @internal
 */
function buildExtensionFormData(
  desired: DatabaseExtensions,
  phase: "queue" | "apply",
): FormData {
  const form = new FormData();
  form.append("_method", "PATCH");

  if (phase === "apply") {
    form.append("update", "1");
    return form;
  }

  // Queue phase — include all libraries and params
  form.append("queued", "1");

  const mappings = extensionsToParamMappings(desired);

  // Always include base libraries
  for (const lib of BASE_LIBRARIES) {
    form.append("parameters[pgconf][shared_preload_libraries][]", lib);
  }

  // Include pginsights in base libraries if it has config, otherwise include as base
  const hasPgInsights = mappings.has("pginsights");
  if (!hasPgInsights) {
    // pginsights is always loaded; if user didn't explicitly configure it, include with defaults off
    form.append("parameters[pgconf][shared_preload_libraries][]", "pginsights");
    form.append("parameters[pgconf][pginsights.raw_queries]", "off");
    form.append("parameters[pgconf][pginsights.normalize_schema_names]", "off");
  }

  // Add user-requested extensions
  for (const [library, params] of mappings) {
    form.append("parameters[pgconf][shared_preload_libraries][]", library);

    for (const [key, value] of Object.entries(params)) {
      form.append(`parameters[pgconf][${key}]`, value);
    }
  }

  return form;
}

/**
 * Updates the PostgreSQL extensions on a PlanetScale database branch.
 *
 * Uses the reverse-engineered two-phase change request API:
 * 1. **Queue** — submits a change request with the desired extension config
 * 2. **Apply** — triggers execution of the queued change
 * 3. **Poll** — waits for the change to complete
 *
 * @param desired - The desired extension configuration. Extensions present are enabled;
 *                  extensions absent are disabled.
 * @param options - Connection and targeting options.
 *
 * @example
 * ## Enable pgvector and pg_cron
 *
 * ```ts
 * await updateExtensions(
 *   {
 *     vector: { hnswEfSearch: 100 },
 *     pgCron: {},
 *   },
 *   {
 *     organization: "my-org",
 *     database: "my-db",
 *     branch: "main",
 *   },
 * );
 * ```
 *
 * @example
 * ## Disable all user extensions
 *
 * ```ts
 * await updateExtensions({}, {
 *   organization: "my-org",
 *   database: "my-db",
 * });
 * ```
 */
export async function updateExtensions(
  desired: DatabaseExtensions,
  options: UpdateExtensionsOptions,
): Promise<void> {
  const { organization, database, branch, baseUrl, token } =
    resolveOptions(options);

  const changesUrl = `${baseUrl}/organizations/${organization}/databases/${database}/branches/${branch}/changes`;

  // Wait for any in-flight changes to complete before submitting ours
  await waitForPendingChanges(changesUrl, token);

  // Phase 1: Queue the change
  const queueForm = buildExtensionFormData(desired, "queue");
  const queueResponse = await fetch(changesUrl, {
    method: "POST",
    headers: {
      Authorization: token,
    },
    body: queueForm,
  });

  if (!queueResponse.ok) {
    const errorBody = await queueResponse.text();
    throw new Error(
      `Failed to queue extension change (${queueResponse.status}): ${errorBody}`,
    );
  }

  // Phase 2: Apply the change
  const applyForm = buildExtensionFormData(desired, "apply");
  const applyResponse = await fetch(changesUrl, {
    method: "POST",
    headers: {
      Authorization: token,
    },
    body: applyForm,
  });

  if (!applyResponse.ok) {
    const errorBody = await applyResponse.text();
    throw new Error(
      `Failed to apply extension change (${applyResponse.status}): ${errorBody}`,
    );
  }

  // Phase 3: Poll until the change is completed
  await waitForPendingChanges(changesUrl, token);
}

/**
 * Polls the changes endpoint until all changes are completed or canceled.
 * @internal
 */
async function waitForPendingChanges(
  changesUrl: string,
  token: string,
): Promise<void> {
  await poll({
    description: "extension changes to complete",
    fn: async () => {
      const response = await fetch(`${changesUrl}?per_page=1`, {
        headers: { Authorization: token },
      });
      if (!response.ok) {
        throw new Error(
          `Failed to poll change status (${response.status}): ${await response.text()}`,
        );
      }
      const data = (await response.json()) as {
        data: Array<{ state: string; id: string }>;
      };
      return data;
    },
    predicate: (result) => {
      if (result.data.length === 0) return true;
      const latest = result.data[0];
      return latest.state === "completed" || latest.state === "canceled";
    },
  });
}
