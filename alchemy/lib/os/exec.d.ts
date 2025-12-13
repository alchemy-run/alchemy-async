import { type SpawnOptions } from "node:child_process";
import type { Context } from "../context.ts";
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
    memoize?: boolean | {
        patterns: string[];
    };
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
export declare const Exec: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Exec>, id: string, props: ExecProps) => Promise<Exec>);
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
export declare function exec(command: string, options?: ExecOptions): Promise<{
    stdout: string;
    stderr: string;
} | undefined>;
//# sourceMappingURL=exec.d.ts.map