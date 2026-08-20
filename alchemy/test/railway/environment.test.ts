import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Environment } from "../../src/railway/environment.ts";
import { Project } from "../../src/railway/project.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Environment", () => {
  const testId = `${BRANCH_PREFIX}-railway-env`;

  test("create, replace, and delete environment", async (scope) => {
    let project: Project | undefined;
    let env: Environment | undefined;
    try {
      project = await Project(`${testId}-proj`, {
        name: `${testId}-proj`,
      });

      env = await Environment(testId, {
        project,
        name: `${testId}-staging`,
      });

      expect(env.environmentId).toBeTruthy();
      expect(env.name).toEqual(`${testId}-staging`);
      expect(env.projectId).toEqual(project.projectId);
      expect(env.createdAt).toBeTruthy();

      const originalEnvId = env.environmentId;

      // Replace — name is immutable
      env = await Environment(testId, {
        project,
        name: `${testId}-staging-v2`,
      });

      expect(env.environmentId).toBeTruthy();
      expect(env.environmentId).not.toEqual(originalEnvId);
      expect(env.name).toEqual(`${testId}-staging-v2`);
    } finally {
      await destroy(scope);

      if (env?.environmentId) {
        await assertEnvironmentDoesNotExist(env.environmentId);
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

async function assertEnvironmentDoesNotExist(
  environmentId: string,
): Promise<void> {
  const api = new RailwayApi();
  try {
    await api.query(
      `query environment($id: String!) {
        environment(id: $id) { id }
      }`,
      { id: environmentId },
    );
    expect.fail("Environment should have been deleted");
  } catch {
    // Expected: environment not found
  }
}
