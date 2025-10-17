import { DurableObject } from "cloudflare:workers";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { validator } from "hono/validator";
import type { worker1 } from "../alchemy.run.ts";

const app = new Hono<{ Bindings: typeof worker1.Env }>()
  .get("/", async (c) => {
    return c.text(
      [
        "Available routes:",
        "GET /assets/:path",
        "GET /do/:name",
        "GET /d1",
        "POST /d1",
        "GET /kv",
        "PUT /kv/:key",
        "DELETE /kv/:key",
        "GET /r2",
        "GET /r2/:key",
        "PUT /r2/:key",
        "DELETE /r2/:key",
      ].join("\n"),
    );
  })
  .get("/assets/:path", async (c) => {
    const url = new URL(c.req.url);
    const path = c.req.param("path");
    return await c.env.ASSETS.fetch(new URL(`/${path}`, url.origin));
  })
  .get("/do/:name", async (c) => {
    const name = c.req.param("name");
    const stub = c.env.DO.getByName(name);
    return await stub.fetch(c.req.raw);
  })
  .get("/d1", async (c) => {
    const users = await c.env.D1.prepare("SELECT * FROM users")
      .all<{ id: string; name: string; email: string; created_at: string }>()
      .then((r) => r.results);
    return c.json(users);
  })
  .post("/d1", async (c) => {
    const { name, email } = await c.req.json();
    const result = await c.env.D1.prepare(
      "INSERT INTO users (name, email) VALUES (?, ?) RETURNING id, name, email, created_at",
    )
      .bind(name, email)
      .run<{ id: string; name: string; email: string; created_at: string }>();
    return c.json(result.results[0]);
  })
  .get("/d1/:id", async (c) => {
    const id = c.req.param("id");
    const user = await c.env.D1.prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<{ id: string; name: string; email: string; created_at: string }>();
    if (!user) {
      throw new HTTPException(404, { message: "Not found" });
    }
    return c.json(user);
  })
  .delete("/d1/:id", async (c) => {
    const id = c.req.param("id");
    await c.env.D1.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    return c.json({ success: true });
  })
  .get("/kv", async (c) => {
    const kv = await c.env.KV.list();
    return c.json({ keys: kv.keys.map((k) => k.name) });
  })
  .get("/kv/:key", async (c) => {
    const key = c.req.param("key");
    const value = await c.env.KV.get(key);
    if (!value) {
      throw new HTTPException(404, { message: "Not found" });
    }
    return typeof value === "string" ? c.text(value) : c.json(value);
  })
  .put(
    "/kv/:key",
    validator("json", (value) => value),
    async (c) => {
      const key = c.req.param("key");
      const value = c.req.valid("json");
      await c.env.KV.put(key, JSON.stringify(value));
      return c.json({ success: true });
    },
  )
  .delete("/kv/:key", async (c) => {
    const key = c.req.param("key");
    await c.env.KV.delete(key);
    return c.json({ success: true });
  })
  .get("/r2", async (c) => {
    const r2 = await c.env.R2.list();
    return c.json({ objects: r2.objects });
  })
  .get("/r2/:key", async (c) => {
    const key = c.req.param("key");
    const object = await c.env.R2.get(key);
    if (!object) {
      throw new HTTPException(404, { message: "Not found" });
    }
    object.writeHttpMetadata(c.res.headers);
    return c.newResponse(object.body, 200);
  })
  .put("/r2/:key", async (c) => {
    const key = c.req.param("key");
    await c.env.R2.put(key, await c.req.arrayBuffer(), {
      httpMetadata: c.req.header(),
    });
    return c.json({ success: true });
  })
  .delete("/r2/:key", async (c) => {
    const key = c.req.param("key");
    await c.env.R2.delete(key);
    return c.json({ success: true });
  });

export default app;

export class DO extends DurableObject<typeof worker1.Env> {
  override fetch(_: Request) {
    return Response.json({
      message: "hello from DO",
    });
  }
}
