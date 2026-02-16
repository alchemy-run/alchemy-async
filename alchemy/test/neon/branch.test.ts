import "../../src/test/vitest.ts";

import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createNeonApi } from "../../src/neon/api.ts";
import { NeonBranch } from "../../src/neon/branch.ts";
import { NeonProject } from "../../src/neon/project.ts";
import { BRANCH_PREFIX } from "../util.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("NeonBranch Resource", () => {
  const api = createNeonApi();

  test("create, update, and delete neon branch", async (scope) => {
    let branch: NeonBranch | undefined;

    try {
      const project = await NeonProject("project", {});
      branch = await NeonBranch("branch", {
        project,
        endpoints: [{ type: "read_write" }, { type: "read_only" }],
      });
      const id = branch.id;
      expect(branch).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        projectId: project.id,
        protected: false,
        default: false,
        parentBranchId: expect.any(String),
        parentLsn: expect.any(String),
        parentTimestamp: undefined,
        initSource: "parent-data",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        expiresAt: undefined,
        endpoints: expect.any(Array),
        databases: expect.any(Array),
        roles: expect.any(Array),
        connectionUris: expect.any(Array),
      });
      expect(branch.endpoints.length).toBe(2);
      expect(branch.endpoints[0].type).toBe("read_write");
      expect(branch.endpoints[1].type).toBe("read_only");
      expect(branch.roles.length).toBe(1);
      expect(branch.connectionUris.length).toBe(2);
      expect(branch.connectionUris[0].connection_parameters.host).toEqual(
        branch.endpoints[0].host,
      );
      expect(branch.connectionUris[1].connection_parameters.host).toEqual(
        branch.endpoints[1].host,
      );
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60);
      branch = await NeonBranch("branch", {
        project,
        endpoints: [{ type: "read_write" }, { type: "read_only" }],
        expiresAt: expiresAt.toISOString(),
      });
      expect(branch.id).toBe(id);
      expect(branch.expiresAt).toBeDefined();
      expect(Math.floor(branch.expiresAt!.getTime() / 1000)).toBeCloseTo(
        Math.floor(expiresAt.getTime() / 1000),
      );
    } finally {
      await destroy(scope);

      // Verify branch was deleted
      if (branch) {
        const { response } = await api.getProjectBranch({
          path: {
            project_id: branch.projectId,
            branch_id: branch.id,
          },
          throwOnError: false,
        });
        expect(response.status).toEqual(404);
      }
    }
  });

  test("adopt existing branch", async (scope) => {
    let originalBranch: NeonBranch | undefined;
    let adoptedBranch: NeonBranch | undefined;

    try {
      const project = await NeonProject("project", {});

      originalBranch = await NeonBranch("original-branch", {
        project,
        name: `${BRANCH_PREFIX}-adopt-test`,
        endpoints: [{ type: "read_write" }],
      });

      adoptedBranch = await NeonBranch("adopted-branch", {
        project,
        name: originalBranch.name,
        adopt: true,
        endpoints: [], // endpoints should be fetched from the original branch
      });

      expect(adoptedBranch.id).toBe(originalBranch.id);
      expect(adoptedBranch.name).toBe(originalBranch.name);
      expect(adoptedBranch.projectId).toBe(originalBranch.projectId);
      expect(adoptedBranch.endpoints).toEqual(
        expect.arrayContaining(
          originalBranch?.endpoints.map((endpoint) =>
            expect.objectContaining({
              id: endpoint.id,
              autoscaling_limit_max_cu: endpoint.autoscaling_limit_max_cu,
              autoscaling_limit_min_cu: endpoint.autoscaling_limit_min_cu,
              pooler_enabled: endpoint.pooler_enabled,
              pooler_mode: endpoint.pooler_mode,
              disabled: endpoint.disabled,
              passwordless_access: endpoint.passwordless_access,
              suspend_timeout_seconds: endpoint.suspend_timeout_seconds,
              region_id: endpoint.region_id,
            }),
          ),
        ),
      );
      expect(adoptedBranch.databases).toEqual(originalBranch.databases);
      expect(adoptedBranch.roles).toEqual(originalBranch.roles);
    } finally {
      await destroy(scope);

      // Verify branch was deleted
      if (originalBranch) {
        const { response } = await api.getProjectBranch({
          path: {
            project_id: originalBranch.projectId,
            branch_id: originalBranch.id,
          },
          throwOnError: false,
        });
        expect(response.status).toEqual(404);
      }
    }
  });
});
