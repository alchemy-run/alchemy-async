import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createRailwayApi } from "../../src/railway/api.ts";
import { Project, Service } from "../../src/railway/index.ts";
import { BRANCH_PREFIX } from "../util.ts";
import "../../src/test/vitest.ts";

const api = createRailwayApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("Railway Service Resource", () => {
  const testId = `${BRANCH_PREFIX}-test-railway-service`;

  test("create service from Docker image", async (scope) => {
    let project: typeof Project.prototype | undefined;
    let service: typeof Service.prototype | undefined;

    try {
      // Create a project first
      project = await Project(`${testId}-project`, {
        name: `${testId}-docker-project`,
      });

      // Create a service from Docker image
      service = await Service(`${testId}-service`, {
        project,
        name: `${testId}-nginx`,
        source: {
          image: "nginx:alpine",
        },
      });

      expect(service.id).toBeTruthy();
      expect(service.name).toEqual(`${testId}-nginx`);
      expect(service.projectId).toEqual(project.id);
      expect(service.createdAt).toBeTruthy();

      // Verify service was created via API
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
        { id: service.id },
      );

      expect(data.service.name).toEqual(`${testId}-nginx`);
      expect(data.service.projectId).toEqual(project.id);
    } finally {
      await destroy(scope);
    }
  });

  test("create service from GitHub repo", async (scope) => {
    let project: typeof Project.prototype | undefined;
    let service: typeof Service.prototype | undefined;

    try {
      project = await Project(`${testId}-gh-project`, {
        name: `${testId}-github-project`,
      });

      // Create a service from a public GitHub repo
      service = await Service(`${testId}-gh-service`, {
        project,
        name: `${testId}-from-github`,
        source: {
          repo: "railwayapp-templates/nextjs",
          branch: "main",
        },
      });

      expect(service.id).toBeTruthy();
      expect(service.name).toEqual(`${testId}-from-github`);
      expect(service.projectId).toEqual(project.id);
    } finally {
      await destroy(scope);
    }
  });

  test("update service", async (scope) => {
    let project: typeof Project.prototype | undefined;
    let service: typeof Service.prototype | undefined;

    try {
      project = await Project(`${testId}-update-project`, {
        name: `${testId}-update-test-project`,
      });

      // Create service
      service = await Service(`${testId}-update-service`, {
        project,
        name: `${testId}-to-update`,
        source: {
          image: "nginx:alpine",
        },
      });

      const originalId = service.id;

      // Update service name
      service = await Service(`${testId}-update-service`, {
        project,
        name: `${testId}-updated`,
        source: {
          image: "nginx:alpine",
        },
      });

      // Service ID should remain the same
      expect(service.id).toEqual(originalId);
      expect(service.name).toEqual(`${testId}-updated`);
    } finally {
      await destroy(scope);
    }
  });
});
