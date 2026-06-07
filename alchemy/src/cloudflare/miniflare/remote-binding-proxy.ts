import type { RemoteProxyConnectionString } from "miniflare";
import { WebSocket } from "ws";
import { Scope } from "../../scope.ts";
import { HTTPServer } from "../../util/http.ts";
import { memoize } from "../../util/memoize.ts";
import { extractCloudflareResult } from "../api-response.ts";
import type { CloudflareApi } from "../api.ts";
import type { WorkerBindingSpec } from "../bindings.ts";
import { getInternalWorkerBundle } from "../bundle/internal-worker-bundle.ts";
import { WorkerBundle } from "../worker-bundle.ts";
import type { WorkerMetadata } from "../worker-metadata.ts";
import { getAccountSubdomain } from "../worker-subdomain.ts";

type WranglerSessionConfig =
  | {
      workers_dev: boolean;
      minimal_mode: boolean;
    }
  | {
      routes: string[];
      minimal_mode: boolean;
    };

export interface RemoteBindingProxy {
  server: HTTPServer;
  bindings: WorkerBindingSpec[];
  connectionString: RemoteProxyConnectionString;
}

export async function createRemoteProxyWorker(input: {
  api: CloudflareApi;
  name: string;
  bindings: WorkerBindingSpec[];
}): Promise<RemoteBindingProxy> {
  const script = await getInternalWorkerBundle("remote-binding-proxy");
  // We must create the preview token BEFORE probing for Cloudflare Access:
  // a preview worker URL only returns the Access 302 when the request carries
  // the preview token (otherwise CF responds with 404 regardless of Access
  // configuration). Probing without the token would incorrectly report
  // "no Access" for accounts that do gate workers.dev behind Access.
  const [token, subdomain] = await Promise.all([
    createWorkersPreviewToken(input.api, {
      name: input.name,
      metadata: {
        main_module: script.bundle.entrypoint,
        compatibility_date: "2025-06-16",
        bindings: input.bindings,
        observability: { enabled: false },
      },
      bundle: script.bundle,
      session: {
        workers_dev: true,
        minimal_mode: true,
      },
    }),
    getAccountSubdomain(input.api),
  ]);
  const host = `${input.name}.${subdomain}.workers.dev`;
  const accessToken = await getAccessToken(host, token);

  const baseHeaders: Record<string, string> = {
    "cf-workers-preview-token": token,
    host,
    ...(accessToken ? { cookie: `CF_Authorization=${accessToken}` } : {}),
  };

  const server = new HTTPServer({
    websocket: async (req) => {
      const input = new URL(req.url);
      const proxied = new URL(input.pathname + input.search, `https://${host}`);
      const headers: Record<string, string> = {
        ...baseHeaders,
      };
      // We don't want to include all headers because some can mess with websocket connections.
      // However, it's important to include `mf-` prefixed headers to configure bindings for miniflare to work.
      req.headers.forEach((value, key) => {
        if (key.startsWith("mf-")) {
          headers[key] = value;
        }
      });
      return new WebSocket(proxied, {
        headers,
      });
    },
    fetch: async (req) => {
      const url = new URL(req.url);
      const proxied = new URL(url.pathname + url.search, `https://${host}`);

      const headers = new Headers(req.headers);
      for (const [key, value] of Object.entries(baseHeaders)) {
        headers.set(key, value);
      }
      headers.delete("cf-connecting-ip");

      const res = await fetch(proxied, {
        method: req.method,
        headers,
        body: req.body,
        redirect: "manual",
        // @ts-expect-error - caused by @cloudflare/workers-types
        duplex: req.body ? "half" : undefined,
      });

      const responseHeaders = new Headers(res.headers);
      responseHeaders.delete("transfer-encoding");
      responseHeaders.delete("content-encoding");

      return new Response(res.body, {
        status: res.status,
        headers: responseHeaders,
      });
    },
  });

  await server.listen();
  return {
    server,
    bindings: input.bindings,
    connectionString: new URL(server.url) as RemoteProxyConnectionString,
  };
}

async function createWorkersPreviewToken(
  api: CloudflareApi,
  input: {
    name: string;
    metadata: WorkerMetadata;
    bundle: WorkerBundle;
    session: WranglerSessionConfig;
  },
) {
  const previewUploadToken = await createPreviewUploadToken(api);
  const formData = await WorkerBundle.toFormData(input.bundle);
  formData.append("metadata", JSON.stringify(input.metadata));
  formData.append("wrangler-session-config", JSON.stringify(input.session));
  const res = await extractCloudflareResult<{ preview_token: string }>(
    "create workers preview token",
    api.post(
      `/accounts/${api.accountId}/workers/scripts/${input.name}/edge-preview`,
      formData,
      {
        headers: {
          "cf-preview-upload-config-token": previewUploadToken,
        },
      },
    ),
  );
  return res.preview_token;
}

async function createPreviewUploadToken(api: CloudflareApi) {
  const { token, exchange_url } = await extractCloudflareResult<{
    exchange_url: string | null | undefined;
    token: string;
  }>(
    "create workers preview session",
    api.get(`/accounts/${api.accountId}/workers/subdomain/edge-preview`),
  );
  if (!exchange_url) {
    return token;
  }
  const accessToken = await getAccessToken(new URL(exchange_url).hostname);
  const json = await fetch(exchange_url, {
    headers: {
      ...(accessToken ? { cookie: `CF_Authorization=${accessToken}` } : {}),
    },
  })
    .then((res) => res.json())
    .catch(() => undefined);
  if (
    typeof json === "object" &&
    json !== null &&
    "token" in json &&
    typeof json.token === "string"
  ) {
    return json.token;
  }
  return token;
}

/**
 * If the given domain uses Cloudflare Access, fetches the access token for the domain.
 * Otherwise, returns undefined.
 *
 * For workers.dev preview URLs, pass the `cf-workers-preview-token` alongside
 * the HEAD probe: the preview worker only surfaces its Access 302 when the
 * request carries the preview token (a bare HEAD returns 404 regardless of
 * Access configuration).
 *
 * @see https://github.com/cloudflare/workers-sdk/blob/a5eb5134f73d3983655d325a4de71c6370c57faa/packages/wrangler/src/user/access.ts#L10
 */
const getAccessToken = memoize(
  async (hostname: string, previewToken?: string) => {
    if (!(await domainUsesAccess(hostname, previewToken))) {
      return undefined;
    }
    const result = await Scope.current
      .exec(`access-${hostname}`, `cloudflared access login ${hostname}`)
      .catch(() => {
        throw new Error(
          [
            `The \`cloudflared\` CLI is not installed, but is required to access the domain "${hostname}".`,
            `Please install it from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation and run \`cloudflare access login ${hostname}\`.`,
          ].join("\n"),
        );
      });
    const matches = result.stdout.match(/fetched your token:\n\n(.*)/m);
    if (matches?.[1]) {
      return matches[1];
    }
    const error = new Error(
      `Failed to get access token for domain "${hostname}".`,
    );
    Object.assign(error, result);
    throw error;
  },
  (hostname) => hostname,
);

/**
 * Returns true if the domain uses Cloudflare Access.
 *
 * @param hostname  the workers.dev preview host
 * @param previewToken  optional preview token; required when probing a
 *   preview-worker URL because CF only serves the Access 302 to requests
 *   that carry the token.
 */
async function domainUsesAccess(hostname: string, previewToken?: string) {
  try {
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(1000),
      headers: previewToken
        ? { "cf-workers-preview-token": previewToken }
        : undefined,
    });
    return !!(
      response.status === 302 &&
      response.headers.get("location")?.includes("cloudflareaccess.com")
    );
  } catch {
    return false;
  }
}
