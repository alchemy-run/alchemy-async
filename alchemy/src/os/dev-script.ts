import fs from "node:fs/promises";
import path from "pathe";
import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import type { Secret } from "../secret.ts";

/**
 * Restart policy for the dev script
 */
export type RestartPolicy = "on-change" | "always" | "never";

/**
 * Properties for creating a DevScript
 */
export interface DevScriptProps {
  /**
   * The script command to execute
   */
  script: string;

  /**
   * Working directory for the script
   * @default process.cwd()
   */
  cwd?: string;

  /**
   * Environment variables to set
   * Secrets will be unwrapped automatically
   */
  env?: Record<string, string | Secret<string> | undefined>;

  /**
   * Process name for identification (used for process lookup)
   * @default first word of script
   */
  processName?: string;

  /**
   * Whether to suppress output mirroring to console
   * @default false
   */
  quiet?: boolean;

  /**
   * Extract function for parsing readiness from output
   * When provided, the resource will block until the function returns a value or timeout occurs
   *
   * @example
   * // Extract a URL from output
   * extract: (line) => {
   *   const match = line.match(/http:\/\/[^\s]+/);
   *   return match ? match[0] : undefined;
   * }
   */
  extract?: (line: string) => string | undefined;

  /**
   * Restart policy when resource props change
   * - "on-change": restart only when script, cwd, env, processName, or extract changes
   * - "always": always restart on update
   * - "never": never restart (only initial spawn)
   * @default "on-change"
   */
  restartOnUpdate?: RestartPolicy;

  /**
   * Timeout in milliseconds for extraction
   * Only applies when extract is provided
   * @default 300000 (5 minutes)
   */
  timeoutMs?: number;
}

/**
 * Output from DevScript resource
 */
export type DevScript = Omit<
  DevScriptProps,
  "extract" | "restartOnUpdate" | "timeoutMs"
> & {
  /**
   * Resource identifier
   */
  id: string;

  /**
   * Resource type identifier
   * @internal
   */
  type: "os-dev-script";

  /**
   * Path to the log file
   */
  logFile: string;

  /**
   * Path to the PID state file
   */
  stateFile: string;

  /**
   * Extracted value from output (when extract config provided)
   */
  extracted?: string;

  /**
   * Timestamp when the script was started
   */
  startedAt: number;

  /**
   * Normalized snapshot of restart-relevant props for change detection
   * @internal
   */
  _restartSnapshot?: string;
};

/**
 * Type guard for DevScript resource
 */
export function isDevScript(resource: any): resource is DevScript {
  return resource?.[ResourceKind] === "os::DevScript";
}

/**
 * Run a long-lived development script with lifecycle management
 *
 * DevScript is designed for running development servers, dashboards, and other
 * long-lived processes as part of `alchemy dev`. It provides:
 * - Automatic start/stop with Alchemy lifecycle
 * - Restart policies for handling prop changes
 * - Extract-based readiness detection with timeout
 * - Log and PID management
 *
 * **Note:** DevScript only runs in local development mode (`alchemy dev`).
 * In production/CI, it returns metadata without spawning processes.
 *
 * @example
 * // Start a dev dashboard that waits for a URL
 * const dashboard = await DevScript("dashboard", {
 *   script: "bun run dev",
 *   extract: (line) => line.match(/https?:\/\/[^\s]+/)?.[0],
 * });
 *
 * console.log("Dashboard ready at:", dashboard.extracted);
 *
 * @example
 * // Start a script with environment variables and secrets
 * import { alchemy } from "alchemy";
 *
 * const script = await DevScript("backend", {
 *   script: "node server.js",
 *   env: {
 *     PORT: "3000",
 *     API_KEY: alchemy.secret.env.API_KEY
 *   }
 * });
 *
 * @example
 * // Start a script with custom restart policy
 * const watcher = await DevScript("watcher", {
 *   script: "bun --watch build.ts",
 *   restartOnUpdate: "never", // Don't restart when props change
 *   quiet: true
 * });
 *
 * @example
 * // Start a script with extraction timeout
 * const server = await DevScript("server", {
 *   script: "vite dev",
 *   extract: (line) => line.match(/Local:\s+(https?:\/\/[^\s]+)/)?.[1],
 *   timeoutMs: 60000 // 1 minute timeout
 * });
 */
export const DevScript = Resource(
  "os::DevScript",
  async function (
    this: Context<DevScript>,
    id: string,
    props: DevScriptProps,
  ): Promise<DevScript> {
    const logsDir = path.join(this.scope.dotAlchemy, "logs");
    const pidsDir = path.join(this.scope.dotAlchemy, "pids");
    const logFile = path.join(logsDir, `${id}.log`);
    const stateFile = path.join(pidsDir, `${id}.pid.json`);

    // Handle delete phase
    if (this.phase === "delete") {
      // Best-effort kill if PID exists
      const pid = await readPidFromStateFile(stateFile);
      if (pid) {
        await killProcess(pid).catch((err) => {
          console.warn(`Failed to kill process ${pid}:`, err);
        });
      } else {
        console.warn(`No PID found for ${id}, skipping process cleanup`);
      }
      return this.destroy();
    }

    // Non-local mode: return metadata without spawning
    if (!this.scope.local) {
      if (this.output) {
        return this.output;
      }
      return {
        id,
        type: "os-dev-script",
        script: props.script,
        cwd: props.cwd,
        env: props.env,
        processName: props.processName,
        quiet: props.quiet,
        logFile,
        stateFile,
        startedAt: Date.now(),
      };
    }

    // Unwrap secrets in environment variables
    const normalizedEnv: Record<string, string> = {};
    if (props.env) {
      for (const [key, value] of Object.entries(props.env)) {
        if (value === undefined) continue;
        if (typeof value === "string") {
          normalizedEnv[key] = value;
        } else {
          normalizedEnv[key] = value.unencrypted;
        }
      }
    }

    // Create restart snapshot for change detection
    const restartSnapshot = createRestartSnapshot({
      script: props.script,
      cwd: props.cwd,
      env: {
        ...(process.env as Record<string, string>),
        ...normalizedEnv,
      },
      processName: props.processName,
      extract: props.extract,
    });

    // Determine if restart is needed
    const restartPolicy = props.restartOnUpdate ?? "on-change";
    let needsRestart = false;

    if (this.phase === "update" && this.output) {
      switch (restartPolicy) {
        case "always":
          needsRestart = true;
          break;
        case "on-change":
          needsRestart = this.output._restartSnapshot !== restartSnapshot;
          break;
        case "never":
          break;
        default:
          exhaustivenessCheck(restartPolicy);
      }
      if (restartPolicy === "always") {
        needsRestart = true;
      } else if (restartPolicy === "on-change") {
        needsRestart = this.output._restartSnapshot !== restartSnapshot;
      }
      // "never" policy never restarts

      if (needsRestart) {
        const pid = await readPidFromStateFile(stateFile);
        if (pid) {
          await killProcess(pid);
        }
        // Clean up PID and log files before restarting
        await Promise.all([
          fs.unlink(stateFile).catch(() => {}),
          fs.unlink(logFile).catch(() => {}),
        ]);
        // Wait for process to fully exit
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    // Only spawn if this is create phase or restart is needed
    const shouldSpawn = this.phase === "create" || needsRestart;

    if (!shouldSpawn && this.output) {
      // No spawn needed, return existing output
      return this.output;
    }

    // Spawn the process
    const extracted = await this.scope.spawn(id, {
      cmd: props.script,
      cwd: props.cwd,
      env: {
        ...(process.env as Record<string, string>),
        ...normalizedEnv,
      },
      processName: props.processName,
      quiet: props.quiet ?? false,
      extract: props.extract,
    });

    // Handle extraction timeout if extract was provided
    let extractedValue: string | undefined;
    if (props.extract && extracted) {
      const timeoutMs = props.timeoutMs ?? 300_000; // 5 minutes default
      try {
        extractedValue = await Promise.race([
          extracted,
          new Promise<never>((_, reject) =>
            setTimeout(
              () => reject(new Error("Extraction timeout")),
              timeoutMs,
            ),
          ),
        ]);
      } catch (error) {
        // Kill the process on timeout
        const pid = await readPidFromStateFile(stateFile);
        if (pid) {
          await killProcess(pid).catch(() => {});
        }

        // Read last lines of log for debugging
        const lastLines = await readLastLines(logFile, 20);
        throw new Error(
          `DevScript "${id}" timed out waiting for extraction after ${timeoutMs}ms.\n` +
            `Log file: ${logFile}\n` +
            `Last 20 lines:\n${lastLines}`,
        );
      }
    }

    return {
      id,
      type: "os-dev-script",
      script: props.script,
      cwd: props.cwd,
      env: props.env,
      processName: props.processName,
      quiet: props.quiet,
      logFile,
      stateFile,
      extracted: extractedValue,
      startedAt: Date.now(),
      _restartSnapshot: restartSnapshot,
    };
  },
);

/**
 * Create a stable snapshot for restart detection
 * @internal
 */
function createRestartSnapshot(data: {
  script: string;
  cwd?: string;
  env: Record<string, string>;
  processName?: string;
  extract?: (line: string) => string | undefined;
}): string {
  // Sort env keys for stable comparison
  const sortedEnv = Object.keys(data.env)
    .sort()
    .map((key) => `${key}=${data.env[key]}`)
    .join("\n");

  const parts = [
    `script=${data.script}`,
    data.cwd ? `cwd=${data.cwd}` : "",
    sortedEnv ? `env:\n${sortedEnv}` : "",
    data.processName ? `processName=${data.processName}` : "",
    data.extract ? `extract:${data.extract.toString()}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

/**
 * Read PID from state file
 * @internal
 */
async function readPidFromStateFile(
  stateFile: string,
): Promise<number | undefined> {
  try {
    const content = await fs.readFile(stateFile, "utf-8");
    const state = JSON.parse(content);
    const pid = Number.parseInt(state.pid, 10);
    return Number.isNaN(pid) ? undefined : pid;
  } catch {
    return undefined;
  }
}

/**
 * Kill a process by PID
 * @internal
 */
async function killProcess(pid: number): Promise<void> {
  // Helper to check if PID is alive
  function isPidAlive(pid: number): boolean {
    if (!pid || Number.isNaN(pid)) return false;
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }

  // Send SIGTERM
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return; // Already dead
  }

  // Wait a bit for graceful shutdown
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Check if still alive using find-process
  if (isPidAlive(pid)) {
    const { default: find } = await import("find-process");
    const processes = await find("pid", pid);
    if (processes.some((p) => p.name !== "<defunct>")) {
      // Still running, send SIGKILL
      try {
        process.kill(pid, "SIGKILL");
      } catch {
        // Ignore error
      }
    }
  }
}

/**
 * Read last N lines from a file
 * @internal
 */
async function readLastLines(
  filePath: string,
  numLines: number,
): Promise<string> {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    const lines = content.split("\n");
    const lastLines = lines.slice(-numLines);
    return lastLines.join("\n");
  } catch {
    return "(unable to read log file)";
  }
}

function exhaustivenessCheck<T>(_value: T): never {
  throw new Error(`Unhandled case: ${String(_value)}`);
}
