import { fromNodeProviderChain } from "@aws-sdk/credential-providers";
import { AwsClient } from "aws4fetch";
import { alchemy } from "../../alchemy.ts";
import { Secret } from "../../secret.ts";
import { logger } from "../../util/logger.ts";
import { flattenParams } from "../../util/params.ts";
import type { AwsClientProps } from "../client-props.ts";
import { resolveAwsCredentials } from "../credentials.ts";
import { awsEndpoint, getRegion } from "../utils.ts";

/**
 * Shared EC2 utilities for all EC2 resources
 */

/**
 * Create an AWS EC2 client with credential resolution from props
 *
 * This function handles the complete credential resolution process internally,
 * merging global, scope, and resource-level credentials according to the
 * established precedence hierarchy.
 *
 * @param props - AWS client properties that may include credential overrides
 * @returns Promise<AwsClient> - Configured AWS client for EC2 operations
 */
export async function createEC2Client(
  props?: AwsClientProps,
): Promise<AwsClient> {
  // Resolve credentials from all sources (global, scope, resource)
  const credentials = await resolveAwsCredentials(props);
  let awsCredentials: AwsClientProps;
  let region: string;

  if (credentials && (credentials.accessKeyId || credentials.secretAccessKey)) {
    // Use provided credentials directly (unwrap secrets for AWS SDK)
    awsCredentials = {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken,
    };
  } else if (credentials?.profile) {
    // Use profile-based credentials if profile is specified
    try {
      const profileCredentials = await fromNodeProviderChain({
        profile: credentials.profile,
      })();
      awsCredentials = {
        accessKeyId: alchemy.secret(profileCredentials.accessKeyId),
        secretAccessKey: alchemy.secret(profileCredentials.secretAccessKey),
        sessionToken: alchemy.secret(profileCredentials.sessionToken),
      };
    } catch (error) {
      logger.log(
        `Error loading credentials from profile ${credentials.profile}:`,
        error,
      );
      // Fall back to default credentials
      awsCredentials = await loadAwsPropsFromCredentialChain();
    }
  } else {
    // Fall back to AWS SDK credential chain
    awsCredentials = await loadAwsPropsFromCredentialChain();
  }

  // Use region from resolved credentials or fall back to getRegion()
  if (credentials?.region) {
    region = credentials.region;
  } else {
    region = await getRegion();
  }

  return new AwsClient({
    ...awsCredentials,
    accessKeyId: Secret.unwrap(awsCredentials.accessKeyId)!,
    secretAccessKey: Secret.unwrap(awsCredentials.secretAccessKey)!,
    sessionToken: Secret.unwrap(awsCredentials.sessionToken) || undefined,
    service: "ec2",
    region,
  });
}

async function loadAwsPropsFromCredentialChain(): Promise<AwsClientProps> {
  const defaultCredentialsRaw = await fromNodeProviderChain()();
  return {
    ...defaultCredentialsRaw,
    accessKeyId: alchemy.secret(defaultCredentialsRaw.accessKeyId),
    secretAccessKey: alchemy.secret(defaultCredentialsRaw.secretAccessKey),
    sessionToken: alchemy.secret(defaultCredentialsRaw.sessionToken),
  };
}

/**
 * Make an EC2 API call with custom response parser
 */
export async function callEC2Api<T>(
  client: AwsClient,
  action: string,
  responseParser: (xmlText: string) => T,
  params: Record<string, any> = {},
): Promise<T> {
  // Try the API call, and retry once with fresh credentials on auth failure
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      // Use the client's region instead of the global region.
      // Honour AWS_ENDPOINT_URL / AWS_ENDPOINT_URL_EC2 for emulators
      // (LocalStack, moto, etc.) — matches AWS SDK v3 behaviour.
      const url = `${awsEndpoint("ec2", client.region ?? "us-east-1")}/`;

      const body = new URLSearchParams({
        Action: action,
        Version: "2016-11-15",
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
          logger.log(
            `🔄 Auth failure detected, refreshing credentials and retrying ${action}...`,
          );
          // Create a fresh client with new credentials
          client = await createEC2Client();
          continue; // Retry with fresh client
        }

        const error = new Error(
          `EC2 API error: ${response.status} ${response.statusText}\n${errorText}`,
        );

        // Set the error code for the ignore function
        if (errorCode) {
          (error as any).code = errorCode;
        }

        throw error;
      }

      const xmlText = await response.text();
      const parsed = responseParser(xmlText);
      return parsed;
    } catch (error) {
      // If it's not an auth failure or we've already retried, throw the error
      if (attempt === 2 || !(error as any)?.message?.includes("AuthFailure")) {
        throw error;
      }
      // Otherwise, continue to retry
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error("Unexpected error in API call retry logic");
}

// Re-export getRegion for convenience
export { getRegion };
