import type { Architecture, Runtime } from "@aws-sdk/client-lambda";
import type { Context } from "../context.ts";
import type { Bundle } from "../esbuild/bundle.ts";
/**
 * Properties for creating or updating a Lambda function
 */
export interface FunctionProps {
    /**
     * Name of the Lambda function
     *
     * @default ${app}-${stage}-${id}
     */
    functionName?: string;
    /**
     * Bundle for the function
     */
    bundle: Bundle;
    /**
     * ARN of the IAM role that Lambda assumes when executing the function
     */
    roleArn: string;
    /**
     * Function handler in the format 'file.function'
     * For Node.js this is typically 'index.handler' or similar
     */
    handler: string;
    /**
     * Lambda runtime environment for the function
     * @default nodejs20.x if not specified
     */
    runtime?: Runtime;
    /**
     * CPU architecture for the function
     * @default x86_64 if not specified
     */
    architecture?: Architecture;
    /**
     * Description of the function's purpose
     */
    description?: string;
    /**
     * Maximum execution time in seconds
     * @default 3 seconds if not specified
     */
    timeout?: number;
    /**
     * Amount of memory available to the function in MB
     * @default 128 MB if not specified
     */
    memorySize?: number;
    /**
     * Environment variables available to the function code
     */
    environment?: Record<string, string>;
    /**
     * Resource tags for the function
     */
    tags?: Record<string, string>;
    /**
     * Function URL configuration for direct HTTP(S) invocation
     */
    url?: {
        /**
         * Configure type of response for the function URL
         */
        invokeMode?: "BUFFERED" | "RESPONSE_STREAM";
        /**
         * Authentication type for the function URL
         */
        authType?: "AWS_IAM" | "NONE";
        /**
         * CORS configuration for the function URL
         */
        cors?: {
            /**
             * Whether to allow credentials in CORS requests
             */
            allowCredentials?: boolean;
            /**
             * Allowed headers in CORS requests
             */
            allowHeaders?: string[];
            /**
             * Allowed HTTP methods in CORS requests
             */
            allowMethods?: string[];
            /**
             * Allowed origins in CORS requests
             */
            allowOrigins?: string[];
            /**
             * Headers exposed to the browser
             */
            exposeHeaders?: string[];
            /**
             * CORS preflight cache time in seconds
             */
            maxAge?: number;
        };
    };
    /**
     * Lambda layers for the function. Use the layer ARN
     */
    layers?: string[];
}
/**
 * Output returned after Lambda function creation/update
 */
export interface Function extends FunctionProps {
    /**
     * ARN of the Lambda function
     */
    arn: string;
    /**
     * Name of the Function
     */
    functionName: string;
    /**
     * Timestamp of the last function modification
     */
    lastModified: string;
    /**
     * Function version
     */
    version: string;
    /**
     * ARN with version suffix
     */
    qualifiedArn: string;
    /**
     * ARN for invoking the function through API Gateway
     */
    invokeArn: string;
    /**
     * SHA256 hash of the function code
     */
    sourceCodeHash: string;
    /**
     * Size of the function code in bytes
     */
    sourceCodeSize: number;
    /**
     * Size of ephemeral storage (/tmp) in MB
     */
    ephemeralStorageSize?: number;
    /**
     * List of supported CPU architectures
     */
    architectures: string[];
    /**
     * ARN of the master function (Lambda@Edge only)
     */
    masterArn?: string;
    /**
     * Unique identifier for the current function code/config
     */
    revisionId: string;
    /**
     * Current state of the function
     */
    state?: string;
    /**
     * Reason for the current state
     */
    stateReason?: string;
    /**
     * Code for the current state reason
     */
    stateReasonCode?: string;
    /**
     * Status of the last update operation
     */
    lastUpdateStatus?: string;
    /**
     * Reason for the last update status
     */
    lastUpdateStatusReason?: string;
    /**
     * Code for the last update status reason
     */
    lastUpdateStatusReasonCode?: string;
    /**
     * Function package type (Zip or Image)
     */
    packageType: string;
    /**
     * ARN of the signing profile version
     */
    signingProfileVersionArn?: string;
    /**
     * ARN of the signing job
     */
    signingJobArn?: string;
    /**
     * Function URL if configured
     */
    functionUrl?: string;
}
/**
 * AWS Lambda Function Resource
 *
 * Creates and manages AWS Lambda functions with support for Node.js runtimes, custom handlers,
 * environment variables, and function URLs. Handles deployment packaging, IAM role
 * stabilization, and function updates.
 *
 * @example
 * // Create a basic Lambda function with minimal configuration
 * const basicFunction = await Function("api-handler", {
 *   functionName: "api-handler",
 *   zipPath: "./dist/api.zip",
 *   roleArn: role.arn,
 *   runtime: Runtime.nodejs20x,
 *   handler: "index.handler",
 *   tags: {
 *     Environment: "production"
 *   }
 * });
 *
 * @example
 * // Create a function with environment variables and custom memory/timeout
 * const configuredFunction = await Function("worker", {
 *   functionName: "worker",
 *   zipPath: "./dist/worker.zip",
 *   roleArn: role.arn,
 *   runtime: Runtime.nodejs20x,
 *   handler: "worker.process",
 *   memorySize: 512,
 *   timeout: 30,
 *   environment: {
 *     QUEUE_URL: queue.url,
 *     LOG_LEVEL: "info"
 *   }
 * });
 *
 * @example
 * // Create a function with a public URL endpoint, CORS and optional response streaming
 * const apiFunction = await Function("public-api", {
 *   functionName: "public-api",
 *   zipPath: "./dist/api.zip",
 *   roleArn: role.arn,
 *   handler: "api.handler",
 *   url: {
 *     authType: "NONE",
 *     invokeMode: "RESPONSE_STREAM",
 *     cors: {
 *       allowOrigins: ["*"],
 *       allowMethods: ["GET", "POST"],
 *       allowHeaders: ["content-type"],
 *       maxAge: 86400
 *     }
 *   }
 * });
 */
export declare const Function: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Function>, id: string, props: FunctionProps) => Promise<{
    arn: string;
    functionName: string;
    lastModified: string;
    version: string;
    qualifiedArn: string;
    invokeArn: string;
    sourceCodeHash: string;
    sourceCodeSize: number;
    ephemeralStorageSize: number | undefined;
    architectures: Architecture[];
    masterArn: string | undefined;
    revisionId: string;
    state: import("@aws-sdk/client-lambda").State | undefined;
    stateReason: string | undefined;
    stateReasonCode: import("@aws-sdk/client-lambda").StateReasonCode | undefined;
    lastUpdateStatus: import("@aws-sdk/client-lambda").LastUpdateStatus | undefined;
    lastUpdateStatusReason: string | undefined;
    lastUpdateStatusReasonCode: import("@aws-sdk/client-lambda").LastUpdateStatusReasonCode | undefined;
    packageType: import("@aws-sdk/client-lambda").PackageType;
    signingProfileVersionArn: string | undefined;
    signingJobArn: string | undefined;
    functionUrl: string | undefined;
    /**
     * Bundle for the function
     */
    bundle: Bundle;
    /**
     * ARN of the IAM role that Lambda assumes when executing the function
     */
    roleArn: string;
    /**
     * Function handler in the format 'file.function'
     * For Node.js this is typically 'index.handler' or similar
     */
    handler: string;
    /**
     * Lambda runtime environment for the function
     * @default nodejs20.x if not specified
     */
    runtime?: Runtime;
    /**
     * CPU architecture for the function
     * @default x86_64 if not specified
     */
    architecture?: Architecture;
    /**
     * Description of the function's purpose
     */
    description?: string;
    /**
     * Maximum execution time in seconds
     * @default 3 seconds if not specified
     */
    timeout?: number;
    /**
     * Amount of memory available to the function in MB
     * @default 128 MB if not specified
     */
    memorySize?: number;
    /**
     * Environment variables available to the function code
     */
    environment?: Record<string, string>;
    /**
     * Resource tags for the function
     */
    tags?: Record<string, string>;
    /**
     * Function URL configuration for direct HTTP(S) invocation
     */
    url?: {
        /**
         * Configure type of response for the function URL
         */
        invokeMode?: "BUFFERED" | "RESPONSE_STREAM";
        /**
         * Authentication type for the function URL
         */
        authType?: "AWS_IAM" | "NONE";
        /**
         * CORS configuration for the function URL
         */
        cors?: {
            /**
             * Whether to allow credentials in CORS requests
             */
            allowCredentials?: boolean;
            /**
             * Allowed headers in CORS requests
             */
            allowHeaders?: string[];
            /**
             * Allowed HTTP methods in CORS requests
             */
            allowMethods?: string[];
            /**
             * Allowed origins in CORS requests
             */
            allowOrigins?: string[];
            /**
             * Headers exposed to the browser
             */
            exposeHeaders?: string[];
            /**
             * CORS preflight cache time in seconds
             */
            maxAge?: number;
        };
    };
    /**
     * Lambda layers for the function. Use the layer ARN
     */
    layers?: string[];
}>);
//# sourceMappingURL=function.d.ts.map