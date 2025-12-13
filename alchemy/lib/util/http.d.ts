import http from "node:http";
import { type Duplex } from "node:stream";
import { WebSocket, WebSocketServer } from "ws";
export declare class HTTPServer {
    httpServer: http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
    webSocketServer?: WebSocketServer;
    constructor(options: {
        websocket?: (request: Request) => Promise<WebSocket>;
        fetch: (request: Request) => Promise<Response>;
    });
    listen(port?: number): Promise<this>;
    get url(): string;
    close(): Promise<void>;
}
export declare function createUpgradeHandler(props: {
    wss: WebSocketServer;
    createServerWebSocket: (req: http.IncomingMessage) => Promise<WebSocket>;
}): (req: http.IncomingMessage, socket: Duplex, head: Buffer) => Promise<void>;
export declare function toWebRequest(req: http.IncomingMessage, host?: string): Request;
export declare function writeNodeResponse(res: http.ServerResponse, response: Response): Promise<void>;
//# sourceMappingURL=http.d.ts.map