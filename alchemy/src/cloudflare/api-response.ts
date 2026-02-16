import { CloudflareApiError } from "./api-error.ts";

/**
 * Cloudflare API response format
 */
export interface CloudflareApiResponse<T> {
  /**
   * API response result
   */
  result: T;

  /**
   * Success status
   */
  success: boolean;

  /**
   * Error details if success is false
   */
  errors: CloudflareApiErrorPayload[];

  /**
   * Response messages
   */
  messages: string[];

  /**
   * Result information (typically for paginated results)
   */
  result_info?: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

/**
 * Cloudflare API list response format
 */
export interface CloudflareApiListResponse<T> extends CloudflareApiResponse<
  T[]
> {
  /**
   * List of results
   */
  result: T[];

  /**
   * Pagination information (always present for list responses)
   */
  result_info: {
    page: number;
    per_page: number;
    total_pages: number;
    count: number;
    total_count: number;
  };
}

/**
 * Cloudflare API error format
 */
export interface CloudflareApiErrorPayload {
  /**
   * Error code
   */
  code: number;

  /**
   * Error message
   */
  message: string;

  /**
   * Error documentation URL
   */
  documentation_url?: string;
}

/**
 * Helper to extract and handle Cloudflare API errors
 *
 * @param response Fetch response object
 * @returns Formatted error message
 */
export async function extractCloudflareError(
  response: Response,
): Promise<string> {
  try {
    const data = (await response.json()) as CloudflareApiResponse<any>;
    if (data.errors && data.errors.length > 0) {
      return data.errors.map((e) => `Error ${e.code}: ${e.message}`).join(", ");
    }
    return `HTTP ${response.status}: ${response.statusText}`;
  } catch {
    return `HTTP ${response.status}: ${response.statusText}`;
  }
}

export async function extractCloudflareResult<T>(
  label: string,
  promise: Promise<Response>,
): Promise<T> {
  const response = await promise.catch((cause) => {
    throw new Error(`Failed to ${label}: Failed to fetch`, { cause });
  });
  const json = (await response.json().catch(() => {
    throw new Error(
      `Failed to ${label} (${response.status}): The API returned an invalid response`,
    );
  })) as CloudflareApiResponse<T>;
  if (json.success) {
    return json.result;
  } else {
    const error = new CloudflareApiError(
      `Failed to ${label} (${response.status} ${response.statusText}):\n${json.errors.map((e) => `- [${e.code}] ${e.message}${e.documentation_url ? ` (${e.documentation_url})` : ""}`).join("\n")}`,
      response,
      json.errors,
    );
    Error.captureStackTrace(error, extractCloudflareResult);
    Object.assign(error, {
      status: response.status,
    });
    throw error;
  }
}
