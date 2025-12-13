import type {
  Architecture,
  LambdaClient,
  Runtime,
} from "@aws-sdk/client-lambda";
import type { Context } from "../context.ts";
import type { Bundle } from "../esbuild/bundle.ts";
import { Resource } from "../resource.ts";
import { ignore } from "../util/ignore.ts";
import { logger } from "../util/logger.ts";
import { importPeer } from "../util/peer.ts";
import { retry } from "./retry.ts";

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
export const Function = Resource(
  "lambda::Function",
  async function (this: Context<Function>, id: string, props: FunctionProps) {
    const {
      AddPermissionCommand,
      Architecture,
      CreateFunctionCommand,
      CreateFunctionUrlConfigCommand,
      DeleteFunctionCommand,
      DeleteFunctionUrlConfigCommand,
      GetFunctionCommand,
      GetFunctionConfigurationCommand,
      GetFunctionUrlConfigCommand,
      LambdaClient,
      ResourceNotFoundException,
      Runtime,
      UpdateFunctionCodeCommand,
      UpdateFunctionConfigurationCommand,
      UpdateFunctionUrlConfigCommand,
    } = await importPeer(import("@aws-sdk/client-lambda"), "lambda::Function");
    const client = new LambdaClient({});
    const region = await resolveRegion(client);

    const functionName =
      props.functionName ??
      this.output?.functionName ??
      this.scope.createPhysicalName(id);

    if (this.phase === "update" && this.output.functionName !== functionName) {
      this.replace();
    }

    if (this.phase === "delete") {
      // Delete function URL if it exists
      if (this.output?.url) {
        try {
          await retry(() =>
            client.send(
              new DeleteFunctionUrlConfigCommand({
                FunctionName: functionName,
              }),
            ),
          );
        } catch (error: any) {
          if (error.name !== "ResourceNotFoundException") {
            logger.warn("Failed to delete function URL:", error);
          }
        }
      }

      await ignore(ResourceNotFoundException.name, () =>
        retry(() =>
          client.send(
            new DeleteFunctionCommand({
              FunctionName: functionName,
            }),
          ),
        ),
      );

      return this.destroy();
    }

    const code = await zipCode(props);

    let functionUrl: string | undefined;
    try {
      // Check if function exists
      await retry(() =>
        client.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          }),
        ),
      );

      if (this.phase === "update") {
        // Wait for function to stabilize
        await waitForFunctionStabilization(client, functionName);

        // Update function code
        await retry(() =>
          client.send(
            new UpdateFunctionCodeCommand({
              FunctionName: functionName,
              ZipFile: code,
            }),
          ),
        );

        // Wait for code update to stabilize
        await waitForFunctionStabilization(client, functionName);

        // Update function configuration
        await retry(() =>
          client.send(
            new UpdateFunctionConfigurationCommand({
              FunctionName: functionName,
              Handler: props.handler,
              Runtime: props.runtime,
              Role: props.roleArn,
              Description: props.description,
              Timeout: props.timeout,
              MemorySize: props.memorySize,
              Environment: props.environment
                ? { Variables: props.environment }
                : undefined,
              Layers: props.layers,
            }),
          ),
        );

        // Wait for configuration update to stabilize
        await waitForFunctionStabilization(client, functionName);

        // Handle URL configuration
        if (props.url) {
          try {
            // Check if URL config exists already
            const urlConfig = await retry(() =>
              client.send(
                new GetFunctionUrlConfigCommand({
                  FunctionName: functionName,
                }),
              ),
            );

            // Update URL configuration if it exists
            if (urlConfig) {
              const updateResult = await retry(() =>
                client.send(
                  new UpdateFunctionUrlConfigCommand({
                    FunctionName: functionName,
                    AuthType: props.url!.authType || "NONE",
                    InvokeMode: props.url!.invokeMode || "BUFFERED",
                    Cors: props.url!.cors
                      ? {
                          AllowCredentials: props.url!.cors.allowCredentials,
                          AllowHeaders: props.url!.cors.allowHeaders,
                          AllowMethods: props.url!.cors.allowMethods,
                          AllowOrigins: props.url!.cors.allowOrigins,
                          ExposeHeaders: props.url!.cors.exposeHeaders,
                          MaxAge: props.url!.cors.maxAge,
                        }
                      : undefined,
                  }),
                ),
              );
              functionUrl = updateResult.FunctionUrl;

              // Add public access permission for function URL
              if (props.url!.authType === "NONE") {
                try {
                  await retry(() =>
                    client.send(
                      new AddPermissionCommand({
                        FunctionName: functionName,
                        StatementId: "FunctionURLAllowPublicAccess",
                        Action: "lambda:InvokeFunctionUrl",
                        Principal: "*",
                        FunctionUrlAuthType: "NONE",
                      }),
                    ),
                  );
                } catch (permError: any) {
                  if (!permError.message?.includes("already exists")) {
                    logger.warn("Error adding URL permission:", permError);
                  }
                }
              }
            } else {
              // Create URL configuration if it doesn't exist
              const createResult = await retry(() =>
                client.send(
                  new CreateFunctionUrlConfigCommand({
                    FunctionName: functionName,
                    AuthType: props.url!.authType || "NONE",
                    InvokeMode: props.url!.invokeMode || "BUFFERED",
                    Cors: props.url!.cors
                      ? {
                          AllowCredentials: props.url!.cors.allowCredentials,
                          AllowHeaders: props.url!.cors.allowHeaders,
                          AllowMethods: props.url!.cors.allowMethods,
                          AllowOrigins: props.url!.cors.allowOrigins,
                          ExposeHeaders: props.url!.cors.exposeHeaders,
                          MaxAge: props.url!.cors.maxAge,
                        }
                      : undefined,
                  }),
                ),
              );
              functionUrl = createResult.FunctionUrl;

              // Add public access permission for function URL
              if (props.url!.authType === "NONE") {
                try {
                  await retry(() =>
                    client.send(
                      new AddPermissionCommand({
                        FunctionName: functionName,
                        StatementId: "FunctionURLAllowPublicAccess",
                        Action: "lambda:InvokeFunctionUrl",
                        Principal: "*",
                        FunctionUrlAuthType: "NONE",
                      }),
                    ),
                  );
                } catch (permError: any) {
                  if (!permError.message?.includes("already exists")) {
                    logger.warn("Error adding URL permission:", permError);
                  }
                }
              }
            }
          } catch (error: any) {
            if (error.name === "ResourceNotFoundException") {
              // Create URL configuration if it doesn't exist
              const createResult = await retry(() =>
                client.send(
                  new CreateFunctionUrlConfigCommand({
                    FunctionName: functionName,
                    AuthType: props.url!.authType || "NONE",
                    InvokeMode: props.url!.invokeMode || "BUFFERED",
                    Cors: props.url!.cors
                      ? {
                          AllowCredentials: props.url!.cors.allowCredentials,
                          AllowHeaders: props.url!.cors.allowHeaders,
                          AllowMethods: props.url!.cors.allowMethods,
                          AllowOrigins: props.url!.cors.allowOrigins,
                          ExposeHeaders: props.url!.cors.exposeHeaders,
                          MaxAge: props.url!.cors.maxAge,
                        }
                      : undefined,
                  }),
                ),
              );
              functionUrl = createResult.FunctionUrl;

              // Add public access permission for function URL
              if (props.url!.authType === "NONE") {
                try {
                  await retry(() =>
                    client.send(
                      new AddPermissionCommand({
                        FunctionName: functionName,
                        StatementId: "FunctionURLAllowPublicAccess",
                        Action: "lambda:InvokeFunctionUrl",
                        Principal: "*",
                        FunctionUrlAuthType: "NONE",
                      }),
                    ),
                  );
                } catch (permError: any) {
                  if (!permError.message?.includes("already exists")) {
                    logger.warn("Error adding URL permission:", permError);
                  }
                }
              }
            } else {
              throw error;
            }
          }
        } else if (this.output?.url) {
          // Remove URL config if it was previously set but not in current props
          try {
            await retry(() =>
              client.send(
                new DeleteFunctionUrlConfigCommand({
                  FunctionName: functionName,
                }),
              ),
            );
            functionUrl = undefined;
          } catch (error: any) {
            if (error.name !== "ResourceNotFoundException") {
              logger.warn("Failed to delete function URL:", error);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "ResourceNotFoundException") {
        // Create function if it doesn't exist
        const startTime = Date.now();
        let delay = 100; // Start with 100ms delay

        while (true) {
          try {
            await retry(() =>
              client.send(
                new CreateFunctionCommand({
                  FunctionName: functionName,
                  Code: { ZipFile: code },
                  Handler: props.handler || "index.handler",
                  Runtime: props.runtime || Runtime.nodejs20x,
                  Role: props.roleArn,
                  Description: props.description,
                  Timeout: props.timeout || 3,
                  MemorySize: props.memorySize || 128,
                  Environment: props.environment
                    ? { Variables: props.environment }
                    : undefined,
                  Architectures: props.architecture
                    ? [props.architecture]
                    : [Architecture.x86_64],
                  Tags: props.tags,
                  Layers: props.layers,
                }),
              ),
            );
            break; // Success - exit retry loop
          } catch (createError: any) {
            if (
              createError.name !== "InvalidParameterValueException" ||
              !createError.message?.includes("cannot be assumed by Lambda")
            ) {
              throw createError; // Different error - rethrow
            }

            if (Date.now() - startTime > 10000) {
              throw new Error(
                "Timeout waiting for IAM role to be assumable by Lambda after 10s",
              );
            }

            await new Promise((resolve) => setTimeout(resolve, delay));
            delay = Math.min(delay * 2, 1000); // Exponential backoff capped at 1s
          }
        }

        // Wait for function to be active
        let isCreating = true;
        while (isCreating) {
          const config = await retry(() =>
            client.send(
              new GetFunctionConfigurationCommand({
                FunctionName: functionName,
              }),
            ),
          );
          isCreating = config.State === "Pending";
          if (isCreating) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // Additional stabilization check - ensure role can be used
        // by waiting a bit more after function becomes Active
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Verify function is fully stable and role is usable
        await waitForFunctionStabilization(client, functionName);

        // Create URL configuration if needed
        if (props.url) {
          try {
            const createResult = await retry(() =>
              client.send(
                new CreateFunctionUrlConfigCommand({
                  FunctionName: functionName,
                  AuthType: props.url!.authType || "NONE",
                  InvokeMode: props.url!.invokeMode || "BUFFERED",
                  Cors: props.url!.cors
                    ? {
                        AllowCredentials: props.url!.cors.allowCredentials,
                        AllowHeaders: props.url!.cors.allowHeaders,
                        AllowMethods: props.url!.cors.allowMethods,
                        AllowOrigins: props.url!.cors.allowOrigins,
                        ExposeHeaders: props.url!.cors.exposeHeaders,
                        MaxAge: props.url!.cors.maxAge,
                      }
                    : undefined,
                }),
              ),
            );
            functionUrl = createResult.FunctionUrl;

            // Add public access permission for function URL
            if (props.url!.authType === "NONE") {
              try {
                await retry(() =>
                  client.send(
                    new AddPermissionCommand({
                      FunctionName: functionName,
                      StatementId: "FunctionURLAllowPublicAccess",
                      Action: "lambda:InvokeFunctionUrl",
                      Principal: "*",
                      FunctionUrlAuthType: "NONE",
                    }),
                  ),
                );
              } catch (permError: any) {
                if (!permError.message?.includes("already exists")) {
                  logger.warn("Error adding URL permission:", permError);
                }
              }
            }
          } catch (error) {
            logger.warn("Failed to create function URL:", error);
          }
        }
      } else {
        throw error;
      }
    }

    // Get complete function details
    const [_func, config] = await Promise.all([
      retry(() =>
        client.send(
          new GetFunctionCommand({
            FunctionName: functionName,
          }),
        ),
      ),
      retry(() =>
        client.send(
          new GetFunctionConfigurationCommand({
            FunctionName: functionName,
          }),
        ),
      ),
    ]);

    // Try to get function URL if it wasn't already retrieved and URL is configured
    if (!functionUrl && (props.url || this.output?.url)) {
      try {
        const urlConfig = await retry(() =>
          client.send(
            new GetFunctionUrlConfigCommand({
              FunctionName: functionName,
            }),
          ),
        );
        functionUrl = urlConfig.FunctionUrl;
      } catch (error: any) {
        if (error.name !== "ResourceNotFoundException") {
          logger.warn("Failed to get function URL:", error);
        }
      }
    }

    return {
      ...props,
      arn: config.FunctionArn!,
      functionName,
      lastModified: config.LastModified!,
      version: config.Version!,
      qualifiedArn: `${config.FunctionArn}:${config.Version}`,
      invokeArn: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${config.FunctionArn}/invocations`,
      sourceCodeHash: config.CodeSha256!,
      sourceCodeSize: config.CodeSize!,
      ephemeralStorageSize: config.EphemeralStorage?.Size,
      architectures: config.Architectures || [],
      masterArn: config.MasterArn,
      revisionId: config.RevisionId!,
      state: config.State,
      stateReason: config.StateReason,
      stateReasonCode: config.StateReasonCode,
      lastUpdateStatus: config.LastUpdateStatus,
      lastUpdateStatusReason: config.LastUpdateStatusReason,
      lastUpdateStatusReasonCode: config.LastUpdateStatusReasonCode,
      packageType: config.PackageType!,
      signingProfileVersionArn: config.SigningProfileVersionArn,
      signingJobArn: config.SigningJobArn,
      functionUrl: functionUrl,
    };
  },
);

// Helper to wait for function to stabilize
async function waitForFunctionStabilization(
  client: LambdaClient,
  functionName: string,
) {
  const { GetFunctionConfigurationCommand } =
    await import("@aws-sdk/client-lambda");
  while (true) {
    const config = await retry(() =>
      client.send(
        new GetFunctionConfigurationCommand({
          FunctionName: functionName,
        }),
      ),
    );

    // Check if function is in a stable state
    if (config.State === "Active" && config.LastUpdateStatus === "Successful") {
      break;
    }

    // If there's a failure, throw an error
    if (config.State === "Failed" || config.LastUpdateStatus === "Failed") {
      throw new Error(
        `Function failed to stabilize: ${config.StateReason || config.LastUpdateStatusReason}`,
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

const handlerRegex = /^(.*)\.([A-Za-z0-9_]+)$/;

function parseFile(handler: string): string {
  const match = handler.match(handlerRegex);
  if (!match) {
    throw new Error(`Invalid handler: ${handler}`);
  }
  return match[1];
}

// Helper to zip the code
async function zipCode(props: FunctionProps): Promise<Buffer> {
  const fileContent = props.bundle.content;
  const fileName =
    parseFile(props.handler) +
    (props.bundle.format === "cjs" ? ".cjs" : ".mjs");

  // Create a zip buffer in memory
  const zip = new (await import("jszip")).default();
  zip.file(fileName, fileContent);

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    platform: "UNIX",
  });
}

async function resolveRegion(client: LambdaClient): Promise<string> {
  const region = client.config.region;
  if (typeof region === "string") return region;
  if (typeof region === "function") return region();
  throw new Error("Could not resolve AWS region");
}
