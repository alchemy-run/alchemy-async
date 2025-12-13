import type { Context } from "../context.ts";
import type { DnsRecord as BaseDnsRecord, DnsRecordType, DnsRecordWithMetadata } from "../dns/record.ts";
import { type CloudflareApiOptions } from "./api.ts";
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
export interface DnsRecord extends DnsRecordWithMetadata {
}
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
export declare const DnsRecords: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<DnsRecords>, _id: string, props: DnsRecordsProps) => Promise<DnsRecords>);
//# sourceMappingURL=dns-records.d.ts.map