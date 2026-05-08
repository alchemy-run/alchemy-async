import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createHetznerDnsApi,
  type HetznerDnsApiError,
  type HetznerDnsApiOptions,
} from "./dns-api.ts";
import type { DNSZone } from "./dns-zone.ts";

export type DNSRecordType =
  | "A"
  | "AAAA"
  | "CNAME"
  | "MX"
  | "NS"
  | "TXT"
  | "SRV"
  | "CAA"
  | "PTR";

export interface DNSRecordProps extends HetznerDnsApiOptions {
  /**
   * The zone this record belongs to. Accepts a zone ID string or a DNSZone resource.
   * IMMUTABLE: changing this will trigger a replacement.
   */
  zone: string | DNSZone;

  /**
   * The record name, e.g. "www" or "@" for the apex.
   */
  name: string;

  /**
   * The DNS record type.
   * IMMUTABLE: changing this will trigger a replacement.
   */
  type: DNSRecordType;

  /**
   * The record value, e.g. an IP address for A records.
   */
  value: string;

  /**
   * TTL in seconds. Omit to use the zone default.
   */
  ttl?: number;
}

export type DNSRecord = Omit<DNSRecordProps, "zone"> & {
  /**
   * The record ID assigned by Hetzner DNS
   */
  id: string;

  /**
   * The zone ID this record belongs to
   */
  zoneId: string;

  /**
   * ISO 8601 timestamp when the record was created
   */
  created: string;

  /**
   * ISO 8601 timestamp when the record was last modified
   */
  modified: string;
};

/**
 * Manages an individual DNS record within a Hetzner DNS zone.
 *
 * @example
 * // Create an A record pointing to a server IP:
 * const record = await DNSRecord("www-record", {
 *   zone: zone,            // DNSZone resource or zone ID string
 *   name: "www",
 *   type: "A",
 *   value: "192.0.2.1",
 *   ttl: 300,
 * });
 *
 * @example
 * // Create a CNAME record:
 * const record = await DNSRecord("api-record", {
 *   zone: "my-zone-id",
 *   name: "api",
 *   type: "CNAME",
 *   value: "www.example.com",
 * });
 *
 * @example
 * // Create an MX record for email:
 * const record = await DNSRecord("mx-record", {
 *   zone: zone,
 *   name: "@",
 *   type: "MX",
 *   value: "10 mail.example.com",
 * });
 */
export const DNSRecord = Resource(
  "hetzner::DNSRecord",
  async function (
    this: Context<DNSRecord>,
    _id: string,
    props: DNSRecordProps,
  ): Promise<DNSRecord> {
    const zoneId = resolveZoneId(props.zone);

    if (this.scope.local) {
      return {
        id: "local-dns-record-id",
        zoneId,
        name: props.name,
        type: props.type,
        value: props.value,
        ttl: props.ttl ?? 300,
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        apiToken: props.apiToken,
      };
    }

    const api = createHetznerDnsApi({ apiToken: props.apiToken });

    if (this.phase === "delete") {
      if (this.output?.id) {
        try {
          await api.delete(`/records/${this.output.id}`);
        } catch (error) {
          if ((error as HetznerDnsApiError).status !== 404) {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    if (this.phase === "update") {
      const prevZoneId = this.output.zoneId;
      const prevType = this.output.type;

      if (prevZoneId !== zoneId || prevType !== props.type) {
        return this.replace();
      }

      const response = await api.put(`/records/${this.output.id}`, {
        zone_id: zoneId,
        name: props.name,
        type: props.type,
        value: props.value,
        ttl: props.ttl,
      });
      const { record } = (await response.json()) as {
        record: HetznerDnsRecordResponse;
      };
      return toOutput(record, props, zoneId);
    }

    // create
    const response = await api.post("/records", {
      zone_id: zoneId,
      name: props.name,
      type: props.type,
      value: props.value,
      ttl: props.ttl,
    });
    const { record } = (await response.json()) as {
      record: HetznerDnsRecordResponse;
    };
    return toOutput(record, props, zoneId);
  },
);

export function isDNSRecord(resource: any): resource is DNSRecord {
  return resource?.[ResourceKind] === "hetzner::DNSRecord";
}

function resolveZoneId(zone: string | DNSZone): string {
  return typeof zone === "string" ? zone : zone.id;
}

function toOutput(
  record: HetznerDnsRecordResponse,
  props: DNSRecordProps,
  zoneId: string,
): DNSRecord {
  return {
    id: record.id,
    zoneId,
    name: record.name,
    type: record.type as DNSRecordType,
    value: record.value,
    ttl: record.ttl,
    created: record.created,
    modified: record.modified,
    apiToken: props.apiToken,
  };
}

interface HetznerDnsRecordResponse {
  id: string;
  zone_id: string;
  name: string;
  type: string;
  value: string;
  ttl: number;
  created: string;
  modified: string;
}
