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
 * Resolve the endpoint URL for an aws4fetch service request, honouring the
 * same `AWS_ENDPOINT_URL_<SERVICE>` / `AWS_ENDPOINT_URL` env vars as the AWS
 * SDK / CLI so aws4fetch-based resources can be pointed at LocalStack, moto,
 * or any other emulator.
 */
export function awsEndpoint(service: string, region: string): string {
  return (
    process.env[
      `AWS_ENDPOINT_URL_${service.toUpperCase().replace(/-/g, "_")}`
    ] ??
    process.env.AWS_ENDPOINT_URL ??
    `https://${service}.${region}.amazonaws.com`
  ).replace(/\/+$/, "");
}

/**
 * AWS Service Configuration
 */
export interface AwsServiceConfig {
  service: string;
  version: string;
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
