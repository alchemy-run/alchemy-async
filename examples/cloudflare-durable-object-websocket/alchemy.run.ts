import alchemy from "alchemy";
import { DurableObjectNamespace, Vite, Worker } from "alchemy/cloudflare";
import type { WebSocketServer } from "./src/server.ts";

const app = await alchemy("cloudflare-durable-object-websocket");

export const server = await Worker("server", {
  name: `${app.name}-${app.stage}-server`,
  entrypoint: "src/server.ts",
  adopt: true,
  bindings: {
    WS_SERVER: DurableObjectNamespace<WebSocketServer>("ws-server", {
      className: "WebSocketServer",
      sqlite: true,
    }),
  },
  dev: {
    tunnel: !process.env.ALCHEMY_E2E,
  },
});

console.log("Server:", server.url);

export const client = await Vite("client", {
  name: `${app.name}-${app.stage}-client`,
  adopt: true,
  env: {
    VITE_WEBSOCKET_URL: server.url!,
  },
  dev: {
    command: "vite dev --port 5001",
  },
});

console.log("Client:", client.url);

if (process.env.ALCHEMY_E2E) {
  const { test } = await import("./test/e2e.ts");
  await test({
    url: server.url,
  });
}

await app.finalize();
