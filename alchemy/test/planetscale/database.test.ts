import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import {
  createPlanetScaleClient,
  type PlanetScaleClient,
} from "../../src/planetscale/api.ts";
import { Database } from "../../src/planetscale/database.ts";
import {
  waitForBranchReady,
  waitForDatabaseReady,
} from "../../src/planetscale/utils.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const kinds = [
  { kind: "mysql", ps10: "PS_10", ps20: "PS_20" },
  { kind: "postgresql", ps10: "PS_10_AWS_X86", ps20: "PS_20_AWS_X86" },
] as const;

describe.skipIf(!process.env.PLANETSCALE_TEST).concurrent.each(kinds)(
  "Database Resource ($kind)",
  ({ kind, ...expectedClusterSizes }) => {
    const api = createPlanetScaleClient();
    const organization = alchemy.env.PLANETSCALE_ORG_ID;

    test(`create database with minimal settings (${kind})`, async (scope) => {
      const name = `${BRANCH_PREFIX}-${kind}-basic`;

      try {
        const database = await Database("basic", {
          name,
          clusterSize: "PS_10",
          kind,
        });

        expect(database).toMatchObject({
          id: expect.any(String),
          name,
          defaultBranch: "main",
          organization,
          state: expect.any(String),
          plan: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          htmlUrl: expect.any(String),
          kind,
        });

        // Branch won't exist until database is ready
        await waitForDatabaseReady(api, organization, name);

        // Verify main branch cluster size
        const { data: mainBranchData } = await api.getBranch({
          path: {
            organization,
            database: name,
            name: "main",
          },
        });

        expect(mainBranchData.cluster_name).toEqual(expectedClusterSizes.ps10);
      } finally {
        await destroy(scope);
        // Verify database was deleted by checking API directly
        await assertDatabaseDeleted(api, organization, name);
      }
    }, 5_000_000); // postgres takes forever

    test(`create, update, and delete database (${kind})`, async (scope) => {
      const name = `${BRANCH_PREFIX}-${kind}-crud`;
      let database;
      try {
        // Create test database with initial settings
        database = await Database("crud", {
          name,
          region: {
            slug: "us-east",
          },
          clusterSize: "PS_10",
          allowDataBranching: true,
          automaticMigrations: true,
          requireApprovalForDeploy: false,
          restrictBranchRegion: true,
          insightsRawQueries: true,
          productionBranchWebConsole: true,
          defaultBranch: "main",
          migrationFramework: "rails",
          migrationTableName: "schema_migrations",
          kind,
        });

        expect(database).toMatchObject({
          id: expect.any(String),
          name,
          organization,
          allowDataBranching: true,
          automaticMigrations: true,
          requireApprovalForDeploy: false,
          restrictBranchRegion: true,
          insightsRawQueries: true,
          productionBranchWebConsole: true,
          defaultBranch: "main",
          migrationFramework: "rails",
          migrationTableName: "schema_migrations",
          state: expect.any(String),
          plan: expect.any(String),
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          htmlUrl: expect.any(String),
          kind,
        });

        // Update database settings
        database = await Database("crud", {
          name,
          organization,
          clusterSize: "PS_20", // Change cluster size
          allowDataBranching: false,
          automaticMigrations: false,
          requireApprovalForDeploy: true,
          restrictBranchRegion: false,
          insightsRawQueries: false,
          productionBranchWebConsole: false,
          defaultBranch: "main",
          migrationFramework: "django",
          migrationTableName: "django_migrations",
          kind,
        });

        expect(database).toMatchObject({
          allowDataBranching: false,
          automaticMigrations: false,
          requireApprovalForDeploy: true,
          restrictBranchRegion: false,
          insightsRawQueries: false,
          productionBranchWebConsole: false,
          defaultBranch: "main",
          migrationFramework: "django",
          migrationTableName: "django_migrations",
          kind,
        });

        // Verify main branch cluster size was updated
        const { data: mainBranchData } = await api.getBranch({
          path: {
            organization,
            database: name,
            name: "main",
          },
        });
        expect(mainBranchData.cluster_name).toEqual(expectedClusterSizes.ps20);
      } catch (err) {
        console.error("Test error:", err);
        throw err;
      } finally {
        // Cleanup
        await destroy(scope);

        // Verify database was deleted by checking API directly
        await assertDatabaseDeleted(api, organization, name);
      }
    }, 5_000_000);

    test(`creates non-main default branch if specified (${kind})`, async (scope) => {
      const name = `${BRANCH_PREFIX}-${kind}-create-branch`;
      const defaultBranch = "custom";
      try {
        // Create database with custom default branch
        const database = await Database("create-branch", {
          name,
          clusterSize: "PS_10",
          defaultBranch,
          kind,
        });

        expect(database).toMatchObject({
          defaultBranch,
        });
        await waitForBranchReady(
          api,
          database.organization,
          database.name,
          defaultBranch,
        );
        // Verify branch was created
        const { data: branchData } = await api.getBranch({
          path: {
            organization,
            database: name,
            name: defaultBranch,
          },
        });
        expect(branchData.parent_branch).toEqual("main");
        expect(branchData.cluster_name).toEqual(expectedClusterSizes.ps10);

        // Update default branch on existing database
        await Database("create-branch", {
          name,
          organization,
          clusterSize: "PS_20",
          defaultBranch,
          kind,
        });

        // Verify branch cluster size was updated
        await waitForBranchReady(
          api,
          organization,
          database.name,
          defaultBranch,
        );
        const { data: newBranchData } = await api.getBranch({
          path: {
            organization,
            database: name,
            name: defaultBranch,
          },
        });
        expect(newBranchData.cluster_name).toEqual(expectedClusterSizes.ps20);
      } catch (err) {
        console.error("Test error:", err);
        throw err;
      } finally {
        await destroy(scope);

        // Verify database was deleted
        await assertDatabaseDeleted(api, organization, name);
      }
    }, 5_000_000); // must wait on multiple resizes and branch creation

    test.skipIf(kind !== "postgresql")(
      `create database with arm arch (${kind})`,
      async (scope) => {
        const name = `${BRANCH_PREFIX}-${kind}-arm`;
        try {
          const database = await Database("arm", {
            name,
            organization,
            clusterSize: "PS_10",
            kind: "postgresql",
            arch: "arm",
          });
          expect(database).toMatchObject({
            id: expect.any(String),
            name,
            arch: "arm",
            kind,
          });
          await waitForDatabaseReady(api, organization, name);
          const { data: branchData } = await api.getBranch({
            path: {
              organization,
              database: name,
              name: "main",
            },
          });
          expect(branchData.cluster_name).toEqual("PS_10_AWS_ARM");
          expect(branchData.cluster_architecture).toEqual("aarch64");
        } catch (err) {
          console.error("Test error:", err);
          throw err;
        } finally {
          await destroy(scope);
          await assertDatabaseDeleted(api, organization, name);
        }
      },
      5_000_000,
    );

    test(`database with delete=false should not be deleted via API (${kind})`, async (scope) => {
      const name = `${BRANCH_PREFIX}-${kind}-nodelete`;

      try {
        const database = await Database("nodelete", {
          name,
          clusterSize: "PS_10",
          kind,
          delete: false,
        });

        expect(database).toMatchObject({
          id: expect.any(String),
          name,
          delete: false,
        });

        // Verify database exists
        await waitForDatabaseReady(api, organization, name);
        const { data } = await api.getDatabase({
          path: {
            organization,
            name,
          },
        });
        expect(data.name).toBe(name);
      } catch (err) {
        console.error("Test error:", err);
        throw err;
      } finally {
        // When we call destroy, the database should NOT be deleted via API
        await destroy(scope);

        // Verify database still exists (was not deleted via API)
        const { response } = await api.getDatabase({
          path: {
            organization,
            name,
          },
          throwOnError: false,
        });
        expect(response.status).toBe(200); // Database should still exist

        // Clean up manually for the test
        await api.deleteDatabase({
          path: {
            organization,
            name,
          },
          throwOnError: false,
        });

        // Wait for manual cleanup to complete
        await assertDatabaseDeleted(api, organization, name);
      }
    }, 5_000_000);
  },
);

/**
 * Wait for database to be deleted (return 404) for up to 60 seconds
 */
async function assertDatabaseDeleted(
  api: PlanetScaleClient,
  organizationName: string,
  databaseName: string,
): Promise<void> {
  const timeout = 1000_000;
  const interval = 2_000;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const { response } = await api.getDatabase({
      path: {
        organization: organizationName,
        name: databaseName,
      },
      throwOnError: false,
    });

    console.log(
      `Waiting for database ${databaseName} to be deleted: ${response.status}`,
    );

    if (response.status === 404) {
      // Database is deleted, test passes
      return;
    }

    // Database still exists, wait and try again
    await new Promise((resolve) => setTimeout(resolve, interval));
  }

  // Timeout reached, database still exists
  throw new Error(
    `Database ${databaseName} was not deleted within ${timeout}ms`,
  );
}
