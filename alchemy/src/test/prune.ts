import * as esbuild from "esbuild";
import { glob } from "glob";
import { exec, spawn } from "node:child_process";
import { promisify } from "node:util";
import path from "pathe";

const execAsync = promisify(exec);

/**
 * Runs only tests that have changed dependencies
 * @param directory Directory to scan for test files
 * @param baseCommit Optional base commit to compare against
 * @param useVitest Whether to use vitest instead of bun test
 */
export async function runChangedTests(
  directory: string,
  baseCommit?: string,
  useVitest?: boolean,
): Promise<void> {
  const changedTests = await findChangedTestFiles(directory, baseCommit);

  // Always include smoke test
  const smokeTestPath = "alchemy/test/smoke.test.ts";
  if (!changedTests.includes(smokeTestPath)) {
    changedTests.unshift(smokeTestPath); // Add at the beginning
  }

  if (process.env.CI) {
    // these tests are being really weird in GitHub CI.
    // not the priority to test in CI
    const testsToRemove = [
      "alchemy/test/cloudflare/dns-records.test.ts",
      "alchemy/test/cloudflare/route.test.ts",
    ];
    for (const test of testsToRemove) {
      const idx = changedTests.indexOf(test);
      if (idx !== -1) {
        changedTests.splice(idx, 1);
      }
    }
  }

  if (changedTests.length === 0) {
    console.log("No tests affected by recent changes.");
    return;
  }

  // Run the tests using spawn for stdio inheritance
  return new Promise<void>((resolve, reject) => {
    const command = useVitest ? "vitest" : "bun";
    const args = useVitest
      ? ["run", ...changedTests]
      : ["test", ...changedTests];
    console.log(`${command} ${args.join(" ")}`);
    // resolve();
    const child = spawn(command, args, { stdio: "inherit" });

    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Tests exited with code ${code}`));
    });

    child.on("error", reject);
  });
}

/**
 * Identifies test files that have changed or depend on changed files
 * @param directory Directory to scan for test files
 * @param baseCommit Optional base commit to compare against (defaults to HEAD~1)
 * @returns Array of changed test files
 */
export async function findChangedTestFiles(
  directory: string,
  baseCommit = "HEAD~1",
): Promise<string[]> {
  // 1. Find all test files
  const testFiles = await findTestFiles(directory);

  // 2. Get git changed files
  const changedFiles = await getChangedFiles(baseCommit);

  // 3. Process each test file
  const changedTestFiles: string[] = [];

  for (const testFile of testFiles) {
    // Get dependency tree for the test file
    const dependencies = await getDependencies(testFile);

    // Check if any dependencies have changed
    const changedDependencies = [...dependencies].filter((dep) =>
      changedFiles.has(dep),
    );

    if (changedDependencies.length > 0) {
      changedTestFiles.push(testFile);
    }
  }

  return changedTestFiles.map((p) => path.relative(process.cwd(), p));
}

/**
 * Finds all test files in a directory
 * @param directory Directory to scan
 * @returns Array of test file paths
 */
async function findTestFiles(directory: string): Promise<string[]> {
  return await glob(path.join(directory, "**/*.test.ts"));
}

/**
 * Gets list of files changed since a base commit
 * @param baseCommit Base commit to compare against
 * @returns Set of changed file paths
 */
async function getChangedFiles(baseCommit: string): Promise<Set<string>> {
  // Get changed files from git
  const { stdout: gitOutput } = await execAsync(
    `git diff --name-only ${baseCommit}`,
  );

  // Convert to set of absolute paths
  const changedFiles = new Set<string>();
  const { stdout: workDir } = await execAsync("git rev-parse --show-toplevel");
  const rootDir = workDir.trim();

  gitOutput
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .forEach((file) => {
      changedFiles.add(path.resolve(rootDir, file));
    });

  return changedFiles;
}

/**
 * Gets dependency tree for a test file
 * @param testFile Path to test file
 * @returns Set of dependency file paths
 */
async function getDependencies(testFile: string): Promise<Set<string>> {
  const dependencies = new Set<string>();

  // Add the test file itself to dependencies
  const absTestPath = path.resolve(testFile);
  dependencies.add(absTestPath);

  try {
    // Use esbuild with metafile to get dependencies
    const result = await esbuild.build({
      entryPoints: [testFile],
      write: false,
      platform: "node",
      format: "esm",
      bundle: true,
      metafile: true,
      external: [
        "@cloudflare/workers-types",
        "bun:test",
        "vitest",
        "@swc/*",
        "react-devtools-core",
      ],
      logLevel: "error",
    });

    if (!result.metafile) {
      return dependencies;
    }

    // Function to normalize paths for comparison
    const normalizePath = (p: string) => path.resolve(p).replace(/\\/g, "/");

    // Process imports from the metafile
    const { inputs } = result.metafile;
    for (const filePath in inputs) {
      // Skip node_modules and non-local imports
      if (
        filePath.includes("node_modules") ||
        filePath.includes("bun:") ||
        !filePath.endsWith(".ts")
      ) {
        continue;
      }

      const absolutePath = normalizePath(filePath);
      dependencies.add(absolutePath);
    }

    return dependencies;
  } catch (error) {
    console.error(`Error analyzing dependencies for ${testFile}:`, error);
    // Return at least the test file itself
    return dependencies;
  }
}
