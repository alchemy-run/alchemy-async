import { Hono } from "hono";
import { cors } from "hono/cors";
import type { bunsite } from "../alchemy.run.ts";

type CloudflareEnv = typeof bunsite.Env;

export const api = new Hono<{ Bindings: CloudflareEnv }>();

// Handle CORS - accept all origins, methods, and headers
api.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowHeaders: ["*"],
    exposeHeaders: ["*"],
    credentials: true,
  }),
);

api.get("/api/test/env", (c) =>
  c.json({ ALCHEMY_TEST_VALUE: c.env.ALCHEMY_TEST_VALUE }),
);

api.get("/api/test/kv/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.env.KV.get(key);
  if (!value) {
    return c.json({ error: "Not found" }, 404);
  }
  return c.text(value);
});

api.put("/api/test/kv/:key", async (c) => {
  const key = c.req.param("key");
  const value = await c.req.text();
  await c.env.KV.put(key, value);
  return c.json({ success: true }, 201);
});

api.delete("/api/test/kv/:key", async (c) => {
  const key = c.req.param("key");
  await c.env.KV.delete(key);
  return c.newResponse(null, 204);
});

export default api;
