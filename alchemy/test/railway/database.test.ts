import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createRailwayApi } from "../../src/railway/api.ts";
import {
  Project,
  PostgresDatabase,
  RedisDatabase,
} from "../../src/railway/index.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const api = createRailwayApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Railway Database Resources", () => {
  const testId = `${BRANCH_PREFIX}-test-railway-db`;

  test("create PostgreSQL database", async (scope) => {
    let project: typeof Project.prototype | undefined;
    let db: typeof PostgresDatabase.prototype | undefined;

    try {
      project = await Project(`${testId}-pg-project`, {
        name: `${testId}-postgres-project`,
      });

      db = await PostgresDatabase(`${testId}-postgres`, {
        project,
        name: `${testId}-postgres-db`,
      });

      expect(db.id).toBeTruthy();
      expect(db.name).toEqual(`${testId}-postgres-db`);
      expect(db.projectId).toEqual(project.id);
      expect(db.type).toEqual("postgres");
      expect(db.createdAt).toBeTruthy();

      // Verify the service was created via API
      const data = await api.request<{
        service: {
          id: string;
          name: string;
          projectId: string;
        };
      }>(
        `
        query service($id: String!) {
          service(id: $id) {
            id
            name
            projectId
          }
        }
      `,
        { id: db.id },
      );

      expect(data.service.projectId).toEqual(project.id);
    } finally {
      await destroy(scope);
    }
  }, 60000);

  test("create Redis database", async (scope) => {
    let project: typeof Project.prototype | undefined;
    let redis: typeof RedisDatabase.prototype | undefined;

    try {
      project = await Project(`${testId}-redis-project`, {
        name: `${testId}-redis-project`,
      });

      redis = await RedisDatabase(`${testId}-redis`, {
        project,
        name: `${testId}-redis-cache`,
      });

      expect(redis.id).toBeTruthy();
      expect(redis.name).toEqual(`${testId}-redis-cache`);
      expect(redis.projectId).toEqual(project.id);
      expect(redis.type).toEqual("redis");
      expect(redis.createdAt).toBeTruthy();
    } finally {
      await destroy(scope);
    }
  }, 60000);
});
