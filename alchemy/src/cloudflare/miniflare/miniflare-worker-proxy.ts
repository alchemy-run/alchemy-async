import * as miniflare from "miniflare";
import { once } from "node:events";
import http from "node:http";
import { Readable } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
import { createUpgradeHandler } from "../../util/http.ts";

export interface MiniflareWorkerProxy {
  url: URL;
  close: () => Promise<void>;
}

export async function createMiniflareWorkerProxy(options: {
  port: number;
  transformRequest?: (request: RequestInfo) => void;
  getWorkerName: (request: RequestInfo) => string;
  miniflare: miniflare.Miniflare;
  mode: "local" | "remote";
}) {
  const server = http.createServer();
  const wss = new WebSocketServer({ noServer: true });

  server.on(
    "upgrade",
    createUpgradeHandler({
      wss,
      createServerWebSocket: (req) => createServerWebSocket(req),
    }),
  );

  server.on("request", async (req, res) => {
    try {
      const response = await handleFetch(req);
      writeMiniflareResponseToNode(response, res);
    } catch (error) {
      console.error(error);
      const response = MiniflareWorkerProxyError.fromUnknown(error).toResponse(
        options.mode,
      );
      writeMiniflareResponseToNode(response, res);
    }
  });

  const handleFetch = async (
    req: http.IncomingMessage,
  ): Promise<miniflare.Response> => {
    const info = parseIncomingMessage(req);
    options.transformRequest?.(info);

    const name = options.getWorkerName(info);
    info.headers.set("MF-Route-Override", name);

    // Handle scheduled events.
    // Wrangler exposes this as /__scheduled, but Miniflare exposes it as /cdn-cgi/handler/scheduled.
    // https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/#background
    // https://github.com/cloudflare/workers-sdk/blob/7d53b9ab6b370944b7934ad51ebef43160c3c775/packages/wrangler/templates/middleware/middleware-scheduled.ts#L6
    if (info.url.pathname === "/__scheduled") {
      info.url.pathname = "/cdn-cgi/handler/scheduled";
    }

    const request = new miniflare.Request(info.url, {
      method: info.method,
      headers: info.headers,
      body: info.body,
      redirect: info.redirect,
      duplex: info.duplex,
    });
    return await options.miniflare.dispatchFetch(request);
  };

  const createServerWebSocket = async (req: http.IncomingMessage) => {
    // Rewrite to Miniflare entry URL
    const target = await options.miniflare.ready;
    const url = new URL(req.url ?? "/", target);
    url.protocol = url.protocol.replace("http", "ws");

    const protocols = req.headers["sec-websocket-protocol"]
      ?.split(",")
      .map((p) => p.trim());

    // Get worker name to set MF-Route-Override header
    const info = parseIncomingMessage(req);
    options.transformRequest?.(info);
    const name = options.getWorkerName(info);

    return new WebSocket(url, protocols, {
      headers: {
        "MF-Route-Override": name,
      },
    });
  };

  server.listen(options.port);
  await once(server, "listening");
  const url = new URL(`http://localhost:${options.port}`);

  return {
    url,
    close: async () => {
      // If we await this while the `wss` server is open, the server will hang.
      server.close();
    },
  };
}

interface RequestInfo {
  method: string;
  url: URL;
  headers: miniflare.Headers;
  body: miniflare.BodyInit | undefined;
  redirect: "manual";
  duplex: "half" | undefined;
}

const parseIncomingMessage = (req: http.IncomingMessage): RequestInfo => {
  const method = req.method ?? "GET";
  const protocol = req.headers["x-forwarded-proto"] ?? "http";
  const url = new URL(req.url ?? "/", `${protocol}://${req.headers.host}`);
  const headers = new miniflare.Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else if (value) {
      headers.set(key, value);
    }
  }
  const body =
    ["GET", "HEAD", "OPTIONS"].includes(method) || !req.readable
      ? undefined
      : Readable.toWeb(req);
  return {
    method,
    url,
    headers,
    body,
    redirect: "manual",
    duplex: body ? "half" : undefined,
  };
};

const writeMiniflareResponseToNode = (
  res: miniflare.Response,
  out: http.ServerResponse,
) => {
  out.statusCode = res.status;
  res.headers.forEach((value, key) => {
    // The `transfer-encoding` header prevents Cloudflare Tunnels from working because of the following error:
    // Request failed error="Unable to reach the origin service. The service may be down or it may not be
    // responding to traffic from cloudflared: net/http: HTTP/1.x transport connection broken: too many
    // transfer encodings: [\"chunked\" \"chunked\"]"
    if (key !== "transfer-encoding") {
      out.setHeader(key, value);
    }
  });

  if (res.body) {
    Readable.fromWeb(res.body).pipe(out, { end: true });
  } else {
    out.end();
  }
};

export class MiniflareWorkerProxyError extends Error {
  constructor(
    message: string,
    readonly status: number,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }

  toResponse(mode: "local" | "remote"): miniflare.Response {
    let text = `[Alchemy] ${this.message}`;
    if (mode === "local" && this.cause) {
      const cause =
        this.cause instanceof Error
          ? (this.cause.stack ?? this.cause.message)
          : String(this.cause);
      text += `\n\n${cause}`;
    }
    return new miniflare.Response(text, {
      status: this.status,
      headers: {
        "Content-Type": "text/plain",
        "Alchemy-Error": this.message,
      },
    });
  }

  static fromUnknown(error: unknown): MiniflareWorkerProxyError {
    if (error instanceof MiniflareWorkerProxyError) {
      return error;
    }
    return new MiniflareWorkerProxyError("An unknown error occurred.", 500, {
      cause: error,
    });
  }
}
