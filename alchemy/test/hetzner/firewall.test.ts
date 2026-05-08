import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { HetznerApi, HetznerApiError } from "../../src/hetzner/api.ts";
import { Firewall } from "../../src/hetzner/firewall.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Hetzner Firewall", () => {
  test("create with rules, update rules, delete", async (scope) => {
    const firewallId = `${BRANCH_PREFIX}-fw-crud`;
    let firewall: Firewall | undefined;

    try {
      // Create with an allow-HTTP inbound rule
      firewall = await Firewall(firewallId, {
        name: `${BRANCH_PREFIX}-firewall`,
        rules: [
          {
            direction: "in",
            protocol: "tcp",
            port: "80",
            sourceIps: ["0.0.0.0/0", "::/0"],
          },
        ],
        labels: { env: "test" },
      });

      expect(firewall.id).toBeGreaterThan(0);
      expect(firewall.name).toBe(`${BRANCH_PREFIX}-firewall`);
      expect(firewall.created).toBeTruthy();
      expect(firewall.rules).toHaveLength(1);
      expect(firewall.rules[0].direction).toBe("in");
      expect(firewall.rules[0].protocol).toBe("tcp");
      expect(firewall.rules[0].port).toBe("80");

      // Update — add HTTPS rule
      firewall = await Firewall(firewallId, {
        name: `${BRANCH_PREFIX}-firewall`,
        rules: [
          {
            direction: "in",
            protocol: "tcp",
            port: "80",
            sourceIps: ["0.0.0.0/0", "::/0"],
          },
          {
            direction: "in",
            protocol: "tcp",
            port: "443",
            sourceIps: ["0.0.0.0/0", "::/0"],
          },
        ],
        labels: { env: "test", updated: "true" },
      });

      expect(firewall.rules).toHaveLength(2);
      const ports = firewall.rules.map((r) => r.port);
      expect(ports).toContain("80");
      expect(ports).toContain("443");
    } finally {
      await destroy(scope);
      if (firewall?.id) {
        await assertFirewallDeleted(firewall.id);
      }
    }
  });

  test("replace all rules on update", async (scope) => {
    const firewallId = `${BRANCH_PREFIX}-fw-replace`;
    let firewall: Firewall | undefined;

    try {
      // Create with HTTP and HTTPS rules
      firewall = await Firewall(firewallId, {
        name: `${BRANCH_PREFIX}-firewall-replace`,
        rules: [
          {
            direction: "in",
            protocol: "tcp",
            port: "80",
            sourceIps: ["0.0.0.0/0", "::/0"],
          },
          {
            direction: "in",
            protocol: "tcp",
            port: "443",
            sourceIps: ["0.0.0.0/0", "::/0"],
          },
        ],
      });

      expect(firewall.rules).toHaveLength(2);

      // Replace all rules with only SSH — old rules must be gone
      firewall = await Firewall(firewallId, {
        name: `${BRANCH_PREFIX}-firewall-replace`,
        rules: [
          {
            direction: "in",
            protocol: "tcp",
            port: "22",
            sourceIps: ["10.0.0.0/8"],
          },
        ],
      });

      expect(firewall.rules).toHaveLength(1);
      expect(firewall.rules[0].port).toBe("22");
    } finally {
      await destroy(scope);
      if (firewall?.id) {
        await assertFirewallDeleted(firewall.id);
      }
    }
  });
});

async function assertFirewallDeleted(firewallId: number): Promise<void> {
  const api = new HetznerApi({});
  try {
    await api.get(`/firewalls/${firewallId}`);
    throw new Error(
      `Expected firewall ${firewallId} to be deleted but it still exists`,
    );
  } catch (err: any) {
    if (err instanceof HetznerApiError && err.status === 404) {
      return; // Expected: firewall was deleted
    }
    throw err;
  }
}
