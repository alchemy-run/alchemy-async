import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
/**
 * Settings for compression of pipeline output
 */
export interface CompressionSettings {
    /**
     * Type of compression to use for pipeline output
     * @default "gzip"
     */
    type: "gzip" | "none";
}
/**
 * Settings for batching behavior of pipeline output
 */
export interface BatchSettings {
    /**
     * Maximum size of batch in megabytes before delivery (1-100 MB)
     * @default 100
     */
    maxMb?: number;
    /**
     * Maximum number of rows in a batch before delivery (1-10,000,000 rows)
     * @default 10000000
     */
    maxRows?: number;
    /**
     * Maximum duration of a batch in seconds before delivery (1-300 seconds)
     * @default 300
     */
    maxSeconds?: number;
}
/**
 * Configuration for a pipeline HTTP source
 */
export interface HttpSource {
    /**
     * Format of the source data
     * @default "json"
     */
    format: "json";
    /**
     * Type of source
     */
    type: "http";
    /**
     * Whether authentication is required
     * @default true
     */
    authentication?: boolean;
    /**
     * CORS configuration for HTTP endpoint source
     */
    cors?: {
        /**
         * Allowed origins for CORS requests
         * @default ["*"]
         */
        origins: string[];
    };
}
/**
 * Configuration for a pipeline binding source
 */
export interface BindingSource {
    /**
     * Format of the source data
     * @default "json"
     */
    format: "json";
    /**
     * Type of source
     */
    type: "binding";
}
/**
 * Configuration for a pipeline source
 */
export type PipelineSource = HttpSource | BindingSource;
/**
 * Configuration for an R2 destination
 */
export interface R2DestinationConfig {
    /**
     * Type of destination (R2)
     */
    type: "r2";
    /**
     * Format of the output data
     * @default "json"
     */
    format: "json" | "ndjson";
    /**
     * Path configuration for the R2 destination
     */
    path: {
        /**
         * R2 bucket name
         */
        bucket: string;
        /**
         * Optional prefix for files in the bucket
         */
        prefix?: string;
        /**
         * Optional filename pattern
         * @default "${slug}${extension}"
         */
        filename?: string;
        /**
         * Optional filepath pattern
         * @default "${date}/${hour}"
         */
        filepath?: string;
    };
    /**
     * Compression settings
     */
    compression?: CompressionSettings;
    /**
     * Batch settings
     */
    batch?: BatchSettings;
    /**
     * Credentials for the R2 bucket
     * Required for R2 destinations
     */
    credentials: {
        /**
         * Access key ID for the R2 bucket
         */
        accessKeyId: Secret;
        /**
         * Secret access key for the R2 bucket
         */
        secretAccessKey: Secret;
        /**
         * Endpoint for the R2 bucket
         */
        endpoint?: string;
    };
}
/**
 * Allowed destination types
 */
export type PipelineDestination = R2DestinationConfig;
/**
 * Properties for creating or updating a Pipeline
 */
export interface PipelineProps extends CloudflareApiOptions {
    /**
     * Name of the pipeline
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Source configuration for the pipeline
     */
    source: PipelineSource[];
    /**
     * Destination configuration for the pipeline
     */
    destination: PipelineDestination;
    /**
     * Compression settings for the pipeline
     * @default { type: "gzip" }
     */
    compression?: CompressionSettings;
    /**
     * Whether to delete the pipeline.
     * If set to false, the pipeline will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
    /**
     * Whether to adopt an existing pipeline instead of creating a new one.
     * If set to true, the resource will attempt to adopt an existing pipeline with the same name
     *
     * @default false
     */
    adopt?: boolean;
    dev?: {
        remote?: boolean;
    };
}
/**
 * Base type for pipeline records
 */
export interface PipelineRecord {
    [key: string]: any;
}
export declare function isPipeline(resource: any): resource is Pipeline;
/**
 * Output returned after Pipeline creation/update
 */
export type Pipeline<_T extends PipelineRecord = PipelineRecord> = PipelineProps & {
    /**
     * Type identifier for the Pipeline resource
     */
    type: "pipeline";
    /**
     * The unique ID of the pipeline
     */
    id: string;
    /**
     * The name of the pipeline
     */
    name: string;
    /**
     * HTTP endpoint URL for the pipeline
     */
    endpoint: string;
    /**
     * Version of the pipeline
     */
    version: number;
};
/**
 * Creates and manages Cloudflare Pipelines.
 *
 * Pipelines provide a managed data pipeline service that lets you collect, transform,
 * and route data to various destinations like R2 buckets.
 *
 * @example
 * // Create a basic pipeline with an R2 bucket destination
 * const bucket = await R2Bucket("logs-bucket", {
 *   name: "logs-bucket"
 * });
 *
 * const accessKey = alchemy.secret(process.env.R2_ACCESS_KEY_ID!);
 * const secretKey = alchemy.secret(process.env.R2_SECRET_ACCESS_KEY!);
 *
 * const pipeline = await Pipeline("logs-pipeline", {
 *   name: "logs-pipeline",
 *   destination: {
 *     type: "r2",
 *     format: "json",
 *     path: {
 *       bucket: bucket.name,
 *       prefix: "app-logs",
 *     },
 *     credentials: {
 *       accessKeyId: accessKey,
 *       secretAccessKey: secretKey
 *     }
 *   },
 *   batch: {
 *     maxMb: 50,
 *     maxSeconds: 60
 *   }
 * });
 *
 * @example
 * // Create a pipeline with custom source configuration
 * const customPipeline = await Pipeline("custom-pipeline", {
 *   name: "custom-pipeline",
 *   source: [{
 *     type: "http",
 *     format: "json",
 *     authentication: true,
 *     cors: {
 *       origins: ["https://example.com"]
 *     }
 *   }],
 *   destination: {
 *     type: "r2",
 *     format: "json",
 *     path: {
 *       bucket: "my-bucket",
 *       prefix: "data"
 *     },
 *     credentials: {
 *       accessKeyId: alchemy.secret(process.env.R2_ACCESS_KEY_ID!),
 *       secretAccessKey: alchemy.secret(process.env.R2_SECRET_ACCESS_KEY!)
 *     },
 *     compression: {
 *       type: "gzip"
 *     }
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/pipelines/
 */
export declare const Pipeline: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | (<T extends PipelineRecord = PipelineRecord>(this: Context<Pipeline<T>>, id: string, props: PipelineProps) => Promise<Pipeline<T>>);
interface CloudflarePipelineResponse {
    result: {
        id: string;
        name: string;
        endpoint: string;
        version: number;
        source: Array<{
            type: "http" | "binding";
            format: string;
            authentication?: boolean;
            cors?: {
                origins: string[];
            };
        }>;
        destination: {
            type: string;
            format: string;
            path?: {
                bucket: string;
                prefix?: string;
                filename?: string;
                filepath?: string;
            };
            compression?: {
                type: string;
            };
            batch: {
                max_bytes?: number;
                max_rows?: number;
                max_duration_s?: number;
            };
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
 * Get a pipeline
 */
export declare function getPipeline(api: CloudflareApi, pipelineName: string): Promise<CloudflarePipelineResponse>;
/**
 * Delete a pipeline
 */
export declare function deletePipeline(api: CloudflareApi, pipelineName: string): Promise<void>;
/**
 * Create a new pipeline
 */
export declare function createPipeline(api: CloudflareApi, pipelineName: string, props: PipelineProps, attempt?: number): Promise<CloudflarePipelineResponse>;
/**
 * Update a pipeline
 */
export declare function updatePipeline(api: CloudflareApi, pipelineName: string, props: PipelineProps): Promise<CloudflarePipelineResponse>;
/**
 * Rename a pipeline
 *
 * @param api - Cloudflare API instance
 * @param currentName - Current name of the pipeline
 * @param newName - New name for the pipeline
 * @returns Updated pipeline response with the new name
 *
 * @see https://developers.cloudflare.com/api/resources/pipelines/methods/update/
 */
export declare function renamePipeline(api: CloudflareApi, currentName: string, newName: string): Promise<CloudflarePipelineResponse>;
/**
 * List all pipelines in an account
 */
export declare function listPipelines(api: CloudflareApi): Promise<{
    name: string;
    id: string;
}[]>;
export {};
//# sourceMappingURL=pipeline.d.ts.map