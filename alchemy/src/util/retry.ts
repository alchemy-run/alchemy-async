/**
 * Utility function for exponential backoff retry
 * Retries an operation with exponential backoff when a retryable error occurs
 *
 * @param operation The async operation to execute and potentially retry
 * @param isRetryable Function to determine if an error should trigger a retry
 * @param maxAttempts Maximum number of attempts before giving up
 * @param initialDelayMs Initial delay in milliseconds before first retry
 * @returns Result of the operation
 * @throws The last error encountered if all retries fail
 */
export async function withExponentialBackoff<T>(
  operation: () => Promise<T>,
  isRetryable: (error: any) => any,
  maxAttempts = 5,
  initialDelayMs = 100,
  maxDelayMs = 10000,
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;
      if (attempt >= maxAttempts || !isRetryable(error)) {
        throw error;
      }

      // Exponential backoff with jitter
      const jitter = Math.random() * 0.1 * delay;
      await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      delay *= 2; // Double the delay for next attempt
      delay = Math.min(delay, maxDelayMs); // Cap at 10 seconds
    }
  }
}
