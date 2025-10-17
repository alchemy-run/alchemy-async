import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createPrismaApi } from "../../src/prisma-postgres/api.ts";
import { Project } from "../../src/prisma-postgres/project.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Prisma Project", async () => {
  const api = createPrismaApi();

  test("create and delete project", async (scope) => {
    const testId = `${BRANCH_PREFIX}-test-project`;
    let project: Project | undefined;

    try {
      project = await Project(testId, {
        name: testId,
        delete: true,
      });

      expect(project.name).toEqual(testId);

      const projects = await api.listProjects();
      const foundProject = projects.data.data.find((p) => p.name === testId);

      expect(foundProject).toBeTruthy();
      expect(foundProject?.id).toEqual(`proj_${project.id}`);
    } finally {
      await alchemy.destroy(scope);

      if (project != null) {
        const status = await api
          .getProject({
            path: {
              id: project.id,
            },
          })
          .then((data) => {
            return data.response.status;
          })
          .catch((error) => {
            return (error.status as number) ?? 500;
          });
        expect(status).toBe(404);
      }
    }
  });

  test("dont delete project if delete is false", async (scope) => {
    const testId = `${BRANCH_PREFIX}-test-project-retained`;
    let project: Project | undefined;

    try {
      project = await Project(testId, {
        name: testId,
      });
    } finally {
      await alchemy.destroy(scope);

      if (project != null) {
        const status = await api
          .getProject({
            path: {
              id: project.id,
            },
          })
          .then((data) => {
            return data.response.status;
          })
          .catch((error) => {
            return (error.status as number) ?? 500;
          });
        expect(status).toBe(200);

        await api.deleteProject({
          path: {
            id: project.id,
          },
        });
      }
    }
  });
});
