import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { DockerApi } from "../../src/docker/api.ts";
import { Volume } from "../../src/docker/volume.ts";
import { BRANCH_PREFIX } from "../util.ts";

import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Volume", () => {
  test("should create a volume with default driver", async (scope) => {
    try {
      const volumeName = `alchemy-test-volume-${Date.now()}`;
      const volume = await Volume("test-volume", {
        name: volumeName,
      });

      expect(volume.name).toBe(volumeName);
      expect(volume.driver).toBe("local"); // default value
      expect(volume.id).toBe(volumeName); // volume ID is same as name
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a volume with custom driver and options", async (scope) => {
    try {
      const volumeName = `alchemy-test-volume-custom-${Date.now()}`;
      const volume = await Volume("test-volume-custom", {
        name: volumeName,
        driver: "local",
        driverOpts: {
          type: "tmpfs",
          device: "tmpfs",
          o: "size=100m,uid=1000",
        },
      });

      expect(volume.name).toBe(volumeName);
      expect(volume.driver).toBe("local");
      expect(volume.driverOpts).toEqual({
        type: "tmpfs",
        device: "tmpfs",
        o: "size=100m,uid=1000",
      });
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a volume with labels", async (scope) => {
    try {
      const volumeName = `alchemy-test-volume-labels-${Date.now()}`;
      const volume = await Volume("test-volume-labels", {
        name: volumeName,
        labels: [
          { name: "com.example.usage", value: "test-volume" },
          { name: "com.example.created-by", value: "alchemy-tests" },
        ],
      });

      expect(volume.name).toBe(volumeName);
      expect(volume.labels).toEqual([
        { name: "com.example.usage", value: "test-volume" },
        { name: "com.example.created-by", value: "alchemy-tests" },
      ]);
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should create a volume with labels as record", async (scope) => {
    try {
      const volumeName = `alchemy-test-volume-record-labels-${Date.now()}`;
      const volume = await Volume("test-volume-record-labels", {
        name: volumeName,
        labels: {
          "com.example.usage": "test-volume",
          "com.example.created-by": "alchemy-tests",
        },
      });

      expect(volume.name).toBe(volumeName);
      // When we pass labels as a record, it should be processed correctly internally
      // but not reflected in the output since we're preserving the input format
      expect(volume.labels).toBeUndefined();
    } finally {
      await alchemy.destroy(scope);
    }
  });

  test("should fail to create a volume when name already exists without adopt", async (scope) => {
    const api = new DockerApi();
    const volumeName = `${BRANCH_PREFIX}-adopt-test-no-adopt`;

    try {
      // Manually create a volume outside of Alchemy
      await api.createVolume(volumeName, "local", {}, {});

      // Attempt to create a volume with the same name without adopt flag
      await expect(
        Volume("adopt-test-no-adopt", {
          name: volumeName,
        }),
      ).rejects.toThrow(
        `Volume "${volumeName}" already exists. Use adopt: true to adopt it.`,
      );
    } finally {
      // Clean up manually created volume
      await api.removeVolume(volumeName);
      await alchemy.destroy(scope);
    }
  });

  test("should adopt an existing volume when adopt is true", async (scope) => {
    const api = new DockerApi();
    const volumeName = `${BRANCH_PREFIX}-adopt-test-with-adopt`;

    try {
      // Manually create a volume outside of Alchemy
      await api.createVolume(volumeName, "local", {}, {});

      // Adopt the volume with Alchemy
      const volume = await Volume("adopt-test-with-adopt", {
        name: volumeName,
        adopt: true,
      });

      // Verify the volume was adopted (same name)
      expect(volume.id).toBe(volumeName);
      expect(volume.name).toBe(volumeName);
      expect(volume.driver).toBe("local");
    } finally {
      await alchemy.destroy(scope);

      // Verify volume was removed
      const exists = await api.volumeExists(volumeName);
      expect(exists).toBe(false);
    }
  });
});
