import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudflareApi } from "../../src/cloudflare/api.ts";

const api = new CloudflareApi({
  accountId: "test-account",
  credentials: { type: "api-token", apiToken: "test-token" },
});

describe.sequential("CloudflareApi rate limiting", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["a null body", "null"],
    ["a non-JSON body", "<html>Too Many Requests</html>"],
  ])("retries a 429 with %s", async (_, body) => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(body, { status: 429, statusText: "Too Many Requests" }),
      )
      .mockResolvedValueOnce(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetch);

    const response = await api.get("/test");

    expect(response.status).toBe(200);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
