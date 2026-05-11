import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createHetznerApi, HetznerApiError } from "../../src/hetzner/api.ts";
import {
  type LoadBalancer,
  LoadBalancer as LoadBalancerResource,
} from "../../src/hetzner/load-balancer.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe.skipIf(!process.env.HCLOUD_TOKEN)("Hetzner LoadBalancer", () => {
  test("create, update services, and delete load balancer", async (scope) => {
    const lbName = `${BRANCH_PREFIX}-alchemy-lb`;
    let lb: LoadBalancer | undefined;

    try {
      // Create with a single TCP service
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "tcp",
            listenPort: 80,
            destinationPort: 80,
            healthCheck: {
              protocol: "tcp",
              port: 80,
              interval: 15,
              timeout: 10,
              retries: 3,
            },
          },
        ],
        targets: [],
        labels: {
          environment: "test",
          "managed-by": "alchemy",
        },
      });

      expect(lb.id).toBeGreaterThan(0);
      expect(lb.name).toBe(lbName);
      expect(lb.loadBalancerType).toBe("lb11");
      expect(lb.location).toBe("nbg1");
      expect(lb.publicNet.ipv4.ip).toBeTruthy();
      expect(lb.created).toBeTruthy();
      expect(lb.services).toHaveLength(1);
      expect(lb.services[0].listenPort).toBe(80);

      // Update: add a second service on port 443
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "tcp",
            listenPort: 80,
            destinationPort: 80,
            healthCheck: { protocol: "tcp", port: 80 },
          },
          {
            protocol: "tcp",
            listenPort: 443,
            destinationPort: 443,
            healthCheck: { protocol: "tcp", port: 443 },
          },
        ],
        targets: [],
        labels: {
          environment: "test",
          "managed-by": "alchemy",
          updated: "true",
        },
      });

      expect(lb.services).toHaveLength(2);
      const ports = lb.services.map((s) => s.listenPort).sort((a, b) => a - b);
      expect(ports).toEqual([80, 443]);

      // Update: remove the port-80 service (service diffing — delete_service)
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "tcp",
            listenPort: 443,
            destinationPort: 443,
            healthCheck: { protocol: "tcp", port: 443 },
          },
        ],
        targets: [],
        labels: { environment: "test", "managed-by": "alchemy" },
      });

      expect(lb.services).toHaveLength(1);
      expect(lb.services[0].listenPort).toBe(443);
    } finally {
      const deletedId = lb?.id;
      await destroy(scope);
      if (deletedId !== undefined) {
        await assertLoadBalancerDeleted(deletedId);
      }
    }
  }, 300_000);

  test("service and target diffing", async (scope) => {
    const lbName = `${BRANCH_PREFIX}-alchemy-lb-diff`;
    let lb: LoadBalancer | undefined;

    try {
      // Create with no targets
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "http",
            listenPort: 80,
            destinationPort: 8080,
            http: { redirectHttp: false },
            healthCheck: {
              protocol: "http",
              port: 8080,
              http: { path: "/health", statusCodes: ["2??"] },
            },
          },
        ],
        targets: [],
        labels: { env: "test" },
      });

      expect(lb.id).toBeGreaterThan(0);
      expect(lb.targets).toHaveLength(0);

      // Add a label_selector target (add_target action).
      // label_selector doesn't require an owned IP or attached network.
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "http",
            listenPort: 80,
            destinationPort: 8080,
            http: { redirectHttp: false },
            healthCheck: {
              protocol: "http",
              port: 8080,
              http: { path: "/health", statusCodes: ["2??"] },
            },
          },
        ],
        targets: [{ type: "label_selector", labelSelector: "env=cod370-test" }],
        labels: { env: "test" },
      });

      expect(lb.targets).toHaveLength(1);
      expect(lb.targets[0].type).toBe("label_selector");
      expect(lb.targets[0].labelSelector).toBe("env=cod370-test");

      // Remove the target (remove_target action)
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [
          {
            protocol: "http",
            listenPort: 80,
            destinationPort: 8080,
            http: { redirectHttp: false },
            healthCheck: {
              protocol: "http",
              port: 8080,
              http: { path: "/health", statusCodes: ["2??"] },
            },
          },
        ],
        targets: [],
        labels: { env: "test" },
      });

      expect(lb.targets).toHaveLength(0);
    } finally {
      const deletedId = lb?.id;
      await destroy(scope);
      if (deletedId !== undefined) {
        await assertLoadBalancerDeleted(deletedId);
      }
    }
  }, 300_000);

  test("adopt existing load balancer", async (scope) => {
    const lbName = `${BRANCH_PREFIX}-alchemy-lb-adopt`;
    let lb1: LoadBalancer | undefined;

    try {
      lb1 = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [],
        targets: [],
      });

      expect(lb1.id).toBeGreaterThan(0);

      // Adopt by name — should resolve to the same underlying resource
      const lb2 = await LoadBalancerResource(`${lbName}-adopted`, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [],
        targets: [],
        adopt: true,
      });

      expect(lb2.id).toBe(lb1.id);
      expect(lb2.name).toBe(lb1.name);
    } finally {
      const deletedId = lb1?.id;
      await destroy(scope);
      if (deletedId !== undefined) {
        await assertLoadBalancerDeleted(deletedId);
      }
    }
  }, 180_000);

  test("location immutability triggers replace", async (scope) => {
    const lbName = `${BRANCH_PREFIX}-alchemy-lb-loc`;
    let lb: LoadBalancer | undefined;
    let originalId: number | undefined;

    try {
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "nbg1",
        services: [],
        targets: [],
      });

      originalId = lb.id;
      expect(lb.location).toBe("nbg1");

      // Changing location must trigger a replace (delete + create)
      lb = await LoadBalancerResource(lbName, {
        name: lbName,
        loadBalancerType: "lb11",
        location: "fsn1",
        services: [],
        targets: [],
      });

      expect(lb.location).toBe("fsn1");
      // The replacement creates a brand-new LB — ID must differ
      expect(lb.id).not.toBe(originalId);

      // Old LB should be gone
      if (originalId !== undefined) {
        await assertLoadBalancerDeleted(originalId);
        originalId = undefined; // Already gone; skip double-check in finally
      }
    } finally {
      const deletedId = lb?.id;
      await destroy(scope);
      if (deletedId !== undefined) {
        await assertLoadBalancerDeleted(deletedId);
      }
      if (originalId !== undefined) {
        await assertLoadBalancerDeleted(originalId);
      }
    }
  }, 300_000);
});

async function assertLoadBalancerDeleted(lbId: number): Promise<void> {
  const api = createHetznerApi({});
  try {
    await api.get(`/load_balancers/${lbId}`);
    throw new Error(`LoadBalancer ${lbId} still exists after deletion`);
  } catch (err: any) {
    if (err instanceof HetznerApiError && err.status === 404) return;
    throw err;
  }
}
