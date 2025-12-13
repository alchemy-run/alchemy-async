import type { Context } from "../context.ts";
export interface FolderProps {
    /**
     * The path of the folder
     */
    path?: string;
    /**
     * Whether to delete the folder during the delete phase
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to clean the folder during the deletion phase (even if it contains existing files)
     * @default false
     */
    clean?: boolean;
    /**
     * Whether to create the folder recursively
     * @default true
     */
    recursive?: boolean;
}
/**
 * Base folder resource type
 */
export interface Folder {
    path: string;
}
/**
 * Folder Resource
 *
 * Creates and manages directories in the filesystem with automatic parent
 * directory creation and cleanup on deletion.
 *
 * @example
 * // Create a directory using id as path
 * const dir = await Folder("uploads");
 *
 * @example
 * // Create a directory with explicit path
 * const dir = await Folder("uploads", {
 *   path: "uploads"
 * });
 *
 * @example
 * // Create a nested directory structure
 * const logs = await Folder("var/log/app", {
 *   path: "var/log/app"
 * });
 */
export declare const Folder: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Folder>, id: string, props?: FolderProps) => Promise<Folder>);
//# sourceMappingURL=folder.d.ts.map