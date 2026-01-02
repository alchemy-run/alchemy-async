import type { Secret } from "../secret.ts";

/**
 * Options for Railway API requests
 */
export interface RailwayApiOptions {
  /**
   * Base URL for Railway GraphQL API
   * @default https://backboard.railway.com/graphql/v2
   */
  baseUrl?: string;

  /**
   * API token to use (overrides RAILWAY_API_TOKEN env var)
   */
  apiToken?: Secret;
}

/**
 * Error from Railway API
 */
export class RailwayError extends Error {
  code: string;
  status: number;

  constructor(props: { message: string; code?: string; status: number }) {
    super(`Railway API error (${props.status}): ${props.message}`);
    this.code = props.code ?? "UNKNOWN";
    this.status = props.status;
  }
}

/**
 * GraphQL error shape from Railway API
 */
interface GraphQLError {
  message: string;
  extensions?: {
    code?: string;
  };
}

/**
 * GraphQL response shape
 */
interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * Railway API client for GraphQL operations
 */
export interface RailwayClient {
  /**
   * Execute a GraphQL query or mutation
   */
  request<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
}

/**
 * Create a Railway API client with environment variable fallback
 * @param options API options
 * @returns Railway API client instance
 */
export function createRailwayApi(
  options: Partial<RailwayApiOptions> = {},
): RailwayClient {
  const apiToken =
    options.apiToken?.unencrypted ?? process.env.RAILWAY_API_TOKEN;
  if (!apiToken) {
    throw new Error(
      "Railway API token is required. Set RAILWAY_API_TOKEN environment variable or provide apiToken option.",
    );
  }

  const baseUrl = options.baseUrl ?? "https://backboard.railway.com/graphql/v2";

  return {
    async request<T>(
      query: string,
      variables?: Record<string, unknown>,
    ): Promise<T> {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          query,
          variables,
        }),
      });

      if (!response.ok) {
        throw new RailwayError({
          message: `HTTP error: ${response.statusText}`,
          status: response.status,
        });
      }

      const json = (await response.json()) as GraphQLResponse<T>;

      if (json.errors && json.errors.length > 0) {
        const firstError = json.errors[0];
        throw new RailwayError({
          message: firstError.message,
          code: firstError.extensions?.code,
          status: 400,
        });
      }

      if (!json.data) {
        throw new RailwayError({
          message: "No data returned from Railway API",
          status: 500,
        });
      }

      return json.data;
    },
  };
}

/**
 * Helper to extract a specific field from a GraphQL response
 */
export function extractResult<T>(
  data: Record<string, unknown>,
  field: string,
): T {
  const result = data[field];
  if (result === undefined) {
    throw new RailwayError({
      message: `Expected field '${field}' not found in response`,
      status: 500,
    });
  }
  return result as T;
}
