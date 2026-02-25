import { afterAll, assert, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { DnsRecords, listRecords } from "../../src/cloudflare/dns-records.ts";
import { Zone } from "../../src/cloudflare/zone.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import type { Scope } from "../../src/scope.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const testDomain = `${BRANCH_PREFIX}-test-2.com`;

const api = await createCloudflareApi();
let zone: Zone;
let scope: Scope | undefined;

test.beforeAll(async (_scope) => {
  zone = await Zone(`${BRANCH_PREFIX}-zone`, {
    name: testDomain,
  });
  scope = _scope;
});

afterAll(async () => {
  if (scope) {
    await destroy(scope);
  }
});

describe.sequential("DnsRecords Resource", async () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names

  test("create, update, and delete DNS records", async (scope) => {
    let dnsRecords;
    try {
      // Create test DNS records
      dnsRecords = await DnsRecords(`${testDomain}-dns`, {
        zoneId: zone.id,
        records: [
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.1",
            proxied: true,
            comment: "Web server",
          },
          {
            name: `api.${testDomain}`,
            type: "A",
            content: "192.0.2.2",
            proxied: true,
            comment: "API server",
          },
          {
            name: `mail.${testDomain}`,
            type: "MX",
            content: "mail.example.com",
            priority: 10,
            proxied: false,
            comment: "Mail server",
          },
        ],
      });

      expect(dnsRecords.records).toHaveLength(3);

      // Verify records were created by querying the API directly
      await assertRecordsMatch(dnsRecords);

      // Update records - modify one record, add one record, remove one record
      dnsRecords = await DnsRecords(`${testDomain}-dns`, {
        zoneId: zone.id,
        records: [
          // Modify existing record
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.3", // Changed IP
            proxied: true,
            comment: "Updated web server",
          },
          // Keep existing record unchanged
          {
            name: `api.${testDomain}`,
            type: "A",
            content: "192.0.2.2",
            proxied: true,
            comment: "API server",
          },
          // Add new record
          {
            name: `cdn.${testDomain}`,
            type: "CNAME",
            content: "cdn.cloudflare.com.",
            proxied: true,
            comment: "CDN endpoint",
          },
          // Removed mail.example.com record
        ],
      });

      expect(dnsRecords.records).toHaveLength(3);

      // Verify updated records
      const updatedWww = dnsRecords.records.find(
        (r) => r.name === `www.${testDomain}`,
      );
      expect(updatedWww?.content).toBe("192.0.2.3");
      expect(updatedWww?.comment).toBe("Updated web server");

      // Verify new record
      const newCdn = dnsRecords.records.find(
        (r) => r.name === `cdn.${testDomain}`,
      );
      expect(newCdn?.type).toBe("CNAME");
      expect(newCdn?.content).toBe("cdn.cloudflare.com");

      // Verify deleted record is gone
      const mailRecord = dnsRecords.records.find(
        (r) => r.name === `mail.${testDomain}`,
      );
      expect(mailRecord).toBeUndefined();

      // Verify directly with API
      await assertRecordsMatch(dnsRecords);
    } catch (err) {
      console.error("Test failed:", err);
      throw err;
    } finally {
      await destroy(scope);
      await assertRecordsDeleted(zone.id);
    }
  });

  test("handles empty records array", async (scope) => {
    try {
      const dnsRecords = await DnsRecords(`${testDomain}-empty-dns`, {
        zoneId: zone.id,
        records: [],
      });

      expect(dnsRecords.records).toHaveLength(0);
    } finally {
      await destroy(scope);
    }
  });

  test("handles duplicate records gracefully", async (scope) => {
    try {
      const dnsRecords = await DnsRecords(`${testDomain}-duplicate-dns`, {
        zoneId: zone.id,
        records: [
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.1",
          },
          // Duplicate record with same name and type but different content
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.2",
          },
        ],
      });

      // Should only create one record (the last one)
      expect(dnsRecords.records).toHaveLength(1);
      expect(dnsRecords.records[0].content).toBe("192.0.2.2");
    } finally {
      await destroy(scope);
      await assertRecordsDeleted(zone.id);
    }
  });

  test("handles multiple TXT records", async (scope) => {
    try {
      let dnsRecords = await DnsRecords(`${testDomain}-txt-dns`, {
        zoneId: zone.id,
        records: [
          {
            name: `www.${testDomain}`,
            type: "TXT",
            content: "v=spf1 include:_spf.google.com ~all",
          },
          {
            name: `www.${testDomain}`,
            type: "TXT",
            content: "google-site-verification=1234567890",
          },
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.1",
          },
        ],
      });
      await assertRecordsMatch(dnsRecords);

      dnsRecords = await DnsRecords(`${testDomain}-txt-dns`, {
        zoneId: zone.id,
        records: [
          {
            name: `www.${testDomain}`,
            type: "TXT",
            content: "v=spf1 include:_spf.google.com ~all",
          },
          {
            name: `www.${testDomain}`,
            type: "TXT",
            content: "google-site-verification=1234567890",
          },
          {
            name: `www.${testDomain}`,
            type: "A",
            content: "192.0.2.2",
          },
        ],
      });

      await assertRecordsMatch(dnsRecords);
    } finally {
      await destroy(scope);
      await assertRecordsDeleted(zone.id);
    }
  });
});

async function assertRecordsMatch(dnsRecords: DnsRecords) {
  const apiRecords = await listRecords(api, dnsRecords.zoneId);
  expect(apiRecords).toHaveLength(dnsRecords.records.length);
  for (const record of dnsRecords.records) {
    const apiRecord = apiRecords.find((r) => r.id === record.id);
    assert(apiRecord, `Record ${record.name} (${record.id}) not found in API`);
    expect(apiRecord.name).toBe(record.name);
    expect(apiRecord.type).toBe(record.type);
    expect(apiRecord.content).toBe(record.content);
    expect(apiRecord.proxied).toBe(record.proxied);
    expect(apiRecord.comment).toBe(record.comment);
  }
}

async function assertRecordsDeleted(zoneId: string) {
  const apiRecords = await listRecords(api, zoneId);
  expect(apiRecords).toHaveLength(0);
}
