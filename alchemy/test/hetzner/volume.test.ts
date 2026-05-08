import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createHetznerApi } from "../../src/hetzner/api.ts";
import { Volume } from "../../src/hetzner/volume.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Hetzner Volume", () => {
  const testId = `${BRANCH_PREFIX}-hetzner-vol`;

  test("create, resize, and delete volume", async (scope) => {
    let volume: Volume | undefined;
    try {
      volume = await Volume(testId, {
        size: 10,
        location: "fsn1",
        format: "ext4",
        labels: { env: "test" },
      });

      expect(volume.id).toBeTypeOf("number");
      expect(volume.name).toBeTruthy();
      expect(volume.status).toBe("available");
      expect(volume.linuxDevice).toBeTruthy();
      expect(volume.location).toBe("fsn1");
      expect(volume.size).toBe(10);
      expect(volume.format).toBe("ext4");

      // Resize volume
      volume = await Volume(testId, {
        size: 20,
        location: "fsn1",
        labels: { env: "test", resized: "true" },
      });

      expect(volume.size).toBe(20);
      expect(volume.labels).toMatchObject({ env: "test", resized: "true" });

      // Shrink attempt should throw
      await expect(
        Volume(testId, { size: 5, location: "fsn1" }),
      ).rejects.toThrow("cannot be shrunk");
    } finally {
      await destroy(scope);
      if (volume?.id) {
        await assertVolumeDeleted(volume.id);
      }
    }
  });
});

async function assertVolumeDeleted(volumeId: number): Promise<void> {
  const api = createHetznerApi({});
  try {
    await api.get(`/volumes/${volumeId}`);
    throw new Error(`Volume ${volumeId} still exists after deletion`);
  } catch (err: any) {
    if (err.status !== 404) throw err;
  }
}
