import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";

export interface ServerPublicNet {
  ipv4?: { ip: string; dnsPtr: string; id: number } | null;
  ipv6?: { ip: string; dnsPtr: string[]; id: number } | null;
}

export interface ServerPrivateNet {
  networkId: number;
  ip: string;
  aliasIps: string[];
  macAddress: string;
}

export interface ServerProps extends HetznerApiOptions {
  name?: string;
  /** e.g. "cx22", "cpx11" — IMMUTABLE */
  serverType: string;
  /** e.g. "ubuntu-24.04" — IMMUTABLE */
  image: string;
  /** e.g. "fsn1", "nbg1", "hel1" */
  location?: string;
  /** mutually exclusive with location */
  datacenter?: string;
  sshKeys?: string[];
  networks?: string[];
  firewalls?: string[];
  /** cloud-init script — IMMUTABLE */
  userData?: string;
  labels?: Record<string, string>;
  publicNet?: { enableIpv4?: boolean; enableIpv6?: boolean };
  adopt?: boolean;
}

export type Server = Omit<ServerProps, "adopt"> & {
  id: number;
  name: string;
  status:
    | "initializing"
    | "starting"
    | "running"
    | "stopping"
    | "off"
    | "deleting"
    | "rebuilding"
    | "migrating"
    | "unknown";
  publicNet: ServerPublicNet;
  privateNet: ServerPrivateNet[];
  datacenter: string;
  location: string;
  created: string;
};

export function isServer(r: unknown): r is Server {
  return (r as any)?.[ResourceKind] === "hetzner::Server";
}

interface HetznerServerResponse {
  server: {
    id: number;
    name: string;
    status: string;
    public_net: {
      ipv4?: { ip: string; dns_ptr: string; id: number } | null;
      ipv6?: {
        ip: string;
        dns_ptr_entries: { ip: string; dns_ptr: string }[];
        id: number;
      } | null;
    };
    private_net: Array<{
      network: number;
      ip: string;
      alias_ips: string[];
      mac_address: string;
    }>;
    datacenter: { location: { name: string }; name: string };
    created: string;
    labels: Record<string, string>;
  };
}

function mapServer(
  raw: HetznerServerResponse["server"],
  props: ServerProps,
): Server {
  return {
    ...props,
    id: raw.id,
    name: raw.name,
    status: raw.status as Server["status"],
    publicNet: {
      ipv4: raw.public_net.ipv4
        ? {
            ip: raw.public_net.ipv4.ip,
            dnsPtr: raw.public_net.ipv4.dns_ptr,
            id: raw.public_net.ipv4.id,
          }
        : null,
      ipv6: raw.public_net.ipv6
        ? {
            ip: raw.public_net.ipv6.ip,
            dnsPtr: raw.public_net.ipv6.dns_ptr_entries.map((e) => e.dns_ptr),
            id: raw.public_net.ipv6.id,
          }
        : null,
    },
    privateNet: raw.private_net.map((pn) => ({
      networkId: pn.network,
      ip: pn.ip,
      aliasIps: pn.alias_ips,
      macAddress: pn.mac_address,
    })),
    datacenter: raw.datacenter.name,
    location: raw.datacenter.location.name,
    created: raw.created,
    labels: raw.labels,
  };
}

/**
 * Hetzner Cloud Server resource.
 *
 * @example
 * const server = await Server("web", {
 *   serverType: "cx22",
 *   image: "ubuntu-24.04",
 *   location: "fsn1",
 * });
 */
export const Server = Resource(
  "hetzner::Server",
  async function (
    this: Context<Server>,
    id: string,
    props: ServerProps,
  ): Promise<Server> {
    if (this.scope.local) {
      if (this.phase === "delete") return this.destroy();
      return {
        ...props,
        id: 0,
        name: props.name ?? id,
        status: "running",
        publicNet: {},
        privateNet: [],
        datacenter: props.datacenter ?? "fsn1-dc14",
        location: props.location ?? "fsn1",
        created: new Date().toISOString(),
      };
    }

    const api = createHetznerApi(props);

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.deleteAndWait(`/servers/${this.output.id}`);
      }
      return this.destroy();
    }

    if (this.phase === "update") {
      const immutableChanged =
        props.serverType !== this.props?.serverType ||
        props.image !== this.props?.image ||
        props.userData !== this.props?.userData;

      if (immutableChanged) {
        this.replace(true);
      }

      const { server: raw } = await api.put<HetznerServerResponse>(
        `/servers/${this.output.id}`,
        { name: props.name ?? this.output.name, labels: props.labels ?? {} },
      );
      return mapServer(raw, props);
    }

    // create
    const body: Record<string, unknown> = {
      name: props.name ?? this.scope.createPhysicalName(id, "-", 63),
      server_type: props.serverType,
      image: props.image,
      labels: props.labels ?? {},
    };
    if (props.location) body.location = props.location;
    if (props.datacenter) body.datacenter = props.datacenter;
    if (props.sshKeys?.length) body.ssh_keys = props.sshKeys;
    if (props.networks?.length) body.networks = props.networks;
    if (props.firewalls?.length)
      body.firewalls = props.firewalls.map((fw) => ({ firewall: fw }));
    if (props.userData) body.user_data = props.userData;
    if (props.publicNet) {
      body.public_net = {
        enable_ipv4: props.publicNet.enableIpv4 ?? true,
        enable_ipv6: props.publicNet.enableIpv6 ?? true,
      };
    }

    // Retry on 409 name-conflict: after a force-replace, Hetzner may not
    // immediately free the name even once the delete action completes.
    let raw: HetznerServerResponse["server"];
    {
      const deadline = Date.now() + 60_000;
      while (true) {
        try {
          ({ server: raw } = await api.post<HetznerServerResponse>(
            "/servers",
            body,
          ));
          break;
        } catch (err: any) {
          if (err?.status === 409 && Date.now() < deadline) {
            await new Promise((r) => setTimeout(r, 2_000));
            continue;
          }
          throw err;
        }
      }
    }

    // poll until running
    await pollUntil(
      () =>
        api
          .get<HetznerServerResponse>(`/servers/${raw.id}`)
          .then((r) => r.server.status),
      (status) => status === "running",
      60_000,
    );

    const { server: ready } = await api.get<HetznerServerResponse>(
      `/servers/${raw.id}`,
    );
    return mapServer(ready, props);
  },
);

async function pollUntil<T>(
  fn: () => Promise<T>,
  predicate: (v: T) => boolean,
  timeoutMs: number,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let delay = 1_000;
  while (Date.now() < deadline) {
    const v = await fn();
    if (predicate(v)) return;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 5_000);
  }
  throw new Error("Timed out waiting for Hetzner server to become running");
}
