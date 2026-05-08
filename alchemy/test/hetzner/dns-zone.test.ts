import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import {
  createHetznerDnsApi,
  HetznerDnsApiError,
} from "../../src/hetzner/dns-api.ts";
import { DNSZone } from "../../src/hetzner/dns-zone.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

// Use a subdomain of a zone the token has access to — or a fresh TLD-like name.
// Hetzner DNS lets you create zones for any name; the zone won't be publicly
// resolvable until NS records are set at the registrar, but the API accepts it.
const TEST_ZONE_NAME = `${BRANCH_PREFIX}-alchemy-test.com`;

describe("Hetzner DNSZone", () => {
  test("create, verify id/name/nsSet, update TTL, teardown", async (scope) => {
    let zone: DNSZone | undefined;

    try {
      // Create
      zone = await DNSZone(`${BRANCH_PREFIX}-dns-zone`, {
        name: TEST_ZONE_NAME,
        ttl: 3600,
      });

      expect(zone.id).toBeTruthy();
      expect(zone.name).toBe(TEST_ZONE_NAME);
      expect(zone.ttl).toBe(3600);
      expect(zone.nsSet).toBeInstanceOf(Array);
      expect(zone.nsSet.length).toBeGreaterThan(0);
      expect(zone.status).toMatch(/^(verified|failed|pending)$/);
      expect(zone.created).toBeTruthy();
      expect(zone.modified).toBeTruthy();

      // Verify via API the zone exists with expected values
      const api = createHetznerDnsApi();
      await assertZoneExists(api, zone.id, { name: TEST_ZONE_NAME, ttl: 3600 });

      // Update TTL
      zone = await DNSZone(`${BRANCH_PREFIX}-dns-zone`, {
        name: TEST_ZONE_NAME,
        ttl: 7200,
      });

      expect(zone.id).toBeTruthy();
      expect(zone.name).toBe(TEST_ZONE_NAME);
      expect(zone.ttl).toBe(7200);

      // Verify update via API
      await assertZoneExists(api, zone.id, { name: TEST_ZONE_NAME, ttl: 7200 });
    } finally {
      await destroy(scope);

      if (zone?.id) {
        // Verify zone no longer exists via the DNS API
        const api = createHetznerDnsApi();
        await assertZoneDeleted(api, zone.id);
      }
    }
  });
});

async function assertZoneExists(
  api: ReturnType<typeof createHetznerDnsApi>,
  zoneId: string,
  expected: { name: string; ttl: number },
): Promise<void> {
  const response = await api.get(`/zones/${zoneId}`);
  expect(response.status).toBe(200);
  const { zone } = (await response.json()) as {
    zone: { id: string; name: string; ttl: number };
  };
  expect(zone.name).toBe(expected.name);
  expect(zone.ttl).toBe(expected.ttl);
}

async function assertZoneDeleted(
  api: ReturnType<typeof createHetznerDnsApi>,
  zoneId: string,
): Promise<void> {
  try {
    await api.get(`/zones/${zoneId}`);
    throw new Error(
      `Expected DNS zone ${zoneId} to be deleted but it still exists`,
    );
  } catch (error) {
    if (error instanceof HetznerDnsApiError && error.status === 404) {
      return;
    }
    throw error;
  }
}
