import { once } from "node:events";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { Readable, type Duplex } from "node:stream";
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
      const webSocketServer = new WebSocketServer({ noServer: true });
      this.webSocketServer = webSocketServer;
      this.httpServer.on("upgrade", async (req, socket, head) => {
        const ws = await websocket(toWebRequest(req));
        await coupleWebSocket(webSocketServer, req, socket, head, ws);
      });
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
    const webSocketServer = this.webSocketServer;
    if (webSocketServer) {
      await new Promise<void>((resolve, reject) => {
        webSocketServer.close((err) => (err ? reject(err) : resolve()));
      });
    }
    await new Promise<void>((resolve, reject) => {
      this.httpServer.close((err) => (err ? reject(err) : resolve()));
    });
  }
}

export async function coupleWebSocket(
  wss: WebSocketServer,
  req: http.IncomingMessage,
  socket: Duplex,
  head: Buffer,
  server: WebSocket,
) {
  if (server.readyState === WebSocket.CONNECTING) {
    // Wait for client to be open before accepting worker pair (which would
    // release buffered messages). Note this will throw if an "error" event is
    // dispatched (https://github.com/cloudflare/miniflare/issues/229).
    await once(server, "open");
  } else if (server.readyState >= WebSocket.CLOSING) {
    throw new TypeError("Incoming WebSocket connection already closed.");
  }
  wss.handleUpgrade(req, socket, head, async (client) => {
    forwardEvents(server, client);
    forwardEvents(client, server);
    wss.emit("connection", client, req);
  });

  function forwardEvents(from: WebSocket, to: WebSocket) {
    from.on("message", (event, binary) => to.send(event, { binary }));
    from.on("close", (code, reason) => {
      // Handle close events similar to Miniflare:
      // @see https://github.com/cloudflare/miniflare/blob/88f081f4e2bd299e715d18bcfe181971f534ff76/packages/miniflare/src/http/websocket.ts#L276-L282

      if (code === 1005 /* No Status Received */) {
        to.close();
      } else if (code === 1006 /* Abnormal Closure */) {
        to.terminate();
      } else {
        to.close(code, reason);
      }
    });
  }
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
