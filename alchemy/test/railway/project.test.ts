import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Project } from "../../src/railway/project.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Project", () => {
  const testId = `${BRANCH_PREFIX}-project`;

  test("create, update, and delete project", async (scope) => {
    let project: Project | undefined;
    try {
      project = await Project(testId, {
        name: `${testId}-test`,
        description: "Test project from Alchemy",
      });

      expect(project.projectId).toBeTruthy();
      expect(project.name).toEqual(`${testId}-test`);
      expect(project.description).toEqual("Test project from Alchemy");
      expect(project.defaultEnvironmentId).toBeTruthy();
      expect(project.createdAt).toBeTruthy();
      expect(project.updatedAt).toBeTruthy();

      // Update
      project = await Project(testId, {
        name: `${testId}-test-updated`,
        description: "Updated test project",
      });

      expect(project.name).toEqual(`${testId}-test-updated`);
      expect(project.description).toEqual("Updated test project");
    } finally {
      await destroy(scope);

      if (project?.projectId) {
        const api = new RailwayApi();
        try {
          await api.query(
            `query project($id: String!) {
              project(id: $id) { id }
            }`,
            { id: project.projectId },
          );
          expect.fail("Project should have been deleted");
        } catch {
          // Expected: project not found
        }
      }
    }
  });

  test("does not delete project when delete is false", async (scope) => {
    let project: Project | undefined;
    const api = new RailwayApi();
    try {
      project = await Project(`${testId}-no-delete`, {
        name: `${testId}-no-delete`,
        delete: false,
      });

      expect(project.projectId).toBeTruthy();
    } finally {
      await destroy(scope);

      if (project?.projectId) {
        // Verify project still exists
        const data = await api.query<{ project: { id: string } }>(
          `query project($id: String!) {
            project(id: $id) { id }
          }`,
          { id: project.projectId },
        );
        expect(data.project.id).toEqual(project.projectId);

        // Clean up manually
        await api.query(
          `mutation projectDelete($id: String!) {
            projectDelete(id: $id)
          }`,
          { id: project.projectId },
        );
      }
    }
  });
});
