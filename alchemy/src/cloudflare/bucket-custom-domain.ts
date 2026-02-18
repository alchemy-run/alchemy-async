import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { diff } from "../util/diff.ts";
import { CloudflareApiError } from "./api-error.ts";
import { extractCloudflareResult } from "./api-response.ts";
import {
  CloudflareApi,
  createCloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { withJurisdiction, type R2BucketJurisdiction } from "./bucket.ts";
import { inferZoneIdFromPattern } from "./route.ts";
import type { Zone } from "./zone.ts";

export interface R2BucketCustomDomainProps
  extends CloudflareApiOptions, R2BucketCustomDomainOptions {
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

const DEV_NOOP_ZONE = "noop-zone";

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
            : (props.zone?.id ?? DEV_NOOP_ZONE),
        ciphers: props.ciphers,
        minTLS: props.minTLS,
      };
    }
    const adopt = props.adopt ?? this.scope.adopt;
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
        await createBucketCustomDomain(
          api,
          props.bucketName,
          props.jurisdiction,
          payload,
        ).catch(async (error) => {
          if (
            error instanceof CloudflareApiError &&
            error.status === 409 &&
            adopt
          ) {
            return await updateBucketCustomDomain(
              api,
              props.bucketName,
              props.jurisdiction,
              payload,
            );
          }
          throw error;
        });
        return payload;
      }
      case "update": {
        if (
          this.output.zoneId !== DEV_NOOP_ZONE && // dev mode placeholder should not trigger replacement
          diff(this.output, payload).some(
            (property) => property === "domain" || property === "zoneId",
          )
        ) {
          return this.replace();
        }
        await updateBucketCustomDomain(
          api,
          props.bucketName,
          props.jurisdiction,
          payload,
        );
        return payload;
      }
      case "delete": {
        if (props.delete !== false) {
          await deleteBucketCustomDomain(
            api,
            props.bucketName,
            props.domain,
            props.jurisdiction,
          );
        }
        return this.destroy();
      }
    }
  },
);

async function createBucketCustomDomain(
  api: CloudflareApi,
  bucket: string,
  jurisdiction: R2BucketJurisdiction | undefined,
  payload: R2BucketCustomDomain,
) {
  return await extractCloudflareResult(
    `create custom domain for bucket "${bucket}"`,
    api.post(
      `/accounts/${api.accountId}/r2/buckets/${bucket}/domains/custom`,
      payload,
      { headers: withJurisdiction({ jurisdiction }) },
    ),
  );
}

async function updateBucketCustomDomain(
  api: CloudflareApi,
  bucket: string,
  jurisdiction: R2BucketJurisdiction | undefined,
  payload: R2BucketCustomDomain,
) {
  return await extractCloudflareResult(
    `update custom domain for bucket "${bucket}"`,
    api.put(
      `/accounts/${api.accountId}/r2/buckets/${bucket}/domains/custom/${encodeURIComponent(payload.domain)}`,
      payload,
      { headers: withJurisdiction({ jurisdiction }) },
    ),
  );
}

export async function deleteBucketCustomDomain(
  api: CloudflareApi,
  bucket: string,
  domain: string,
  jurisdiction: R2BucketJurisdiction | undefined,
) {
  return await extractCloudflareResult(
    `delete custom domain for bucket "${bucket}"`,
    api.delete(
      `/accounts/${api.accountId}/r2/buckets/${bucket}/domains/custom/${encodeURIComponent(domain)}`,
      { headers: withJurisdiction({ jurisdiction }) },
    ),
  ).catch((error) => {
    if (!(error instanceof CloudflareApiError && error.status === 404)) {
      throw error;
    }
  });
}

export async function getBucketCustomDomain(
  api: CloudflareApi,
  bucket: string,
  domain: string,
  jurisdiction: R2BucketJurisdiction | undefined,
) {
  return await extractCloudflareResult<
    R2BucketCustomDomain & {
      zoneName?: string;
      status: {
        ownership:
          | "pending"
          | "active"
          | "deactivated"
          | "blocked"
          | "error"
          | "unknown";
        ssl:
          | "initializing"
          | "pending"
          | "active"
          | "deactivated"
          | "error"
          | "unknown";
      };
    }
  >(
    `get custom domain for bucket "${bucket}"`,
    api.get(
      `/accounts/${api.accountId}/r2/buckets/${bucket}/domains/custom/${encodeURIComponent(domain)}`,
      {
        headers: withJurisdiction({ jurisdiction }),
      },
    ),
  ).catch((error) => {
    if (!(error instanceof CloudflareApiError && error.status === 404)) {
      throw error;
    }
  });
}
