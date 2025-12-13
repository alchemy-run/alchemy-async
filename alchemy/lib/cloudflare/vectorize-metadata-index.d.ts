import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { VectorizeIndex } from "./vectorize-index.ts";
/**
 * Properties for creating or deleting a Vectorize Metadata Index
 */
export interface VectorizeMetadataIndexProps extends CloudflareApiOptions {
    /**
     * Parent Vectorize Index
     */
    index: VectorizeIndex;
    /**
     * Name of the property in the metadata to create an index for
     */
    propertyName: string;
    /**
     * Type of the metadata index
     */
    indexType: "string" | "number" | "boolean";
}
export declare function isVectorizeMetadataIndex(resource: any): resource is VectorizeMetadataIndex;
/**
 * Output returned after Vectorize Metadata Index creation/deletion
 */
export interface VectorizeMetadataIndex extends VectorizeMetadataIndexProps {
    /**
     * ID of this metadata index (derived from propertyName)
     */
    id: string;
    /**
     * Mutation ID returned by the API after creation
     */
    mutationId?: string;
}
/**
 * Creates and manages Cloudflare Vectorize Metadata Indexes.
 *
 * Vectorize Metadata Indexes enable filtering based on metadata properties when querying vectors.
 * Each Vectorize Index can have up to 10 metadata indexes.
 *
 * @example
 * // First create a Vectorize Index
 * const vectorIndex = await VectorizeIndex("documents", {
 *   name: "documents",
 *   config: {
 *     dimensions: 768,
 *     metric: "cosine"
 *   }
 * });
 *
 * // Then create a metadata index for the "category" property
 * const categoryIndex = await VectorizeMetadataIndex("category-index", {
 *   index: vectorIndex,
 *   propertyName: "category",
 *   indexType: "string"
 * });
 *
 * @example
 * // Create a metadata index for a numeric property
 * const yearIndex = await VectorizeMetadataIndex("year-index", {
 *   index: vectorIndex,
 *   propertyName: "year",
 *   indexType: "number"
 * });
 *
 * @see https://developers.cloudflare.com/vectorize/
 */
export declare const VectorizeMetadataIndex: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<VectorizeMetadataIndex>, _id: string, props: VectorizeMetadataIndexProps) => Promise<VectorizeMetadataIndex>);
interface CloudflareMetadataIndexResponse {
    result: {
        mutationId: string;
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Create a new Vectorize metadata index
 */
export declare function createMetadataIndex(api: CloudflareApi, indexName: string, props: VectorizeMetadataIndexProps): Promise<CloudflareMetadataIndexResponse>;
/**
 * Delete a Vectorize metadata index
 */
export declare function deleteMetadataIndex(api: CloudflareApi, indexName: string, propertyName: string): Promise<void>;
/**
 * List all metadata indexes for a Vectorize index
 */
export declare function listMetadataIndexes(api: CloudflareApi, indexName: string): Promise<{
    propertyName: string;
    indexType: "string" | "number" | "boolean";
}[]>;
export {};
//# sourceMappingURL=vectorize-metadata-index.d.ts.map