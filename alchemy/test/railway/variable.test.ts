import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Project } from "../../src/railway/project.ts";
import { Service } from "../../src/railway/service.ts";
import { Variable } from "../../src/railway/variable.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Variable", () => {
  const testId = `${BRANCH_PREFIX}-railway-var`;

  test("create, update, and delete variables", async (scope) => {
    let project: Project | undefined;
    let service: Service | undefined;
    let vars: Variable | undefined;
    try {
      project = await Project(`${testId}-proj`, {
        name: `${testId}-proj`,
      });

      service = await Service(`${testId}-svc`, {
        project,
        name: `${testId}-svc`,
      });

      // Create
      vars = await Variable(testId, {
        project,
        environment: project.defaultEnvironmentId,
        service,
        variables: {
          NODE_ENV: "production",
          PORT: "3000",
        },
      });

      expect(vars.keys).toContain("NODE_ENV");
      expect(vars.keys).toContain("PORT");
      expect(vars.projectId).toEqual(project.projectId);
      expect(vars.environmentId).toEqual(project.defaultEnvironmentId);

      // Update — add a var, remove PORT
      vars = await Variable(testId, {
        project,
        environment: project.defaultEnvironmentId,
        service,
        variables: {
          NODE_ENV: "production",
          APP_NAME: "test-app",
        },
      });

      expect(vars.keys).toContain("NODE_ENV");
      expect(vars.keys).toContain("APP_NAME");
      expect(vars.keys).not.toContain("PORT");
    } finally {
      await destroy(scope);

      if (service?.serviceId && project) {
        await assertVariablesDoNotExist(
          project.projectId,
          project.defaultEnvironmentId,
          service.serviceId,
        );
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

async function assertVariablesDoNotExist(
  projectId: string,
  environmentId: string,
  serviceId: string,
): Promise<void> {
  const api = new RailwayApi();
  try {
    const data = await api.query<{
      variables: Record<string, string>;
    }>(
      `query variables($projectId: String!, $environmentId: String!, $serviceId: String!) {
        variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
      }`,
      { projectId, environmentId, serviceId },
    );
    // After deletion, either the query fails or returns empty
    expect(Object.keys(data.variables)).toHaveLength(0);
  } catch {
    // Expected: service/project not found after deletion
  }
}
