import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createHetznerApi } from "../../src/hetzner/api.ts";
import { SSHKey } from "../../src/hetzner/ssh-key.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

// Distinct throwaway public keys — one unique pair per test to avoid
// Hetzner's uniqueness constraint when tests run concurrently.
const PUBLIC_KEY_1 =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJdi4GzEMcAuxbzIYFTqedkc8rmYRk920D/PPrxrZRtV test1@alchemy";
const PUBLIC_KEY_2 =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICfu4Nc0ywsp4i/DPHW2ikdDIe9OkrY1gG0WoywClAhP test2@alchemy";
// Keys 3-5 are used by individual tests to avoid fingerprint conflicts
const PUBLIC_KEY_3 =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIMKQSZhYcf7O3MZp4uEFc5j14Bh/5Ky9r9gVamwJPVT0 test3@alchemy";
const PUBLIC_KEY_4 =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIJv5Czhph6vk6HgxjZmN9AAaVlQpW+MpuEXZ+z2jqnAH test4@alchemy";
const PUBLIC_KEY_5 =
  "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIK4+intxP3VUMPmpwP8xgEKZskZtdBKqrW5usYmZBDqM test5@alchemy";

const test = alchemy.test(import.meta, { prefix: BRANCH_PREFIX });

describe("Hetzner SSHKey", () => {
  test("create, update labels, delete", async (scope) => {
    const id = `${BRANCH_PREFIX}-ssh-key-test`;
    let key: SSHKey | undefined;
    try {
      key = await SSHKey(id, {
        publicKey: PUBLIC_KEY_3,
        labels: { env: "test" },
      });

      expect(key.id).toBeTruthy();
      expect(key.fingerprint).toBeTruthy();
      expect(key.name).toBeTruthy();
      expect(key.publicKey).toEqual(PUBLIC_KEY_3);
      expect(key.labels).toEqual({ env: "test" });
      expect(key.created).toBeTruthy();

      // Verify via API
      const resolvedApi = createHetznerApi({});
      const listRes = await resolvedApi.get<{
        ssh_keys: Array<{ id: number; name: string }>;
      }>("/ssh_keys");
      expect(listRes.ssh_keys).toBeTruthy();
      const { ssh_keys } = listRes;
      expect(ssh_keys.some((k) => k.id === key!.id)).toBe(true);

      // Update labels
      const updatedKey = await SSHKey(id, {
        publicKey: PUBLIC_KEY_3,
        labels: { env: "test", updated: "true" },
      });

      expect(updatedKey.id).toEqual(key.id);
      expect(updatedKey.labels).toEqual({ env: "test", updated: "true" });
      key = updatedKey;
    } finally {
      await destroy(scope);

      // Verify the key was deleted
      if (key?.id) {
        const resolvedApi = createHetznerApi({});
        try {
          await resolvedApi.get(`/ssh_keys/${key.id}`);
          throw new Error(`SSH key ${key.id} still exists after deletion`);
        } catch (err: any) {
          expect(err?.status).toEqual(404);
        }
      }
    }
  });

  test("immutable publicKey triggers replace", async (scope) => {
    const id = `${BRANCH_PREFIX}-ssh-key-replace`;
    let key: SSHKey | undefined;
    try {
      key = await SSHKey(id, {
        publicKey: PUBLIC_KEY_4,
      });
      expect(key.id).toBeTruthy();
      const originalId = key.id;

      // Change publicKey — should trigger replacement (new resource)
      key = await SSHKey(id, {
        publicKey: PUBLIC_KEY_5,
      });

      expect(key.id).toBeTruthy();
      expect(key.id).not.toEqual(originalId);
      expect(key.publicKey).toEqual(PUBLIC_KEY_5);

      // Old key should no longer exist
      const resolvedApi = createHetznerApi({});
      try {
        await resolvedApi.get(`/ssh_keys/${originalId}`);
        throw new Error(`SSH key ${originalId} still exists after replacement`);
      } catch (err: any) {
        expect(err?.status).toEqual(404);
      }
    } finally {
      await destroy(scope);

      if (key?.id) {
        const resolvedApi = createHetznerApi({});
        try {
          await resolvedApi.get(`/ssh_keys/${key.id}`);
        } catch (err: any) {
          expect(err?.status).toEqual(404);
        }
      }
    }
  });

  test("adopt existing", async (scope) => {
    const name = `${BRANCH_PREFIX}-ssh-key-adopt`;
    let existingId: number | undefined;
    let key: SSHKey | undefined;
    try {
      // Create the key manually via API
      const resolvedApi = createHetznerApi({});
      const createRes = await resolvedApi.post<{
        ssh_key: { id: number; name: string; fingerprint: string };
      }>("/ssh_keys", {
        name,
        public_key: PUBLIC_KEY_1,
        labels: {},
      });
      const { ssh_key } = createRes;
      existingId = ssh_key.id;

      // Adopt it via Alchemy
      key = await SSHKey(`${BRANCH_PREFIX}-ssh-key-adopt`, {
        name,
        publicKey: PUBLIC_KEY_1,
        adopt: true,
      });

      expect(key.id).toEqual(existingId);
      expect(key.fingerprint).toEqual(ssh_key.fingerprint);
    } finally {
      await destroy(scope);

      if (key?.id ?? existingId) {
        const resolvedApi = createHetznerApi({});
        try {
          await resolvedApi.get(`/ssh_keys/${key?.id ?? existingId}`);
          throw new Error(
            `SSH key ${key?.id ?? existingId} still exists after deletion`,
          );
        } catch (err: any) {
          expect(err?.status).toEqual(404);
        }
      }
    }
  });
});
