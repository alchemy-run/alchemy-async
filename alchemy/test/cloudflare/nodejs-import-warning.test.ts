import path from "pathe";
import { afterEach, describe, expect, vi } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe.sequential("NodeJS Import Warning Plugin", () => {
  const warn = vi.hoisted(() =>
    vi.fn((...args: unknown[]) => console.warn(...args)),
  );
  vi.mock("../../src/util/logger.ts", () => ({
    logger: {
      log: vi.fn((...args: unknown[]) => console.log(...args)),
      error: vi.fn((...args: unknown[]) => console.error(...args)),
      warn,
      warnOnce: vi.fn((...args: unknown[]) => console.warn(...args)),
      task: vi.fn(() => {}),
      exit: vi.fn(() => {}),
    },
  }));

  afterEach(() => {
    warn.mockClear();
  });

  test("should warn about node imports without nodejs_compat flag", async (scope) => {
    const entrypoint = path.resolve(
      __dirname,
      "test-handlers/node-imports-handler.ts",
    );

    try {
      await Worker(`${BRANCH_PREFIX}-test-node-imports`, {
        name: `${BRANCH_PREFIX}-test-node-imports`,
        entrypoint,
        format: "esm",
        adopt: true,
      });
    } catch (_e) {
      // Upload should fail, but we're testing the warning
    } finally {
      await destroy(scope);
    }

    // Verify warning was logged
    expect(warn).toHaveBeenCalledWith(
      [
        'The package "node:crypto" wasn\'t found on the file system but is built into node.',
        'Your Worker may throw errors at runtime unless you enable the "nodejs_compat" compatibility flag. Refer to https://developers.cloudflare.com/workers/runtime-apis/nodejs/ for more details. Imported from:',
        " - alchemy/test/cloudflare/test-handlers/node-imports-handler.ts",
      ].join("\n"),
    );
  });

  test("should not warn when nodejs_compat flag is present", async (scope) => {
    const entrypoint = path.resolve(
      __dirname,
      "test-handlers/node-imports-handler.ts",
    );

    try {
      await Worker(`${BRANCH_PREFIX}-test-node-imports-with-compat`, {
        name: `${BRANCH_PREFIX}-test-node-imports-with-compat`,
        entrypoint,
        format: "esm",
        compatibilityDate: "2024-09-23",
        compatibilityFlags: ["nodejs_compat"], // nodejs_compat flag present
        adopt: true,
      });
    } finally {
      await destroy(scope);
    }

    // Verify no warning was logged about missing nodejs_compat
    expect(warn).not.toHaveBeenCalled();
  });

  test("should warn specifically about async_hooks without nodejs_compat or nodejs_als", async (scope) => {
    const entrypoint = path.resolve(
      __dirname,
      "test-handlers/async-hooks-handler.ts",
    );

    try {
      await Worker(`${BRANCH_PREFIX}-test-async-hooks`, {
        name: `${BRANCH_PREFIX}-test-async-hooks`,
        entrypoint,
        format: "esm",
        adopt: true,
      });
    } catch (_e) {
      // Upload should fail, but we're testing the warning
    } finally {
      await destroy(scope);
    }

    // Verify specific async_hooks warning was logged
    expect(warn).toHaveBeenCalledWith(
      [
        `The package "node:async_hooks" wasn't found on the file system but is built into node.`,
        `Your Worker may throw errors at runtime unless you enable the "nodejs_compat" compatibility flag. Refer to https://developers.cloudflare.com/workers/runtime-apis/nodejs/ for more details. Imported from:`,
        " - alchemy/test/cloudflare/test-handlers/async-hooks-handler.ts",
      ].join("\n"),
    );
  });

  test("should not warn about async_hooks when nodejs_als flag is present", async (scope) => {
    const entrypoint = path.resolve(
      __dirname,
      "test-handlers/async-hooks-handler.ts",
    );

    try {
      await Worker(`${BRANCH_PREFIX}-test-async-hooks-with-als`, {
        name: `${BRANCH_PREFIX}-test-async-hooks-with-als`,
        entrypoint,
        format: "esm",
        compatibilityDate: "2024-09-23",
        compatibilityFlags: ["nodejs_als"], // nodejs_als flag present
        adopt: true,
      });
    } catch (_e) {
      // Bundling might fail for other reasons, but we're testing no async_hooks warning
    } finally {
      await destroy(scope);
    }

    // Verify no specific async_hooks warning was logged
    expect(warn).not.toHaveBeenCalled();
  });
});
