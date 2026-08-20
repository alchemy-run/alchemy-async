import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Domain } from "../../src/railway/domain.ts";
import { Project } from "../../src/railway/project.ts";
import { Service } from "../../src/railway/service.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Domain", () => {
  const testId = `${BRANCH_PREFIX}-railway-domain`;

  test("create and delete railway domain", async (scope) => {
    let project: Project | undefined;
    let domain: Domain | undefined;
    try {
      project = await Project(`${testId}-proj`, {
        name: `${testId}-proj`,
      });

      const service = await Service(`${testId}-svc`, {
        project,
        name: `${testId}-svc`,
        source: { image: "nginx:latest" },
      });

      domain = await Domain(testId, {
        service,
        environment: project.defaultEnvironmentId,
      });

      expect(domain.domainId).toBeTruthy();
      expect(domain.domain).toBeTruthy();
      expect(domain.domain).toContain(".up.railway.app");
      expect(domain.serviceId).toEqual(service.serviceId);
      expect(domain.environmentId).toEqual(project.defaultEnvironmentId);
    } finally {
      await destroy(scope);

      if (domain?.domainId) {
        await assertDomainDoesNotExist(domain.domainId);
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

async function assertDomainDoesNotExist(domainId: string): Promise<void> {
  const api = new RailwayApi();
  try {
    await api.query(
      `query domain($id: String!) {
        domain(id: $id) { id }
      }`,
      { id: domainId },
    );
    expect.fail("Domain should have been deleted");
  } catch {
    // Expected: domain not found
  }
}
