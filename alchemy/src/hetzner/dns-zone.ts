import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import {
  createHetznerDnsApi,
  type HetznerDnsApiError,
  type HetznerDnsApiOptions,
} from "./dns-api.ts";

export interface DNSZoneProps extends HetznerDnsApiOptions {
  /**
   * The domain name for the zone, e.g. "example.com"
   * IMMUTABLE: changing this will trigger a replacement.
   */
  name: string;

  /**
   * Default TTL in seconds for records in this zone
   */
  ttl?: number;

  /**
   * Whether to delete the zone when the resource is destroyed
   * @default true
   */
  delete?: boolean;

  /**
   * Adopt an existing zone with this name instead of failing on conflict
   * @default false
   */
  adopt?: boolean;
}

export type DNSZone = Omit<DNSZoneProps, "adopt"> & {
  /**
   * The zone ID assigned by Hetzner DNS
   */
  id: string;

  /**
   * The domain name
   */
  name: string;

  /**
   * Default TTL in seconds
   */
  ttl: number;

  /**
   * Verification status of the zone
   */
  status: "verified" | "failed" | "pending";

  /**
   * Nameservers assigned by Hetzner for this zone
   */
  nsSet: string[];

  /**
   * ISO 8601 timestamp when the zone was created
   */
  created: string;

  /**
   * ISO 8601 timestamp when the zone was last modified
   */
  modified: string;
};

/**
 * Manages a DNS zone in Hetzner DNS.
 *
 * @example
 * // Create a DNS zone for a domain:
 * const zone = await DNSZone("example-zone", {
 *   name: "example.com",
 *   ttl: 86400,
 * });
 * console.log(zone.nsSet); // nameservers to configure at your registrar
 *
 * @example
 * // Adopt an existing zone:
 * const zone = await DNSZone("example-zone", {
 *   name: "example.com",
 *   adopt: true,
 * });
 *
 * @example
 * // Create a zone without deleting it on destroy:
 * const zone = await DNSZone("example-zone", {
 *   name: "example.com",
 *   delete: false,
 * });
 */
export const DNSZone = Resource(
  "hetzner::DNSZone",
  async function (
    this: Context<DNSZone>,
    _id: string,
    props: DNSZoneProps,
  ): Promise<DNSZone> {
    if (this.scope.local) {
      return {
        id: "local-dns-zone-id",
        name: props.name,
        ttl: props.ttl ?? 86400,
        status: "verified",
        nsSet: [
          "hydrogen.ns.hetzner.com",
          "oxygen.ns.hetzner.com",
          "helium.ns.hetzner.de",
        ],
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        apiToken: props.apiToken,
        delete: props.delete,
      };
    }

    const api = createHetznerDnsApi({ apiToken: props.apiToken });

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.delete(`/zones/${this.output.id}`);
        } catch (error) {
          if ((error as HetznerDnsApiError).status !== 404) {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    if (this.phase === "update") {
      if (this.output.name !== props.name) {
        return this.replace();
      }

      const response = await api.put(`/zones/${this.output.id}`, {
        name: props.name,
        ttl: props.ttl ?? this.output.ttl,
      });
      const { zone } = (await response.json()) as {
        zone: HetznerDnsZoneResponse;
      };
      return toOutput(zone, props);
    }

    // create
    let zone: HetznerDnsZoneResponse;
    try {
      const response = await api.post("/zones", {
        name: props.name,
        ttl: props.ttl,
      });
      ({ zone } = (await response.json()) as { zone: HetznerDnsZoneResponse });
    } catch (error) {
      const apiError = error as HetznerDnsApiError;
      if (apiError.status === 422 && props.adopt) {
        zone = await findZoneByName(api, props.name);
      } else {
        throw error;
      }
    }

    return toOutput(zone, props);
  },
);

function toOutput(zone: HetznerDnsZoneResponse, props: DNSZoneProps): DNSZone {
  return {
    id: zone.id,
    name: zone.name,
    ttl: zone.ttl,
    status: zone.status as "verified" | "failed" | "pending",
    nsSet: zone.ns_set ?? [],
    created: zone.created,
    modified: zone.modified,
    apiToken: props.apiToken,
    delete: props.delete,
  };
}

async function findZoneByName(
  api: ReturnType<typeof createHetznerDnsApi>,
  name: string,
): Promise<HetznerDnsZoneResponse> {
  const response = await api.get(`/zones?name=${encodeURIComponent(name)}`);
  const { zones } = (await response.json()) as {
    zones: HetznerDnsZoneResponse[];
  };
  const zone = zones.find((z) => z.name === name);
  if (!zone) {
    throw new Error(`DNS zone "${name}" not found for adoption.`);
  }
  return zone;
}

interface HetznerDnsZoneResponse {
  id: string;
  name: string;
  ttl: number;
  status: string;
  ns_set: string[];
  created: string;
  modified: string;
}
