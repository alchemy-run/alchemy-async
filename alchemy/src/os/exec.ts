import { spawn, type SpawnOptions } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "pathe";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";

/**
 * Properties for executing a shell command
 */
export interface ExecProps {
  /**
   * The command to execute (including any arguments)
   */
  command: string;

  /**
   * Whether to memoize the command (only re-run if the command changes)
   *
   * When set to `true`, the command will only be re-executed if the command string changes.
   *
   * When set to an object with `patterns`, the command will be re-executed if either:
   * 1. The command string changes, or
   * 2. The contents of any files matching the glob patterns change
   *
   * ⚠️ **Important Note**: When using memoization with build commands, the build outputs
   * will not be produced if the command is memoized. This is because the command is not
   * actually executed when memoized. Consider disabling memoization in CI environments:
   *
   * @example
   * // Disable memoization in CI to ensure build outputs are always produced
   * await Exec("build", {
   *   command: "vite build",
   *   memoize: process.env.CI ? false : {
   *     patterns: ["./src/**"]
   *   }
   * });
   *
   * @default false
   */
  memoize?: boolean | { patterns: string[] };

  /**
   * Working directory for the command
   */
  cwd?: string;

  /**
   * Environment variables to set
   */
  env?: Record<string, string | Secret<string> | undefined>;

  /**
   * Whether to inherit stdio from parent process
   * @default true
   */
  inheritStdio?: boolean;
}

/**
 * Output returned after command execution
 */
export interface Exec extends ExecProps {
  /**
   * Unique identifier for this execution
   */
  id: string;

  /**
   * Exit code of the command
   */
  exitCode: number;

  /**
   * Standard output from the command (only available when inheritStdio is false)
   */
  stdout: string;

  /**
   * Standard error from the command (only available when inheritStdio is false)
   */
  stderr: string;

  /**
   * Time at which the command was executed
   */
  executedAt: number;

  /**
   * Whether the command has completed execution
   */
  completed: boolean;

  /**
   * Hash of the command inputs
   */
  hash?: string;
}

/**
 * Execute a shell command
 *
 * @example
 * // Run a simple command with inherited stdio (default)
 * const result = await Exec("list-files", {
 *   command: "ls -la"
 * });
 *
 * @example
 * // Run a command and capture output instead of inheriting stdio
 * const result = await Exec("list-files", {
 *   command: "ls -la",
 *   inheritStdio: false
 * });
 *
 * console.log(result.stdout);
 *
 * @example
 * // Run a command in a specific directory with custom environment
 * const build = await Exec("build-project", {
 *   command: "npm run build",
 *   cwd: "./my-project",
 *   env: { NODE_ENV: "production" }
 * });
 *
 * @example
 * // Run a command with secrets in environment variables
 * import alchemy from "alchemy";
 *
 * const deploy = await Exec("deploy-app", {
 *   command: "npm run deploy",
 *   env: {
 *     NODE_ENV: "production",
 *     API_KEY: alchemy.secret(process.env.API_KEY),
 *     DATABASE_URL: alchemy.secret(process.env.DATABASE_URL)
 *   }
 * });
 *
 * @example
 * // Run a memoized command that only re-executes when the command changes
 * const memoizedCmd = await Exec("status-check", {
 *   command: "git status",
 *   memoize: true
 * });
 *
 * // This won't actually run the command again if nothing has changed
 * await Exec("status-check", {
 *   command: "git status",
 *   memoize: true
 * });
 *
 * @example
 * // Memoize a build command with file patterns, but disable in CI
 * // This ensures build outputs are always produced in CI
 * const build = await Exec("build", {
 *   command: "vite build",
 *   memoize: process.env.CI ? false : {
 *     patterns: ["./src/**"]
 *   }
 * });
 *
 * @example
 * // Memoize a database migration command based on schema files
 * // This is safe to memoize since it's idempotent
 * const migrate = await Exec("db-migrate", {
 *   command: "drizzle-kit push:pg",
 *   memoize: {
 *     patterns: ["./src/db/schema/**"]
 *   }
 * });
 */
export const Exec = Resource(
  "os::Exec",
  {
    alwaysUpdate: true,
  },
  async function (
    this: Context<Exec>,
    id: string,
    props: ExecProps,
  ): Promise<Exec> {
    if (this.phase === "delete") {
      // Nothing to actually delete for an exec command
      return this.destroy();
    }

    const hash =
      typeof props.memoize === "object"
        ? await hashInputs(props.cwd ?? process.cwd(), props.memoize.patterns)
        : undefined;

    if (
      this.phase === "update" &&
      props.memoize &&
      this.output?.command === props.command &&
      (typeof props.memoize === "boolean" ||
        (hash && this.output?.hash === hash))
    ) {
      // If memoize is enabled and the command hasn't changed, return the existing output
      return this.output;
    }

    // Default values
    let stdout = "";
    let stderr = "";
    let exitCode = 0;

    // Default to inheriting stdio unless explicitly set to false
    const inheritStdio = props.inheritStdio !== false;

    try {
      // Parse the command into command and args
      const [cmd, ...args] = props.command.split(/\s+/);

      // Process environment variables, extracting values from secrets
      const processedEnv: Record<string, string> = {};
      if (props.env) {
        for (const [key, value] of Object.entries(props.env)) {
          if (typeof value === "string") {
            processedEnv[key] = value;
          } else if (value) {
            // Handle Secret objects
            processedEnv[key] = value.unencrypted;
          }
        }
      }

      // Use spawn for better stdio control
      const childProcess = spawn(cmd, args, {
        cwd: props.cwd || process.cwd(),
        env: { ...process.env, ...processedEnv },
        shell: true, // Use shell to handle complex commands
        stdio: inheritStdio ? "inherit" : "pipe", // Inherit stdio when requested
      });

      if (!inheritStdio) {
        // If not inheriting stdio, collect output manually
        childProcess.stdout?.on("data", (data) => {
          stdout += data.toString();
        });

        childProcess.stderr?.on("data", (data) => {
          stderr += data.toString();
        });
      }

      // Wait for the process to complete
      exitCode = await new Promise<number>((resolve, _reject) => {
        childProcess.on("close", (code) => {
          resolve(code || 0);
        });

        childProcess.on("error", (err) => {
          stderr += err.toString();
          resolve(1);
        });
      });
    } catch (error: any) {
      // If not throwing, capture the error information
      exitCode = 1;
      stderr += String(error);
    }

    if (exitCode !== 0) {
      throw new Error(
        `Command failed with exit code ${exitCode}: ${props.command}\n${stderr}`,
      );
    }

    // Return the execution result
    return {
      id,
      command: props.command,
      cwd: props.cwd,
      env: props.env,
      memoize: props.memoize,
      inheritStdio,
      exitCode,
      stdout,
      stderr,
      executedAt: Date.now(),
      completed: true,
      hash,
    };
  },
);

const defaultOptions: SpawnOptions = {
  stdio: "inherit",
  env: {
    ...process.env,
  },
  shell: true,
};

/**
 * Options for exec function
 */
export interface ExecOptions extends Partial<SpawnOptions> {
  /**
   * Whether to capture stdout and stderr
   * @default false
   */
  captureOutput?: boolean;
}

/**
 * Execute a shell command.
 *
 * @param command The command to execute
 * @param options Options for the command execution
 * @returns Promise that resolves when the command completes.
 *          If captureOutput is true, resolves with { stdout, stderr } strings.
 */
export async function exec(
  command: string,
  options?: ExecOptions,
): Promise<{ stdout: string; stderr: string } | undefined> {
  const [cmd, ...args] = command.split(/\s+/);
  const captureOutput = options?.captureOutput === true;

  return new Promise((resolve, reject) => {
    // Set stdio to pipe only if we're capturing output
    const spawnOptions = {
      ...defaultOptions,
      ...options,
      env: {
        ...defaultOptions.env,
        ...options?.env,
      },
      stdio: captureOutput ? "pipe" : defaultOptions.stdio,
    };

    const child = spawn(cmd, args, spawnOptions);

    let stdout = "";
    let stderr = "";

    if (captureOutput) {
      child.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr?.on("data", (data) => {
        stderr += data.toString();
      });
    }

    child.on("close", (code) => {
      if (code === 0) {
        if (captureOutput) {
          resolve({ stdout, stderr });
        } else {
          resolve(undefined);
        }
      } else {
        reject(
          new Error(
            `Command failed with exit code ${code}${stderr ? `: ${stderr}` : ""}`,
          ),
        );
      }
    });

    child.on("error", (err) => {
      reject(err);
    });
  });
}

async function hashInputs(cwd: string, patterns: string[]) {
  const { glob } = await import("glob");
  const { readFile } = await import("node:fs/promises");

  const hashes = new Map<string, string>();

  await Promise.all(
    patterns.flatMap(async (pattern) => {
      const files = await glob(pattern, { cwd });
      return Promise.all(
        files.map(async (file: string) => {
          const path = join(cwd, file);
          const content = await readFile(path);
          hashes.set(path, createHash("sha256").update(content).digest("hex"));
        }),
      );
    }),
  );

  const sortedHashes = Array.from(hashes.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const finalHash = createHash("sha256");
  for (const [, hash] of sortedHashes) {
    finalHash.update(hash);
  }
  return finalHash.digest("hex");
}
