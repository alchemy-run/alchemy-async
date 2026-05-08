import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import {
  createHetznerDnsApi,
  HetznerDnsApiError,
} from "../../src/hetzner/dns-api.ts";
import { DNSRecord } from "../../src/hetzner/dns-record.ts";
import { DNSZone } from "../../src/hetzner/dns-zone.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const TEST_ZONE_NAME = `${BRANCH_PREFIX}-rec-alchemy-test.com`;

describe("Hetzner DNSRecord", () => {
  test("create A record, verify, update value, teardown", async (scope) => {
    let zone: DNSZone | undefined;
    let record: DNSRecord | undefined;

    try {
      zone = await DNSZone(`${BRANCH_PREFIX}-rec-zone`, {
        name: TEST_ZONE_NAME,
        ttl: 3600,
      });

      expect(zone.id).toBeTruthy();

      record = await DNSRecord(`${BRANCH_PREFIX}-a-record`, {
        zone,
        name: "www",
        type: "A",
        value: "203.0.113.1",
        ttl: 300,
      });

      expect(record.id).toBeTruthy();
      expect(record.name).toBe("www");
      expect(record.type).toBe("A");
      expect(record.value).toBe("203.0.113.1");
      expect(record.ttl).toBe(300);
      expect(record.zoneId).toBe(zone.id);

      // Verify via API
      const api = createHetznerDnsApi();
      const fetchedRes = await api.get(`/records/${record.id}`);
      const fetched: any = await fetchedRes.json();
      expect(fetched.record.id).toBe(record.id);
      expect(fetched.record.value).toBe("203.0.113.1");

      // Update value
      record = await DNSRecord(`${BRANCH_PREFIX}-a-record`, {
        zone,
        name: "www",
        type: "A",
        value: "203.0.113.2",
        ttl: 300,
      });

      expect(record.value).toBe("203.0.113.2");

      const updatedRes = await api.get(`/records/${record.id}`);
      const updated: any = await updatedRes.json();
      expect(updated.record.value).toBe("203.0.113.2");
    } finally {
      await destroy(scope);

      if (record?.id) {
        const api = createHetznerDnsApi();
        try {
          await api.get(`/records/${record.id}`);
          throw new Error(
            `DNS record ${record.id} still exists after deletion`,
          );
        } catch (err: any) {
          if (!(err instanceof HetznerDnsApiError) || err.status !== 404) {
            if (
              !(err instanceof Error && err.message.includes("still exists"))
            ) {
              // Record is gone — expected
            } else {
              throw err;
            }
          }
        }
      }
    }
  });

  test("changing type triggers replacement", async (scope) => {
    let zone: DNSZone | undefined;
    let record: DNSRecord | undefined;

    try {
      zone = await DNSZone(`${BRANCH_PREFIX}-rec-zone-replace`, {
        name: `${BRANCH_PREFIX}-replace-alchemy-test.com`,
        ttl: 3600,
      });

      record = await DNSRecord(`${BRANCH_PREFIX}-record-replace`, {
        zone,
        name: "test",
        type: "A",
        value: "203.0.113.10",
      });

      const originalId = record.id;
      expect(originalId).toBeTruthy();

      // Change type — must trigger replacement (new id)
      record = await DNSRecord(`${BRANCH_PREFIX}-record-replace`, {
        zone,
        name: "test",
        type: "AAAA",
        value: "2001:db8::1",
      });

      expect(record.id).toBeTruthy();
      expect(record.id).not.toBe(originalId);
      expect(record.type).toBe("AAAA");
    } finally {
      await destroy(scope);
    }
  });
});
