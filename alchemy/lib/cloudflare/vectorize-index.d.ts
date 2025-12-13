import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Properties for creating or updating a Vectorize Index
 */
export interface VectorizeIndexProps extends CloudflareApiOptions {
    /**
     * Name of the index
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Optional description of the index
     */
    description?: string;
    /**
     * Dimensions of the vectors
     */
    dimensions: number;
    /**
     * Distance metric used for vector similarity
     */
    metric: "cosine" | "euclidean" | "dot_product";
    /**
     * Whether to delete the index if removed
     * If set to false, the index will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to adopt an existing index with the same name if it exists
     * If true and an index with the same name exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
}
export declare function isVectorizeIndex(resource: any): resource is VectorizeIndex;
/**
 * Output returned after Vectorize Index creation/update
 */
export interface VectorizeIndex extends VectorizeIndexProps {
    type: "vectorize";
    /**
     * The unique identifier for the index (same as name)
     */
    id: string;
    /**
     * Name of the Vectorize Index.
     */
    name: string;
    /**
     * Time at which the index was created
     */
    createdAt?: number;
}
/**
 * Creates and manages Cloudflare Vectorize Indexes.
 *
 * Vectorize is Cloudflare's vector database that enables vector search within Cloudflare Workers.
 *
 * @example
 * // Create a basic vector index for text embeddings
 * const basicIndex = await VectorizeIndex("text-embeddings", {
 *   name: "text-embeddings",
 *   config: {
 *     dimensions: 768,
 *     metric: "cosine"
 *   }
 * });
 *
 * @example
 * // Create a vector index with a description
 * const descIndex = await VectorizeIndex("image-embeddings", {
 *   name: "image-embeddings",
 *   description: "Vector index for image embeddings using CLIP model",
 *   config: {
 *     dimensions: 512,
 *     metric: "cosine"
 *   }
 * });
 *
 * @example
 * // Adopt an existing index if it already exists instead of failing
 * const existingIndex = await VectorizeIndex("existing-index", {
 *   name: "existing-index",
 *   adopt: true,
 *   config: {
 *     dimensions: 1024,
 *     metric: "euclidean"
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/vectorize/
 */
export declare const VectorizeIndex: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<VectorizeIndex>, id: string, props: VectorizeIndexProps) => Promise<VectorizeIndex>);
interface CloudflareVectorizeResponse {
    result: {
        name: string;
        description?: string;
        created_on?: string;
        config: {
            dimensions: number;
            metric: string;
        };
    };
    success: boolean;
    errors: Array<{
        code: number;
        message: string;
    }>;
    messages: string[];
}
/**
 * Create a new Vectorize index
 */
export declare function createIndex(api: CloudflareApi, indexName: string, props: VectorizeIndexProps): Promise<CloudflareVectorizeResponse>;
/**
 * Get a Vectorize index
 */
export declare function getIndex(api: CloudflareApi, indexName: string): Promise<CloudflareVectorizeResponse>;
/**
 * Delete a Vectorize index
 */
export declare function deleteIndex(api: CloudflareApi, indexName: string): Promise<void>;
/**
 * List all Vectorize indexes in an account
 */
export declare function listIndexes(api: CloudflareApi): Promise<{
    name: string;
    description?: string;
}[]>;
/**
 * Update a Vectorize index
 *
 * Note: The Cloudflare Vectorize API does not support updating indexes.
 * This function will always throw an error.
 */
export declare function updateIndex(_api: CloudflareApi, _indexName: string, _props: VectorizeIndexProps): Promise<CloudflareVectorizeResponse>;
export {};
//# sourceMappingURL=vectorize-index.d.ts.map