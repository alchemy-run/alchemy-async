import * as miniflare from "miniflare";
export interface MiniflareWorkerProxy {
    url: URL;
    close: () => Promise<void>;
}
export declare function createMiniflareWorkerProxy(options: {
    port: number;
    transformRequest?: (request: RequestInfo) => void;
    getWorkerName: (request: RequestInfo) => string;
    miniflare: miniflare.Miniflare;
    mode: "local" | "remote";
}): Promise<{
    url: URL;
    close: () => Promise<void>;
}>;
interface RequestInfo {
    method: string;
    url: URL;
    headers: miniflare.Headers;
    body: miniflare.BodyInit | undefined;
    redirect: "manual";
    duplex: "half" | undefined;
}
export declare class MiniflareWorkerProxyError extends Error {
    readonly status: number;
    constructor(message: string, status: number, options?: ErrorOptions);
    toResponse(mode: "local" | "remote"): miniflare.Response;
    static fromUnknown(error: unknown): MiniflareWorkerProxyError;
}
export {};
//# sourceMappingURL=miniflare-worker-proxy.d.ts.map