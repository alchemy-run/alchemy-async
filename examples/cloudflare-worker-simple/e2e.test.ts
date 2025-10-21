import { hc } from "hono/client";
import assert from "node:assert";
import fs from "node:fs/promises";
import { after, before, describe, it } from "node:test";
import type app from "./src/worker1.ts";

describe("cloudflare-worker-simple", () => {
  const api = hc<typeof app>(process.env.WORKER_URL!);

  before(async () => {
    for (let i = 0; i < 10; i++) {
      const res = await api.index.$get();
      if (res.ok) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  });

  it("assets", async () => {
    const res = await api.assets[":path"].$get({
      param: {
        path: "index.html",
      },
    });
    assert.equal(res.status, 200);
    assert(res.headers.get("content-type")?.includes("text/html"));
    assert.equal(
      await res.text(),
      await fs.readFile("assets/index.html", "utf-8"),
    );
  });

  it("durable object", async () => {
    const res = await api.do[":name"].$get({
      param: {
        name: "test",
      },
    });
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { message: "hello from DO" });
  });

  describe("d1", () => {
    before(async () => {
      const res = await api.d1.$get().then((res) => res.json());
      for (const item of res) {
        const res = await api.d1[":id"].$delete({
          param: {
            id: item.id,
          },
        });
        assert.equal(res.status, 200);
        await res.body?.cancel();
      }
    });

    after(async () => {
      const res = await api.d1.$get();
      const json = await res.json();
      assert.equal(res.status, 200);
      assert.deepEqual(json, []);
    });

    it("create, get, delete", async () => {
      const create = await api.d1.$post({
        json: {
          name: "test",
          email: "test@example.com",
        },
      });
      const json = await create.json();
      assert.equal(create.status, 200);
      assert.equal(typeof json.id, "number");
      assert.equal(json.name, "test");
      assert.equal(json.email, "test@example.com");
      assert.equal(typeof json.created_at, "string");

      const get = await api.d1[":id"].$get({
        param: {
          id: json.id,
        },
      });
      assert.equal(get.status, 200);
      assert.deepEqual(await get.json(), json);

      const del = await api.d1[":id"].$delete({
        param: {
          id: json.id,
        },
      });
      assert.equal(del.status, 200);
      assert.deepEqual(await del.json(), { success: true });

      const ensure = await api.d1[":id"].$get({
        param: {
          id: json.id,
        },
      });
      assert.equal(ensure.status, 404);
      await ensure.body?.cancel();
    });
  });

  describe("kv", () => {
    it("inserts kv records", async () => {
      const list = await api.kv.$get();
      assert.equal(list.status, 200);
      assert.deepEqual(await list.json(), {
        keys: ["my-object-value", "my-string-value"], // these are inserted in alchemy.run.ts
      });

      const getObjectValue = await api.kv[":key"].$get({
        param: {
          key: "my-object-value",
        },
      });
      assert.equal(getObjectValue.status, 200);
      assert.deepEqual(await getObjectValue.json(), {
        type: "object",
        properties: { id: { type: "string" } },
      });

      const getStringValue = await api.kv[":key"].$get({
        param: {
          key: "my-string-value",
        },
      });
      assert.equal(getStringValue.status, 200);
      assert.deepEqual(await getStringValue.text(), "hello-world");
    });

    it("create, get, delete", async () => {
      const key = crypto.randomUUID();
      const value = crypto.randomUUID();

      const put = await api.kv[":key"].$put({
        param: {
          key,
        },
        json: {
          value,
        },
      });
      const json = await put.json();
      assert.equal(put.status, 200);
      assert.deepEqual(json, { success: true });

      const get = await api.kv[":key"].$get({
        param: {
          key,
        },
      });
      assert.equal(get.status, 200);
      assert.deepEqual(await get.json(), { value });

      const del = await api.kv[":key"].$delete({
        param: {
          key,
        },
      });
      assert.equal(del.status, 200);
      assert.deepEqual(await del.json(), { success: true });

      const ensure = await api.kv[":key"].$get({
        param: {
          key,
        },
      });
      assert.equal(ensure.status, 404);
      await ensure.body?.cancel();
    });
  });
});
