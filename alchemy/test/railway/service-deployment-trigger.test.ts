import { randomUUID } from "node:crypto";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { RailwayApi } from "../../src/railway/api.ts";
import { Project } from "../../src/railway/project.ts";
import { Service } from "../../src/railway/service.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const skipIfNoToken = !process.env.RAILWAY_API_TOKEN;

describe.skipIf(skipIfNoToken)("Railway Service deployment trigger", () => {
  const runId = randomUUID().slice(0, 8);
  const testId = `${BRANCH_PREFIX}-rsvc-${runId}`;
  let project: Project | undefined;

  test.beforeAll(async () => {
    project = await Project(`${testId}-proj`, {
      name: `${testId}-proj`,
    });
  });

  test.afterAll(async () => {
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
  });

  test("create, update, and remove managed deployment trigger", async (scope) => {
    try {
      if (!project) {
        throw new Error("Expected test project to be initialized");
      }

      const serviceName = `${testId}-svc`;
      let service = await Service(`${testId}-svc`, {
        project,
        name: serviceName,
        source: { repo: "Makisuo/maple" },
        deploymentTrigger: {
          branch: "main",
          rootDirectory: "/",
        },
      });

      expect(service.deploymentTriggerId).toBeTruthy();
      expect(service.deploymentTriggerBranch).toEqual("main");
      expect(service.deploymentTriggerRepository).toEqual("Makisuo/maple");
      const initialTriggerId = service.deploymentTriggerId!;

      let triggers = await listServiceTriggers(service.serviceId);
      expect(triggers.some((trigger) => trigger.id === initialTriggerId)).toBe(
        true,
      );

      service = await Service(`${testId}-svc`, {
        project,
        name: serviceName,
        source: { repo: "Makisuo/maple" },
        deploymentTrigger: {
          branch: "develop",
          rootDirectory: "/",
        },
      });

      expect(service.deploymentTriggerId).toEqual(initialTriggerId);
      expect(service.deploymentTriggerBranch).toEqual("develop");

      triggers = await listServiceTriggers(service.serviceId);
      const updated = triggers.find(
        (trigger) => trigger.id === initialTriggerId,
      );
      expect(updated).toBeTruthy();
      expect(updated?.branch).toEqual("develop");

      service = await Service(`${testId}-svc`, {
        project,
        name: serviceName,
        source: { repo: "Makisuo/maple" },
      });

      expect(service.deploymentTriggerId).toBeUndefined();
      expect(service.deploymentTriggerBranch).toBeUndefined();
      expect(service.deploymentTriggerRepository).toBeUndefined();

      triggers = await listServiceTriggers(service.serviceId);
      expect(triggers.some((trigger) => trigger.id === initialTriggerId)).toBe(
        false,
      );
    } finally {
      await destroy(scope);
    }
  });

  test("throws when deploymentTrigger is configured without source.repo", async () => {
    await expect(
      Service(`${testId}-missing-source`, {
        project: "project-id",
        name: `${testId}-missing-source`,
        deploymentTrigger: {
          branch: "main",
        },
      }),
    ).rejects.toThrow(
      "deploymentTrigger requires source.repo or deploymentTrigger.repository.",
    );
  });

  test("adopt existing service and reconcile deployment trigger", async (scope) => {
    try {
      if (!project) {
        throw new Error("Expected test project to be initialized");
      }
      const api = new RailwayApi();
      const serviceName = `${testId}-adopt-svc`;

      const created = await api.query<{
        serviceCreate: {
          id: string;
        };
      }>(
        `mutation serviceCreate($input: ServiceCreateInput!) {
          serviceCreate(input: $input) {
            id
          }
        }`,
        {
          input: {
            projectId: project.projectId,
            name: serviceName,
            source: {
              repo: "Makisuo/maple",
            },
          },
        },
      );

      const service = await Service(`${testId}-adopt-svc`, {
        project,
        name: serviceName,
        source: { repo: "Makisuo/maple" },
        adopt: true,
        deploymentTrigger: {
          branch: "main",
          rootDirectory: "/",
        },
      });

      expect(service.serviceId).toEqual(created.serviceCreate.id);
      expect(service.deploymentTriggerId).toBeTruthy();
      expect(service.deploymentTriggerBranch).toEqual("main");
    } finally {
      await destroy(scope);
    }
  });
});

async function listServiceTriggers(serviceId: string) {
  const api = new RailwayApi();
  const data = await api.query<{
    service: {
      repoTriggers: {
        edges: Array<{
          node: {
            id: string;
            branch: string;
            repository: string;
          };
        }>;
      };
    };
  }>(
    `query service($id: String!) {
      service(id: $id) {
        repoTriggers(first: 50) {
          edges {
            node {
              id
              branch
              repository
            }
          }
        }
      }
    }`,
    { id: serviceId },
  );

  return data.service.repoTriggers.edges.map((edge) => edge.node);
}
