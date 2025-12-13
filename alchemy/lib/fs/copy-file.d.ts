import type { Context } from "../context.ts";
/**
 * Properties for creating a CopyFile resource
 */
export interface CopyFileProps {
    /**
     * Source path of the file to copy
     */
    src: string;
    /**
     * Destination path where the file should be copied to
     */
    dest: string;
    /**
     * Whether to overwrite the destination file if it already exists
     * @default true
     */
    overwrite?: boolean;
}
/**
 * Output returned after CopyFile creation/update
 */
export interface CopyFile extends CopyFileProps {
    /**
     * Time at which the object was created
     */
    createdAt: number;
    /**
     * Whether the file was successfully copied
     */
    copied: boolean;
}
/**
 * CopyFile Resource
 *
 * Copies a file from a source location to a destination location.
 *
 * @example
 * // Copy a file to a new location
 * const copiedFile = await CopyFile("config-copy", {
 *   src: "config.json",
 *   dest: "backup/config.json"
 * });
 *
 * @example
 * // Copy a file without overwriting if destination exists
 * const safeCopy = await CopyFile("safe-copy", {
 *   src: "data.json",
 *   dest: "backup/data.json",
 *   overwrite: false
 * });
 */
export declare const CopyFile: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<CopyFile>, _id: string, props: CopyFileProps) => Promise<CopyFile>);
//# sourceMappingURL=copy-file.d.ts.map