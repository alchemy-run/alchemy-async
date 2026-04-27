import type * as miniflare from "miniflare";
import { Scope } from "../../scope.ts";
import { findOpenPort } from "../../util/find-open-port.ts";
import type { CloudflareApi } from "../api.ts";
import { getInternalWorkerBundle } from "../bundle/internal-worker-bundle.ts";
import {
  enableWorkerSubdomain,
  getAccountSubdomain,
  getWorkerSubdomain,
} from "../worker-subdomain.ts";
import { putWorker } from "../worker.ts";
import {
  createMiniflareWorkerProxy,
  MiniflareWorkerProxyError,
} from "./miniflare-worker-proxy.ts";

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

export async function createTunnel(
  getMiniflare: () => Promise<miniflare.Miniflare>,
): Promise<Tunnel> {
  const workers = new Set<string>(); // used to avoid exposing workers that are not running with tunneling enabled
  const proxy = await createMiniflareWorkerProxy({
    port: await findOpenPort(9977), // alchemy auth uses 9976, so one above that
    getMiniflare,
    mode: "remote",
    transformRequest: (request) => {
      if (request.url.origin === remote.origin) {
        request.url.protocol = proxy.url.protocol;
        request.url.host = proxy.url.host;
        request.url.port = proxy.url.port;
        request.headers.set("host", proxy.url.host);
      }
    },
    getWorkerName: (request) => {
      const name = request.headers.get("alchemy-worker-name");
      if (!name) {
        throw new MiniflareWorkerProxyError(
          "Worker name is missing from request headers. This indicates a bug in Alchemy.",
          530,
        );
      }
      if (!workers.has(name)) {
        throw new MiniflareWorkerProxyError(
          `The worker "${name}" is not running with tunneling enabled.`,
          530,
        );
      }
      return name;
    },
  });
  const remoteUrlString = await Scope.current.spawn("tunnel", {
    processName: `cloudflared-${proxy.url.port}`,
    cmd: `cloudflared tunnel --url ${proxy.url.toString()}`,
    quiet: !process.env.DEBUG,
    extract: (line) => {
      const match = line.match(/https:\/\/([^\s]+)\.trycloudflare\.com/);
      if (match) {
        return `https://${match[1]}.trycloudflare.com`;
      }
    },
  });
  const remote = new URL(remoteUrlString);
  return {
    configureWorker: async (input) => {
      workers.add(input.name);
      return await createTunnelProxyWorker({
        api: input.api,
        name: input.name,
        host: remote.host,
      });
    },
    close: async () => {
      await proxy.close();
    },
  };
}

async function createTunnelProxyWorker(input: {
  api: CloudflareApi;
  name: string;
  host: string;
}) {
  const script = await getInternalWorkerBundle("tunnel-proxy");
  const [accountSubdomain, workerSubdomainStatus] = await Promise.all([
    getAccountSubdomain(input.api),
    getWorkerSubdomain(input.api, input.name),
    putWorker(input.api, {
      workerName: input.name,
      scriptBundle: script.bundle,
      compatibilityDate: "2025-09-01",
      compatibilityFlags: [],
      bindings: {
        WORKER_NAME: input.name,
        TUNNEL_HOST: input.host,
      },
    }),
  ]);
  if (!workerSubdomainStatus.enabled) {
    await enableWorkerSubdomain(input.api, input.name);
  }
  return new URL(`https://${input.name}.${accountSubdomain}.workers.dev`);
}
