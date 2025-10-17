/// <reference types="bun" />

import { afterAll, beforeAll, it } from "bun:test";
import path from "pathe";
import { alchemy } from "../alchemy.ts";
import { Scope } from "../scope.ts";
import type { TestOptions } from "./options.ts";

/**
 * Extend the Alchemy interface to include test functionality
 */
declare module "../alchemy.ts" {
  interface Alchemy {
    test: typeof test;
  }
}

/**
 * Add test functionality to alchemy instance
 */
alchemy.test = test;

/**
 * Test function type definition with overloads
 */
type test = {
  /**
   * Create a test with default options
   * @param name Test name
   * @param fn Test function
   * @param timeout Optional timeout in milliseconds
   */
  (name: string, fn: (scope: Scope) => Promise<any>, timeout?: number): void;

  /**
   * Create a test with custom options
   * @param name Test name
   * @param options Test configuration options
   * @param fn Test function
   * @param timeout Optional timeout in milliseconds
   */
  (
    name: string,
    options: TestOptions,
    fn: (scope: Scope) => Promise<any>,
    timeout?: number,
  ): void;

  /**
   * Skip test conditionally
   * @param condition If true, test will be skipped
   */
  skipIf(condition: boolean): test;

  beforeAll(fn: (scope: Scope) => Promise<void>, timeout?: number): void;

  afterAll(fn: (scope: Scope) => Promise<void>, timeout?: number): void;

  /**
   * Current test scope
   */
  scope: Scope;
};

/**
 * Creates a test helper function that provides scoped resource management
 *
 * @param meta Import meta object from the test file
 * @param defaultOptions Default options to apply to all tests
 * @returns Test function with scope management
 *
 * @example
 * ```typescript
 * const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX
});
 *
 * describe("My Resource", () => {
 *   test("create and delete", async (scope) => {
 *     try {
 *       const resource = await MyResource("test", { ... });
 *       expect(resource.id).toBeTruthy();
 *     } finally {
 *       await alchemy.destroy(scope);
 *     }
 *   });
 * });
 * ```
 */
export function test(meta: ImportMeta, defaultOptions?: TestOptions): test {
  defaultOptions = defaultOptions ?? {
    quiet: true,
  };

  // Add skipIf functionality
  test.skipIf = it.skipIf.bind(it);

  // Create local test scope based on filename
  const scope = new Scope({
    parent: undefined,
    scopeName: `${defaultOptions.prefix ? `${defaultOptions.prefix}-` : ""}${path.basename(meta.filename)}`,
    // parent: globalTestScope,
    stateStore: defaultOptions?.stateStore,
    phase: "up",
    noTrack: true,
    local: defaultOptions.local,
  });

  test.beforeAll = (fn: (scope: Scope) => Promise<void>) => {
    return beforeAll(() => scope.run(() => fn(scope)));
  };

  test.afterAll = (fn: (scope: Scope) => Promise<void>) => {
    return afterAll(() => scope.run(() => fn(scope)));
  };

  return test as any;

  function test(
    ...args:
      | [
          name: string,
          options: TestOptions,
          fn: (scope: Scope) => Promise<void>,
        ]
      | [name: string, fn: (scope: Scope) => Promise<void>]
  ) {
    const testName = args[0];
    const _options = typeof args[1] === "object" ? args[1] : undefined;
    const timeout =
      typeof args[args.length - 1] === "number"
        ? (args[args.length - 1] as number)
        : 120000;
    const spread = (obj: any) =>
      obj && typeof obj === "object"
        ? Object.fromEntries(
            Object.entries(obj).flatMap(([k, v]) =>
              v !== undefined ? [[k, v]] : [],
            ),
          )
        : {};

    // Merge options with defaults
    const options: TestOptions = {
      quiet: false,
      password: "test-password",
      ...spread(defaultOptions),
      ...spread(_options),
    };
    console.log("options", options);

    const fn = typeof args[1] === "function" ? args[1] : args[2]!;

    return it(
      testName,
      () =>
        alchemy.run(
          testName,
          {
            ...options,
            parent: scope,
          },
          async (scope) => {
            await scope.run(() => fn(scope));
          },
        ),
      timeout,
    );
  }
}
