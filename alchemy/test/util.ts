import { exec } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "pathe";
import type { AlchemyOptions } from "../src/alchemy.ts";
import { CloudflareStateStore } from "../src/state/cloudflare-state-store.ts";
import { D1StateStore } from "../src/state/d1-state-store.ts";
import { FileSystemStateStore } from "../src/state/file-system-state-store.ts";
import { R2RestStateStore } from "../src/state/r2-rest-state-store.ts";
import { SQLiteStateStore } from "../src/state/sqlite-state-store.ts";

/**
 * Check if a file or directory exists
 * Uses fs.access which is available in all Node.js versions
 */
export async function exists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize a string to be safe for AWS resource names
 * Replaces any characters that aren't alphanumeric, hyphen, or underscore
 */
function sanitizeForAwsResourceName(str: string): string {
  // Replace any character that's not alphanumeric, hyphen, or underscore with a hyphen
  return str.replace(/[^a-zA-Z0-9\-_]/g, "-");
}

/**
 * Branch prefix for resource names to avoid naming conflicts in CI/CD
 *
 * Uses BRANCH_PREFIX environment variable in CI/CD environments
 * Falls back to current user's name in local development
 * Sanitizes to ensure only valid characters for AWS resource names
 */
export const BRANCH_PREFIX = sanitizeForAwsResourceName(
  process.env.BRANCH_PREFIX || os.userInfo().username,
);

export const STATE_STORE_TYPES = ["do", "fs", "d1", "sqlite", "r2"] as const;

export const createTestOptions = (
  storeType: (typeof STATE_STORE_TYPES)[number],
  namespace: string,
) =>
  ({
    stateStore: (scope) => {
      switch (storeType) {
        case "do":
          return new CloudflareStateStore(scope);
        case "fs":
          return new FileSystemStateStore(scope);
        case "d1":
          return new D1StateStore(scope);
        case "sqlite":
          return new SQLiteStateStore(scope, {
            filename: `.alchemy/${namespace}.sqlite`,
          });
        case "r2":
          return new R2RestStateStore(scope);
      }
    },
  }) satisfies AlchemyOptions;

/**
 * Repeatedly invokes an async function until the predicate returns true or the timeout elapses.
 * Useful for handling eventual consistency in external services.
 */
export async function waitFor<T>(
  producer: () => Promise<T> | T,
  predicate: (value: T) => boolean,
  options?: {
    timeoutMs?: number;
    intervalMs?: number;
  },
): Promise<T> {
  const timeoutMs = options?.timeoutMs ?? 10_000;
  const intervalMs = options?.intervalMs ?? 250;
  const deadline = Date.now() + timeoutMs;

  let lastValue: T;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    lastValue = await producer();
    if (predicate(lastValue)) return lastValue;
    if (Date.now() >= deadline) return lastValue;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Our smoke tests (create.test.ts and init.test.ts) install `alchemy` via a `file:..` reference
 * but alchemy has `catalog:` dependencies and assumes you're installed as part of a monorepo.
 *
 * To avoid hacking the monorepo config for these temporary pacakges (which didn't work when tried),
 * this function just copies across the `catalog` definition from the monorepo to the temp package.
 */
export async function patchCatalogAndInstall(
  projectPath: string,
  options?: {
    devDependencies?: {
      [key: string]: string;
    };
  },
) {
  const packageJson = JSON.parse(
    await fs.readFile(path.join(projectPath, "package.json"), "utf-8"),
  );
  packageJson.workspaces = {
    catalog: JSON.parse(await fs.readFile("package.json", "utf-8")).workspaces
      .catalog,
  };
  if (options?.devDependencies) {
    packageJson.devDependencies = {
      ...packageJson.devDependencies,
      ...options.devDependencies,
    };
  }
  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );
}

export async function runCommand(
  command: string,
  cwd: string,
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string }> {
  console.log(`Running: ${command} in ${cwd}`);

  try {
    const result = await exec(command, {
      cwd,
      env: {
        ...process.env,
        ...env,
        DO_NOT_TRACK: "true",
      },
    });
    return { stdout: result.toString(), stderr: "" };
  } catch (error: any) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout?.toString() ?? "");
    console.error(error.stderr?.toString() ?? "");
    throw error;
  }
}
