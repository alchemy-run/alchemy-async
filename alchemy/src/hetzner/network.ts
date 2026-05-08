import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";

export interface SubnetConfig {
  type: "cloud" | "server" | "vswitch";
  networkZone: string;
  ipRange?: string;
  vswitchId?: number;
}

export interface NetworkProps extends HetznerApiOptions {
  /**
   * Name of the network
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * IP range of the network in CIDR notation (e.g. "10.0.0.0/16")
   * IMMUTABLE: changing this will trigger a replacement
   */
  ipRange: string;

  /**
   * Subnets to configure within this network
   */
  subnets?: SubnetConfig[];

  /**
   * User-defined labels (key-value pairs)
   */
  labels?: Record<string, string>;

  /**
   * When true, adopt an existing network with the same name rather than failing
   */
  adopt?: boolean;
}

export type Network = Omit<NetworkProps, "adopt"> & {
  /**
   * The numeric ID of the network assigned by Hetzner
   */
  id: number;

  /**
   * Name of the network (always set in output)
   */
  name: string;

  /**
   * IDs of servers attached to this network
   */
  servers: number[];

  /**
   * ISO 8601 timestamp of when the network was created
   */
  created: string;
};

function subnetKey(s: SubnetConfig): string {
  return [s.type, s.networkZone, s.ipRange ?? "", s.vswitchId ?? ""].join("|");
}

function toApiSubnet(s: SubnetConfig): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    type: s.type,
    network_zone: s.networkZone,
  };
  if (s.ipRange !== undefined) obj.ip_range = s.ipRange;
  if (s.vswitchId !== undefined) obj.vswitch_id = s.vswitchId;
  return obj;
}

/**
 * Create and manage a Hetzner Cloud Network.
 *
 * @example
 * // Create a basic private network:
 * const network = await Network("app-network", {
 *   ipRange: "10.0.0.0/16",
 * });
 *
 * @example
 * // Create a network with subnets:
 * const network = await Network("app-network", {
 *   name: "my-network",
 *   ipRange: "10.0.0.0/16",
 *   subnets: [
 *     { type: "cloud", networkZone: "eu-central", ipRange: "10.0.1.0/24" },
 *   ],
 *   labels: { env: "production" },
 * });
 *
 * @example
 * // Adopt an existing network:
 * const network = await Network("existing-network", {
 *   name: "existing-network",
 *   ipRange: "10.0.0.0/16",
 *   adopt: true,
 * });
 */
export const Network = Resource(
  "hetzner::Network",
  async function (
    this: Context<Network>,
    id: string,
    props: NetworkProps,
  ): Promise<Network> {
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      const { adopt: _adopt, ...rest } = props;
      return {
        ...rest,
        id: 0,
        name,
        servers: [],
        created: new Date().toISOString(),
      };
    }

    const api = createHetznerApi(props);

    if (this.phase === "delete") {
      if (this.output?.id) {
        await api.delete(`/networks/${this.output.id}`);
      }
      return this.destroy();
    }

    if (this.phase === "update") {
      if (this.output.ipRange !== props.ipRange) {
        return this.replace(true);
      }

      const networkId = this.output.id;

      await api.put(`/networks/${networkId}`, {
        name,
        labels: props.labels ?? {},
      });

      const currentSubnetKeys = new Set(
        (this.output.subnets ?? []).map(subnetKey),
      );
      const desiredSubnets = props.subnets ?? [];
      const desiredSubnetKeys = new Set(desiredSubnets.map(subnetKey));

      const toAdd = desiredSubnets.filter(
        (s) => !currentSubnetKeys.has(subnetKey(s)),
      );
      const toRemove = (this.output.subnets ?? []).filter(
        (s) => !desiredSubnetKeys.has(subnetKey(s)),
      );

      await Promise.all([
        ...toAdd.map((s) =>
          api.post(`/networks/${networkId}/actions/add_subnet`, toApiSubnet(s)),
        ),
        ...toRemove.map((s) =>
          api.post(
            `/networks/${networkId}/actions/delete_subnet`,
            toApiSubnet(s),
          ),
        ),
      ]);

      const updated: any = await api.get(`/networks/${networkId}`);
      return networkFromApi(updated.network, props);
    }

    // create phase
    const adopt = props.adopt ?? this.scope.adopt;

    try {
      const body: Record<string, unknown> = {
        name,
        ip_range: props.ipRange,
        labels: props.labels ?? {},
      };
      if (props.subnets?.length) {
        body.subnets = props.subnets.map(toApiSubnet);
      }

      const data: any = await api.post("/networks", body);
      return networkFromApi(data.network, props);
    } catch (err: any) {
      if (adopt && err?.status === 422) {
        const list: any = await api.get(
          `/networks?name=${encodeURIComponent(name)}`,
        );
        const existing = list?.networks?.[0];
        if (!existing) {
          throw new Error(
            `Network "${name}" could not be created and could not be found for adoption.`,
            { cause: err },
          );
        }
        return networkFromApi(existing, props);
      }
      throw err;
    }
  },
);

function networkFromApi(n: Record<string, any>, props: NetworkProps): Network {
  const { adopt: _adopt, ...rest } = props;
  return {
    ...rest,
    id: n.id,
    name: n.name,
    ipRange: n.ip_range,
    subnets: (n.subnets ?? []).map(
      (s: any): SubnetConfig => ({
        type: s.type,
        networkZone: s.network_zone,
        ipRange: s.ip_range,
        vswitchId: s.vswitch_id,
      }),
    ),
    labels: n.labels ?? {},
    servers: n.servers ?? [],
    created: n.created,
  };
}

export function isNetwork(r: any): r is Network {
  return r?.[ResourceKind] === "hetzner::Network";
}
