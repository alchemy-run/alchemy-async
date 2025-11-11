import type { Agent } from "undici";
import { isTransientNetworkError } from "./is-transient-error.ts";
import { logger } from "./logger.ts";

export async function safeFetch(
  url: string | URL | Request,
  options: RequestInit = {},
  retries = 10,
) {
  let latestErr: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(url, {
        ...options,
        // Type assertion to work around Cloudflare Workers type definitions
        dispatcher: await dispatcher(),
      } as RequestInit);
    } catch (err: any) {
      console.log("err", err);
      latestErr = err;
      const shouldRetry =
        isTransientNetworkError(err) || isTransientNetworkError(err.cause);

      if (!shouldRetry || attempt === retries) {
        throw err;
      }

      logger.warn(`Retry ${attempt}/${retries} for ${url}: ${err.code}`);
      await new Promise((r) => setTimeout(r, 250 * attempt)); // exponential backoff
    }
  }
  throw latestErr;
}

let agent:
  | {
      value: Agent | undefined;
    }
  | undefined;

async function dispatcher() {
  if (agent) {
    return agent.value;
  }
  try {
    // undici not available in all runtimes
    const { Agent } = await import("undici");

    if (!agent) {
      // Configure agent with connection limits to avoid socket errors
      agent = {
        value: new Agent({
          pipelining: 0, // Disable pipelining to avoid connection issues
          // connections: 5, // Limit concurrent connections per host
        }),
      };
    }
  } catch {
    agent = { value: undefined };
  }
  return agent.value;
}

/**
 * Fetch with exponential backoff retry logic for 404 responses, expecting 200 OK.
 * This is a convenience wrapper around fetchAndExpectStatus with expectedStatus=200.
 *
 * @param input URL or Request object
 * @param init RequestInit options
 * @param maxAttempts Maximum number of retry attempts (default: 10)
 * @param maxWaitTime Maximum total wait time in milliseconds (default: 30000)
 * @returns The successful Response
 */
export async function fetchAndExpectOK(
  input: string | URL | Request,
  init?: RequestInit,
  maxAttempts = 10,
  maxWaitTime = 30000,
): Promise<Response> {
  return fetchAndExpectStatus(input, init, 200, maxAttempts, maxWaitTime);
}

/**
 * Fetch and expect a specific status code with retry logic.
 * Cloudflare's control plane is eventually consistent, so resources may
 * return 404 immediately after creation before becoming available.
 *
 * @param input URL or Request object
 * @param init RequestInit options
 * @param expectedStatus Expected HTTP status code (default: 200)
 * @param maxAttempts Maximum number of retry attempts (default: 10)
 * @param maxWaitTime Maximum total wait time in milliseconds (default: 30000)
 * @returns The successful Response
 */
export async function fetchAndExpectStatus(
  input: string | URL | Request,
  init?: RequestInit,
  expectedStatus = 200,
  maxAttempts = 20,
  maxWaitTime = 30000,
): Promise<Response> {
  let attempt = 0;
  let lastError: Error | undefined;

  while (attempt < maxAttempts) {
    try {
      const response = await safeFetch(input, init);

      // If we get the expected status, return it
      if (response.status === expectedStatus) {
        return response;
      }

      // If we get a 500, 404 when expecting something else, retry with backoff
      if (
        response.status >= 500 ||
        (response.status === 404 && expectedStatus !== 404)
      ) {
        attempt++;

        if (attempt >= maxAttempts) {
          throw new Error(
            `Expected status ${expectedStatus} but got 404 after ${maxAttempts} attempts. This may indicate eventual consistency issues.`,
          );
        }

        const backoffTime = Math.min(attempt * 1500, maxWaitTime / maxAttempts);

        console.log(
          `Expected status ${expectedStatus} but got 404, retrying in ${backoffTime}ms (attempt ${attempt}/${maxAttempts})...`,
        );

        await new Promise((resolve) => setTimeout(resolve, backoffTime));
        continue;
      }

      // For other status codes, throw immediately
      throw new Error(
        `Expected status ${expectedStatus} but got ${response.status}: ${response.statusText}`,
      );
    } catch (error) {
      if (error instanceof Error) {
        lastError = error;

        // If it's not an HTTP error, retry with backoff
        if (
          !error.message.startsWith("Expected status") &&
          !error.message.startsWith("HTTP ")
        ) {
          attempt++;

          if (attempt >= maxAttempts) {
            break;
          }

          const backoffTime = Math.min(
            attempt * 1500,
            maxWaitTime / maxAttempts,
          );

          console.log(
            `Network error, retrying in ${backoffTime}ms (attempt ${attempt}/${maxAttempts}): ${error.message}`,
          );

          await new Promise((resolve) => setTimeout(resolve, backoffTime));
          continue;
        }
      }

      // For status code mismatches, throw immediately
      throw error;
    }
  }

  throw lastError || new Error(`Failed after ${maxAttempts} attempts`);
}
