import { describe, expect, it, vi } from "vitest";
import type { CloudflareApi } from "../../src/cloudflare/api.ts";
import { findHyperdriveIdByName } from "../../src/cloudflare/hyperdrive-ref.ts";

function createMockApi(pages: Array<Array<{ id: string; name: string }>>) {
  const get = vi.fn(async (path: string) => {
    const url = new URL(`https://example.com${path}`);
    const page = Number(url.searchParams.get("page"));
    return new Response(
      JSON.stringify({
        success: true,
        result: pages[page - 1] ?? [],
        result_info: { page, total_pages: pages.length },
      }),
    );
  });
  const api = { accountId: "test-account", get } as unknown as CloudflareApi;
  return { api, get };
}

describe("findHyperdriveIdByName", () => {
  it("requests 100 configs per page and searches later pages", async () => {
    const { api, get } = createMockApi([
      [{ id: "1", name: "first" }],
      [{ id: "2", name: "target" }],
    ]);

    expect(await findHyperdriveIdByName(api, "target")).toBe("2");
    expect(get).toHaveBeenCalledTimes(2);
    const urls = get.mock.calls.map(
      ([path]) => new URL(`https://example.com${path}`).searchParams,
    );
    expect(urls.map((params) => params.get("page"))).toEqual(["1", "2"]);
    expect(urls.map((params) => params.get("per_page"))).toEqual([
      "100",
      "100",
    ]);
  });

  it("returns undefined when no page has the name", async () => {
    const { api, get } = createMockApi([[{ id: "1", name: "first" }], []]);

    expect(await findHyperdriveIdByName(api, "missing")).toBeUndefined();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
