import * as miniflare from "miniflare";
import type { HTTPServer } from "../../util/http.ts";
import { AsyncMutex } from "../../util/mutex.ts";
import { type MiniflareWorkerInput } from "./build-worker-options.ts";
import { type MiniflareWorkerProxy } from "./miniflare-worker-proxy.ts";
import { type Tunnel } from "./tunnel.ts";
declare global {
    var ALCHEMY_MINIFLARE_CONTROLLER: MiniflareController | undefined;
}
export declare class MiniflareController {
    abort: AbortController;
    miniflare: miniflare.Miniflare | undefined;
    options: Map<string, miniflare.WorkerOptions>;
    tunnel: Tunnel | undefined;
    localProxies: Map<string, MiniflareWorkerProxy>;
    remoteProxies: Map<string, HTTPServer>;
    mutex: AsyncMutex;
    static get singleton(): MiniflareController;
    add(input: MiniflareWorkerInput): Promise<string>;
    private watch;
    private update;
    private setMiniflareOptions;
    dispose(): Promise<void>;
}
//# sourceMappingURL=miniflare-controller.d.ts.map