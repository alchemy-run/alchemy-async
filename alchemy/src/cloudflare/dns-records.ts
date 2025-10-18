import type { Context } from "../context.ts";
import type {
  DnsRecord as BaseDnsRecord,
  DnsRecordType,
  DnsRecordWithMetadata,
} from "../dns/record.ts";
import { Resource } from "../resource.ts";
import { logger } from "../util/logger.ts";
import {
  type CloudflareApi,
  type CloudflareApiOptions,
  createCloudflareApi,
} from "./api.ts";
import type { CloudflareResponse } from "./response.ts";

/**
 * Cloudflare DNS Record response format
 */
interface CloudflareDnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
  proxiable: boolean;
  proxied: boolean;
  ttl: number;
  locked: boolean;
  zone_id: string;
  zone_name: string;
  created_on: string;
  modified_on: string;
  data?: Record<string, unknown>;
  priority?: number;
  comment?: string;
  tags?: string[];
}

/**
 * Properties for a DNS record
 */
export interface DnsRecordProps extends Omit<BaseDnsRecord, "type"> {
  /**
   * Record type (A, AAAA, CNAME, etc.)
   */
  type: DnsRecordType;
}

/**
 * Output returned after DNS record creation/update
 */
export interface DnsRecord extends DnsRecordWithMetadata {}

/**
 * Properties for managing multiple DNS records
 */
export interface DnsRecordsProps extends CloudflareApiOptions {
  /**
   * Zone ID or domain name where records will be created
   */
  zoneId: string;

  /**
   * Array of DNS records to manage
   */
  records: DnsRecordProps[];
}

/**
 * Output returned after DNS records creation/update
 */
export interface DnsRecords {
  /**
   * Zone ID where records are created
   */
  zoneId: string;

  /**
   * Array of created/updated DNS records
   */
  records: DnsRecord[];
}

/**
 * Manages a batch of DNS records in a Cloudflare zone.
 * Supports creating, updating, and deleting multiple records at once.
 *
 * @example
 * // Create multiple A and CNAME records
 * const dnsRecords = await DnsRecords("example.com-dns", {
 *   zone: "example.com",
 *   records: [
 *     {
 *       name: "www.example.com",
 *       type: "A",
 *       content: "192.0.2.1",
 *       proxied: true
 *     },
 *     {
 *       name: "blog.example.com",
 *       type: "CNAME",
 *       content: "www.example.com",
 *       proxied: true
 *     }
 *   ]
 * });
 *
 * @example
 * // Create MX records for email routing
 * const emailRecords = await DnsRecords("example.com-email", {
 *   zone: "example.com",
 *   records: [
 *     {
 *       name: "example.com",
 *       type: "MX",
 *       content: "aspmx.l.google.com",
 *       priority: 1
 *     },
 *     {
 *       name: "example.com",
 *       type: "MX",
 *       content: "alt1.aspmx.l.google.com",
 *       priority: 5
 *     }
 *   ]
 * });
 */
export const DnsRecords = Resource(
  "cloudflare::DnsRecords",
  async function (
    this: Context<DnsRecords>,
    _id: string,
    props: DnsRecordsProps,
  ): Promise<DnsRecords> {
    // Create Cloudflare API client
    const api = await createCloudflareApi(props);

    // Get zone ID if domain name was provided
    const zoneId = props.zoneId;

    if (this.phase === "delete") {
      if (this.output?.records) {
        // Delete all existing records
        await Promise.all(
          this.output.records.map(async (record) => {
            try {
              const response = await api.delete(
                `/zones/${zoneId}/dns_records/${record.id}`,
              );
              if (!response.ok && response.status !== 404) {
                logger.error(
                  `Failed to delete DNS record ${record.name}: ${response.statusText}`,
                );
              }
            } catch (error) {
              logger.error(`Error deleting DNS record ${record.name}:`, error);
            }
          }),
        );
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.records) {
      // Get current records to compare with desired state
      const currentRecords = this.output.records;
      const desiredRecords = props.records;

      // Find records to delete (exist in current but not in desired)
      const recordsToDelete = currentRecords.filter(
        (current) =>
          !desiredRecords.some(
            (desired) =>
              desired.name === current.name && desired.type === current.type,
          ),
      );

      // Delete orphaned records
      await Promise.all(
        recordsToDelete.map(async (record) => {
          try {
            const response = await api.delete(
              `/zones/${zoneId}/dns_records/${record.id}`,
            );
            if (!response.ok && response.status !== 404) {
              logger.error(
                `Failed to delete DNS record ${record.name}: ${response.statusText}`,
              );
            }
          } catch (error) {
            logger.error(`Error deleting DNS record ${record.name}:`, error);
          }
        }),
      );

      // Update or create records
      const updatedRecords = await Promise.all(
        desiredRecords.map(async (desired) => {
          // Find matching existing record
          const existing = currentRecords.find(
            (current) =>
              current.name === desired.name && current.type === desired.type,
          );

          if (existing) {
            // Update if content or other properties changed
            if (
              existing.content !== desired.content ||
              existing.ttl !== (desired.ttl || 1) ||
              existing.proxied !== (desired.proxied || false) ||
              existing.priority !== desired.priority ||
              existing.comment !== desired.comment
            ) {
              return createOrUpdateRecord(api, zoneId, desired, existing.id);
            }
            return existing;
          }
          // Create new record
          return createOrUpdateRecord(api, zoneId, desired);
        }),
      );

      return {
        zoneId,
        records: updatedRecords,
      };
    }

    // Create new records
    const uniqueRecords = props.records.reduce(
      (acc, record) => {
        // For record types that can have multiple entries with the same name (MX, TXT, NS, etc.),
        // include content and/or priority in the key to avoid deduplication
        let key = `${record.name}-${record.type}`;

        // If it's a record type that can have multiple entries with the same name, make the key unique
        if (["MX", "TXT", "NS", "SRV", "CAA"].includes(record.type)) {
          // For MX, include priority in the key
          if (record.type === "MX" || record.type === "SRV") {
            key = `${key}-${record.priority}-${record.content}`;
          } else {
            // For other multi-record types, content is the differentiator
            key = `${key}-${record.content}`;
          }
        }

        acc[key] = record;
        return acc;
      },
      {} as Record<string, DnsRecordProps>,
    );

    const createdRecords = await Promise.all(
      Object.values(uniqueRecords).map(async (record) => {
        // First check if record exists
        const listResponse = await api.get(
          `/zones/${zoneId}/dns_records?type=${record.type}&name=${record.name}`,
        );
        if (!listResponse.ok) {
          throw new Error(
            `Failed to check existing DNS records: ${listResponse.statusText}`,
          );
        }

        const listResult = (await listResponse.json()) as CloudflareResponse<
          CloudflareDnsRecord[]
        >;
        const existingRecord = listResult.result[0];

        return createOrUpdateRecord(api, zoneId, record, existingRecord?.id);
      }),
    );

    return {
      zoneId,
      records: createdRecords,
    };
  },
);

/**
 * Create or update a DNS record
 */
async function createOrUpdateRecord(
  api: CloudflareApi,
  zoneId: string,
  record: DnsRecordProps,
  existingId?: string,
): Promise<DnsRecord> {
  const payload = getRecordPayload(record);

  const response = await (existingId
    ? api.put(`/zones/${zoneId}/dns_records/${existingId}`, payload)
    : api.post(`/zones/${zoneId}/dns_records`, payload));

  if (!response.ok) {
    const errorBody = await response.text();

    // If it's an update operation and the record doesn't exist, fall back to creation
    if (existingId && response.status === 404) {
      try {
        const createResponse = await api.post(
          `/zones/${zoneId}/dns_records`,
          payload,
        );
        if (createResponse.ok) {
          return convertCloudflareRecord(
            ((await createResponse.json()) as any).result,
            zoneId,
          );
        }
      } catch (_err) {
        // Fall through to the original error
      }
    }

    throw new Error(
      `Failed to ${
        existingId ? "update" : "create"
      } DNS record ${record.name}: ${response.statusText}\nResponse: ${errorBody}`,
    );
  }

  const result =
    (await response.json()) as CloudflareResponse<CloudflareDnsRecord>;
  return convertCloudflareRecord(result.result, zoneId);
}

/**
 * Get the record payload for create/update operations
 */
function getRecordPayload(record: DnsRecordProps) {
  return {
    type: record.type,
    name: record.name,
    content: record.content,
    ttl: record.ttl || 1,
    proxied: record.proxied || false,
    priority: record.priority,
    comment: record.comment,
  };
}

/**
 * Convert a Cloudflare DNS record response to our DnsRecord type
 */
function convertCloudflareRecord(
  record: CloudflareDnsRecord,
  zoneId: string,
): DnsRecord {
  return {
    id: record.id,
    name: record.name,
    type: record.type as DnsRecordProps["type"],
    content: record.content,
    ttl: record.ttl,
    proxied: record.proxied,
    priority: record.priority,
    comment: record.comment,
    tags: record.tags,
    createdAt: new Date(record.created_on).getTime(),
    modifiedAt: new Date(record.modified_on).getTime(),
    zoneId,
  };
}
