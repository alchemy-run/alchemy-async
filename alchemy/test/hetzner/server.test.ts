import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createHetznerApi } from "../../src/hetzner/api.ts";
import { Server } from "../../src/hetzner/server.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const api = createHetznerApi({});

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

async function assertServerDeleted(serverId: number): Promise<void> {
  try {
    await api.get(`/servers/${serverId}`);
    throw new Error(`Server ${serverId} still exists after destroy`);
  } catch (err: any) {
    // HetznerApiError with status 404 is the expected outcome
    if (err.status !== 404) throw err;
  }
}

describe("Hetzner Server Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-hetzner-server`;

  test("create, update, and delete server", async (scope) => {
    let server: Server | undefined;
    try {
      // Create a minimal server
      server = await Server(testId, {
        serverType: "cx22",
        image: "ubuntu-24.04",
        location: "fsn1",
        labels: { env: "test" },
      });

      expect(server.id).toBeGreaterThan(0);
      expect(server.name).toBeTruthy();
      expect(server.status).toEqual("running");
      expect(server.serverType).toEqual("cx22");
      expect(server.image).toEqual("ubuntu-24.04");
      expect(server.location).toEqual("fsn1");
      expect(server.created).toBeTruthy();
      expect(server.publicNet).toBeTruthy();
      expect(server.publicNet.ipv4?.ip).toBeTruthy();
      expect(server.privateNet).toEqual([]);
      expect(server.labels).toMatchObject({ env: "test" });

      // Verify the server exists via API
      const verifyData = await api.get<any>(`/servers/${server.id}`);
      expect(verifyData.server.id).toEqual(server.id);
      expect(verifyData.server.status).toEqual("running");

      const serverId = server.id;

      // Update: change labels (mutable property)
      server = await Server(testId, {
        serverType: "cx22",
        image: "ubuntu-24.04",
        location: "fsn1",
        labels: { env: "test", updated: "true" },
      });

      expect(server.id).toEqual(serverId);
      expect(server.labels).toMatchObject({ env: "test", updated: "true" });

      // Verify updated labels via API
      const updatedData = await api.get<any>(`/servers/${server.id}`);
      expect(updatedData.server.labels).toMatchObject({
        env: "test",
        updated: "true",
      });
    } finally {
      const serverId = server?.id;
      await destroy(scope);

      // Verify the server no longer exists
      if (serverId !== undefined) {
        await assertServerDeleted(serverId);
      }
    }
  });

  test("immutable serverType triggers replace", async (scope) => {
    let server: Server | undefined;
    try {
      server = await Server(`${testId}-replace`, {
        serverType: "cx22",
        image: "ubuntu-24.04",
        location: "fsn1",
      });

      const originalId = server.id;
      expect(server.serverType).toEqual("cx22");

      // Change serverType — must trigger replacement (new server created)
      server = await Server(`${testId}-replace`, {
        serverType: "cx32",
        image: "ubuntu-24.04",
        location: "fsn1",
      });

      expect(server.status).toEqual("running");
      expect(server.serverType).toEqual("cx32");
      // Replacement creates a new resource with a different id
      expect(server.id).not.toEqual(originalId);
    } finally {
      await destroy(scope);

      if (server?.id !== undefined) {
        await assertServerDeleted(server.id);
      }
    }
  });

  test("immutable image triggers replace", async (scope) => {
    let server: Server | undefined;
    try {
      server = await Server(`${testId}-img-replace`, {
        serverType: "cx22",
        image: "ubuntu-24.04",
        location: "fsn1",
      });

      const originalId = server.id;
      expect(server.image).toEqual("ubuntu-24.04");

      // Change image — must trigger replacement
      server = await Server(`${testId}-img-replace`, {
        serverType: "cx22",
        image: "debian-12",
        location: "fsn1",
      });

      expect(server.status).toEqual("running");
      expect(server.image).toEqual("debian-12");
      expect(server.id).not.toEqual(originalId);
    } finally {
      await destroy(scope);

      if (server?.id !== undefined) {
        await assertServerDeleted(server.id);
      }
    }
  });
});
