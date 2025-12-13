/**
 * Used to disable path validation during dynamic imports.
 */
export declare const withSkipPathValidation: <T>(callback: () => T) => T;
export declare const getDefaultConfigPath: (rootDir?: string) => string;
export declare const getDefaultPersistPath: (rootDir?: string) => string;
export declare const validateConfigPath: (path: string, throws?: boolean) => string;
//# sourceMappingURL=paths.d.ts.map