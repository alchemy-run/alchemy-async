import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Project } from "../../src/railway/project.ts";
import { Service } from "../../src/railway/service.ts";
import { Volume } from "../../src/railway/volume.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Volume", () => {
  const testId = `${BRANCH_PREFIX}-railway-vol`;

  test("create, replace, and delete volume", async (scope) => {
    let project: Project | undefined;
    let volume: Volume | undefined;
    try {
      project = await Project(`${testId}-proj`, {
        name: `${testId}-proj`,
      });

      const service = await Service(`${testId}-svc`, {
        project,
        name: `${testId}-svc`,
      });

      volume = await Volume(testId, {
        project,
        service,
        environment: project.defaultEnvironmentId,
        mountPath: "/data",
      });

      expect(volume.volumeId).toBeTruthy();
      expect(volume.mountPath).toEqual("/data");
      expect(volume.projectId).toEqual(project.projectId);
      expect(volume.serviceId).toEqual(service.serviceId);

      const originalVolumeId = volume.volumeId;

      // Replace — mountPath is immutable
      volume = await Volume(testId, {
        project,
        service,
        environment: project.defaultEnvironmentId,
        mountPath: "/data/v2",
      });

      expect(volume.volumeId).toBeTruthy();
      expect(volume.volumeId).not.toEqual(originalVolumeId);
      expect(volume.mountPath).toEqual("/data/v2");
    } finally {
      await destroy(scope);

      if (volume?.volumeId) {
        await assertVolumeDoesNotExist(volume.volumeId);
      }

      if (project?.projectId) {
        const api = new RailwayApi();
        try {
          await api.query(
            `mutation projectDelete($id: String!) {
              projectDelete(id: $id)
            }`,
            { id: project.projectId },
          );
        } catch {
          // OK if already deleted
        }
      }
    }
  });
});

async function assertVolumeDoesNotExist(volumeId: string): Promise<void> {
  const api = new RailwayApi();
  try {
    await api.query(
      `query volume($id: String!) {
        volume(id: $id) { id }
      }`,
      { id: volumeId },
    );
    expect.fail("Volume should have been deleted");
  } catch {
    // Expected: volume not found
  }
}
