import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { destroy } from "../../src/destroy.ts";
import { createNeonApi } from "../../src/neon/api.ts";
import { NeonProject, NeonProjectRef } from "../../src/neon/project.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

// Create API client for verification
const api = createNeonApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe("NeonProject Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-neon-project`;

  // Helper function to generate a unique project name
  const generateProjectName = () => `Test Project ${testId}`;

  test("create, update, and delete neon project", async (scope) => {
    let project: NeonProject | undefined;
    let adoptedProject: NeonProject | undefined;
    try {
      // Create a test Neon project with basic settings
      const projectName = generateProjectName();
      project = await NeonProject(testId, {
        name: projectName,
        region_id: "aws-us-east-1",
        pg_version: 16,
      });

      expect(project.id).toBeTruthy();
      expect(project.name).toEqual(projectName);
      expect(project.region_id).toEqual("aws-us-east-1");
      expect(project.pg_version).toEqual(16);
      expect(project.created_at).toBeTruthy();
      expect(project.updated_at).toBeTruthy();

      // Verify the additional properties are included
      expect(project.branch).toBeTruthy();
      const branch = project.branch!;
      expect(branch.name).toBeTruthy();
      expect(branch.id).toBeTruthy();
      expect(branch.project_id).toEqual(project.id);
      expect(branch.current_state).toBeTruthy();

      expect(project.endpoints).toBeTruthy();
      const endpoint = project.endpoints![0];
      expect(endpoint.type).toEqual("read_write");
      expect(endpoint.host).toBeTruthy();
      expect(endpoint.branch_id).toBeTruthy();
      expect(endpoint.project_id).toEqual(project.id);

      expect(project.connection_uris).toBeTruthy();
      expect(
        project.connection_uris![0].connection_uri.unencrypted,
      ).toBeTruthy();
      expect(project.connection_uris![0].connection_uri.unencrypted).toContain(
        "postgresql://",
      );

      expect(project.databases).toBeTruthy();
      const database = project.databases![0];
      expect(database.name).toBeTruthy();
      expect(database.id).toBeTruthy();
      expect(database.branch_id).toBeTruthy();
      expect(database.owner_name).toBeTruthy();

      expect(project.roles).toBeTruthy();
      const role = project.roles![0];
      expect(role.name).toBeTruthy();
      expect(role.branch_id).toBeTruthy();

      // Verify operations are not exposed in the project output
      expect((project as any).operations).toBeUndefined();

      // Verify project was created by querying the API directly
      const { data } = await api.getProject({
        path: {
          project_id: project.id,
        },
      });

      expect(data.project.name).toEqual(projectName);

      // Check if the branch is in ready state, confirming operations were waited for
      expect(project.branch!.current_state).toEqual("ready");

      // Check if endpoints are active, confirming operations were waited for
      expect(project.endpoints![0].current_state).toEqual("active");

      // Create an existing project via API, as if it were already existing in the user's account
      const {
        data: { project: existingProject },
      } = await api.createProject({
        body: {
          project: {
            name: `${projectName}-existing`,
            region_id: "aws-us-east-1",
            pg_version: 16,
          },
        },
      });
      // Adopt the project as a Resource
      adoptedProject = await NeonProject(`${testId}-adopted`, {
        adopt: true,
        name: existingProject.name,
      });
      expect(adoptedProject.id).toEqual(existingProject.id);
      expect(adoptedProject.name).toEqual(existingProject.name);
      expect(adoptedProject.region_id).toEqual(existingProject.region_id);

      // Update the project name
      const updatedName = `${generateProjectName()}-updated`;
      project = await NeonProject(testId, {
        name: updatedName,
        region_id: "aws-us-east-1",
        pg_version: 16,
      });

      expect(project.id).toBeTruthy();
      expect(project.name).toEqual(updatedName);

      // Verify project was updated
      const { data: updatedData } = await api.getProject({
        path: {
          project_id: project.id,
        },
      });
      expect(updatedData.project.name).toEqual(updatedName);
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify project was deleted
      if (project?.id) {
        const { response } = await api.getProject({
          path: {
            project_id: project.id,
          },
          throwOnError: false,
        });
        expect(response.status).toEqual(404);
      }

      // Adopted project should be automatically deleted by Alchemy
      if (adoptedProject?.id) {
        const { response } = await api.getProject({
          path: { project_id: adoptedProject.id },
          throwOnError: false,
        });
        expect(response.status).toEqual(404);
      }
    }
  });

  test("does not delete project when delete is false", async (scope) => {
    let project: NeonProject | undefined;
    try {
      project = await NeonProject(`${testId}-delete-false`, {
        delete: false,
      });
      expect(project.id).toBeTruthy();
    } finally {
      await destroy(scope);

      if (project?.id) {
        // Verify project still exists
        const { response } = await api.getProject({
          path: { project_id: project.id },
          throwOnError: false,
        });
        expect(response.status).toEqual(200);

        // Delete project manually
        await api.deleteProject({
          path: { project_id: project.id },
          throwOnError: false,
        });

        // Verify project was deleted
        const { response: deletedResponse } = await api.getProject({
          path: { project_id: project.id },
          throwOnError: false,
        });
        expect(deletedResponse.status).toEqual(404);
      }
    }
  });
});

describe("NeonProjectRef Resource", () => {
  const name = `${BRANCH_PREFIX}-test-neon-project-existing`;

  test("reference existing project", async () => {
    const {
      data: { project, branch, endpoints, connection_uris, databases, roles },
    } = await api.createProject({
      body: {
        project: {
          name,
        },
      },
    });
    try {
      const projectRef = await NeonProjectRef({
        name,
      });
      expect(projectRef.id).toEqual(project.id);
      expect(projectRef.name).toEqual(project.name);
      expect(projectRef.region_id).toEqual(project.region_id);
      expect(projectRef.pg_version).toEqual(project.pg_version);
      expect(projectRef.created_at).toEqual(project.created_at);
      expect(projectRef.updated_at).toEqual(project.updated_at);
      expect(projectRef.branch).toMatchObject(branch);
      expect(projectRef.endpoints).toMatchObject(endpoints);

      // Connection URIs are slightly different, so we need to compare the connection parameters
      expect(projectRef.connection_uris.length).toEqual(connection_uris.length);
      expect(
        projectRef.connection_uris[0].connection_parameters.database,
      ).toEqual(connection_uris[0]!.connection_parameters.database);
      expect(projectRef.connection_uris[0].connection_parameters.host).toEqual(
        connection_uris[0]!.connection_parameters.host,
      );
      expect(projectRef.connection_uris[0].connection_parameters.port).toEqual(
        5432,
      );
      expect(projectRef.connection_uris[0].connection_parameters.user).toEqual(
        connection_uris[0]!.connection_parameters.role,
      );
      expect(
        projectRef.connection_uris[0].connection_parameters.password
          .unencrypted,
      ).toEqual(connection_uris[0]!.connection_parameters.password);
      expect(projectRef.databases).toMatchObject(databases);

      // Password not included in roles response, so exclude it from the comparison
      expect(projectRef.roles).toMatchObject(
        roles.map(({ password: _, ...role }) => role),
      );
    } finally {
      await api.deleteProject({
        path: { project_id: project.id },
      });
    }
  });
});
