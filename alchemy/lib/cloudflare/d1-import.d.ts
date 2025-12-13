import type { CloudflareApi } from "./api.ts";
/**
 * Options for importing SQL into a D1 database
 */
export interface ImportD1DatabaseOptions {
    /**
     * The ID of the D1 database to import into
     */
    databaseId: string;
    /**
     * The SQL file data to upload
     */
    sqlData: Blob | BufferSource | string;
    /**
     * Optional custom filename for the imported SQL
     */
    filename?: string;
}
/**
 * Response from the import D1 database operation
 */
export interface ImportD1DatabaseResult {
    /**
     * The filename of the imported database
     */
    filename: string;
    /**
     * Additional result information from the import operation
     */
    result: {
        /**
         * Final bookmark used during import
         */
        final_bookmark?: string;
        /**
         * Metadata about the import operation
         */
        meta: {
            /**
             * Whether the database was changed
             */
            changed_db: boolean;
            /**
             * Number of changes made
             */
            changes: number;
            /**
             * Duration of the operation
             */
            duration: number;
            /**
             * ID of the last row
             */
            last_row_id: number;
            /**
             * Number of rows read
             */
            rows_read: number;
            /**
             * Number of rows written
             */
            rows_written: number;
            /**
             * Whether served by primary
             */
            served_by_primary: boolean;
            /**
             * Region that served the request
             */
            served_by_region: string;
            /**
             * Size after import
             */
            size_after: number;
            /**
             * Timing information
             */
            timings: {
                /**
                 * SQL execution duration in milliseconds
                 */
                sql_duration_ms: number;
            };
        };
        /**
         * Number of queries executed
         */
        num_queries: number;
    };
    /**
     * The status of the import operation
     */
    status: "complete";
    /**
     * Whether the import operation was successful
     */
    success: boolean;
}
/**
 * Initiates an import of SQL into a Cloudflare D1 database.
 * Implements a flow to get an upload URL, upload the SQL file, and poll for status updates.
 *
 * Based on Cloudflare API:
 * https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/import/
 *
 * @param api The CloudflareApi instance to use for requests
 * @param options Options including the database ID and SQL data to import
 * @returns An object containing the import results and status upon completion
 * @throws Will throw an error if the API call fails or the import process reports an error
 */
export declare function importD1Database(api: CloudflareApi, options: ImportD1DatabaseOptions): Promise<ImportD1DatabaseResult>;
//# sourceMappingURL=d1-import.d.ts.map