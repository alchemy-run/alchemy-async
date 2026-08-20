import { Secret } from "../secret.ts";
import { safeFetch } from "../util/safe-fetch.ts";

/**
 * Options for Railway API requests
 */
export interface RailwayApiOptions {
  /**
   * Railway API token for authentication.
   * Falls back to `RAILWAY_API_TOKEN` environment variable.
   */
  apiToken?: Secret;
}

/**
 * Error from the Railway GraphQL API
 */
export class RailwayError extends Error {
  readonly errors: Array<{
    message: string;
    extensions?: Record<string, any>;
  }>;

  constructor(
    message: string,
    errors: Array<{ message: string; extensions?: Record<string, any> }>,
  ) {
    super(message);
    this.name = "RailwayError";
    this.errors = errors;
  }
}

/**
 * Minimal GraphQL client for the Railway API
 */
export class RailwayApi {
  /** Railway API token */
  readonly token: string;

  /** GraphQL endpoint */
  readonly endpoint = "https://backboard.railway.com/graphql/v2";

  /**
   * Create a new Railway API client
   *
   * @param options API options
   */
  constructor(options: RailwayApiOptions = {}) {
    this.token =
      (options.apiToken
        ? (Secret.unwrap(options.apiToken) as string)
        : undefined) ??
      process.env.RAILWAY_API_TOKEN ??
      "";

    if (!this.token) {
      throw new Error(
        "Railway API token is required. Set RAILWAY_API_TOKEN environment variable or pass apiToken option.",
      );
    }
  }

  /**
   * Execute a GraphQL query or mutation
   *
   * @param query GraphQL query string
   * @param variables Query variables
   * @returns The data from the response
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
  ): Promise<T> {
    const response = await safeFetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    const json = (await response.json()) as {
      data?: T;
      errors?: Array<{ message: string; extensions?: Record<string, any> }>;
    };

    if (json.errors?.length) {
      throw new RailwayError(
        `Railway API error: ${json.errors.map((e) => e.message).join(", ")}`,
        json.errors,
      );
    }

    if (!json.data) {
      throw new RailwayError("Railway API returned no data", []);
    }

    return json.data;
  }
}
