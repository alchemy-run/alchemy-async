import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { Network } from "../../src/hetzner/network.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

async function assertNetworkDeleted(id: number) {
  const res = await fetch(`https://api.hetzner.cloud/v1/networks/${id}`, {
    headers: { Authorization: `Bearer ${process.env.HETZNER_API_TOKEN}` },
  });
  expect(res.status).toBe(404);
}

describe("Hetzner Network", () => {
  test("create with subnet, update labels, delete", async (scope) => {
    const resourceId = `${BRANCH_PREFIX}-hnet-basic`;
    let network: Network | undefined;
    try {
      network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.0.0.0/16",
        subnets: [
          { type: "cloud", networkZone: "eu-central", ipRange: "10.0.1.0/24" },
        ],
        labels: { env: "test" },
      });

      expect(network.id).toBeTypeOf("number");
      expect(network.id).toBeGreaterThan(0);
      expect(network.name).toBe(resourceId);
      expect(network.ipRange).toBe("10.0.0.0/16");
      expect(network.subnets).toHaveLength(1);
      expect(network.subnets![0].type).toBe("cloud");
      expect(network.subnets![0].networkZone).toBe("eu-central");
      expect(network.subnets![0].ipRange).toBe("10.0.1.0/24");
      expect(network.labels?.env).toBe("test");
      expect(network.servers).toBeInstanceOf(Array);
      expect(network.created).toBeTypeOf("string");

      // update labels only — subnet and ipRange unchanged
      network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.0.0.0/16",
        subnets: [
          { type: "cloud", networkZone: "eu-central", ipRange: "10.0.1.0/24" },
        ],
        labels: { env: "test", updated: "true" },
      });

      expect(network.labels?.env).toBe("test");
      expect(network.labels?.updated).toBe("true");
    } finally {
      const deletedId = network?.id;
      await destroy(scope);
      if (deletedId) {
        await assertNetworkDeleted(deletedId);
      }
    }
  });

  test("add and remove subnet on update", async (scope) => {
    const resourceId = `${BRANCH_PREFIX}-hnet-subnet`;
    try {
      // create with one subnet
      let network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.1.0.0/16",
        subnets: [
          { type: "cloud", networkZone: "eu-central", ipRange: "10.1.1.0/24" },
        ],
      });

      expect(network.subnets).toHaveLength(1);
      expect(network.subnets![0].ipRange).toBe("10.1.1.0/24");

      // add a second subnet
      network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.1.0.0/16",
        subnets: [
          { type: "cloud", networkZone: "eu-central", ipRange: "10.1.1.0/24" },
          { type: "cloud", networkZone: "eu-central", ipRange: "10.1.2.0/24" },
        ],
      });

      expect(network.subnets).toHaveLength(2);
      const ranges = network.subnets!.map((s) => s.ipRange).sort();
      expect(ranges).toEqual(["10.1.1.0/24", "10.1.2.0/24"]);

      // remove the first subnet — only second remains
      network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.1.0.0/16",
        subnets: [
          { type: "cloud", networkZone: "eu-central", ipRange: "10.1.2.0/24" },
        ],
      });

      expect(network.subnets).toHaveLength(1);
      expect(network.subnets![0].ipRange).toBe("10.1.2.0/24");
    } finally {
      await destroy(scope);
    }
  });

  test("immutable ipRange triggers replace", async (scope) => {
    const resourceId = `${BRANCH_PREFIX}-hnet-replace`;
    let originalId: number | undefined;
    try {
      // create with initial IP range
      let network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.2.0.0/16",
      });

      expect(network.id).toBeGreaterThan(0);
      expect(network.ipRange).toBe("10.2.0.0/16");
      originalId = network.id;

      // change ipRange — must trigger replacement (delete old, create new)
      network = await Network(resourceId, {
        name: resourceId,
        ipRange: "10.3.0.0/16",
      });

      expect(network.ipRange).toBe("10.3.0.0/16");
      expect(network.id).toBeGreaterThan(0);
      // new resource must have a different ID
      expect(network.id).not.toBe(originalId);

      // old network must no longer exist
      await assertNetworkDeleted(originalId);
      originalId = undefined; // already confirmed gone
    } finally {
      await destroy(scope);
    }
  });
});
