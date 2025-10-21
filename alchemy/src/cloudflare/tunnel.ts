import { alchemy } from "../alchemy.ts";
import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { handleApiError } from "./api-error.ts";
import type {
  CloudflareApiListResponse,
  CloudflareApiResponse,
} from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { DnsRecords } from "./dns-records.ts";
import { findZoneForHostname } from "./zone.ts";

/**
 * Tunnel data as returned by Cloudflare API
 */
interface CloudflareTunnel {
  id: string;
  account_tag: string;
  created_at: string;
  deleted_at: string | null;
  name: string;
  metadata?: Record<string, any>;
  credentials_file?: {
    AccountTag: string;
    TunnelID: string;
    TunnelName: string;
    TunnelSecret: string;
  };
  token?: string;
}

/**
 * Properties for creating or updating a Cloudflare Tunnel
 *
 * @remarks
 * This interface includes all configuration options supported by Cloudflare Tunnels
 * for both remotely-managed (configSrc: 'cloudflare') and locally-managed tunnels.
 */
export interface TunnelProps extends CloudflareApiOptions {
  /**
   * Name for the tunnel
   *
   * Note: Tunnel names are immutable and cannot be changed after creation.
   * When updating a tunnel, any name change will be ignored.
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Secret for the tunnel
   * If not provided, will be generated automatically
   */
  tunnelSecret?: Secret<string>;

  /**
   * Optional metadata object for the tunnel
   */
  metadata?: Record<string, any>;

  /**
   * Configuration source
   * - 'cloudflare' - Use Cloudflare configuration (default, managed via API)
   * - 'local' - Use local configuration (managed via config file)
   *
   * @default 'cloudflare'
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/tunnel-useful-terms/#remotely-managed-tunnel
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/tunnel-useful-terms/#locally-managed-tunnel
   */
  configSrc?: "cloudflare" | "local";

  /**
   * Ingress rules defining how requests are routed
   * Must include a catch-all rule at the end
   * Only used when configSrc is 'cloudflare'
   *
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#ingress-rules
   */
  ingress?: IngressRule[];

  /**
   * WarpRouting configuration for private network access
   * Only used when configSrc is 'cloudflare'
   *
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/private-net/
   */
  warpRouting?: {
    enabled?: boolean;
  };

  /**
   * Origin request configuration to apply to all rules
   * Only used when configSrc is 'cloudflare'
   *
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#origin-request-parameters
   */
  originRequest?: OriginRequestConfig;

  /**
   * Whether to adopt an existing tunnel with the same name if it exists
   * If true and a tunnel with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the tunnel.
   * If set to false, the tunnel will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;
}

/**
 * Tunnel configuration for routing traffic
 */
export interface TunnelConfig {
  /**
   * Ingress rules defining how requests are routed
   * Must include a catch-all rule at the end
   */
  ingress?: IngressRule[];

  /**
   * WarpRouting configuration for private network access
   */
  warpRouting?: {
    enabled?: boolean;
  };

  /**
   * Origin request configuration to apply to all rules
   */
  originRequest?: OriginRequestConfig;
}

/**
 * Ingress rule defining how a hostname is routed
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#ingress-rules
 */
export interface IngressRule {
  /**
   * Hostname to match for this rule
   * Use service: "http_status:404" as catch-all
   */
  hostname?: string;

  /**
   * Service to route to (e.g., "http://localhost:8000" or "http_status:404")
   *
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#supported-protocols
   */
  service: string;

  /**
   * Path to match for this rule
   */
  path?: string;

  /**
   * Origin request configuration for this specific rule
   */
  originRequest?: OriginRequestConfig;
}

/**
 * Origin request configuration
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/origin-configuration/#origin-request-parameters
 */
export interface OriginRequestConfig {
  /**
   * Timeout for origin server to respond to a request
   */
  connectTimeout?: number;

  /**
   * Timeout for closing the connection to the origin server
   */
  tlsTimeout?: number;

  /**
   * Timeout for TCP connections to the origin server
   */
  tcpKeepAlive?: number;

  /**
   * Disable keep-alive connections
   */
  noHappyEyeballs?: boolean;

  /**
   * Keep connections open after a request
   */
  keepAliveConnections?: number;

  /**
   * Timeout for keep-alive connections
   */
  keepAliveTimeout?: number;

  /**
   * HTTP/2 origin support
   */
  http2Origin?: boolean;

  /**
   * Headers to add to origin requests
   */
  httpHostHeader?: string;

  /**
   * CA pool for origin TLS verification
   */
  caPool?: string;

  /**
   * Disable TLS verification
   */
  noTLSVerify?: boolean;

  /**
   * Disable chunked encoding
   */
  disableChunkedEncoding?: boolean;

  /**
   * Rewrite the Host header
   */
  bastionMode?: boolean;

  /**
   * Proxy protocol version
   */
  proxyProtocol?: "off" | "v1" | "v2";

  /**
   * Proxy outgoing connections through a specified address
   */
  proxyAddress?: string;

  /**
   * Port to use for proxy connections
   */
  proxyPort?: number;

  /**
   * Type of proxy to use
   */
  proxyType?: string;

  /**
   * Enable TCP keep-alive for connection pooling
   */
  tcpKeepAliveInterval?: number;
}

export function isTunnel(resource: any): resource is Tunnel {
  return resource?.[ResourceKind] === "cloudflare::Tunnel";
}

/**
 * Output returned after Tunnel creation/update
 */
export interface Tunnel extends Omit<TunnelProps, "delete" | "tunnelSecret"> {
  /**
   * The name of the tunnel
   */
  name: string;

  /**
   * The ID of the tunnel
   */
  tunnelId: string;

  /**
   * The account ID that owns the tunnel
   */
  accountTag: string;

  /**
   * Time at which the tunnel was created
   */
  createdAt: string;

  /**
   * Time at which the tunnel was deleted (null if active)
   */
  deletedAt: string | null;

  /**
   * Credentials for connecting to the tunnel
   */
  credentials: {
    accountTag: string;
    tunnelId: string;
    tunnelName: string;
    tunnelSecret: Secret<string>;
  };

  /**
   * Token for running the tunnel
   *
   * @remarks
   * Use this token with `cloudflared tunnel run --token <token>` to start the tunnel
   *
   * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel-api/#install-and-run-the-tunnel
   */
  token: Secret<string>;

  /**
   * DNS records automatically created for hostnames in ingress rules
   * Maps hostname to DNS record ID
   * @internal
   */
  dnsRecords?: Record<string, string>;
}

/**
 * Creates and manages a Cloudflare Tunnel, which provides a secure connection between
 * your origin server and Cloudflare's edge. This resource handles the tunnel lifecycle
 * (create, update, delete) and configuration.
 *
 * @remarks
 * After creating a tunnel, use the returned credentials and token to run the
 * cloudflared connector on your origin server.
 *
 * When hostnames are specified in ingress rules, this resource automatically creates
 * the required DNS CNAME records pointing to <tunnel-id>.cfargotunnel.com, following
 * the Cloudflare API documentation for connecting applications (step 3a).
 *
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/get-started/create-remote-tunnel-api/
 * @see https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/configure-tunnels/
 *
 * @example
 * // Create a basic tunnel
 * const tunnel = await Tunnel("my-app", {
 *   name: "my-app-tunnel"
 * });
 *
 * // Run cloudflared with:
 * // cloudflared tunnel run --token <tunnel.token.unencrypted>
 *
 * @example
 * // Create a tunnel with ingress configuration for a web app
 * // DNS records are automatically created for each hostname
 * const webTunnel = await Tunnel("web-app", {
 *   name: "web-app-tunnel",
 *   ingress: [
 *     {
 *       hostname: "app.example.com",
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       service: "http_status:404"  // catch-all rule
 *     }
 *   ]
 * });
 * // A CNAME record for app.example.com → webTunnel.tunnelId.cfargotunnel.com
 * // is automatically created in the appropriate zone
 *
 * @example
 * // Create a tunnel with multiple services and origin configuration
 * const apiTunnel = await Tunnel("api", {
 *   name: "api-tunnel",
 *   ingress: [
 *     {
 *       hostname: "api.example.com",
 *       path: "/v1/*",
 *       service: "http://localhost:8080",
 *       originRequest: {
 *         httpHostHeader: "api.internal",
 *         connectTimeout: 30
 *       }
 *     },
 *     {
 *       hostname: "api.example.com",
 *       path: "/v2/*",
 *       service: "http://localhost:8081"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a tunnel for private network access with WARP
 * const privateTunnel = await Tunnel("private-network", {
 *   name: "private-network-tunnel",
 *   warpRouting: {
 *     enabled: true
 *   }
 * });
 *
 * @example
 * // Create a tunnel with origin request configuration
 * const secureTunnel = await Tunnel("secure", {
 *   name: "secure-tunnel",
 *   originRequest: {
 *     noTLSVerify: false,
 *     connectTimeout: 30,
 *     httpHostHeader: "internal.service"
 *   },
 *   ingress: [
 *     {
 *       hostname: "secure.example.com",
 *       service: "https://localhost:8443"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Adopt an existing tunnel if it already exists
 * const existingTunnel = await Tunnel("existing", {
 *   name: "existing-tunnel",
 *   adopt: true,
 *   ingress: [
 *     {
 *       hostname: "updated.example.com",
 *       service: "http://localhost:5000"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 *
 * @example
 * // Tunnel with automatic DNS record creation
 * // The Tunnel resource automatically creates DNS records for hostnames in ingress rules
 * const appTunnel = await Tunnel("app", {
 *   name: "app-tunnel",
 *   ingress: [
 *     {
 *       hostname: "app.example.com",
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       hostname: "api.example.com",
 *       service: "http://localhost:8080"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 * // DNS CNAME records are automatically created:
 * // - app.example.com → {tunnelId}.cfargotunnel.com
 * // - api.example.com → {tunnelId}.cfargotunnel.com
 *
 * // Run the tunnel:
 * // cloudflared tunnel run --token <appTunnel.token.unencrypted>
 *
 * @example
 * // For advanced DNS control, you can still manually manage DNS records
 * // by omitting hostnames from ingress rules:
 * const tunnel = await Tunnel("manual-dns", {
 *   name: "manual-dns-tunnel",
 *   ingress: [
 *     {
 *       service: "http://localhost:3000"
 *     },
 *     {
 *       service: "http_status:404"
 *     }
 *   ]
 * });
 * // Then create DNS records separately with custom configuration
 */
export const Tunnel = Resource(
  "cloudflare::Tunnel",
  async function (
    this: Context<Tunnel>,
    id: string,
    props: TunnelProps,
  ): Promise<Tunnel> {
    // Create Cloudflare API client with automatic account discovery
    const api = await createCloudflareApi(props);

    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    // Track if we're replacing the tunnel (don't fetch token in this case)
    let isReplacing = false;

    if (this.phase === "update" && this.output.name !== name) {
      console.log("replacing tunnel", this.output.name, name);
      this.replace(true);
    }

    if (this.phase === "delete") {
      // For delete operations, check if the tunnel ID exists in the output
      const tunnelId = this.output?.tunnelId;
      if (tunnelId && props.delete !== false) {
        await deleteTunnel(api, tunnelId);
      }

      // Return destroyed state
      return this.destroy();
    }

    // For create or update operations
    let tunnelData: CloudflareTunnel;

    if (this.phase === "update" && this.output?.tunnelId) {
      // Get existing tunnel data
      tunnelData = await getTunnel(api, this.output.tunnelId);

      // Check if name is being changed - tunnel names are immutable
      if (props.name && props.name !== tunnelData.name) {
        this.replace(true);
      }

      // Update configuration if provided
      if (
        (props.ingress || props.warpRouting || props.originRequest) &&
        props.configSrc !== "local"
      ) {
        const config: TunnelConfig = {
          ingress: props.ingress,
          warpRouting: props.warpRouting,
          originRequest: props.originRequest,
        };
        await updateTunnelConfiguration(api, this.output.tunnelId, config);
      }
    } else {
      // Create new tunnel
      try {
        tunnelData = await createTunnel(api, {
          name,
          configSrc: props.configSrc,
          tunnelSecret: props.tunnelSecret,
          metadata: props.metadata,
        });

        // Configure tunnel if config is provided
        if (
          (props.ingress || props.warpRouting || props.originRequest) &&
          props.configSrc !== "local"
        ) {
          await updateTunnelConfiguration(api, tunnelData.id, {
            ingress: props.ingress,
            warpRouting: props.warpRouting,
            originRequest: props.originRequest,
          });
        }
      } catch (error) {
        // Check if this is a "tunnel already exists" error and adopt is enabled
        if (
          props.adopt &&
          error instanceof Error &&
          (error.message.includes("already have a tunnel with this name") ||
            error.message.includes("already exists"))
        ) {
          logger.log(`Tunnel '${name}' already exists, adopting it`);

          // Find the existing tunnel by name
          const existingTunnel = await findTunnelByName(api, name);

          if (!existingTunnel) {
            throw new Error(
              `Failed to find existing tunnel '${name}' for adoption`,
            );
          }

          tunnelData = existingTunnel;

          // Update configuration if provided
          if (
            (props.ingress || props.warpRouting || props.originRequest) &&
            props.configSrc !== "local"
          ) {
            const config: TunnelConfig = {
              ingress: props.ingress,
              warpRouting: props.warpRouting,
              originRequest: props.originRequest,
            };
            await updateTunnelConfiguration(api, existingTunnel.id, config);
          }
        } else {
          // Re-throw the error if adopt is false or it's not an "already exists" error
          throw error;
        }
      }
    }

    // Ensure tunnel token is available (unless we're replacing)
    // Sometimes Cloudflare doesn't return the token in the initial response
    if (!isReplacing && !tunnelData.token) {
      tunnelData.token = await getTunnelToken(api, tunnelData.id);
    }

    // Handle DNS records for ingress hostnames
    let dnsRecords = this.output?.dnsRecords || {};

    // Extract hostnames from ingress rules
    const hostnames = new Set<string>();
    if (props.ingress) {
      for (const rule of props.ingress) {
        if (rule.hostname && !rule.hostname.includes("*")) {
          // Skip wildcard hostnames as they need special handling
          hostnames.add(rule.hostname);
        }
      }
    }

    // Create or update DNS records for each hostname
    if (hostnames.size > 0) {
      // Group hostnames by zone
      const hostnamesByZone = new Map<
        string,
        { zoneId: string; hostnames: string[] }
      >();

      for (const hostname of hostnames) {
        const { zoneId } = await findZoneForHostname(api, hostname);
        if (!hostnamesByZone.has(zoneId)) {
          hostnamesByZone.set(zoneId, { zoneId, hostnames: [] });
        }
        hostnamesByZone.get(zoneId)!.hostnames.push(hostname);
      }

      // Create DNS records for each zone in parallel
      const dnsPromises = Array.from(hostnamesByZone.entries()).map(
        async ([zoneId, { hostnames: zoneHostnames }]) => {
          const dnsResourceId = `${id}-dns-${zoneId}`;
          const dnsResource = await DnsRecords(dnsResourceId, {
            zoneId,
            records: zoneHostnames.map((hostname) => ({
              name: hostname,
              type: "CNAME" as const,
              content: `${tunnelData.id}.cfargotunnel.com`,
              proxied: true,
              comment: `Cloudflare Tunnel: ${tunnelData.name}`,
            })),
          });

          // Return records for mapping storage
          return dnsResource.records;
        },
      );

      const allDnsRecords = await Promise.all(dnsPromises);

      // Store DNS record mappings
      for (const records of allDnsRecords) {
        for (const record of records) {
          dnsRecords[record.name] = record.id;
        }
      }
    }

    // Clean up DNS records that are no longer needed
    const currentHostnames = Array.from(hostnames);
    for (const hostname of Object.keys(dnsRecords)) {
      if (!currentHostnames.includes(hostname)) {
        delete dnsRecords[hostname];
      }
    }

    // Transform API response to our interface
    return {
      tunnelId: tunnelData.id,
      accountTag: tunnelData.account_tag,
      name: tunnelData.name,
      createdAt: tunnelData.created_at,
      deletedAt: tunnelData.deleted_at,
      credentials: tunnelData.credentials_file
        ? {
            accountTag: tunnelData.credentials_file.AccountTag,
            tunnelId: tunnelData.credentials_file.TunnelID,
            tunnelName: tunnelData.credentials_file.TunnelName,
            tunnelSecret: alchemy.secret(
              tunnelData.credentials_file.TunnelSecret,
            ),
          }
        : this.output?.credentials || {
            accountTag: tunnelData.account_tag,
            tunnelId: tunnelData.id,
            tunnelName: tunnelData.name,
            tunnelSecret: alchemy.secret(""),
          },
      token: tunnelData.token
        ? alchemy.secret(tunnelData.token)
        : this.output?.token || alchemy.secret(""),
      metadata: props.metadata,
      ingress: props.ingress,
      warpRouting: props.warpRouting,
      originRequest: props.originRequest,
      configSrc: props.configSrc,
      dnsRecords: Object.keys(dnsRecords).length > 0 ? dnsRecords : undefined,
    };
  },
);

/**
 * Get tunnel details
 * @internal
 */
export async function getTunnel(
  api: CloudflareApi,
  tunnelId: string,
): Promise<CloudflareTunnel> {
  const response = await api.get(
    `/accounts/${api.accountId}/cfd_tunnel/${tunnelId}`,
  );

  if (!response.ok) {
    await handleApiError(response, "get", "tunnel", tunnelId);
  }

  const data =
    (await response.json()) as CloudflareApiResponse<CloudflareTunnel>;
  return data.result;
}

/**
 * Get tunnel configuration
 * @internal
 */
export async function getTunnelConfiguration(
  api: CloudflareApi,
  tunnelId: string,
): Promise<TunnelConfig> {
  const response = await api.get(
    `/accounts/${api.accountId}/cfd_tunnel/${tunnelId}/configurations`,
  );

  if (!response.ok) {
    await handleApiError(response, "get configuration", "tunnel", tunnelId);
  }

  const data = (await response.json()) as CloudflareApiResponse<{
    config: TunnelConfig;
  }>;
  return data.result.config;
}

/**
 * Delete a tunnel
 * @internal
 */
async function deleteTunnel(
  api: CloudflareApi,
  tunnelId: string,
): Promise<void> {
  const response = await api.delete(
    `/accounts/${api.accountId}/cfd_tunnel/${tunnelId}`,
  );

  if (!response.ok && response.status !== 404) {
    await handleApiError(response, "delete", "tunnel", tunnelId);
  }
}

/**
 * Create a new tunnel
 * @internal
 */
async function createTunnel(
  api: CloudflareApi,
  props: {
    name: string;
    configSrc?: "cloudflare" | "local";
    tunnelSecret?: Secret<string>;
    metadata?: Record<string, any>;
  },
): Promise<CloudflareTunnel> {
  const payload: Record<string, any> = {
    name: props.name,
    config_src: props.configSrc || "cloudflare",
  };

  if (props.tunnelSecret) {
    payload.tunnel_secret = props.tunnelSecret.unencrypted;
  }

  if (props.metadata) {
    payload.metadata = props.metadata;
  }

  const response = await api.post(
    `/accounts/${api.accountId}/cfd_tunnel`,
    payload,
  );

  if (!response.ok) {
    await handleApiError(response, "create", "tunnel", props.name);
  }

  const data =
    (await response.json()) as CloudflareApiResponse<CloudflareTunnel>;
  return data.result;
}

/**
 * Update tunnel configuration
 * @internal
 */
async function updateTunnelConfiguration(
  api: CloudflareApi,
  tunnelId: string,
  config: TunnelConfig,
): Promise<void> {
  const response = await api.put(
    `/accounts/${api.accountId}/cfd_tunnel/${tunnelId}/configurations`,
    { config },
  );

  if (!response.ok) {
    await handleApiError(response, "update configuration", "tunnel", tunnelId);
  }
}

/**
 * List all tunnels with pagination support
 * @internal
 */
export async function listTunnels(
  api: CloudflareApi,
  options?: {
    /** Whether to include deleted tunnels */
    includeDeleted?: boolean;
    /** Maximum number of tunnels to return */
    limit?: number;
  },
): Promise<CloudflareTunnel[]> {
  const tunnels: CloudflareTunnel[] = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by API
  let hasMorePages = true;
  const limit = options?.limit;
  const includeDeleted = options?.includeDeleted ?? false;

  while (hasMorePages) {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
    });

    if (!includeDeleted) {
      params.append("is_deleted", "false");
    }

    const response = await api.get(
      `/accounts/${api.accountId}/cfd_tunnel?${params.toString()}`,
    );

    if (!response.ok) {
      await handleApiError(response, "list", "tunnel", "all");
    }

    const data =
      (await response.json()) as CloudflareApiListResponse<CloudflareTunnel>;

    tunnels.push(...data.result);
    const resultInfo = data.result_info;

    // Check if we've reached the limit
    if (limit && tunnels.length >= limit) {
      return tunnels.slice(0, limit);
    }

    // Check if we've seen all pages
    hasMorePages =
      resultInfo.page * resultInfo.per_page < resultInfo.total_count;
    page++;
  }

  return tunnels;
}

/**
 * Find a tunnel by name with pagination support
 * @internal
 */
export async function findTunnelByName(
  api: CloudflareApi,
  name: string,
): Promise<CloudflareTunnel | null> {
  let page = 1;
  const perPage = 100; // Maximum allowed by API
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await api.get(
      `/accounts/${api.accountId}/cfd_tunnel?page=${page}&per_page=${perPage}&is_deleted=false`,
    );

    if (!response.ok) {
      await handleApiError(response, "list", "tunnel", "all");
    }

    const data =
      (await response.json()) as CloudflareApiListResponse<CloudflareTunnel>;

    const tunnels = data.result;
    const resultInfo = data.result_info;

    // Look for a tunnel with matching name
    const match = tunnels.find((tunnel) => tunnel.name === name);
    if (match) {
      return match;
    }

    // Check if we've seen all pages
    hasMorePages =
      resultInfo.page * resultInfo.per_page < resultInfo.total_count;
    page++;
  }

  // No matching tunnel found
  return null;
}

/**
 * Get tunnel token
 */
async function getTunnelToken(
  api: CloudflareApi,
  tunnelId: string,
): Promise<string> {
  const response = await api.get(
    `/accounts/${api.accountId}/cfd_tunnel/${tunnelId}/token`,
  );

  if (!response.ok) {
    logger.error(
      `Failed to fetch token for tunnel ${tunnelId}: ${response.status} ${response.statusText}`,
    );
    await handleApiError(response, "get token", "tunnel", tunnelId);
  }

  const data = (await response.json()) as CloudflareApiResponse<string>;
  if (!data.result) {
    logger.warn(`Could not retrieve token for tunnel ${tunnelId}`);
  } else {
    logger.log(`Successfully fetched token for tunnel ${tunnelId}`);
  }
  return data.result;
}
