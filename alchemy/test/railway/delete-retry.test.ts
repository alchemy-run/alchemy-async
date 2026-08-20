import { describe, expect, test, vi } from "vitest";
import { RailwayError } from "../../src/railway/api.ts";
import { runRailwayDeleteMutation } from "../../src/railway/delete-retry.ts";
import "../../src/test/vitest.ts";

describe("Railway delete retry", () => {
  test("retries when Railway reports operation already in progress", async () => {
    const operation = vi.fn(async () => {
      if (operation.mock.calls.length < 3) {
        throw new RailwayError(
          "Railway API error: Cannot delete service domain: an operation is already in progress",
          [
            {
              message:
                "Cannot delete service domain: an operation is already in progress",
            },
          ],
        );
      }
    });

    await runRailwayDeleteMutation(operation, {
      maxAttempts: 5,
      initialDelayMs: 1,
      maxDelayMs: 2,
    });

    expect(operation).toHaveBeenCalledTimes(3);
  });

  test("treats not found as already deleted", async () => {
    const operation = vi.fn(async () => {
      throw new RailwayError("Railway API error: not found", [
        { message: "not found" },
      ]);
    });

    await expect(
      runRailwayDeleteMutation(operation, {
        maxAttempts: 5,
        initialDelayMs: 1,
        maxDelayMs: 2,
      }),
    ).resolves.toBeUndefined();

    expect(operation).toHaveBeenCalledTimes(1);
  });

  test("throws non-retryable delete failures", async () => {
    const operation = vi.fn(async () => {
      throw new RailwayError("Railway API error: permission denied", [
        { message: "permission denied" },
      ]);
    });

    await expect(
      runRailwayDeleteMutation(operation, {
        maxAttempts: 5,
        initialDelayMs: 1,
        maxDelayMs: 2,
      }),
    ).rejects.toThrow("permission denied");

    expect(operation).toHaveBeenCalledTimes(1);
  });
});
