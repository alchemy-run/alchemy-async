import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { loadConfig } from "@smithy/node-config-provider";
import { AwsClient } from "aws4fetch";
import { logger } from "../../util/logger.ts";
import { safeFetch } from "../../util/safe-fetch.ts";
import { awsEndpoint } from "../utils.ts";
import {
  AlreadyExistsError,
  CloudControlError,
  ConcurrentOperationError,
  NetworkError,
  NotFoundError,
  RequestError,
  ResourceNotFoundException,
  ThrottlingException,
  UpdateFailedError,
  ValidationException,
} from "./error.ts";

/**
 * Status of a Cloud Control API operation
 */
export type OperationStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILED"
  | "CANCEL_IN_PROGRESS"
  | "CANCEL_COMPLETE";

/**
 * Progress event from a Cloud Control API operation
 */
export interface ProgressEvent {
  /**
   * Error code if the operation failed
   */
  ErrorCode?: string;

  /**
   * Time when the event occurred
   */
  EventTime?: number;

  /**
   * Token for hooks associated with the request
   */
  HooksRequestToken?: string;

  /**
   * Resource identifier
   */
  Identifier: string;

  /**
   * Operation being performed (CREATE, READ, UPDATE, DELETE)
   */
  Operation?: string;

  /**
   * Current status of the operation
   */
  OperationStatus: OperationStatus;

  /**
   * Token that identifies the request
   */
  RequestToken: string;

  /**
   * JSON string representation of the resource model
   */
  ResourceModel?: string;

  /**
   * Number of seconds to wait before retrying
   */
  RetryAfter?: number;

  /**
   * Status message providing details about the operation
   */
  StatusMessage: string;

  /**
   * Type name of the resource
   */
  TypeName?: string;
}

/**
 * Options for Cloud Control API requests
 */
export interface CloudControlOptions {
  /**
   * AWS region to use (defaults to us-east-1)
   */
  region?: string;

  /**
   * AWS access key ID (overrides environment variable)
   */
  accessKeyId?: string;

  /**
   * AWS secret access key (overrides environment variable)
   */
  secretAccessKey?: string;

  /**
   * AWS session token for temporary credentials
   */
  sessionToken?: string;

  /**
   * Initial delay in milliseconds between polling attempts
   */
  initialPollingDelay?: number;

  /**
   * Maximum delay in milliseconds between polling attempts
   */
  maxPollingDelay?: number;

  /**
   * Maximum number of retries for retryable errors
   */
  maxRetries?: number;
}

const getRegion = loadConfig({
  environmentVariableSelector: (env) =>
    env.AWS_REGION || env.AWS_DEFAULT_REGION,
  configFileSelector: (profile) => profile.region,
  default: undefined,
});

/**
 * Create a Cloud Control API client
 */
export async function createCloudControlClient(
  options: CloudControlOptions = {},
) {
  const credentials = await fromNodeProviderChain()();

  const region =
    options.region ?? // 1. favor explicit region passed in
    (await getRegion()) ?? // 2-4. resolve from AWS profile, loadConfig, and environment
    process.env.AWS_REGION ??
    process.env.AWS_DEFAULT_REGION;

  if (!region) {
    throw new Error(
      "No region found. Please set AWS_REGION or AWS_DEFAULT_REGION in the environment or in your AWS profile.",
    );
  }

  const client = new AwsClient({
    ...credentials,
    service: "cloudcontrolapi",
    region,
  });

  return new CloudControlClient(client, {
    ...options,
    region,
  });
}

export class CloudControlClient {
  private region: string;
  private initialPollingDelay: number;
  private maxPollingDelay: number;
  private maxRetries: number;

  constructor(
    private readonly client: AwsClient,
    options: CloudControlOptions,
  ) {
    this.region = options.region || "us-east-1";
    this.initialPollingDelay = options.initialPollingDelay || 1000;
    this.maxPollingDelay = options.maxPollingDelay || 10000;
    this.maxRetries = options.maxRetries || 3;
  }

  /**
   * Create a new resource
   */
  public async createResource(
    typeName: string,
    desiredState: Record<string, any>,
  ): Promise<ProgressEvent> {
    return this.sync("CreateResource", {
      TypeName: typeName,
      DesiredState: JSON.stringify(desiredState),
    });
  }

  /**
   * Get a resource's current state
   */
  public async getResource(
    typeName: string,
    identifier: string,
  ): Promise<Record<string, any> | undefined> {
    try {
      const resource = await this.fetch<{
        Identifier: string;
        TypeName: string;
        ResourceDescription: {
          Properties: string;
        };
      }>("GetResource", {
        TypeName: typeName,
        Identifier: identifier,
      });
      return JSON.parse(resource.ResourceDescription.Properties);
    } catch (error: any) {
      if (error instanceof ResourceNotFoundException) {
        return undefined;
      }
      throw error;
    }
  }

  /**
   * Update a resource
   */
  public async updateResource(
    typeName: string,
    identifier: string,
    patchDocument: Record<string, any>,
  ): Promise<ProgressEvent> {
    return this.sync("UpdateResource", {
      TypeName: typeName,
      Identifier: identifier,
      PatchDocument: JSON.stringify(patchDocument),
    });
  }

  /**
   * Delete a resource
   */
  public async deleteResource(
    typeName: string,
    identifier: string,
  ): Promise<ProgressEvent> {
    return this.sync("DeleteResource", {
      TypeName: typeName,
      Identifier: identifier,
    });
  }

  /**
   * List resources of a given type
   */
  public listResources(typeName: string, nextToken?: string) {
    return this.fetch<{
      ResourceDescriptions: Array<{
        Identifier: string;
        Properties: Record<string, any>;
      }>;
      NextToken?: string;
    }>("ListResources", {
      TypeName: typeName,
      NextToken: nextToken,
    });
  }

  /**
   * Poll an operation until it completes
   */
  public async poll(
    requestToken: string,
    action?: "CreateResource" | "UpdateResource" | "DeleteResource",
  ): Promise<ProgressEvent> {
    let delay = this.initialPollingDelay;
    let logged = false;

    while (true) {
      try {
        const response = await this.fetch<{
          ProgressEvent: ProgressEvent;
        }>("GetResourceRequestStatus", {
          RequestToken: requestToken,
        });

        if (response.ProgressEvent.OperationStatus === "SUCCESS") {
          return response.ProgressEvent;
        }

        if (response.ProgressEvent.OperationStatus === "FAILED") {
          const errorCode = response.ProgressEvent.ErrorCode;
          const progressEvent = response.ProgressEvent;
          if (errorCode === "AlreadyExists") {
            throw new AlreadyExistsError(progressEvent);
          } else if (errorCode === "NotFound") {
            throw new NotFoundError(progressEvent);
          }
          throw new UpdateFailedError(progressEvent);
        }

        // Use the suggested retry delay if provided
        const waitTime = response.ProgressEvent.RetryAfter
          ? Math.max(100, response.ProgressEvent.RetryAfter * 1000 - Date.now())
          : delay;

        if (!logged) {
          logged = true;
          logger.log(
            `Polling for ${response.ProgressEvent.Identifier} (${response.ProgressEvent.TypeName}) to stabilize`,
          );
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
        delay = Math.min(delay * 2, this.maxPollingDelay);
      } catch (error: any) {
        if (error instanceof NotFoundError && action === "DeleteResource") {
          return error.progressEvent;
        } else if (error instanceof CloudControlError) {
          throw error;
        } else if (error instanceof ValidationException) {
          throw error;
        }

        // For retryable errors, continue polling
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(delay * 2, this.maxPollingDelay)),
        );
        delay = Math.min(delay * 2, this.maxPollingDelay);
      }
    }
  }

  public async sync(
    action: "CreateResource" | "UpdateResource" | "DeleteResource",
    props?: any,
  ): Promise<ProgressEvent> {
    const { ProgressEvent } = await this.fetch<{
      ProgressEvent: ProgressEvent;
    }>(action, props);

    return this.poll(ProgressEvent.RequestToken, action);
  }

  public async fetch<T>(
    action: string,
    params?: any,
    options?: {
      maxRetries?: number;
    },
  ): Promise<T> {
    let attempt = 0;
    const maxRetries = options?.maxRetries || this.maxRetries;

    while (true) {
      try {
        const args = [
          `${awsEndpoint("cloudcontrolapi", this.region)}/?Action=${action}&Version=2021-09-30`,
          {
            method: "POST",
            headers: {
              "content-type": "application/x-amz-json-1.0",
              "x-amz-target": `CloudApiService.${action}`,
            },
            body: JSON.stringify(params),
          },
        ] as const;
        const signedRequest = await this.client.sign(...args);
        const response = await safeFetch(signedRequest);

        if (!response.ok) {
          const data: any = await response.json();
          if (
            data.__type ===
            "com.amazon.cloudapiservice#ResourceNotFoundException"
          ) {
            throw new ResourceNotFoundException(response);
          }
          if (
            data.__type ===
            "com.amazon.cloudapiservice#ConcurrentOperationException"
          ) {
            // Extract request token from message
            const message = data.Message || "";
            const requestTokenMatch = message.match(
              /RequestToken\s+([a-fA-F0-9-]+)/,
            );
            if (!requestTokenMatch) {
              throw new RequestError(response, {
                ...data,
                message: `ConcurrentOperationException without request token: ${message}`,
              });
            }
            throw new ConcurrentOperationError(message, requestTokenMatch[1]);
          }
          if (
            data.__type === "com.amazon.coral.availability#ThrottlingException"
          ) {
            throw new ThrottlingException(response, data);
          }
          if (data.__type === "com.amazon.coral.validate#ValidationException") {
            throw new ValidationException(response, data);
          }
          throw new RequestError(response, data);
        }

        return (await response.json()) as T;
      } catch (error: any) {
        // Handle other CloudControl errors (don't retry, except ThrottlingException)
        if (
          error instanceof CloudControlError &&
          !(error instanceof ThrottlingException)
        ) {
          throw error;
        }

        // Handle retryable errors (throttling and network errors)
        if (attempt < maxRetries) {
          // Use exponential backoff with jitter, capped at 3 seconds
          const baseDelay = Math.min(2 ** attempt * 1000, 3000);
          const jitter = Math.random() * 0.1 * baseDelay;
          const retryDelay = baseDelay + jitter;

          const errorType =
            error instanceof ThrottlingException
              ? "Throttling"
              : "Network error";
          logger.log(
            `${errorType} detected, retrying in ${Math.round(retryDelay)}ms (attempt ${attempt + 1}/${maxRetries + 1})`,
          );
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
          attempt++;
          continue;
        }

        // Max retries exceeded
        if (error instanceof ThrottlingException) {
          logger.error(
            `Max retries (${maxRetries}) exceeded for throttling exception`,
          );
          throw error;
        }

        throw new NetworkError(
          error.message || "Network error during Cloud Control API request",
        );
      }
    }
  }
}
