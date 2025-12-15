import { describe, expect, it, vi } from "vitest";
import type { CloudflareApi } from "../../src/cloudflare/api.ts";
import { findQueueByName, listQueues } from "../../src/cloudflare/queue.ts";

interface MockQueue {
  queue_name: string;
  queue_id: string;
}

interface MockPage {
  result: MockQueue[];
  result_info?: {
    total_pages?: number;
    per_page?: number;
  };
  status?: number;
}

function createQueue(queue_name: string, queue_id: string): MockQueue {
  return { queue_name, queue_id };
}

function createMockApi(pages: MockPage[]) {
  const get = vi.fn(async (path: string) => {
    const url = new URL(`https://example.com${path}`);
    const pageParam = Number(url.searchParams.get("page") ?? "1");
    const perPageParam = Number(url.searchParams.get("per_page") ?? "20");
    const page = pages[pageParam - 1] ?? { result: [] };

    const body = {
      success: true,
      result: page.result,
      result_info: {
        page: pageParam,
        per_page: perPageParam,
        total_pages: page.result_info?.total_pages ?? pages.length,
        ...page.result_info,
      },
    };

    return new Response(JSON.stringify(body), {
      status: page.status ?? 200,
    });
  });

  const api = { accountId: "test-account", get } as unknown as CloudflareApi;
  return { api, get };
}

describe("Cloudflare queue pagination", () => {
  it("searches additional pages when finding a queue by name", async () => {
    const { api, get } = createMockApi([
      { result: [createQueue("first-queue", "1")] },
      { result: [createQueue("second-queue", "2")] },
      { result: [createQueue("target-queue", "3")] },
    ]);

    const result = await findQueueByName(api, "target-queue");

    expect(result?.result?.queue_id).toBe("3");
    expect(get).toHaveBeenCalledTimes(3);

    const firstCallUrl = new URL(
      `https://example.com${get.mock.calls[0][0] as string}`,
    );
    expect(firstCallUrl.searchParams.get("page")).toBe("1");
    expect(firstCallUrl.searchParams.get("per_page")).toBe("100");

    const lastCallUrl = new URL(
      `https://example.com${get.mock.calls[get.mock.calls.length - 1][0] as string}`,
    );
    expect(lastCallUrl.searchParams.get("page")).toBe("3");
  });

  it("returns all queues across paginated responses", async () => {
    const { api, get } = createMockApi([
      {
        result: [createQueue("page-one", "1")],
        result_info: { total_pages: 2 },
      },
      { result: [createQueue("page-two", "2")] },
    ]);

    const queues = await listQueues(api);

    expect(queues).toEqual([
      { name: "page-one", id: "1" },
      { name: "page-two", id: "2" },
    ]);
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("stops pagination when a queue is not found", async () => {
    const { api, get } = createMockApi([
      {
        result: [createQueue("page-one", "1")],
        result_info: { total_pages: 2 },
      },
      { result: [] },
    ]);

    const result = await findQueueByName(api, "missing-queue");

    expect(result).toBeNull();
    expect(get).toHaveBeenCalledTimes(2);
  });
});
