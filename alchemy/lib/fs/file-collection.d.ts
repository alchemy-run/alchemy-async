/**
 * Collection of files with their contents
 */
export type FileCollection = {
    /**
     * Type identifier for FileCollection
     */
    type: "fs::FileCollection";
    /**
     * Map of relative paths to file contents
     */
    files: {
        [relativePath: string]: string;
    };
};
export declare function isFileCollection(value: unknown): value is FileCollection;
//# sourceMappingURL=file-collection.d.ts.map