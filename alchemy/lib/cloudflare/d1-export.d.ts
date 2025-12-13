import type { CloudflareApi } from "./api.ts";
/**
 * Options for exporting a D1 database
 */
export interface ExportD1DatabaseOptions {
    /**
     * The ID of the D1 database to export
     */
    databaseId: string;
    /**
     * Optional dump options to control what is exported
     */
    dumpOptions?: {
        /**
         * Optional list of tables to export
         */
        tables?: string[];
        /**
         * Whether to exclude schema in the export
         */
        no_schema?: boolean;
        /**
         * Whether to exclude data in the export
         */
        no_data?: boolean;
    };
}
/**
 * Response from the export D1 database operation
 */
export interface ExportD1DatabaseResult {
    /**
     * The filename of the exported database
     */
    filename: string;
    /**
     * The signed URL for downloading the exported database
     */
    signed_url: string;
    /**
     * The status of the export operation
     */
    status: "complete";
    /**
     * Whether the export operation was successful
     */
    success: boolean;
}
/**
 * Initiates an export of a Cloudflare D1 database and returns a download URL.
 * Implements recursive polling with bookmark handling, similar to wrangler.
 * Waits indefinitely until the export process completes or fails.
 *
 * Based on Cloudflare API:
 * https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/export/
 * and wrangler implementation.
 *
 * @param options Options including the database ID and optional dump parameters.
 * @returns An object containing the download URL, filename, and status upon completion.
 * @throws Will throw an error if the API call fails or the export process reports an error.
 */
export declare function exportD1Database(api: CloudflareApi, options: ExportD1DatabaseOptions, currentBookmark?: string): Promise<ExportD1DatabaseResult>;
//# sourceMappingURL=d1-export.d.ts.map