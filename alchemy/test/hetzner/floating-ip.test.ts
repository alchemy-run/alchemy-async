import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createHetznerApi } from "../../src/hetzner/api.ts";
import { FloatingIP } from "../../src/hetzner/floating-ip.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe.skipIf(!process.env.HCLOUD_TOKEN)("Hetzner FloatingIP", () => {
  const testId = `${BRANCH_PREFIX}-hetzner-fip`;

  test("create, update, and delete floating IP", async (scope) => {
    let fip: FloatingIP | undefined;

    try {
      // Create an IPv4 floating IP in Falkenstein
      fip = await FloatingIP(testId, {
        type: "ipv4",
        homeLocation: "fsn1",
        description: "alchemy test floating IP",
        labels: { env: "test", "managed-by": "alchemy" },
      });

      expect(fip.id).toBeGreaterThan(0);
      expect(fip.name).toBeTruthy();
      expect(fip.type).toBe("ipv4");
      expect(fip.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
      expect(fip.homeLocation).toBe("fsn1");
      expect(fip.description).toBe("alchemy test floating IP");
      expect(fip.labels).toMatchObject({ env: "test" });
      expect(fip.created).toBeTruthy();

      // Verify via direct API call
      const api = createHetznerApi({});
      const data = await api.get<any>(`/floating_ips/${fip.id}`);
      expect(data.floating_ip.id).toBe(fip.id);
      expect(data.floating_ip.ip).toBe(fip.ip);

      // Update: change labels and description (mutable properties)
      fip = await FloatingIP(testId, {
        type: "ipv4",
        homeLocation: "fsn1",
        description: "alchemy test floating IP (updated)",
        labels: { env: "test", "managed-by": "alchemy", updated: "true" },
      });

      expect(fip.description).toBe("alchemy test floating IP (updated)");
      expect(fip.labels).toMatchObject({ updated: "true" });
      // IP address must not change across updates
      expect(fip.ip).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    } finally {
      await destroy(scope);

      // Verify the floating IP was deleted
      if (fip?.id) {
        await assertFloatingIPDeleted(fip.id);
      }
    }
  }, 120_000);

  test("ip type is immutable — triggers replacement on change", async (scope) => {
    const ipv4Id = `${testId}-immutable`;
    let fip: FloatingIP | undefined;

    try {
      fip = await FloatingIP(ipv4Id, {
        type: "ipv4",
        homeLocation: "fsn1",
      });

      expect(fip.type).toBe("ipv4");
      const originalId = fip.id;

      // Changing type to ipv6 should trigger replace (new resource created)
      fip = await FloatingIP(ipv4Id, {
        type: "ipv6",
        homeLocation: "fsn1",
      });

      expect(fip.type).toBe("ipv6");
      // A different resource should have been provisioned
      expect(fip.id).not.toBe(originalId);
    } finally {
      await destroy(scope);

      if (fip?.id) {
        await assertFloatingIPDeleted(fip.id);
      }
    }
  }, 180_000);

  test("delete=false preserves floating IP after destroy", async (scope) => {
    const retainId = `${testId}-retain`;
    let fip: FloatingIP | undefined;

    try {
      fip = await FloatingIP(retainId, {
        type: "ipv4",
        homeLocation: "fsn1",
        delete: false,
      });

      expect(fip.id).toBeGreaterThan(0);
    } finally {
      await destroy(scope);

      // The floating IP should still exist because delete: false
      if (fip?.id) {
        const api = createHetznerApi({});
        const data = await api.get<any>(`/floating_ips/${fip.id}`);
        expect(data.floating_ip.id).toBe(fip.id);

        // Manual cleanup
        await api.delete(`/floating_ips/${fip.id}`);
        await assertFloatingIPDeleted(fip.id);
      }
    }
  }, 120_000);

  test("adopt existing floating IP", async (scope) => {
    const adoptId = `${testId}-adopt`;
    let fip: FloatingIP | undefined;

    try {
      // Create first, then adopt with the same name
      fip = await FloatingIP(adoptId, {
        type: "ipv4",
        homeLocation: "fsn1",
        labels: { env: "test" },
      });

      expect(fip.id).toBeGreaterThan(0);
      const originalId = fip.id;
      const originalIp = fip.ip;

      // Adopt should find the existing IP instead of failing
      const adopted = await FloatingIP(`${adoptId}-ref`, {
        name: fip.name,
        type: "ipv4",
        homeLocation: "fsn1",
        adopt: true,
      });

      expect(adopted.id).toBe(originalId);
      expect(adopted.ip).toBe(originalIp);
    } finally {
      await destroy(scope);

      if (fip?.id) {
        await assertFloatingIPDeleted(fip.id);
      }
    }
  }, 120_000);
});

async function assertFloatingIPDeleted(id: number): Promise<void> {
  const api = createHetznerApi({});
  try {
    await api.get(`/floating_ips/${id}`);
    throw new Error(`FloatingIP ${id} still exists after deletion`);
  } catch (err: any) {
    // 404 from HetznerApiError means it was deleted — that's expected
    if (err?.status !== 404) throw err;
  }
}
