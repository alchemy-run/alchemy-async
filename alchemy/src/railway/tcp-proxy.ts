import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isService, type Service } from "./service.ts";

/**
 * Properties for creating a Railway TCP proxy
 */
export interface TcpProxyProps extends RailwayApiOptions {
  /**
   * The service to attach the TCP proxy to
   */
  service: string | Service;

  /**
   * The environment to create the TCP proxy in
   */
  environment: string | Environment;

  /**
   * The application port to proxy traffic to
   */
  applicationPort: number;

  /**
   * Whether to delete the TCP proxy when the resource is destroyed.
   * @default true
   */
  delete?: boolean;
}

/**
 * Output returned after Railway TCP proxy creation
 */
export interface TcpProxy {
  /**
   * The ID of the TCP proxy
   */
  id: string;

  /**
   * The domain to connect to
   */
  domain: string;

  /**
   * The proxy port to connect to
   */
  proxyPort: number;

  /**
   * The application port traffic is forwarded to
   */
  applicationPort: number;

  /**
   * The service ID this TCP proxy is attached to
   */
  serviceId: string;

  /**
   * The environment ID this TCP proxy belongs to
   */
  environmentId: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface TcpProxyCreateResponse {
  tcpProxyCreate: {
    id: string;
    domain: string;
    proxyPort: number;
    applicationPort: number;
  };
}

/**
 * Type guard for Railway TcpProxy
 */
export function isTcpProxy(resource: any): resource is TcpProxy {
  return resource?.[ResourceKind] === "railway::TcpProxy";
}

/**
 * Get the service ID from a service reference
 */
function getServiceId(service: string | Service): string {
  if (isService(service)) {
    return service.id;
  }
  return service;
}

/**
 * Get the environment ID from an environment reference
 */
function getEnvironmentId(environment: string | Environment): string {
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Creates a Railway TCP proxy for non-HTTP traffic.
 *
 * @example
 * // Create a TCP proxy for a database:
 * const proxy = await TcpProxy("db-proxy", {
 *   service: postgresService,
 *   environment: production,
 *   applicationPort: 5432
 * });
 * console.log(`Connect to: ${proxy.domain}:${proxy.proxyPort}`);
 *
 * @example
 * // Create a TCP proxy for Redis:
 * const redisProxy = await TcpProxy("redis-proxy", {
 *   service: redisService,
 *   environment: production,
 *   applicationPort: 6379
 * });
 */
export const TcpProxy = Resource(
  "railway::TcpProxy",
  async function (
    this: Context<TcpProxy>,
    id: string,
    props: TcpProxyProps,
  ): Promise<TcpProxy> {
    const api = createRailwayApi(props);
    const serviceId = getServiceId(props.service);
    const environmentId = getEnvironmentId(props.environment);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.request(
            `
            mutation tcpProxyDelete($id: String!) {
              tcpProxyDelete(id: $id)
            }
          `,
            { id: this.output.id },
          );
        } catch (error) {
          // Ignore 404 errors (TCP proxy already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // TCP proxies are immutable - port changes require replacement
    if (this.phase === "update" && this.output?.id) {
      if (this.output.applicationPort !== props.applicationPort) {
        return this.replace();
      }
      return this.output;
    }

    // Create new TCP proxy
    const data = await api.request<TcpProxyCreateResponse>(
      `
      mutation tcpProxyCreate($input: TCPProxyCreateInput!) {
        tcpProxyCreate(input: $input) {
          id
          domain
          proxyPort
          applicationPort
        }
      }
    `,
      {
        input: {
          serviceId,
          environmentId,
          applicationPort: props.applicationPort,
        },
      },
    );

    return {
      id: data.tcpProxyCreate.id,
      domain: data.tcpProxyCreate.domain,
      proxyPort: data.tcpProxyCreate.proxyPort,
      applicationPort: data.tcpProxyCreate.applicationPort,
      serviceId,
      environmentId,
    };
  },
);
