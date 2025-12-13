export type Pathname = string;
export interface IgnoreRule {
    pattern: string;
    mark?: string;
    negative: boolean;
    body: string;
    ignoreCase: boolean;
    regexPrefix: string;
    regex: RegExp;
    checkRegex: RegExp;
}
export interface TestResult {
    ignored: boolean;
    unignored: boolean;
    rule?: IgnoreRule;
}
export interface PatternParams {
    pattern: string;
    mark?: string;
}
declare class RuleManager {
    private _ignoreCase;
    private _rules;
    private _added;
    constructor(ignoreCase: boolean);
    private _add;
    add(pattern: string | Ignore | readonly (string | Ignore)[] | PatternParams): boolean;
    test(path: string, checkUnignored: boolean, mode: string): TestResult;
}
export interface Options {
    ignorecase?: boolean;
    ignoreCase?: boolean;
    allowRelativePaths?: boolean;
}
export declare class Ignore {
    _rules: RuleManager;
    private _strictPathCheck;
    private _ignoreCache;
    private _testCache;
    constructor({ ignorecase, ignoreCase, allowRelativePaths, }?: Options);
    private _initCache;
    /**
     * Adds one or several rules to the current manager.
     * @param  {string[]} patterns
     * @returns IgnoreBase
     */
    add(pattern: string | Ignore | readonly (string | Ignore)[] | PatternParams): this;
    addPattern(pattern: string | Ignore | readonly (string | Ignore)[] | PatternParams): this;
    private _test;
    /**
     * Debugs ignore rules and returns the checking result, which is
     *   equivalent to `git check-ignore -v`.
     * @returns TestResult
     */
    checkIgnore(path: string): TestResult;
    private _t;
    /**
     * Returns Boolean whether pathname should be ignored.
     * @param  {string} pathname a path to check
     * @returns boolean
     */
    ignores(path: string): boolean;
    /**
     * Creates a filter function which could filter
     * an array of paths with Array.prototype.filter.
     */
    createFilter(): (pathname: Pathname) => boolean;
    /**
     * Filters the given array of pathnames, and returns the filtered array.
     * NOTICE that each path here should be a relative path to the root of your repository.
     * @param paths the array of paths to be filtered.
     * @returns The filtered array of paths
     */
    filter(paths: Pathname[]): Pathname[];
    /**
     * Returns whether pathname should be ignored or unignored
     * @param  {string} pathname a path to check
     * @returns TestResult
     */
    test(path: string): TestResult;
}
/**
 * Creates new ignore manager.
 */
declare function ignore(options?: Options): Ignore;
declare namespace ignore {
    var _a: typeof ignore;
    export var isPathValid: (path: string) => boolean;
    export { _a as default };
}
declare const isPathValid: (path: string) => boolean;
export default ignore;
export { isPathValid };
//# sourceMappingURL=ignore-matcher.d.ts.map