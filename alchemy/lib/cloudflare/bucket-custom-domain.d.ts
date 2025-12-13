import type { Context } from "../context.ts";
import { CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import { type R2BucketJurisdiction } from "./bucket.ts";
import type { Zone } from "./zone.ts";
export interface R2BucketCustomDomainProps extends CloudflareApiOptions, R2BucketCustomDomainOptions {
    /**
     * The bucket to attach the domain to.
     */
    bucketName: string;
    /**
     * The jurisdiction of the bucket.
     * @default "default"
     */
    jurisdiction?: R2BucketJurisdiction;
    /**
     * Development mode properties
     * @internal
     */
    dev?: {
        remote?: boolean;
    };
}
export interface R2BucketCustomDomainOptions {
    /**
     * The domain name to attach to the bucket.
     */
    domain: string;
    /**
     * Whether the domain is enabled.
     * @default true
     */
    enabled?: boolean;
    /**
     * The zone to attach the domain to.
     */
    zone?: string | Zone;
    /**
     * An allowlist of ciphers for TLS termination. These ciphers must be in the BoringSSL format.
     */
    ciphers?: string[];
    /**
     * The minimum TLS version to support.
     */
    minTLS?: "1.0" | "1.1" | "1.2" | "1.3" | (string & {});
    /**
     * Whether to adopt an existing custom domain binding during creation.
     * If false and the domain already exists, creation will fail.
     * This only applies during the create phase.
     * @default false
     */
    adopt?: boolean;
    /**
     * Whether to delete the custom domain binding during deletion.
     * If false, the custom domain binding will remain but the resource will be removed from state
     * @default true
     */
    delete?: boolean;
}
export type R2BucketCustomDomain = {
    /**
     * The domain name.
     */
    domain: string;
    /**
     * Whether the domain is enabled.
     */
    enabled: boolean;
    /**
     * The zone ID.
     */
    zoneId: string;
    /**
     * The ciphers to support.
     */
    ciphers?: string[];
    /**
     * The minimum TLS version to support.
     */
    minTLS?: "1.0" | "1.1" | "1.2" | "1.3" | (string & {});
};
export declare const R2BucketCustomDomain: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<R2BucketCustomDomain>, _id: string, props: R2BucketCustomDomainProps) => Promise<R2BucketCustomDomain>);
export declare function deleteBucketCustomDomain(api: CloudflareApi, bucket: string, domain: string, jurisdiction: R2BucketJurisdiction | undefined): Promise<unknown>;
export declare function getBucketCustomDomain(api: CloudflareApi, bucket: string, domain: string, jurisdiction: R2BucketJurisdiction | undefined): Promise<void | (R2BucketCustomDomain & {
    zoneName?: string;
    status: {
        ownership: "pending" | "active" | "deactivated" | "blocked" | "error" | "unknown";
        ssl: "initializing" | "pending" | "active" | "deactivated" | "error" | "unknown";
    };
})>;
//# sourceMappingURL=bucket-custom-domain.d.ts.map