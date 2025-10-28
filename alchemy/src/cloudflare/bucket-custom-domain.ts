import type { Context } from "../context";
import { Resource } from "../resource";
import { diff } from "../util/diff";
import { createCloudflareApi, type CloudflareApiOptions } from "./api";
import { CloudflareApiError } from "./api-error";
import { extractCloudflareResult } from "./api-response";
import { withJurisdiction, type R2BucketJurisdiction } from "./bucket";
import { inferZoneIdFromPattern } from "./route";
import type { Zone } from "./zone";

export interface R2BucketCustomDomainProps extends CloudflareApiOptions {
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

export const R2BucketCustomDomain = Resource(
  "cloudflare::R2BucketCustomDomain",
  async function (
    this: Context<R2BucketCustomDomain>,
    _id: string,
    props: R2BucketCustomDomainProps,
  ): Promise<R2BucketCustomDomain> {
    if (this.scope.local && !props.dev?.remote && this.phase !== "delete") {
      return {
        domain: props.domain,
        enabled: props.enabled ?? false,
        zoneId:
          typeof props.zone === "string"
            ? props.zone
            : (props.zone?.id ?? "noop-zone"),
        ciphers: props.ciphers,
        minTLS: props.minTLS,
      };
    }
    const api = await createCloudflareApi(props);
    const payload: R2BucketCustomDomain = {
      domain: props.domain,
      enabled: props.enabled ?? true,
      zoneId:
        typeof props.zone === "string"
          ? props.zone
          : (props.zone?.id ??
            (await inferZoneIdFromPattern(api, props.domain))),
      ciphers: props.ciphers,
      minTLS: props.minTLS,
    };
    switch (this.phase) {
      case "create": {
        await extractCloudflareResult(
          `attach custom domain to bucket "${props.bucketName}"`,
          api.post(
            `/accounts/${api.accountId}/r2/buckets/${props.bucketName}/domains/custom`,
            payload,
            { headers: withJurisdiction(props) },
          ),
        );
        return payload;
      }
      case "update": {
        if (
          diff(this.output, payload).some(
            (property) => property === "domain" || property === "zoneId",
          )
        ) {
          return this.replace();
        }
        await extractCloudflareResult<R2BucketCustomDomain>(
          `update custom domain for bucket "${props.bucketName}"`,
          api.put(
            `/accounts/${api.accountId}/r2/buckets/${props.bucketName}/domains/custom/${encodeURIComponent(props.domain)}`,
            payload,
            { headers: withJurisdiction(props) },
          ),
        );
        return payload;
      }
      case "delete": {
        try {
          await extractCloudflareResult(
            `detach custom domain from bucket "${props.bucketName}"`,
            api.delete(
              `/accounts/${api.accountId}/r2/buckets/${props.bucketName}/domains/custom/${encodeURIComponent(props.domain)}`,
              { headers: withJurisdiction(props) },
            ),
          );
        } catch (error) {
          if (!(error instanceof CloudflareApiError && error.status === 404)) {
            throw error;
          }
        }
        return this.destroy();
      }
    }
  },
);
