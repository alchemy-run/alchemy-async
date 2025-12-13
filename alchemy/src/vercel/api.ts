import { alchemy } from "../alchemy.ts";
import type { Secret } from "../secret.ts";
import { safeFetch } from "../util/safe-fetch.ts";

/**
 * Options for Vercel API requests
 */
export interface VercelApiOptions {
  /**
   * Base URL for API
   */
  baseUrl: string;

  /**
   * API access token to use (overrides environment variable)
   */
  accessToken?: Secret;
}

/**
 * Creates a VercelApi instance with automatic token validation
 *
 * @param options API options
 * @returns Promise resolving to a VercelApi instance
 */
export async function createVercelApi(
  options: VercelApiOptions,
): Promise<VercelApi> {
  const { accessToken = alchemy.secret.env.VERCEL_ACCESS_TOKEN, baseUrl } =
    options;

  return new VercelApi({
    baseUrl,
    accessToken,
  });
}

/**
 * Vercel API client using raw fetch
 */
export class VercelApi {
  /** Base URL for API */
  readonly baseUrl: string;

  /** API access token */
  readonly accessToken: Secret;

  /**
   * Create a new API client
   * Use createVercelApi factory function instead of direct constructor
   * for automatic token validation.
   *
   * @param options API options
   */
  constructor(options: VercelApiOptions & { accessToken: Secret }) {
    this.baseUrl = options.baseUrl;
    this.accessToken = options.accessToken;
  }

  /**
   * Make a request to the API
   *
   * @param path API path (without base URL)
   * @param init Fetch init options
   * @returns Raw Response object from fetch
   */
  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    // Set up authentication headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.accessToken.unencrypted}`,
    };

    // Add headers from init if provided
    if (init.headers) {
      const initHeaders = init.headers as Record<string, string>;
      Object.keys(initHeaders).forEach((key) => {
        headers[key] = initHeaders[key];
      });
    }

    // For FormData, remove Content-Type
    if (init.body instanceof FormData) {
      delete headers["Content-Type"];
    }

    const response = await safeFetch(`${this.baseUrl}${path}`, {
      ...init,
      headers,
    });

    if (!response.ok) {
      let error = new Error(`API error: ${response.statusText}`, {
        cause: response,
      });

      try {
        error = Object.assign(
          new Error(response.statusText, { cause: response }),
          ((await response.json()) as { error: Error })?.error,
        );
      } finally {
        // oxlint-disable-next-line no-unsafe-finally
        throw error;
      }
    }

    return response;
  }

  /**
   * Helper for GET requests
   */
  async get(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "GET" });
  }

  /**
   * Helper for POST requests
   */
  async post(
    path: string,
    body: any,
    init: RequestInit = {},
  ): Promise<Response> {
    const requestBody = body instanceof FormData ? body : JSON.stringify(body);
    return this.fetch(path, { ...init, method: "POST", body: requestBody });
  }

  /**
   * Helper for PUT requests
   */
  async put(
    path: string,
    body: any,
    init: RequestInit = {},
  ): Promise<Response> {
    const requestBody = body instanceof FormData ? body : JSON.stringify(body);
    return this.fetch(path, { ...init, method: "PUT", body: requestBody });
  }

  /**
   * Helper for PATCH requests
   */
  async patch(
    path: string,
    body: any,
    init: RequestInit = {},
  ): Promise<Response> {
    return this.fetch(path, {
      ...init,
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  /**
   * Helper for DELETE requests
   */
  async delete(path: string, init: RequestInit = {}): Promise<Response> {
    return this.fetch(path, { ...init, method: "DELETE" });
  }
}
