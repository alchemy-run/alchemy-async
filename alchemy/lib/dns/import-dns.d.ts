import type { Context } from "../context.ts";
import { type DnsRecordType } from "./record.ts";
/**
 * DNS record response structure from Cloudflare DNS API
 * with both data (original) and content (for compatibility)
 */
export interface DnsApiRecord {
    name: string;
    type: DnsRecordType;
    TTL: number;
    data: string;
    content: string;
    ttl: number;
    priority?: number;
}
/**
 * Properties for importing DNS records
 */
export interface ImportDnsRecordsProps {
    /**
     * The domain to fetch DNS records for
     */
    domain: string;
    /**
     * Specific record types to fetch. If not provided, defaults to all supported types.
     */
    recordTypes?: DnsRecordType[];
    /**
     * Bump the resource to force a new import
     */
    bump?: number;
}
/**
 * Output returned after DNS records import
 */
export interface ImportDnsRecords extends ImportDnsRecordsProps {
    /**
     * The DNS records as a flat array, directly compatible with DnsRecords function
     */
    records: DnsApiRecord[];
    /**
     * Time at which the records were imported
     */
    importedAt: number;
}
/**
 * Import DNS records for a domain using Cloudflare's DNS-over-HTTPS API.
 * This resource allows you to fetch DNS records for a domain and store them
 * in a structured format.
 *
 * @example
 * // Import all default record types
 * const allRecords = await ImportDnsRecords("example.com", {
 *   domain: "example.com"
 * });
 *
 * @example
 * // Import only specific record types
 * const specificRecords = await ImportDnsRecords("example.com", {
 *   domain: "example.com",
 *   recordTypes: ["A", "MX"]
 * });
 *
 * @example
 * // Import DNS records and transfer them to a Cloudflare zone
 * const dnsRecords = await ImportDnsRecords("dns-records", {
 *   domain: "example.com",
 * });
 *
 * const zone = await Zone("example.com", {
 *   name: "example.com",
 *   type: "full",
 * });
 *
 * // Records are directly compatible with DnsRecords function
 * await DnsRecords("transfer-dns-records", {
 *   zoneId: zone.id,
 *   records: dnsRecords.records,
 * });
 */
export declare const ImportDnsRecords: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<ImportDnsRecords>, _id: string, props: ImportDnsRecordsProps) => Promise<ImportDnsRecords>);
//# sourceMappingURL=import-dns.d.ts.map