import type { Scope } from "../scope.ts";

/**
 * Starts a Cloudflare Quick Tunnel to a local server.
 *
 * @returns the Local URL and the publicly accessible URL of the Quick Tunnel
 */
export const quickTunnel = async (
  scope: Scope,
  localUrl = "http://localhost:8080",
) => ({
  /**
   * The URL of the local server.
   */
  localUrl,
  /**
   * The URL of the publicly accessible Quick Tunnel.
   */
  tunnelUrl: await scope.spawn("tunnel", {
    cmd: `cloudflared tunnel --url ${localUrl}`,
    shell: false,
    // used to check if a PID is a cloudflared process when the parent exits, for resumability
    processName: "cloudflared",
    extract: (line) => {
      const match = line.match(/https:\/\/([^\s]+)\.trycloudflare\.com/);
      if (match) {
        return `https://${match[1]}.trycloudflare.com`;
      }
    },
  }),
});
