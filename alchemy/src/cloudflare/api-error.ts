/**
 * Custom error class for Cloudflare API errors
 * Includes HTTP status information from the Response
 */
export class CloudflareApiError extends Error {
  /**
   * HTTP status code
   */
  status: number;

  /**
   * HTTP status text
   */
  statusText: string;

  /**
   * Raw error data from the API
   */
  errorData?: any;

  /**
   * Create a new CloudflareApiError
   */
  constructor(message: string, response: Response, errorData?: any) {
    super(message);
    this.name = "CloudflareApiError";
    this.status = response.status;
    this.statusText = response.statusText;
    this.errorData = errorData;

    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, CloudflareApiError.prototype);
  }
}

/**
 * Helper function to handle API errors
 *
 * @param response The fetch Response object
 * @param action The action being performed (e.g., "creating", "deleting")
 * @param resourceType The type of resource being acted upon (e.g., "R2 bucket", "Worker")
 * @param resourceName The name/identifier of the specific resource
 * @returns Never returns - always throws an error
 */
export async function handleApiError(
  response: Response,
  action: string,
  resourceType: string,
  resourceName?: string,
): Promise<never> {
  // Read response body once and parse it
  const text = await response.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    json = { errors: [{ message: text }] };
  }

  // Handle API errors
  const errors: { message: string; code: number }[] = json?.errors || [
    { message: response.statusText },
  ];
  const errorMessage = `Error ${response.status} ${action} ${resourceType}${
    resourceName ? ` '${resourceName}'` : ""
  }: ${errors.map((error) => `${error.code}: ${error.message}`).join(", ")}`;
  throw new CloudflareApiError(errorMessage, response, errors);
}
