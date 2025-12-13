/**
 * Runs only tests that have changed dependencies
 * @param directory Directory to scan for test files
 * @param baseCommit Optional base commit to compare against
 * @param useVitest Whether to use vitest instead of bun test
 */
export declare function runChangedTests(directory: string, baseCommit?: string, useVitest?: boolean): Promise<void>;
/**
 * Identifies test files that have changed or depend on changed files
 * @param directory Directory to scan for test files
 * @param baseCommit Optional base commit to compare against (defaults to HEAD~1)
 * @returns Array of changed test files
 */
export declare function findChangedTestFiles(directory: string, baseCommit?: string): Promise<string[]>;
//# sourceMappingURL=prune.d.ts.map