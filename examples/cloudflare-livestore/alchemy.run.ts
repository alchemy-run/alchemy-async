import alchemy from "alchemy";
import { D1Database, DurableObjectNamespace, Vite } from "alchemy/cloudflare";

const app = await alchemy("cloudflare-livestore");

const db = await D1Database("db", {
  name: `${app.name}-${app.stage}-livestore`,
  adopt: true,
});

export const server = await Vite("server", {
  name: `${app.name}-${app.stage}-livestore-server`,
  assets: "dist",
  entrypoint: "src/livestore/server.ts",
  compatibility: "node",
  bindings: {
    DB: db,
    WEBSOCKET_SERVER: DurableObjectNamespace("websocket-server", {
      className: "WebSocketServer",
    }),
  },
  dev: {
    command: "vite dev --port 5002",
  },
});

console.log(`server.url: ${server.url}`);

await app.finalize();
