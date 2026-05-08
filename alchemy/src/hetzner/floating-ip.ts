import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";
import type { Server } from "./server.ts";

export interface FloatingIPProps extends HetznerApiOptions {
  /**
   * Name for the floating IP.
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * IP version — immutable after creation.
   */
  type: "ipv4" | "ipv6";

  /**
   * Home location for the floating IP (e.g. "fsn1").
   */
  homeLocation?: string;

  /**
   * Server to assign the floating IP to.
   * Accepts a server ID string or a Server resource reference.
   */
  server?: string | Server;

  /**
   * Human-readable description.
   */
  description?: string;

  /**
   * Arbitrary key/value labels.
   */
  labels?: Record<string, string>;

  /**
   * Whether to delete the floating IP when the resource is destroyed.
   * @default true
   */
  delete?: boolean;

  /**
   * Adopt an existing floating IP with the same name instead of failing.
   * @default false
   */
  adopt?: boolean;
}

export type FloatingIP = Omit<FloatingIPProps, "adopt"> & {
  /**
   * Hetzner's numeric ID for this floating IP.
   */
  id: number;

  /**
   * Physical name as stored in Hetzner.
   */
  name: string;

  /**
   * The actual IP address allocated by Hetzner.
   */
  ip: string;

  /**
   * Home location name (e.g. "fsn1").
   */
  homeLocation: string;

  /**
   * Reverse-DNS entries for this IP.
   */
  dnsPtr: Array<{ ip: string; dnsPtr: string }>;

  /**
   * ISO-8601 timestamp of creation.
   */
  created: string;
};

export function isFloatingIP(r: any): r is FloatingIP {
  return r?.[ResourceKind] === "hetzner::FloatingIP";
}

/** Extract a numeric server ID from a string ID or Server resource reference. */
function resolveServerId(
  server: string | Server | undefined,
): number | undefined {
  if (server === undefined) return undefined;
  if (typeof server === "string") return parseInt(server, 10);
  return server.id;
}

/**
 * Create and manage Hetzner Cloud Floating IPs.
 *
 * @example
 * ## Reserve an IPv4 floating IP
 *
 * ```ts
 * const ip = await FloatingIP("my-ip", {
 *   type: "ipv4",
 *   homeLocation: "fsn1",
 * });
 * console.log(ip.ip); // e.g. "203.0.113.1"
 * ```
 *
 * @example
 * ## Assign a floating IP to a server
 *
 * ```ts
 * const server = await Server("web", {
 *   serverType: "cx22",
 *   image: "ubuntu-24.04",
 *   location: "fsn1",
 * });
 *
 * const ip = await FloatingIP("web-ip", {
 *   type: "ipv4",
 *   homeLocation: "fsn1",
 *   server,
 * });
 * ```
 *
 * @example
 * ## Keep the IP after destroy (retain: no-delete)
 *
 * ```ts
 * const ip = await FloatingIP("static-ip", {
 *   type: "ipv4",
 *   homeLocation: "fsn1",
 *   delete: false,
 * });
 * ```
 */
export const FloatingIP = Resource(
  "hetzner::FloatingIP",
  async function (
    this: Context<FloatingIP>,
    id: string,
    props: FloatingIPProps,
  ): Promise<FloatingIP> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      return {
        ...props,
        id: 0,
        name,
        ip: props.type === "ipv4" ? "127.0.0.1" : "::1",
        homeLocation: props.homeLocation ?? "fsn1",
        dnsPtr: [],
        created: new Date().toISOString(),
      };
    }

    const api = createHetznerApi(props);

    if (this.phase === "delete") {
      if (this.output?.id && props.delete !== false) {
        const serverId = resolveServerId(this.output.server);
        if (serverId !== undefined) {
          try {
            await api.post(`/floating_ips/${this.output.id}/actions/unassign`);
          } catch (error: any) {
            logger.warn(`Could not unassign floating IP before delete:`, error);
          }
        }
        try {
          await api.delete(`/floating_ips/${this.output.id}`);
        } catch (error: any) {
          if (error?.status !== 404) {
            logger.error(`Error deleting floating IP ${id}:`, error);
            throw error;
          }
        }
      }
      return this.destroy();
    }

    const serverId = resolveServerId(props.server);

    if (this.phase === "update" && this.output) {
      if (this.output.type !== props.type) {
        return this.replace();
      }

      await api.put(`/floating_ips/${this.output.id}`, {
        name,
        description: props.description,
        labels: props.labels,
      });

      const prevServerId = resolveServerId(this.output.server);
      if (serverId !== prevServerId) {
        if (serverId !== undefined) {
          await api.post(`/floating_ips/${this.output.id}/actions/assign`, {
            server: serverId,
          });
        } else if (prevServerId !== undefined) {
          await api.post(`/floating_ips/${this.output.id}/actions/unassign`);
        }
      }

      const getData: any = await api.get(`/floating_ips/${this.output.id}`);
      return mapApiResponse(getData.floating_ip, props);
    }

    const body: Record<string, unknown> = {
      type: props.type,
      name,
      description: props.description,
      labels: props.labels,
    };
    if (props.homeLocation) body.home_location = props.homeLocation;
    if (serverId !== undefined) body.server = serverId;

    let floatingIpData: any;
    try {
      const data: any = await api.post("/floating_ips", body);
      floatingIpData = data.floating_ip;
    } catch (error: any) {
      if (error?.code === "uniqueness_error" && props.adopt) {
        const existing = await findFloatingIPByName(api, name);
        if (!existing) {
          throw new Error(
            `FloatingIP "${name}" already exists but could not be found for adoption.`,
            { cause: error },
          );
        }
        await api.put(`/floating_ips/${existing.id}`, {
          name,
          description: props.description,
          labels: props.labels,
        });
        if (serverId !== undefined) {
          await api.post(`/floating_ips/${existing.id}/actions/assign`, {
            server: serverId,
          });
        }
        const getData: any = await api.get(`/floating_ips/${existing.id}`);
        floatingIpData = getData.floating_ip;
      } else {
        throw error;
      }
    }

    return mapApiResponse(floatingIpData, props);
  },
);

function mapApiResponse(raw: any, props: FloatingIPProps): FloatingIP {
  return {
    ...props,
    id: raw.id,
    name: raw.name,
    type: raw.type,
    ip: raw.ip,
    homeLocation: raw.home_location?.name ?? "",
    description: raw.description ?? props.description,
    labels: raw.labels ?? props.labels,
    dnsPtr: (raw.dns_ptr ?? []).map((entry: any) => ({
      ip: entry.ip,
      dnsPtr: entry.dns_ptr,
    })),
    created: raw.created,
  };
}

async function findFloatingIPByName(
  api: ReturnType<typeof createHetznerApi>,
  name: string,
): Promise<{ id: number } | undefined> {
  const data: any = await api.get(
    `/floating_ips?name=${encodeURIComponent(name)}`,
  );
  return data.floating_ips?.[0];
}
