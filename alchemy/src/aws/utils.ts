import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { loadConfig } from "@smithy/node-config-provider";
import type { Provider } from "@smithy/types";
import { AwsClient } from "aws4fetch";
import { flattenParams } from "../util/params.ts";

/**
 * Get AWS region from configuration
 */
export const getRegion: Provider<string> = loadConfig({
  environmentVariableSelector: (env: any) =>
    env.AWS_REGION || env.AWS_DEFAULT_REGION,
  configFileSelector: (profile: any) => profile.region,
  default: "us-east-1",
});

/**
 * Resolve the endpoint URL for an AWS service, honouring the standard
 * `AWS_ENDPOINT_URL` and `AWS_ENDPOINT_URL_<SERVICE>` environment variables.
 *
 * This mirrors the resolution behaviour of AWS SDK v3 so users can point
 * `aws4fetch`-based resources at LocalStack, moto, or any other AWS emulator
 * without learning a new variable.
 *
 * Resolution order (first match wins):
 * 1. `AWS_ENDPOINT_URL_<SERVICE>` (e.g. `AWS_ENDPOINT_URL_EC2`) — uppercased,
 *    `-` is replaced with `_` to match the SDK convention.
 * 2. `AWS_ENDPOINT_URL` — global override applied to every service.
 * 3. `https://<service>.<region>.amazonaws.com` — the default AWS endpoint.
 *
 * Any trailing slash on an override is stripped so callers can append paths
 * deterministically.
 *
 * @param service - AWS service id (e.g. `"ec2"`, `"s3"`, `"cloudcontrolapi"`).
 * @param region  - AWS region (e.g. `"us-east-1"`).
 * @returns Endpoint URL without a trailing slash.
 *
 * @example
 * // With AWS_ENDPOINT_URL=http://localhost:4566
 * awsEndpoint("ec2", "us-east-1");
 * // → "http://localhost:4566"
 *
 * @example
 * // With AWS_ENDPOINT_URL_EC2=http://localhost:5000 (takes precedence)
 * awsEndpoint("ec2", "us-east-1");
 * // → "http://localhost:5000"
 *
 * @example
 * // No overrides — defaults to the real AWS endpoint
 * awsEndpoint("ec2", "us-east-1");
 * // → "https://ec2.us-east-1.amazonaws.com"
 */
export function awsEndpoint(service: string, region: string): string {
  const serviceVar = `AWS_ENDPOINT_URL_${service.toUpperCase().replace(/-/g, "_")}`;
  const override = process.env[serviceVar] ?? process.env.AWS_ENDPOINT_URL;
  if (override) {
    return override.replace(/\/+$/, "");
  }
  return `https://${service}.${region}.amazonaws.com`;
}

/**
 * Whether the user has configured an endpoint override for a specific service
 * (or globally via `AWS_ENDPOINT_URL`). Useful for emulator-specific tweaks
 * such as forcing path-style addressing on S3.
 *
 * @internal
 */
export function hasAwsEndpointOverride(service: string): boolean {
  const serviceVar = `AWS_ENDPOINT_URL_${service.toUpperCase().replace(/-/g, "_")}`;
  return Boolean(process.env[serviceVar] ?? process.env.AWS_ENDPOINT_URL);
}

/**
 * AWS Service Configuration
 */
export interface AwsServiceConfig {
  service: string;
  version: string;
  /**
   * Optional endpoint resolver. When omitted, the endpoint is resolved via
   * {@link awsEndpoint}, which honours `AWS_ENDPOINT_URL` /
   * `AWS_ENDPOINT_URL_<SERVICE>` for emulator support.
   */
  endpoint?: (region: string) => string;
}

/**
 * AWS API Caller interface
 */
export interface AwsApiCaller<T = any> {
  createClient(): Promise<AwsClient>;
  callApi<R = T>(
    client: AwsClient,
    action: string,
    params?: Record<string, any>,
  ): Promise<R>;
}

/**
 * Create an AWS API caller for a specific service
 */
export function getAwsApiCaller<T = any>(
  config: AwsServiceConfig,
  responseParser: (xmlText: string) => T,
): AwsApiCaller<T> {
  return {
    async createClient(): Promise<AwsClient> {
      const credentials = await fromNodeProviderChain()();
      const region = await getRegion();

      return new AwsClient({
        ...credentials,
        service: config.service,
        region,
      });
    },

    async callApi<R = T>(
      client: AwsClient,
      action: string,
      params: Record<string, any> = {},
    ): Promise<R> {
      // Try the API call, and retry once with fresh credentials on auth failure
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const region = await getRegion();
          const url = config.endpoint
            ? config.endpoint(region)
            : `${awsEndpoint(config.service, region)}/`;

          const body = new URLSearchParams({
            Action: action,
            Version: config.version,
            ...flattenParams(params),
          });

          const signedRequest = await client.sign(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: body.toString(),
          });

          const response = await fetch(signedRequest);

          if (!response.ok) {
            const errorText = await response.text();

            // Parse AWS error code from XML response
            const errorCodeMatch = errorText.match(/<Code>([^<]+)<\/Code>/);
            const errorCode = errorCodeMatch ? errorCodeMatch[1] : null;

            // If this is an auth failure and we haven't retried yet, create a fresh client and retry
            if (errorCode === "AuthFailure" && attempt === 1) {
              console.log(
                `🔄 Auth failure detected, refreshing credentials and retrying ${action}...`,
              );
              // Create a fresh client with new credentials
              const freshCredentials = await fromNodeProviderChain()();
              const region = await getRegion();
              client = new AwsClient({
                ...freshCredentials,
                service: config.service,
                region,
              });
              continue; // Retry with fresh client
            }

            const error = new Error(
              `${config.service.toUpperCase()} API error: ${response.status} ${response.statusText}\n${errorText}`,
            );

            // Set the error code for the ignore function
            if (errorCode) {
              (error as any).code = errorCode;
            }

            throw error;
          }

          const xmlText = await response.text();
          const parsed = responseParser(xmlText);
          return parsed as unknown as R;
        } catch (error) {
          // If it's not an auth failure or we've already retried, throw the error
          if (
            attempt === 2 ||
            !(error as any)?.message?.includes("AuthFailure")
          ) {
            throw error;
          }
          // Otherwise, continue to retry
        }
      }

      // This should never be reached, but TypeScript needs it
      throw new Error("Unexpected error in API call retry logic");
    },
  };
}
