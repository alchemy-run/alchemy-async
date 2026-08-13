import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createVercelApi } from "../../src/vercel/api.ts";
import { Project } from "../../src/vercel/project.ts";
import { Storage } from "../../src/vercel/storage.ts";
import { BRANCH_PREFIX } from "../util.ts";

// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const api = await createVercelApi({
  baseUrl: "https://api.vercel.com/v1",
});

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Vercel Storage Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-storage`;

  test("create, connect projects, update connections, and delete storage", async (scope) => {
    let storage: Storage | undefined;
    let project: Project | undefined;

    try {
      // Create a project to connect
      project = await Project(`${BRANCH_PREFIX}-test-project`, {
        name: `${BRANCH_PREFIX}-test-project`,
        framework: "nextjs",
      });

      // Create storage with a connection to the project
      storage = await Storage(testId, {
        name: testId,
        region: "iad1",
        team: `team_${BRANCH_PREFIX}`,
        type: "blob",
        projects: [
          {
            projectId: project.id,
            envVarEnvironments: ["development", "preview", "production"],
            envVarPrefix: "MY_STORAGE_",
          },
        ],
      });

      expect(storage.id).toBeTruthy();
      expect(storage.name).toEqual(testId);
      expect(storage.type).toEqual("blob");

      // Verify created via API
      const getResponse = await api.get(
        `/storage/stores/${storage.id}?teamId=${typeof storage.team === "string" ? storage.team : storage.team.id}`,
      );
      expect(getResponse.status).toEqual(200);
      const responseData: any = await getResponse.json();
      expect(responseData.store?.id).toEqual(storage.id);

      // Update connections: remove previous, add a new prefix
      storage = await Storage(testId, {
        name: testId,
        region: storage.region,
        team: storage.team,
        type: storage.type,
        projects: [
          {
            projectId: project.id,
            envVarEnvironments: ["production"],
            envVarPrefix: "BLOB_",
          },
        ],
      });

      expect(storage.id).toBeTruthy();
      expect(storage.projectsMetadata).toBeInstanceOf(Array);

      // Verify still exists
      const getUpdatedResponse = await api.get(
        `/storage/stores/${storage.id}?teamId=${typeof storage.team === "string" ? storage.team : storage.team.id}`,
      );
      expect(getUpdatedResponse.status).toEqual(200);
    } catch (err) {
      console.log(err);
      throw err;
    } finally {
      await destroy(scope);

      // Verify storage deleted
      const error = await api
        .get(
          `/storage/stores/${storage?.id}?teamId=${storage && (typeof storage.team === "string" ? storage.team : storage.team.id)}`,
        )
        .catch((error) => error);

      expect(error.cause?.status).toEqual(404);
    }
  });
});
