import { DurableObject } from "cloudflare:workers";
import type { server } from "../alchemy.run.ts";

export default {
  fetch: (req: Request, env: typeof server.Env) => {
    const url = new URL(req.url);
    if (url.pathname === "/status") {
      return new Response("OK");
    }
    if (url.pathname !== "/websocket") {
      return new Response("Not found", { status: 404 });
    }
    const stub = env.WS_SERVER.getByName("default");
    return stub.fetch(req);
  },
};

export class WebSocketServer extends DurableObject {
  declare env: typeof server.Env;

  async fetch(req: Request): Promise<Response> {
    if (req.headers.get("upgrade") !== "websocket") {
      return new Response("Not a websocket request", { status: 400 });
    }
    const wsPair = new WebSocketPair();
    const { 0: client, 1: server } = wsPair;
    this.ctx.acceptWebSocket(server);
    console.log("accepting websocket request");
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  webSocketMessage(
    ws: WebSocket,
    message: string | ArrayBuffer,
  ): void | Promise<void> {
    console.log("message", message);
    ws.send(`Received message: ${message.toString()}`);
  }

  webSocketClose(
    _ws: WebSocket,
    code: number,
    reason: string,
  ): void | Promise<void> {
    console.log("close", code, reason);
  }

  webSocketError(_ws: WebSocket, error: unknown): void | Promise<void> {
    console.log("error", error);
  }
}
