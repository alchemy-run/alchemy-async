import type { Context } from "../context";
import { Resource } from "../resource.ts";
import { isCloudflareApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { Tunnel } from "./tunnel.ts";

/**
 * Properties for creating or updating a VPC service.
 */
export interface VpcServiceProps extends CloudflareApiOptions {
  /**
   * The name of the VPC service to create.
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;
  /**
   * The type of the VPC service. Currently only "http" is supported, but tcp will be supported in the future.
   *
   * @default "http"
   */
  serviceType?: "http";
  /**
   * The TCP port for the VPC service.
   */
  tcpPort?: number;
  /**
   * The application protocol for the VPC service.
   */
  appProtocol?: string;
  /**
   * The HTTP port for the VPC service.
   *
   * @default 80
   */
  httpPort?: number;
  /**
   * The HTTPS port for the VPC service.
   *
   * @default 443
   */
  httpsPort?: number;
  /**
   * The host for the VPC service.
   */
  host:
    | VpcService.IPv4Host
    | VpcService.IPv6Host
    | VpcService.DualStackHost
    | VpcService.HostnameHost;
  /**
   * Whether to adopt the VPC service if it already exists.
   *
   * @default false
   */
  adopt?: boolean;
}

export declare namespace VpcService {
  /** Host definition: hostname (with resolver network) or IPv4/IPv6/dual-stack with network. */
  export type Host = IPv4Host | IPv6Host | DualStackHost | HostnameHost;

  /**
   * Represents a VPC service that is accessible via an IPv4 address.
   */
  export interface IPv4Host {
    ipv4: string;
    network: Network;
  }

  /**
   * Represents a VPC service that is accessible via an IPv6 address.
   */
  export interface IPv6Host {
    ipv6: string;
    network: Network;
  }

  /**
   * Represents a VPC service that is accessible via both IPv4 and IPv6 addresses.
   */
  export interface DualStackHost {
    ipv4: string;
    ipv6: string;
    network: Network;
  }

  /**
   * Network the VPC service is reached through. Use a `Tunnel` resource or an existing `tunnelId`.
   */
  export type Network = { tunnelId: string } | { tunnel: Tunnel };

  /**
   * Hostname-based host. DNS is resolved over the resolver network (tunnel).
   * Optionally specify `resolverIps` for explicit DNS resolver IPs.
   */
  export interface HostnameHost {
    hostname: string;
    resolverNetwork: Network & { resolverIps?: string[] };
  }
}

/**
 * A VPC service instance. Bind to a Worker to allow the Worker to fetch from
 * the private host (hostname or IP) over the configured tunnel.
 */
export type VpcService = Omit<VpcServiceProps, "name" | "adopt"> & {
  /** Display name of the service. */
  name: string;
  /** Cloudflare-assigned service ID. */
  serviceId: string;
  /** Creation time (Unix ms). */
  createdAt: number;
  /** Last update time (Unix ms). */
  updatedAt: number;
  /** Resource kind for bindings. */
  type: "vpc_service";
};

/**
 * Create or update a VPC service that routes Worker traffic to a private host
 * (hostname or IP) through a Cloudflare Tunnel.
 *
 * [VPC Services](https://developers.cloudflare.com/workers-vpc/configuration/vpc-services/)
 * enable Workers to securely access private network resources through Cloudflare Tunnel.
 * Configure a host (hostname or IP) and optional ports, then bind the service to a Worker
 * to reach private backends.
 *
 * @example
 * // Minimal: hostname through a tunnel
 * ```ts
 * const tunnel = await Tunnel("my-tunnel", {
 *   ingress: [{ service: "http://localhost:3000" }],
 * });
 * const vpcService = await VpcService("my-service", {
 *   host: {
 *     hostname: "localhost",
 *     resolverNetwork: { tunnel, resolverIps: ["127.0.0.1"] },
 *   },
 * });
 * ```
 *
 * @example
 * // IPv4 address
 * ```ts
 * const vpcService = await VpcService("internal-api", {
 *   host: {
 *     ipv4: "192.168.1.100",
 *     network: { tunnel },
 *   },
 * });
 * ```
 *
 * @example
 * // IPv6 address
 * ```ts
 * const vpcService = await VpcService("ipv6-service", {
 *   host: { ipv6: "::1", network: { tunnel } },
 * });
 * ```
 *
 * @example
 * // Dual stack (IPv4 + IPv6)
 * ```ts
 * const vpcService = await VpcService("dual-stack-service", {
 *   host: {
 *     ipv4: "192.168.1.100",
 *     ipv6: "::1",
 *     network: { tunnel },
 *   },
 * });
 * ```
 *
 * @example
 * // Custom HTTP/HTTPS ports
 * ```ts
 * const vpcService = await VpcService("dev-server", {
 *   httpPort: 5173,
 *   httpsPort: 5174,
 *   host: {
 *     hostname: "localhost",
 *     resolverNetwork: { tunnel, resolverIps: ["127.0.0.1"] },
 *   },
 * });
 * ```
 *
 * @example
 * // Bind to a Worker
 * ```ts
 * const vpcService = await VpcService("private-api", {
 *   httpPort: 8080,
 *   host: {
 *     hostname: "internal-api",
 *     resolverNetwork: { tunnel, resolverIps: ["10.0.0.1"] },
 *   },
 * });
 * const worker = await Worker("api-gateway", {
 *   entrypoint: "./src/worker.ts",
 *   bindings: { PRIVATE_API: vpcService },
 * });
 * ```
 *
 * @example
 * // Existing tunnel by ID
 * ```ts
 * const vpcService = await VpcService("existing-tunnel-service", {
 *   host: {
 *     hostname: "internal.example.com",
 *     resolverNetwork: {
 *       tunnelId: "e6a0817c-79c5-40ca-9776-a1c019defe70",
 *       resolverIps: ["10.0.0.53"],
 *     },
 *   },
 * });
 * ```
 *
 * @example
 * // Adopt an existing VPC service
 * ```ts
 * const vpcService = await VpcService("adopted-service", {
 *   name: "existing-service-name",
 *   adopt: true,
 *   host: {
 *     hostname: "localhost",
 *     resolverNetwork: { tunnel },
 *   },
 * });
 * ```
 */
export const VpcService = Resource(
  "cloudflare::VpcService",
  async function (
    this: Context<VpcService>,
    id: string,
    props: VpcServiceProps,
  ): Promise<VpcService> {
    const api = await createCloudflareApi(props);
    if (this.phase === "delete") {
      if (this.output?.serviceId) {
        await deleteService(api, this.output.serviceId);
      }
      return this.destroy();
    }
    const input: ConnectivityService.Input = {
      name: props.name ?? this.scope.createPhysicalName(id),
      type: props.serviceType ?? "http",
      tcp_port: props.tcpPort,
      app_protocol: props.appProtocol,
      http_port: props.httpPort,
      https_port: props.httpsPort,
      host: normalizeHost(props.host),
    };
    switch (this.phase) {
      case "create": {
        const adopt = props.adopt ?? this.scope.adopt;
        const service = await createService(api, input).catch(async (err) => {
          if (isCloudflareApiError(err, { code: 5101 }) && adopt) {
            const services = await listServices(api);
            const service = services.find((s) => s.name === input.name);
            if (service) {
              return await updateService(api, service.service_id, input);
            }
          }
          throw err;
        });
        return formatOutput(service);
      }
      case "update": {
        const service = await updateService(api, this.output.serviceId, input);
        return formatOutput(service);
      }
    }

    function normalizeHost(host: VpcService.Host): ConnectivityService.Host {
      if ("hostname" in host) {
        return {
          hostname: host.hostname,
          resolver_network: normalizeNetwork(host.resolverNetwork),
        };
      }
      return {
        ...host,
        network: normalizeNetwork(host.network),
      };
    }

    function normalizeNetwork<T extends VpcService.Network>(
      network: T,
    ): ConnectivityService.Network {
      if ("tunnelId" in network) {
        const { tunnelId, ...rest } = network;
        return { tunnel_id: network.tunnelId, ...rest };
      }
      const { tunnel, ...rest } = network;
      return { tunnel_id: tunnel.tunnelId, ...rest };
    }

    function formatOutput(service: ConnectivityService): VpcService {
      return {
        name: service.name,
        serviceId: service.service_id,
        serviceType: service.type,
        tcpPort: service.tcp_port,
        appProtocol: service.app_protocol,
        httpPort: service.http_port,
        httpsPort: service.https_port,
        host:
          "hostname" in service.host
            ? {
                hostname: service.host.hostname,
                resolverNetwork: {
                  tunnelId: service.host.resolver_network.tunnel_id,
                  resolverIps: service.host.resolver_network.resolver_ips,
                },
              }
            : {
                ...service.host,
                network: { tunnelId: service.host.network.tunnel_id },
              },
        createdAt: new Date(service.created_at).getTime(),
        updatedAt: new Date(service.updated_at).getTime(),
        type: "vpc_service",
      };
    }
  },
);

/**
 * Create a connectivity (VPC) service via the Cloudflare API.
 * @internal
 */
export async function createService(
  api: CloudflareApi,
  body: ConnectivityService.Input,
): Promise<ConnectivityService> {
  return await extractCloudflareResult<ConnectivityService>(
    `create connectivity service`,
    api.post(
      `/accounts/${api.accountId}/connectivity/directory/services`,
      body,
    ),
  );
}

/**
 * Delete a connectivity (VPC) service. No-op if the service is already gone (404).
 * @internal
 */
export async function deleteService(
  api: CloudflareApi,
  serviceId: string,
): Promise<void> {
  await extractCloudflareResult(
    `delete connectivity service "${serviceId}"`,
    api.delete(
      `/accounts/${api.accountId}/connectivity/directory/services/${serviceId}`,
    ),
  ).catch((err) => {
    if (!isCloudflareApiError(err, { status: 404 })) {
      throw err;
    }
  });
}

/**
 * Fetch a single connectivity (VPC) service by ID.
 * @internal
 */
export async function getService(
  api: CloudflareApi,
  serviceId: string,
): Promise<ConnectivityService> {
  return await extractCloudflareResult<ConnectivityService>(
    `get connectivity service "${serviceId}"`,
    api.get(
      `/accounts/${api.accountId}/connectivity/directory/services/${serviceId}`,
    ),
  );
}

/**
 * List connectivity (VPC) services for the account.
 * @internal
 */
export async function listServices(
  api: CloudflareApi,
): Promise<ConnectivityService[]> {
  return await extractCloudflareResult<ConnectivityService[]>(
    `list connectivity services`,
    api.get(
      `/accounts/${api.accountId}/connectivity/directory/services?per_page=1000`,
    ),
  );
}

/**
 * Update an existing connectivity (VPC) service.
 * @internal
 */
export async function updateService(
  api: CloudflareApi,
  serviceId: string,
  body: ConnectivityService.Input,
): Promise<ConnectivityService> {
  return await extractCloudflareResult<ConnectivityService>(
    `update connectivity service "${serviceId}"`,
    api.put(
      `/accounts/${api.accountId}/connectivity/directory/services/${serviceId}`,
      body,
    ),
  );
}

interface ConnectivityService extends ConnectivityService.Input {
  service_id: string;
  created_at: string;
  updated_at: string;
}

declare namespace ConnectivityService {
  export interface Input {
    name: string;
    type: "http";
    tcp_port?: number;
    app_protocol?: string;
    http_port?: number;
    https_port?: number;
    host: Host;
  }

  export type Host = IPv4Host | IPv6Host | DualStackHost | HostnameHost;

  export interface IPv4Host {
    ipv4: string;
    network: Network;
  }

  export interface IPv6Host {
    ipv6: string;
    network: Network;
  }

  export interface DualStackHost {
    ipv4: string;
    ipv6: string;
    network: Network;
  }

  export interface Network {
    tunnel_id: string;
  }

  export interface HostnameHost {
    hostname: string;
    resolver_network: ResolverNetwork;
  }

  export interface ResolverNetwork extends Network {
    resolver_ips?: string[];
  }
}
