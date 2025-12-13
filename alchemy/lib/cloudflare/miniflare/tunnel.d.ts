import type * as miniflare from "miniflare";
import type { CloudflareApi } from "../api.ts";
export interface Tunnel {
    /**
     * Enables tunneling for a local worker.
     * Returns a `workers.dev` URL that can be used to access the worker.
     */
    configureWorker: (input: {
        api: CloudflareApi;
        name: string;
    }) => Promise<URL>;
    /**
     * Closes the tunnel.
     */
    close: () => Promise<void>;
}
export declare function createTunnel(miniflare: miniflare.Miniflare): Promise<Tunnel>;
//# sourceMappingURL=tunnel.d.ts.map