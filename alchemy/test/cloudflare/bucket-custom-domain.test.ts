import "../../src/test/vitest.ts";

import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import {
  deleteBucketCustomDomain,
  getBucketCustomDomain,
} from "../../src/cloudflare/bucket-custom-domain.ts";
import {
  getBucket,
  R2Bucket,
  type R2BucketJurisdiction,
} from "../../src/cloudflare/bucket.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";
import { CloudflareApiError } from "../../src/cloudflare/api-error.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
  quiet: false,
});

const testDomain = process.env.ALCHEMY_TEST_DOMAIN!;

const api = await createCloudflareApi();

describe("Bucket Custom Domain", () => {
  test("should create a custom domain", async (scope) => {
    let bucket: R2Bucket | undefined;
    const domain = `bucket-custom-domain-${Date.now()}.${testDomain}`;
    try {
      bucket = await R2Bucket("bucket", {
        name: `${BRANCH_PREFIX}-bucket-custom-domain`,
        domains: domain,
        adopt: true,
      });
      expect(bucket.domains).toMatchObject([domain]);
      const customDomain = await getBucketCustomDomain(
        api,
        bucket.name,
        domain,
        bucket.jurisdiction,
      );
      expect(customDomain).toMatchObject({
        domain,
        enabled: true,
      });
    } finally {
      await destroy(scope);
      if (bucket) {
        await assertCustomDomainDeleted(
          bucket.name,
          domain,
          bucket.jurisdiction,
        );
      }
    }
  });

  test("should retain custom domain when delete is false", async (scope) => {
    let bucket: R2Bucket | undefined;
    const domain = `bucket-custom-domain-delete-false-${Date.now()}.${testDomain}`;
    try {
      bucket = await R2Bucket("bucket-delete-false", {
        name: `${BRANCH_PREFIX}-bucket-custom-domain-delete-false`,
        domains: domain,
        adopt: true,
        delete: false,
      });
    } finally {
      await destroy(scope);
      if (bucket) {
        const customDomain = await getBucketCustomDomain(
          api,
          bucket.name,
          domain,
          bucket.jurisdiction,
        );
        expect(customDomain).toMatchObject({
          domain,
          enabled: true,
        });
        await deleteBucketCustomDomain(
          api,
          bucket.name,
          domain,
          bucket.jurisdiction,
        );
      }
    }
  });

  test("does not error on replace when bound to worker", async (scope) => {
    const domain = `bucket-custom-domain-replace-worker-${Date.now()}.${testDomain}`;
    try {
      const bucket1 = await R2Bucket("bucket-replace", {
        name: `${BRANCH_PREFIX}-bucket-custom-domain-replace-1`,
        domains: [domain, `1-${domain}`],
        adopt: true,
      });
      await Worker("worker", {
        name: `${BRANCH_PREFIX}-bucket-custom-domain-replace-worker`,
        script: `export default { async fetch(request, env) { return Response.json(await env.R2.list()) } }`,
        bindings: {
          R2: bucket1,
        },
      });
      await R2Bucket("bucket-replace", {
        name: `${BRANCH_PREFIX}-bucket-custom-domain-replace-2`,
        domains: [domain, `2-${domain}`],
        adopt: true,
      });
      await assertBucketDeleted(bucket1); // verify that bucket was replaced
      await assertCustomDomainDeleted(
        bucket1.name,
        domain,
        bucket1.jurisdiction,
      );
    } finally {
      await destroy(scope);
    }
  });
});

async function assertBucketDeleted(bucket: R2Bucket) {
  expect(
    getBucket(api, bucket.name, {
      jurisdiction: bucket.jurisdiction,
    }).catch((error) => {
      if (error instanceof CloudflareApiError && error.status === 404) {
        return null;
      }
      throw error;
    }),
  ).resolves.toBeNull();
}

async function assertCustomDomainDeleted(
  bucket: string,
  domain: string,
  jurisdiction: R2BucketJurisdiction | undefined,
) {
  const customDomain = await getBucketCustomDomain(
    api,
    bucket,
    domain,
    jurisdiction,
  );
  expect(customDomain).toBeUndefined();
}
