import { withExponentialBackoff } from "../util/retry.ts";
import { RailwayError } from "./api.ts";

const NOT_FOUND_PATTERNS = ["not found"];
const OPERATION_IN_PROGRESS_PATTERNS = [
  "operation is already in progress",
  "already in progress",
];

export interface RailwayDeleteRetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
}

function getErrorMessages(error: unknown): string[] {
  if (error instanceof RailwayError) {
    return [error.message, ...error.errors.map((item) => item.message)];
  }
  if (error instanceof Error) {
    return [error.message];
  }
  return [String(error)];
}

export function hasRailwayErrorPattern(
  error: unknown,
  patterns: readonly string[],
): boolean {
  const messages = getErrorMessages(error).map((message) =>
    message.toLowerCase(),
  );
  return messages.some((message) =>
    patterns.some((pattern) => message.includes(pattern)),
  );
}

export function isRailwayNotFoundError(error: unknown): boolean {
  return hasRailwayErrorPattern(error, NOT_FOUND_PATTERNS);
}

export function isRailwayOperationInProgressError(error: unknown): boolean {
  return hasRailwayErrorPattern(error, OPERATION_IN_PROGRESS_PATTERNS);
}

export async function runRailwayDeleteMutation(
  operation: () => Promise<unknown>,
  options: RailwayDeleteRetryOptions = {},
): Promise<void> {
  const { maxAttempts = 8, initialDelayMs = 500, maxDelayMs = 5000 } = options;

  try {
    await withExponentialBackoff(
      operation,
      isRailwayOperationInProgressError,
      maxAttempts,
      initialDelayMs,
      maxDelayMs,
    );
  } catch (error) {
    if (isRailwayNotFoundError(error)) {
      return;
    }
    throw error;
  }
}
