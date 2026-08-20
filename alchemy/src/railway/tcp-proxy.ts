import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Environment } from "./environment.ts";
import type { Service } from "./service.ts";

/**
 * Properties for creating or updating a Railway TCP Proxy
 */
export interface TCPProxyProps extends RailwayApiOptions {
  /**
   * The service to attach the TCP proxy to
   */
  service: string | Service;

  /**
   * The environment for the TCP proxy
   */
  environment: string | Environment;

  /**
   * The application port to proxy traffic to
   */
  applicationPort: number;
}

/**
 * Output type for a Railway TCP Proxy
 */
export type TCPProxy = Omit<TCPProxyProps, "service" | "environment"> & {
  /**
   * The Railway TCP proxy ID
   */
  proxyId: string;

  /**
   * The service ID
   */
  serviceId: string;

  /**
   * The environment ID
   */
  environmentId: string;

  /**
   * The application port being proxied
   */
  applicationPort: number;

  /**
   * The external domain for the proxy
   */
  domain: string;

  /**
   * The external port assigned to the proxy
   */
  proxyPort: number;
};

/**
 * Type guard for Railway TCPProxy
 */
export function isTCPProxy(resource: any): resource is TCPProxy {
  return resource?.[ResourceKind] === "railway::TCPProxy";
}

/**
 * Creates and manages a Railway TCP proxy for exposing non-HTTP services.
 *
 * @example
 * ## Create a TCP proxy for a database
 *
 * Expose a database service via TCP.
 *
 * ```ts
 * const proxy = await TCPProxy("db-proxy", {
 *   service,
 *   environment: project.defaultEnvironmentId,
 *   applicationPort: 5432,
 * });
 * console.log(`${proxy.domain}:${proxy.proxyPort}`);
 * ```
 *
 * @example
 * ## Create a TCP proxy for Redis
 *
 * Expose a Redis service externally.
 *
 * ```ts
 * const proxy = await TCPProxy("redis-proxy", {
 *   service: "service-id",
 *   environment: "env-id",
 *   applicationPort: 6379,
 * });
 * ```
 */
export const TCPProxy = Resource(
  "railway::TCPProxy",
  async function (
    this: Context<TCPProxy>,
    id: string,
    props: TCPProxyProps,
  ): Promise<TCPProxy> {
    const serviceId =
      typeof props.service === "string"
        ? props.service
        : props.service.serviceId;
    const environmentId =
      typeof props.environment === "string"
        ? props.environment
        : props.environment.environmentId;

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        proxyId: this.output?.proxyId ?? "",
        serviceId,
        environmentId,
        applicationPort: props.applicationPort,
        domain: this.output?.domain ?? "local.railway.internal",
        proxyPort: this.output?.proxyPort ?? props.applicationPort,
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      const proxyId = this.output?.proxyId;
      if (proxyId) {
        await runRailwayDeleteMutation(() =>
          api.query(
            `mutation tcpProxyDelete($id: String!) {
              tcpProxyDelete(id: $id)
            }`,
            { id: proxyId },
          ),
        );
      }
      return this.destroy();
    }

    // applicationPort is immutable — replace if changed
    if (
      this.phase === "update" &&
      this.output?.applicationPort !== props.applicationPort
    ) {
      return this.replace();
    }

    const proxyId = this.output?.proxyId;

    if (proxyId && this.output) {
      // No update needed — applicationPort is immutable
      return this.output;
    }

    // Create
    const data = await api.query<{
      tcpProxyCreate: {
        id: string;
        domain: string;
        proxyPort: number;
        applicationPort: number;
      };
    }>(
      `mutation tcpProxyCreate($input: TCPProxyCreateInput!) {
        tcpProxyCreate(input: $input) {
          id
          domain
          proxyPort
          applicationPort
        }
      }`,
      {
        input: {
          serviceId,
          environmentId,
          applicationPort: props.applicationPort,
        },
      },
    );

    const proxy = data.tcpProxyCreate;

    return {
      proxyId: proxy.id,
      serviceId,
      environmentId,
      applicationPort: proxy.applicationPort,
      domain: proxy.domain,
      proxyPort: proxy.proxyPort,
    };
  },
);
