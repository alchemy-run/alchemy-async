import type { Scope } from "../scope.ts";
/**
 * Starts a Cloudflare Quick Tunnel to a local server.
 *
 * @returns the Local URL and the publicly accessible URL of the Quick Tunnel
 */
export declare const quickTunnel: (scope: Scope, localUrl?: string) => Promise<{
    /**
     * The URL of the local server.
     */
    localUrl: string;
    /**
     * The URL of the publicly accessible Quick Tunnel.
     */
    tunnelUrl: string;
}>;
//# sourceMappingURL=quick-tunnel.d.ts.map