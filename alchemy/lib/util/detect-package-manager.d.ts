export type PackageManager = "bun" | "pnpm" | "yarn" | "npm" | "deno";
export declare function detectPackageManager(root?: string): Promise<PackageManager>;
export declare function getPackageManagerRunner(): Promise<string>;
//# sourceMappingURL=detect-package-manager.d.ts.map