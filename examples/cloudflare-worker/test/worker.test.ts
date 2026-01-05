import { describe, expect, inject, it } from "vitest";

describe("worker", () => {
  it("should return the correct response", async () => {
    const workerUrl = inject("workerUrl");
    const response = await fetch(workerUrl);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Ok");
  });
});
