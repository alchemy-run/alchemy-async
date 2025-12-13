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
    (name: string, options: TestOptions, fn: (scope: Scope) => Promise<any>, timeout?: number): void;
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
export declare function test(meta: ImportMeta, defaultOptions?: TestOptions): test;
export {};
//# sourceMappingURL=bun.d.ts.map