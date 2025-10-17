import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { Exec } from "../../src/os/exec.ts";
import { secret } from "../../src/secret.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Exec Resource", { concurrent: false }, () => {
  test("execute a simple command", async (scope) => {
    try {
      // Run a simple command
      const result = await Exec("echo-test", {
        command: "echo 'Hello, Alchemy!'",
        inheritStdio: false,
      });

      expect(result.id).toBe("echo-test");
      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("Hello, Alchemy!");
      expect(result.stderr).toBe("");
      expect(result.completed).toBe(true);
    } finally {
      await destroy(scope);
    }
  });

  test("execute a command with environment variables", async (scope) => {
    try {
      // Run a command with custom environment variables
      const result = await Exec("env-test", {
        command: "echo $TEST_VAR",
        env: { TEST_VAR: "Custom Environment Variable" },
        inheritStdio: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("Custom Environment Variable");
    } finally {
      await destroy(scope);
    }
  });

  test("execute a command with secret environment variables", async (scope) => {
    try {
      // Run a command with secret environment variables
      const secretValue = "SuperSecretValue123!";
      const result = await Exec("secret-env-test", {
        command: "echo $SECRET_VAR",
        env: {
          SECRET_VAR: secret(secretValue),
          REGULAR_VAR: "RegularValue",
        },
        inheritStdio: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe(secretValue);
    } finally {
      await destroy(scope);
    }
  });

  test("execute a command with mixed environment variables (secrets and strings)", async (scope) => {
    try {
      // Run a command with mixed environment variables
      const secretValue = "TopSecret!";
      const result = await Exec("mixed-env-test", {
        command: 'echo "$REGULAR_VAR|$SECRET_VAR"',
        env: {
          REGULAR_VAR: "NotSecret",
          SECRET_VAR: secret(secretValue),
        },
        inheritStdio: false,
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.trim()).toBe("NotSecret|TopSecret!");
    } finally {
      await destroy(scope);
    }
  });

  test("execute a command that fails", async (scope) => {
    try {
      // Run a command that will fail
      const result = Exec("fail-test", {
        command: "command-that-does-not-exist",
        inheritStdio: false,
      });
      await expect(result).rejects.toThrow();
    } finally {
      await destroy(scope);
    }
  });

  test("execute a command with a specific working directory", async (scope) => {
    try {
      // Run a command in a specific directory
      const result = await Exec("pwd-test", {
        command: "pwd",
        cwd: "/tmp",
        inheritStdio: false,
      });

      expect(result.exitCode).toBe(0);
      // On macOS, /tmp is a symlink to /private/tmp
      const expectedPath =
        process.platform === "darwin" ? "/private/tmp" : "/tmp";
      expect(result.stdout.trim()).toBe(expectedPath);
    } finally {
      await destroy(scope);
    }
  });

  test("memoize a command", async (scope) => {
    try {
      // Create a command with timestamp to verify it's not re-run
      const timestampCmd = `echo "Timestamp: $(date +%s)"`;

      // First execution
      const firstRun = await Exec("memoize-test", {
        command: timestampCmd,
        memoize: true,
        inheritStdio: false,
      });

      expect(firstRun.exitCode).toBe(0);
      expect(firstRun.stdout).toContain("Timestamp:");

      // Small delay to ensure timestamp would change if re-run
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Second execution with the same command
      const secondRun = await Exec("memoize-test", {
        command: timestampCmd,
        memoize: true,
        inheritStdio: false,
      });

      // The output should be identical since it should be memoized
      expect(secondRun.stdout).toBe(firstRun.stdout);
      expect(secondRun.executedAt).toBe(firstRun.executedAt);

      // Third execution with a different command
      const thirdRun = await Exec("memoize-test", {
        command: `echo "Different command: $(date +%s)"`,
        memoize: true,
        inheritStdio: false,
      });

      // This should execute and have different output
      expect(thirdRun.stdout).not.toBe(secondRun.stdout);
      expect(thirdRun.executedAt).not.toBe(secondRun.executedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("memoize a command with file patterns - no changes", async (scope) => {
    try {
      // Create a temporary directory for our test files
      const testDir = join(tmpdir(), `alchemy-test-${Date.now()}`);
      await mkdir(testDir, { recursive: true });

      // Create an initial test file
      const testFile = join(testDir, "test.txt");
      await writeFile(testFile, "initial content");

      // First execution
      const firstRun = await Exec("file-memoize-test", {
        command: `cat ${testFile}`,
        cwd: testDir,
        memoize: { patterns: ["test.txt"] },
        inheritStdio: false,
      });

      expect(firstRun.exitCode).toBe(0);
      expect(firstRun.stdout.trim()).toBe("initial content");

      // Small delay to ensure we can detect if it re-runs
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Second execution with the same file content
      const secondRun = await Exec("file-memoize-test", {
        command: `cat ${testFile}`,
        cwd: testDir,
        memoize: { patterns: ["test.txt"] },
        inheritStdio: false,
      });

      // Should be memoized since file hasn't changed
      expect(secondRun.stdout).toBe(firstRun.stdout);
      expect(secondRun.executedAt).toBe(firstRun.executedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("memoize a command with file patterns - with changes", async (scope) => {
    try {
      // Create a temporary directory for our test files
      const testDir = join(tmpdir(), `alchemy-test-${Date.now()}`);
      await mkdir(testDir, { recursive: true });

      // Create an initial test file
      const testFile = join(testDir, "test.txt");
      await writeFile(testFile, "initial content");

      // First execution
      const firstRun = await Exec("file-memoize-test", {
        command: `cat ${testFile}`,
        cwd: testDir,
        memoize: { patterns: ["test.txt"] },
        inheritStdio: false,
      });

      expect(firstRun.exitCode).toBe(0);
      expect(firstRun.stdout.trim()).toBe("initial content");

      // Small delay to ensure we can detect if it re-runs
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Modify the file
      await writeFile(testFile, "modified content");

      // Second execution with modified file
      const secondRun = await Exec("file-memoize-test", {
        command: `cat ${testFile}`,
        cwd: testDir,
        memoize: { patterns: ["test.txt"] },
        inheritStdio: false,
      });

      // Should re-run since file has changed
      expect(secondRun.stdout.trim()).toBe("modified content");
      expect(secondRun.executedAt).not.toBe(firstRun.executedAt);
    } finally {
      await destroy(scope);
    }
  });
});
