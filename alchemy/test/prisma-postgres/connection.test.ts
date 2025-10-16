import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createPrismaApi } from "../../src/prisma-postgres/api.ts";
import { Connection } from "../../src/prisma-postgres/connection.ts";
import { Database } from "../../src/prisma-postgres/database.ts";
import { Project } from "../../src/prisma-postgres/project.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Prisma Database Connection", async () => {
  const api = createPrismaApi();

  test("create and delete database", async (scope) => {
    const projectId = `${BRANCH_PREFIX}-test-dbc-project`;
    const databaseId = `${BRANCH_PREFIX}-test-dbc-database`;
    const testId = `${BRANCH_PREFIX}-test-database-connection`;
    let connection: Connection | undefined;
    let project: Project | undefined;

    try {
      project = await Project(projectId, {
        name: projectId,
      });

      const database = await Database(databaseId, {
        project,
        name: databaseId,
        region: "ap-northeast-1",
      });

      connection = await Connection(testId, {
        database,
        name: testId,
      });

      expect(connection.name).toBe(testId);
      expect(connection.database).toBe(database.id);
      expect(connection.createdAt).toBeDefined();
      expect(connection.connectionString.unencrypted).toBeDefined();
    } finally {
      await alchemy.destroy(scope);

      if (connection != null) {
        const status = await api
          .listDatabaseConnections({
            path: { databaseId: connection.database },
          })
          .then((data) => data.data.data.find((c) => c.name === testId))
          .catch((error) => {
            return (error.status as number) ?? 500;
          });
        expect(status).toBe(undefined);

        await api.deleteProject({
          path: {
            id: project!.id,
          },
        });
      }
    }
  });
});
