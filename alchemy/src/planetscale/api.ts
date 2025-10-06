import type { Secret } from "../secret.ts";
import {
  createClient,
  createConfig,
  type ClientOptions,
} from "../util/api/client/index.ts";
import { PlanetScaleClient } from "./api/sdk.gen.ts";
import type { GeneralError } from "./api/types.gen.ts";

/**
 * Properties for configuring the PlanetScale API.
 */
export interface PlanetScaleProps {
  /**
   * The base URL of the PlanetScale API. Defaults to https://api.planetscale.com/v1.
   */
  baseUrl?: string;
  /**
   * The ID of the service token to use for authentication. Defaults to the value of the PLANETSCALE_SERVICE_TOKEN_ID environment variable.
   */
  serviceTokenId?: Secret;
  /**
   * The secret of the service token to use for authentication. Defaults to the value of the PLANETSCALE_SERVICE_TOKEN environment variable.
   */
  serviceToken?: Secret;
  /**
   * The API key to use for authentication. Defaults to the value of the PLANETSCALE_API_TOKEN environment variable.
   * @deprecated Use serviceTokenId and serviceToken instead.
   */
  apiKey?: Secret;
}

export class PlanetScaleError extends Error {
  status: number;
  method: string;
  url: string;
  code: string | undefined;

  constructor(props: {
    error: GeneralError;
    request: Request;
    response: Response;
  }) {
    super(
      `A request to the PlanetScale API failed (${props.response.status}: ${props.error.message}`,
    );
    this.status = props.response.status;
    this.method = props.request.method;
    this.url = props.request.url;
    this.code = props.error.code;
  }
}

export type { PlanetScaleClient };

export function createPlanetScaleClient(
  options: PlanetScaleProps = {},
): PlanetScaleClient {
  const token = extractToken(options);
  const client = createClient(
    createConfig<ClientOptions>({
      baseUrl: options.baseUrl ?? "https://api.planetscale.com/v1",
      headers: {
        Authorization: token, // PlanetScale does not use the Bearer prefix
      },
      throwOnError: true,
    }),
  );
  client.interceptors.error.use((error, response, request) => {
    return new PlanetScaleError({
      error: error as GeneralError,
      request,
      response,
    });
  });
  return new PlanetScaleClient({
    client,
  });
}

const extractToken = (props: PlanetScaleProps) => {
  if (props.apiKey) {
    return props.apiKey.unencrypted;
  } else if (props.serviceTokenId && props.serviceToken) {
    return `${props.serviceTokenId.unencrypted}:${props.serviceToken.unencrypted}`;
  } else if (process.env.PLANETSCALE_API_TOKEN) {
    return process.env.PLANETSCALE_API_TOKEN;
  } else if (
    process.env.PLANETSCALE_SERVICE_TOKEN_ID &&
    process.env.PLANETSCALE_SERVICE_TOKEN
  ) {
    return `${process.env.PLANETSCALE_SERVICE_TOKEN_ID}:${process.env.PLANETSCALE_SERVICE_TOKEN}`;
  } else {
    throw new Error(
      "No authentication token provided for PlanetScale. Please provide an API key, service token ID and secret, or set the PLANETSCALE_SERVICE_TOKEN_ID and PLANETSCALE_SERVICE_TOKEN environment variables.",
    );
  }
};
