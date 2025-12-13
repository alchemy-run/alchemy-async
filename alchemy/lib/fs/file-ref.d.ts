/**
 * Reference to a file in the filesystem
 */
export type FileRef = {
    /**
     * Type identifier for FileRef
     */
    kind: "fs::FileRef";
    /**
     * Path to the file
     */
    path: string;
};
export declare function isFileRef(value: unknown): value is FileRef;
//# sourceMappingURL=file-ref.d.ts.map