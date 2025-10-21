import { Hono } from "hono";

const app = new Hono<{ Bindings: Env }>();

app.get("/", (c) => {
  return c.text("Hello Hono!");
});

app.get("/kv", async (c) => {
  const key = "hello";
  const value = `world@${Date.now()}`;
  await c.env.KV.put(key, value);
  const got = await c.env.KV.get(key);
  return c.json({ key, value: got });
});

export default app;
