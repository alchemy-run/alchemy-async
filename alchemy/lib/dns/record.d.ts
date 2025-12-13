/**
 * DNS record types supported across different providers
 */
export type DnsRecordType = "A" | "AAAA" | "MX" | "TXT" | "NS" | "CNAME" | "SOA" | "SRV" | "PTR";
/**
 * Default DNS record types to fetch
 */
export declare const DEFAULT_RECORD_TYPES: readonly DnsRecordType[];
/**
 * Base DNS record interface with common properties
 */
export interface DnsRecordBase {
    /**
     * DNS record name (e.g., "example.com", "subdomain.example.com")
     */
    name: string;
    /**
     * Record type (A, AAAA, CNAME, etc.)
     */
    type: DnsRecordType;
}
/**
 * DNS record response structure from DNS-over-HTTPS APIs
 */
export interface DohDnsRecord extends DnsRecordBase {
    /**
     * Time To Live in seconds
     */
    TTL: number;
    /**
     * Record data/content (varies by record type)
     */
    data: string;
}
/**
 * Comprehensive DNS record structure for creating/managing records
 */
export interface DnsRecord extends DnsRecordBase {
    /**
     * DNS record content (e.g., IP address, hostname)
     */
    content: string;
    /**
     * Time To Live (TTL) in seconds
     * Setting to 1 means 'automatic'
     * Value must be between 60 and 86400, with minimum reduced to 30 for Enterprise zones
     * @default 1
     */
    ttl?: number;
    /**
     * Whether the record is receiving proxied traffic through Cloudflare
     * @default false
     */
    proxied?: boolean;
    /**
     * Comments or notes about the record
     */
    comment?: string;
    /**
     * Record tags
     */
    tags?: string[];
    /**
     * Priority value for MX/SRV records
     */
    priority?: number;
}
/**
 * DNS record with provider-specific ID and metadata
 */
export interface DnsRecordWithMetadata extends DnsRecord {
    /**
     * Record ID
     */
    id: string;
    /**
     * Zone or domain ID the record belongs to
     */
    zoneId: string;
    /**
     * Time at which the record was created
     */
    createdAt: number;
    /**
     * Time at which the record was last modified
     */
    modifiedAt?: number;
}
//# sourceMappingURL=record.d.ts.map