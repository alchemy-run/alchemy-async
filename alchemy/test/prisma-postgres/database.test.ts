import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createPrismaApi } from "../../src/prisma-postgres/api.ts";
import { Database } from "../../src/prisma-postgres/database.ts";
import { Project } from "../../src/prisma-postgres/project.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Prisma Database", async () => {
  const api = createPrismaApi();

  test("create and delete database", async (scope) => {
    const projectId = `${BRANCH_PREFIX}-test-db-project`;
    const testId = `${BRANCH_PREFIX}-test-database`;
    let database: Database | undefined;

    try {
      const project = await Project(projectId, {
        name: projectId,
        delete: true,
      });

      database = await Database(testId, {
        project,
        name: testId,
        delete: true,
        region: "ap-northeast-1",
      });

      expect(database.region).toBe("ap-northeast-1");
      expect(database.name).toBe(testId);
      expect(database.project).toBe(project.id);

      const databases = await api.listDatabases({
        path: {
          projectId: project.id,
        },
      });
      const foundDatabase = databases.data.data.find((d) => d.name === testId);
      expect(foundDatabase).toBeTruthy();
      expect(foundDatabase?.id).toBe(database.id);
    } finally {
      await alchemy.destroy(scope);

      if (database != null) {
        const status = await api
          .getDatabase({
            path: { databaseId: database.id },
          })
          .then((data) => data.response.status)
          .catch((error) => {
            return (error.status as number) ?? 500;
          });
        expect(status).toBe(404);
      }
    }
  });

  test("dont delete database if delete is false", async (scope) => {
    const projectId = `${BRANCH_PREFIX}-test-project-db-retained`;
    const testId = `${BRANCH_PREFIX}-test-database-retained`;
    let project: Project | undefined;
    let database: Database | undefined;

    try {
      project = await Project(projectId, {
        name: projectId,
      });

      database = await Database(testId, {
        project,
        name: testId,
      });
    } finally {
      await alchemy.destroy(scope);

      if (database != null) {
        const status = await api
          .getDatabase({
            path: { databaseId: database.id },
          })
          .then((data) => data.response.status)
          .catch((error) => {
            return (error.status as number) ?? 500;
          });
        expect(status).toBe(200);

        await api.deleteProject({
          path: {
            id: project!.id,
          },
        });
      }
    }
  });
});
