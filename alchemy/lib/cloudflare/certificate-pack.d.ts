import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { type Zone } from "./zone.ts";
/**
 * Certificate Authority options for Advanced Certificate Packs
 */
export type CertificateAuthority = "google" | "lets_encrypt" | "ssl_com";
/**
 * Validation method for certificate verification
 */
export type ValidationMethod = "txt" | "http" | "email";
/**
 * Validity period options for certificates
 */
export type ValidityDays = 14 | 30 | 90 | 365;
/**
 * Certificate pack status values during lifecycle
 */
export type CertificatePackStatus = "initializing" | "pending_validation" | "deleted" | "pending_issuance" | "pending_deployment" | "pending_deletion" | "pending_expiration" | "expired" | "active" | "initializing_timed_out" | "validation_timed_out" | "issuance_timed_out" | "deployment_timed_out" | "deletion_timed_out" | "pending_cleanup" | "staging_deployment" | "staging_active" | "deactivating" | "inactive" | "backup_issued" | "holding_deployment";
/**
 * Properties for creating a Certificate Pack
 */
export interface CertificatePackProps extends CloudflareApiOptions {
    /**
     * The zone to create the certificate pack for
     * Can be a Zone resource, zone ID string, or omitted to auto-infer from hosts
     */
    zone?: string | Zone;
    /**
     * Certificate Authority to use for issuing the certificate
     * - google: Google Trust Services (Enterprise features)
     * - lets_encrypt: Let's Encrypt (Free, shorter validity periods)
     * - ssl_com: SSL.com (Commercial certificates with extended validation)
     *
     * **Note:** This property is immutable after creation. To change the CA,
     * you must delete and recreate the certificate pack.
     */
    certificateAuthority: CertificateAuthority;
    /**
     * List of hostnames to include in the certificate
     * Maximum 50 hosts, must include the zone apex (root domain)
     * Supports wildcards (e.g., "*.example.com")
     *
     * **Note:** This property is immutable after creation.
     */
    hosts: string[];
    /**
     * Certificate type - only "advanced" is supported
     *
     * **Note:** This property is immutable after creation.
     * @default "advanced"
     */
    type?: "advanced";
    /**
     * Method used to validate domain ownership
     * - txt: DNS TXT record validation
     * - http: HTTP file validation
     * - email: Email validation
     *
     * **Note:** This property is immutable after creation.
     */
    validationMethod: ValidationMethod;
    /**
     * Certificate validity period in days
     * Available options: 14, 30, 90, or 365 days
     *
     * **Note:** This property is immutable after creation.
     */
    validityDays: ValidityDays;
    /**
     * Whether to add Cloudflare branding subdomain as Common Name
     * Adds sni.cloudflaressl.com subdomain when enabled
     *
     * **Note:** This is the only property that can be updated after creation.
     * @default false
     */
    cloudflareBranding?: boolean;
    /**
     * Whether to delete the certificate pack
     * If set to false, the pack will remain but the resource will be removed from state
     *
     * @default true
     */
    delete?: boolean;
}
/**
 * Output returned after Certificate Pack creation/update
 */
export interface CertificatePack {
    /**
     * The unique ID of the certificate pack
     */
    id: string;
    /**
     * Certificate Authority used for the certificate
     */
    certificateAuthority: CertificateAuthority;
    /**
     * Whether Cloudflare branding is enabled
     */
    cloudflareBranding: boolean;
    /**
     * List of hostnames included in the certificate
     */
    hosts: string[];
    /**
     * Current status of the certificate pack
     */
    status: CertificatePackStatus;
    /**
     * Certificate type
     */
    type: "advanced";
    /**
     * Validation method used for domain verification
     */
    validationMethod: ValidationMethod;
    /**
     * Certificate validity period in days
     */
    validityDays: ValidityDays;
    /**
     * Zone ID the certificate pack belongs to
     */
    zoneId: string;
    /**
     * Zone name (domain)
     */
    zoneName: string;
}
/**
 * Creates and manages Cloudflare Advanced Certificate Packs.
 *
 * Advanced Certificate Packs provide flexible SSL/TLS certificates with
 * multiple Certificate Authority options, custom validity periods, and
 * support for up to 50 hostnames per certificate.
 *
 * **Important Notes:**
 * - Requires a paid Cloudflare plan (not available on Free plans)
 * - Certificate provisioning can take up to 10 minutes
 * - Most properties are immutable after creation (only cloudflareBranding can be updated)
 * - To change immutable properties, you must delete and recreate the certificate pack
 *
 * @example
 * // Create a basic certificate pack with Let's Encrypt
 * const basicCert = await CertificatePack("my-cert", {
 *   zone: myZone,
 *   certificateAuthority: "lets_encrypt",
 *   hosts: ["example.com", "www.example.com"],
 *   validationMethod: "txt",
 *   validityDays: 90
 * });
 *
 * @example
 * // Create an enterprise certificate with Google Trust Services
 * const enterpriseCert = await CertificatePack("enterprise-cert", {
 *   zone: "example.com",
 *   certificateAuthority: "google",
 *   hosts: ["example.com", "*.example.com", "api.example.com"],
 *   validationMethod: "txt",
 *   validityDays: 365,
 *   cloudflareBranding: true
 * });
 *
 * @example
 * // Create a wildcard certificate with SSL.com
 * const wildcardCert = await CertificatePack("wildcard-cert", {
 *   zone: myZone,
 *   certificateAuthority: "ssl_com",
 *   hosts: ["example.com", "*.example.com"],
 *   validationMethod: "email",
 *   validityDays: 365
 * });
 *
 * @example
 * // Create a certificate for multiple subdomains
 * const multiDomainCert = await CertificatePack("multi-cert", {
 *   zone: "example.com",
 *   certificateAuthority: "lets_encrypt",
 *   hosts: [
 *     "example.com",
 *     "www.example.com",
 *     "api.example.com",
 *     "admin.example.com",
 *     "blog.example.com"
 *   ],
 *   validationMethod: "http",
 *   validityDays: 90
 * });
 *
 * @see https://developers.cloudflare.com/api/resources/ssl/subresources/certificate_packs/
 */
export declare const CertificatePack: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<CertificatePack>, _id: string, props: CertificatePackProps) => Promise<CertificatePack>);
/**
 * Helper function to wait for certificate pack to reach active status
 * Useful for testing or when you need to ensure the certificate is ready
 *
 * @param api CloudflareApi instance
 * @param zoneId Zone ID
 * @param certificatePackId Certificate pack ID
 * @param timeoutMs Maximum time to wait in milliseconds (default: 15 minutes)
 * @returns Promise resolving to the final certificate pack status
 *
 * @example
 * // Wait for certificate to become active
 * const finalStatus = await waitForCertificatePackActive(
 *   api,
 *   zoneId,
 *   certificatePack.id,
 *   10 * 60 * 1000 // 10 minutes
 * );
 * console.log(`Certificate pack is now: ${finalStatus}`);
 */
export declare function waitForCertificatePackActive(api: CloudflareApi, zoneId: string, certificatePackId: string, timeoutMs?: number): Promise<CertificatePackStatus>;
//# sourceMappingURL=certificate-pack.d.ts.map