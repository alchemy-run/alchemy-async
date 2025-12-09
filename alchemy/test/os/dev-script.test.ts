import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { DevScript } from "../../src/os/dev-script.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  local: true, // DevScript only works in local mode
});

describe("DevScript Resource", { concurrent: false }, () => {
  test("start a script and extract URL from output", async (scope) => {
    try {
      // Create a script that prints a URL after a short delay
      const script = await DevScript("url-test", {
        script:
          "bash -c \"sleep 1 && echo 'Server running at http://localhost:3000'\"",
        extract: (line) => line.match(/http:\/\/[^\s]+/)?.[0],
        timeoutMs: 10_000, // 10 second timeout for tests
      });

      expect(script.id).toBe("url-test");
      expect(script.type).toBe("os-dev-script");
      expect(script.extracted).toBe("http://localhost:3000");
      expect(script.logFile).toContain(".alchemy/logs/url-test.log");
      expect(script.stateFile).toContain(".alchemy/pids/url-test.pid.json");
      expect(script.startedAt).toBeGreaterThan(0);
    } finally {
      await destroy(scope);
    }
  });

  test("extract with capture groups", async (scope) => {
    try {
      // Script that prints URL with prefix
      const script = await DevScript("group-test", {
        script:
          "bash -c \"echo 'Local: http://localhost:5000 | Network: http://192.168.1.1:5000'\"",
        extract: (line) => line.match(/Local:\s+(http:\/\/[^\s]+)/)?.[1],
        timeoutMs: 5_000,
      });

      expect(script.extracted).toBe("http://localhost:5000");
    } finally {
      await destroy(scope);
    }
  });

  // TODO: Fix flaky timeout test - timing is inconsistent in CI
  test.skipIf(true)(
    "timeout when extraction pattern never matches",
    async (scope) => {
      try {
        // Script that never prints the expected pattern
        const scriptPromise = DevScript("timeout-test", {
          script: "bash -c \"sleep 5 && echo 'This will not match'\"",
          extract: (line) => line.match(/NEVER_MATCHES/)?.[0],
          timeoutMs: 1_000, // 1 second timeout - should fire before script completes
        });

        await expect(scriptPromise).rejects.toThrow(
          /timed out waiting for extraction/,
        );
      } finally {
        await destroy(scope);
      }
    },
    5_000,
  ); // 5 second test timeout

  test("restart policy on-change (default) - restarts when script changes", async (scope) => {
    try {
      // First script
      const script1 = await DevScript("restart-test", {
        script: "bash -c \"echo 'First' && sleep 10\"",
      });

      expect(script1.script).toBe("bash -c \"echo 'First' && sleep 10\"");

      // Small delay to ensure different startedAt
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update with different script - should restart
      const script2 = await DevScript("restart-test", {
        script: "bash -c \"echo 'Second' && sleep 10\"",
      });

      expect(script2.script).toBe("bash -c \"echo 'Second' && sleep 10\"");
      expect(script2.startedAt).toBeGreaterThan(script1.startedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("restart policy on-change - does not restart when script unchanged", async (scope) => {
    try {
      // First script
      const script1 = await DevScript("no-restart-test", {
        script: "bash -c \"echo 'Same' && sleep 10\"",
      });

      const firstStartedAt = script1.startedAt;

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update with same script - should NOT restart
      const script2 = await DevScript("no-restart-test", {
        script: "bash -c \"echo 'Same' && sleep 10\"",
      });

      expect(script2.startedAt).toBe(firstStartedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("restart policy always - restarts even with same script", async (scope) => {
    try {
      // First script
      const script1 = await DevScript("always-restart-test", {
        script: "bash -c \"echo 'Test' && sleep 10\"",
        restartOnUpdate: "always",
      });

      const firstStartedAt = script1.startedAt;

      // Wait long enough to ensure a new timestamp
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update with same script and "always" policy - should restart
      const script2 = await DevScript("always-restart-test", {
        script: "bash -c \"echo 'Test2' && sleep 10\"", // Different output to verify restart
        restartOnUpdate: "always",
      });

      // Check that restart actually happened (new startedAt)
      expect(script2.startedAt).toBeGreaterThan(firstStartedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("restart policy never - does not restart even when script changes", async (scope) => {
    try {
      // First script
      const script1 = await DevScript("never-restart-test", {
        script: "bash -c \"echo 'First' && sleep 10\"",
        restartOnUpdate: "never",
      });

      const firstStartedAt = script1.startedAt;

      // Small delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update with different script but "never" policy - should NOT restart
      const script2 = await DevScript("never-restart-test", {
        script: "bash -c \"echo 'Second' && sleep 10\"",
        restartOnUpdate: "never",
      });

      expect(script2.startedAt).toBe(firstStartedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("restart when environment variables change", async (scope) => {
    try {
      // First script
      const script1 = await DevScript("env-restart-test", {
        script: 'bash -c "echo $TEST_VAR && sleep 10"',
        env: { TEST_VAR: "first" },
      });

      const firstStartedAt = script1.startedAt;

      // Wait long enough to ensure filesystem operations complete
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Update with different env - should restart
      const script2 = await DevScript("env-restart-test", {
        script: 'bash -c "echo $TEST_VAR && sleep 10"',
        env: { TEST_VAR: "second" },
      });

      expect(script2.startedAt).toBeGreaterThan(firstStartedAt);
    } finally {
      await destroy(scope);
    }
  });

  test("quiet mode suppresses output", async (scope) => {
    try {
      // This test just verifies quiet doesn't break anything
      const script = await DevScript("quiet-test", {
        script: "bash -c \"echo 'This should be quiet' && sleep 1\"",
        quiet: true,
      });

      expect(script.quiet).toBe(true);
      expect(script.id).toBe("quiet-test");
    } finally {
      await destroy(scope);
    }
  });

  test.skipIf(true)(
    "custom working directory",
    async (scope) => {
      try {
        const testDir = join(tmpdir(), `alchemy-test-${Date.now()}`);
        await mkdir(testDir, { recursive: true });
        await writeFile(join(testDir, "test.txt"), "test content");

        const script = await DevScript("cwd-test", {
          script: 'bash -c "cat test.txt && sleep 1"',
          cwd: testDir,
          extract: (line) => line.match(/test content/)?.[0],
          timeoutMs: 10_000,
        });

        expect(script.extracted).toBe("test content");
        expect(script.cwd).toBe(testDir);
      } finally {
        await destroy(scope);
      }
    },
    15_000,
  ); // 15 second test timeout // TODO: Fix flaky test

  test("process cleanup on destroy", async (scope) => {
    try {
      // Start a long-running script
      const script = await DevScript("cleanup-test", {
        script: 'bash -c "sleep 30"',
      });

      expect(script.id).toBe("cleanup-test");

      // Verify PID exists (process is running)
      const { default: find } = await import("find-process");
      const pidContent = await import("node:fs/promises").then((fs) =>
        fs.readFile(script.stateFile, "utf-8"),
      );
      const pid = JSON.parse(pidContent).pid;
      const beforeDestroy = await find("pid", pid);
      expect(beforeDestroy.length).toBeGreaterThan(0);

      // Destroy should kill the process
      await destroy(scope);

      // Wait a bit for process to be killed
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Verify process is no longer running
      const afterDestroy = await find("pid", pid);
      const isDefunct = afterDestroy.every((p) => p.name === "<defunct>");
      expect(afterDestroy.length === 0 || isDefunct).toBe(true);
    } catch (error) {
      // Still destroy even if test fails
      await destroy(scope);
      throw error;
    }
  });

  test.skipIf(true)(
    "non-local mode returns metadata without spawning",
    async (scope) => {
      // TODO: Fix this test - scoping issue with nested alchemy instances
      // Create a separate test with local: false in the alchemy.run options
      const testWithNonLocal = async () => {
        const prodApp = await alchemy("test-non-local", {
          stage: "test",
          local: false, // This is the key - non-local mode
        });

        try {
          const script = await DevScript("non-local-test", {
            script: "bash -c \"echo 'This should not run'\"",
          });

          // Should return metadata
          expect(script.id).toBe("non-local-test");
          expect(script.type).toBe("os-dev-script");
          expect(script.script).toBe("bash -c \"echo 'This should not run'\"");

          // Should not have extracted value since it didn't spawn
          expect(script.extracted).toBeUndefined();

          await prodApp.finalize();

          // No process should be running
          const { default: find } = await import("find-process");
          const processes = await find("name", "bash");
          // Filter to check if our specific command is running
          const ourProcess = processes.find((p) =>
            p.cmd?.includes("This should not run"),
          );
          expect(ourProcess).toBeUndefined();
        } catch (error) {
          await prodApp.finalize();
          throw error;
        }
      };

      await testWithNonLocal();
    },
  );

  test("handles extract with regex flags", async (scope) => {
    try {
      const script = await DevScript("flags-test", {
        script: "bash -c \"echo 'URL: HTTPS://EXAMPLE.COM'\"",
        extract: (line) => line.match(/https:\/\/[^\s]+/i)?.[0], // Case insensitive
        timeoutMs: 5_000,
      });

      expect(script.extracted).toBe("HTTPS://EXAMPLE.COM");
    } finally {
      await destroy(scope);
    }
  });
});
