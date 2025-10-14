import { afterAll, describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import {
  createPlanetScaleClient,
  type PlanetScaleClient,
} from "../../src/planetscale/api.ts";
import { Database } from "../../src/planetscale/database.ts";
import { Role } from "../../src/planetscale/role.ts";
import { waitForDatabaseReady } from "../../src/planetscale/utils.ts";
import { Secret } from "../../src/secret.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import type { Scope } from "../../src/scope.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe
  .skipIf(!process.env.PLANETSCALE_TEST)
  .concurrent("Role Resource (postgresql)", () => {
    let api: PlanetScaleClient;
    let database: Database;

    let scope: Scope | undefined;

    test.beforeAll(async (_scope) => {
      api = createPlanetScaleClient();

      database = await Database("database", {
        name: "role-test-db",
        clusterSize: "PS_10",
        kind: "postgresql",
        arch: "arm", // slightly faster than x86
      });
      await waitForDatabaseReady(api, database.organization, database.name);
      scope = _scope;
    }, 240_000); // slow and steady wins the race

    afterAll(async () => {
      if (scope) {
        await destroy(scope);
      }
    });

    test("create and delete role", async (scope) => {
      const testId = `${BRANCH_PREFIX}-test-role`;

      try {
        // Create a role
        let role = await Role(testId, {
          database,
          // Empty array means no permissions, which is fine for testing.
          inheritedRoles: [],
        });

        expect(role).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          host: expect.any(String),
          username: expect.any(String),
          password: expect.any(Secret),
        });

        // Verify role was created by querying the API directly
        const { data } = await api.getRole({
          path: {
            organization: database.organization,
            database: database.name,
            branch: "main",
            id: role.id,
          },
        });
        expect(data).toMatchObject({
          id: role.id,
          name: role.name,
          access_host_url: role.host,
          username: role.username,
          expires_at: role.expiresAt,
        });
      } finally {
        await destroy(scope);
      }
    });

    test("role gets replaced when properties change", async (scope) => {
      const testId = `${BRANCH_PREFIX}-test-role-replace`;

      try {
        // Create initial role
        let role = await Role(testId, {
          database,
          inheritedRoles: [],
        });

        const originalId = role.id;
        expect(role).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          host: expect.any(String),
          username: expect.any(String),
          password: expect.any(Secret),
        });

        // Update role with different ttl (should trigger replacement)
        role = await Role(testId, {
          database,
          ttl: 3600,
          inheritedRoles: [],
        });

        // Should have a new ID due to replacement
        expect(role.id).not.toEqual(originalId);
        expect(role.ttl).toEqual(3600);

        // Ensure old password is deleted
        await scope.destroyPendingDeletions();

        // Verify old password was deleted and new one created
        const { response: getOldResponse } = await api.getRole({
          path: {
            organization: database.organization,
            database: database.name,
            branch: "main",
            id: originalId,
          },
          throwOnError: false,
        });
        expect(getOldResponse.status).toEqual(404);

        const { data: newRole } = await api.getRole({
          path: {
            organization: database.organization,
            database: database.name,
            branch: "main",
            id: role.id,
          },
        });
        expect(newRole.ttl).toEqual(3600);
      } finally {
        await destroy(scope);
      }
    });
  });
