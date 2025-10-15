import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createPrismaApi } from "../../src/prisma/api.ts";
import { DatabaseConnection } from "../../src/prisma/database-connection.ts";
import { Database } from "../../src/prisma/database.ts";
import { Project } from "../../src/prisma/project.ts";
import "../../src/test/vitest.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe.skipIf(!process.env.ALL_TESTS)(
  "Prisma Database Connection",
  async () => {
    const api = createPrismaApi();

    test("create and delete database", async (scope) => {
      const projectId = `${BRANCH_PREFIX}-test-dbc-project`;
      const databaseId = `${BRANCH_PREFIX}-test-dbc-database`;
      const testId = `${BRANCH_PREFIX}-test-database-connection`;
      let databaseConnection: DatabaseConnection | undefined;
      let project: Project | undefined;

      try {
        project = await Project(projectId, {
          name: projectId,
          adopt: true,
        });

        const database = await Database(databaseId, {
          project,
          name: databaseId,
          adopt: true,
          region: "ap-northeast-1",
        });

        databaseConnection = await DatabaseConnection(testId, {
          database,
          name: testId,
        });

        expect(databaseConnection.name).toBe(testId);
        expect(databaseConnection.database).toBe(database.id);
        expect(databaseConnection.createdAt).toBeDefined();
        expect(databaseConnection.connectionString.unencrypted).toBeDefined();
      } finally {
        await alchemy.destroy(scope);

        if (databaseConnection != null) {
          const status = await api
            .listDatabaseConnections({
              path: { databaseId: databaseConnection.database },
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
  },
);
