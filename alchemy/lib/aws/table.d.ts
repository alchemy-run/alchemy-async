import type { Context } from "../context.ts";
/**
 * Properties for creating or updating a DynamoDB table
 */
export interface TableProps {
    /**
     * Name of the DynamoDB table
     *
     * @default ${app}-${stage}-${id}
     */
    tableName?: string;
    /**
     * Primary partition key (hash key) configuration
     * Defines the main identifier for items in the table
     */
    partitionKey: {
        /**
         * Name of the partition key attribute
         */
        name: string;
        /**
         * Data type of the partition key
         * S: String, N: Number, B: Binary
         */
        type: "S" | "N" | "B";
    };
    /**
     * Optional sort key (range key) configuration
     * Used to sort items with the same partition key
     */
    sortKey?: {
        /**
         * Name of the sort key attribute
         */
        name: string;
        /**
         * Data type of the sort key
         * S: String, N: Number, B: Binary
         */
        type: "S" | "N" | "B";
    };
    /**
     * Billing mode for the table
     * PROVISIONED: Set read/write capacity units
     * PAY_PER_REQUEST: Pay per request pricing
     */
    billingMode?: "PROVISIONED" | "PAY_PER_REQUEST";
    /**
     * Read capacity units when using PROVISIONED billing mode
     * Default: 5
     */
    readCapacity?: number;
    /**
     * Write capacity units when using PROVISIONED billing mode
     * Default: 5
     */
    writeCapacity?: number;
    /**
     * Tags to apply to the table
     * Key-value pairs for resource organization
     */
    tags?: Record<string, string>;
}
/**
 * Output returned after DynamoDB table creation/update
 */
export interface Table extends TableProps {
    /**
     * ARN of the table
     * Format: arn:aws:dynamodb:region:account-id:table/table-name
     */
    arn: string;
    /**
     * Name of the DynamoDB Table.
     */
    tableName: string;
    /**
     * ARN of the table's stream if enabled
     * Format: arn:aws:dynamodb:region:account-id:table/table-name/stream/timestamp
     */
    streamArn?: string;
    /**
     * Unique identifier for the table
     */
    tableId: string;
}
/**
 * AWS DynamoDB Table Resource
 *
 * Creates and manages DynamoDB tables with support for partition and sort keys,
 * flexible billing modes, and automatic table status monitoring.
 *
 * @example
 * // Create a table with partition and sort key
 * const table = await Table("user-events", {
 *   tableName: "user-events",
 *   partitionKey: {
 *     name: "id",
 *     type: "S"
 *   },
 *   sortKey: {
 *     name: "timestamp",
 *     type: "N"
 *   },
 *   tags: {
 *     Environment: "test"
 *   }
 * });
 *
 * @example
 * // Create a table with provisioned capacity
 * const table = await Table("high-throughput", {
 *   tableName: "high-throughput",
 *   partitionKey: {
 *     name: "userId",
 *     type: "S"
 *   },
 *   billingMode: "PROVISIONED",
 *   readCapacity: 100,
 *   writeCapacity: 50
 * });
 */
export declare const Table: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Table>, id: string, props: TableProps) => Promise<Table>);
//# sourceMappingURL=table.d.ts.map