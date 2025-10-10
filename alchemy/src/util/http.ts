import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { type Duplex, Readable } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";

export class HTTPServer {
  httpServer = http.createServer();
  webSocketServer?: WebSocketServer;

  constructor(options: {
    websocket?: (request: Request) => Promise<WebSocket>;
    fetch: (request: Request) => Promise<Response>;
  }) {
    const websocket = options.websocket;
    if (websocket) {
      const wss = new WebSocketServer({ noServer: true });
      this.webSocketServer = wss;
      this.httpServer.on(
        "upgrade",
        createUpgradeHandler({
          wss,
          createServerWebSocket: (req) => websocket(toWebRequest(req)),
        }),
      );
    }
    this.httpServer.on("request", async (req, res) => {
      const response = await options.fetch(toWebRequest(req));
      await writeNodeResponse(res, response);
    });
  }

  listen(port?: number) {
    return new Promise<this>((resolve, reject) => {
      this.httpServer.on("listening", () => {
        resolve(this);
      });
      this.httpServer.on("error", (error) => {
        reject(error);
      });
      this.httpServer.listen(port);
    });
  }

  get url() {
    const address = this.httpServer.address() as AddressInfo | null;
    if (!address) {
      throw new Error("Server is not listening");
    }
    const hostname = address.address === "::" ? "localhost" : address.address;
    return `http://${hostname}:${address.port}`;
  }

  async close() {
    this.webSocketServer?.close();
    this.httpServer.close();
  }
}

export function createUpgradeHandler(props: {
  wss: WebSocketServer;
  createServerWebSocket: (req: http.IncomingMessage) => Promise<WebSocket>;
}) {
  async function waitForWebSocketOpen(server: WebSocket) {
    if (server.readyState === WebSocket.CONNECTING) {
      // Wait for client to be open before accepting worker pair (which would
      // release buffered messages). Note this will throw if an "error" event is
      // dispatched (https://github.com/cloudflare/miniflare/issues/229).
      await once(server, "open");
    } else if (server.readyState >= WebSocket.CLOSING) {
      throw new TypeError("Incoming WebSocket connection already closed.");
    }
  }

  function forwardWebSocketEvents(from: WebSocket, to: WebSocket) {
    const ready = waitForWebSocketOpen(to);
    const ifOpen = (fn: () => void) => {
      // Wait for target to be open before sending message
      void ready.then(() => {
        // Silently discard messages received after close:
        // https://www.rfc-editor.org/rfc/rfc6455#section-1.4
        if (to.readyState !== WebSocket.OPEN) return;

        fn();
      });
    };
    from.on("message", (event, binary) => {
      ifOpen(() => {
        to.send(event, { binary });
      });
    });
    from.on("close", (code, reason) => {
      // Handle close events similar to Miniflare:
      // https://github.com/cloudflare/workers-sdk/blob/88f081f4e2bd299e715d18bcfe181971f534ff76/packages/miniflare/src/http/websocket.ts#L276-L282

      ifOpen(() => {
        if (code === 1005 /* No Status Received */) {
          to.close();
        } else if (code === 1006 /* Abnormal Closure */) {
          to.terminate();
        } else {
          to.close(code, reason);
        }
      });
    });
    from.on("error", (error) => {
      console.error("Websocket error:", error);

      ifOpen(() => {
        to.terminate();
      });
    });
  }

  return async (req: http.IncomingMessage, socket: Duplex, head: Buffer) => {
    const server = await props.createServerWebSocket(req);
    props.wss.handleUpgrade(req, socket, head, async (client) => {
      forwardWebSocketEvents(server, client);
      forwardWebSocketEvents(client, server);
      props.wss.emit("connection", client, req);
    });
  };
}

export function toWebRequest(
  req: http.IncomingMessage,
  host?: string,
): Request {
  const method = req.method ?? "GET";
  const url = new URL(req.url ?? "/", `http://${host ?? req.headers.host}`);
  const body =
    ["GET", "HEAD", "OPTIONS"].includes(method) || !req.readable
      ? undefined
      : Readable.toWeb(req);
  return new Request(url.toString(), {
    method,
    headers: req.headers as Record<string, string>,
    body: body as unknown as BodyInit,
    // @ts-expect-error - caused by @cloudflare/workers-types
    duplex: body ? "half" : undefined,
    redirect: "manual",
  });
}

export async function writeNodeResponse(
  res: http.ServerResponse,
  response: Response,
) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  if (response.body) {
    await response.body.pipeTo(
      new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
      }),
    );
  } else {
    res.end();
  }
}
