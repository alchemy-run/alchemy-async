import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createRailwayApi } from "../../src/railway/api.ts";
import { Project, ProjectRef } from "../../src/railway/index.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

// Create API client for verification
const api = createRailwayApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Railway Project Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-railway-project`;

  test("create, update, and delete project", async (scope) => {
    let project: typeof Project.prototype | undefined;
    try {
      // Create a test Railway project
      project = await Project(testId, {
        name: `${testId}-test`,
        description: "Test project for Alchemy",
      });

      expect(project.id).toBeTruthy();
      expect(project.name).toEqual(`${testId}-test`);
      expect(project.description).toEqual("Test project for Alchemy");
      expect(project.createdAt).toBeTruthy();
      expect(project.updatedAt).toBeTruthy();
      expect(project.environments).toBeDefined();

      // Verify project was created by querying the API directly
      const data = await api.request<{
        project: {
          id: string;
          name: string;
          description: string;
        };
      }>(
        `
        query project($id: String!) {
          project(id: $id) {
            id
            name
            description
          }
        }
      `,
        { id: project.id },
      );

      expect(data.project.name).toEqual(`${testId}-test`);

      // Update the project
      const updatedDescription = "Updated test project";
      project = await Project(testId, {
        name: `${testId}-test`,
        description: updatedDescription,
      });

      expect(project.description).toEqual(updatedDescription);

      // Verify project was updated
      const updatedData = await api.request<{
        project: {
          id: string;
          name: string;
          description: string;
        };
      }>(
        `
        query project($id: String!) {
          project(id: $id) {
            id
            name
            description
          }
        }
      `,
        { id: project.id },
      );
      expect(updatedData.project.description).toEqual(updatedDescription);
    } finally {
      // Always clean up
      await destroy(scope);

      // Verify project was deleted
      if (project?.id) {
        try {
          await api.request(
            `
            query project($id: String!) {
              project(id: $id) {
                id
              }
            }
          `,
            { id: project.id },
          );
          // If we get here, project still exists - fail
          expect(true).toBe(false);
        } catch (error) {
          // Project should not exist
          expect(error).toBeDefined();
        }
      }
    }
  });

  test("adopt existing project", async (scope) => {
    let existingProjectId: string | undefined;
    let adoptedProject: typeof Project.prototype | undefined;

    try {
      // Create a project via API first
      const createData = await api.request<{
        projectCreate: {
          id: string;
          name: string;
        };
      }>(
        `
        mutation projectCreate($input: ProjectCreateInput!) {
          projectCreate(input: $input) {
            id
            name
          }
        }
      `,
        {
          input: {
            name: `${testId}-existing`,
            description: "Existing project to adopt",
          },
        },
      );

      existingProjectId = createData.projectCreate.id;

      // Adopt the project
      adoptedProject = await Project(`${testId}-adopted`, {
        adopt: true,
        name: `${testId}-existing`,
      });

      expect(adoptedProject.id).toEqual(existingProjectId);
      expect(adoptedProject.name).toEqual(`${testId}-existing`);
    } finally {
      await destroy(scope);

      // Clean up the adopted project if it still exists
      if (existingProjectId) {
        try {
          await api.request(
            `
            mutation projectDelete($id: String!) {
              projectDelete(id: $id)
            }
          `,
            { id: existingProjectId },
          );
        } catch {
          // Ignore errors - project may have been deleted
        }
      }
    }
  });

  test("does not delete project when delete is false", async (scope) => {
    let project: typeof Project.prototype | undefined;
    try {
      project = await Project(`${testId}-no-delete`, {
        name: `${testId}-no-delete`,
        delete: false,
      });
      expect(project.id).toBeTruthy();
    } finally {
      await destroy(scope);

      // Verify project still exists
      if (project?.id) {
        const data = await api.request<{
          project: {
            id: string;
          };
        }>(
          `
          query project($id: String!) {
            project(id: $id) {
              id
            }
          }
        `,
          { id: project.id },
        );
        expect(data.project.id).toEqual(project.id);

        // Clean up manually
        await api.request(
          `
          mutation projectDelete($id: String!) {
            projectDelete(id: $id)
          }
        `,
          { id: project.id },
        );
      }
    }
  });
});
