import { describe, expect, it } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import {
  Hyperdrive,
  normalizeHyperdriveOrigin,
} from "../../src/cloudflare/hyperdrive.ts";
import { Worker } from "../../src/cloudflare/worker.ts";
import { destroy } from "../../src/destroy.ts";
import { NeonProject } from "../../src/neon/project.ts";
import { fetchAndExpectOK } from "../../src/util/safe-fetch.ts";
import { BRANCH_PREFIX } from "../util.ts";
// must import this or else alchemy.test won't exist
import "../../src/test/vitest.ts";

// Create API client for verification
const api = await createCloudflareApi();

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

describe.concurrent("Hyperdrive Resource", () => {
  // Use BRANCH_PREFIX for deterministic, non-colliding resource names
  const testId = `${BRANCH_PREFIX}-test-hyperdrive`;

  test("create, update, and delete hyperdrive with Neon project", async (scope) => {
    let hyperdrive: Hyperdrive | undefined;
    let project: NeonProject | undefined;
    let worker: Worker | undefined;

    try {
      // First create a Neon PostgreSQL project
      project = await NeonProject(`${testId}-db`, {
        name: `Hyperdrive Test DB ${BRANCH_PREFIX}`,
      });

      expect(project.id).toBeTruthy();
      expect(project.connection_uris.length).toBeGreaterThan(0);

      console.log(project.connection_uris[0].connection_parameters);

      // Create a test Hyperdrive using the Neon project's connection parameters
      hyperdrive = await Hyperdrive(testId, {
        name: `test-hyperdrive-${BRANCH_PREFIX}`,
        origin: project.connection_uris[0].connection_parameters,
        dev: {
          origin: "postgres://postgres:postgres@localhost:5432/postgres",
        },
      });

      expect(hyperdrive.id).toEqual(testId);
      expect(hyperdrive.name).toEqual(`test-hyperdrive-${BRANCH_PREFIX}`);
      expect(hyperdrive.origin.host).toEqual(
        project.connection_uris[0].connection_parameters.host,
      );
      expect(hyperdrive.origin.database).toEqual(
        project.connection_uris[0].connection_parameters.database,
      );
      expect((hyperdrive.origin as any).password.unencrypted).toEqual(
        project.connection_uris[0].connection_parameters.password.unencrypted,
      );
      expect(hyperdrive.hyperdriveId).toBeTruthy(); // Check that we got a hyperdriveId
      expect(hyperdrive.dev.origin.unencrypted).toEqual(
        "postgres://postgres:postgres@localhost:5432/postgres",
      );

      // Verify hyperdrive was created by querying the API directly
      const getResponse = await api.get(
        `/accounts/${api.accountId}/hyperdrive/configs/${hyperdrive.hyperdriveId}`,
      );
      expect(getResponse.status).toEqual(200);

      const responseData: any = await getResponse.json();
      expect(responseData.result.name).toEqual(
        `test-hyperdrive-${BRANCH_PREFIX}`,
      );
      expect(responseData.result.origin.host).toEqual(
        project.connection_uris[0].connection_parameters.host,
      );

      // Create a simple worker script to test the connection

      // Deploy a worker that uses the hyperdrive
      const workerName = `${BRANCH_PREFIX}-hyperdrive-test-worker`;
      worker = await Worker(workerName, {
        name: workerName,
        adopt: true,
        script: `
          export default {
            async fetch(request, env, ctx) {
              if (typeof env.DB?.connect === "function") {
                return new Response("OK", { status: 200 });
              } else {
                return new Response("DB not found", { status: 500 });
              }
            }
          };
        `,
        format: "esm",
        url: true,
        bindings: {
          DB: hyperdrive,
        },
      });

      expect(worker.url).toBeTruthy();

      // Test the connection works
      await fetchAndExpectOK(worker.url!);

      // Update the hyperdrive
      hyperdrive = await Hyperdrive(testId, {
        name: `updated-hyperdrive-${BRANCH_PREFIX}`,
        origin: project.connection_uris[0].connection_parameters,
        caching: {
          disabled: true,
        },
      });

      expect(hyperdrive.id).toEqual(testId);
      expect(hyperdrive.name).toEqual(`updated-hyperdrive-${BRANCH_PREFIX}`);
      expect(hyperdrive.caching?.disabled).toEqual(true);

      // Verify hyperdrive was updated
      const getUpdatedResponse = await api.get(
        `/accounts/${api.accountId}/hyperdrive/configs/${hyperdrive.hyperdriveId}`,
      );
      const updatedData: any = await getUpdatedResponse.json();
      expect(updatedData.result.name).toEqual(
        `updated-hyperdrive-${BRANCH_PREFIX}`,
      );
      expect(updatedData.result.caching.disabled).toEqual(true);
    } finally {
      // Always clean up, even if test assertions fail
      await destroy(scope);

      // Verify hyperdrive was deleted
      if (hyperdrive?.hyperdriveId) {
        const getDeletedResponse = await api.get(
          `/accounts/${api.accountId}/hyperdrive/configs/${hyperdrive.hyperdriveId}`,
        );
        expect(getDeletedResponse.status).toEqual(404);
      }
    }
  });

  test("adopt hyperdrive config", async (scope) => {
    try {
      const project = await NeonProject(`${testId}-db-adopt`, {
        name: `Hyperdrive Test DB Adopt ${BRANCH_PREFIX}`,
      });

      const hyperdrive1 = await Hyperdrive(`${testId}-adopt`, {
        name: `test-hyperdrive-adopt-${BRANCH_PREFIX}`,
        origin: project.connection_uris[0].connection_parameters,
      });

      const hyperdrive2 = await Hyperdrive(`${testId}-adopt-true`, {
        name: `test-hyperdrive-adopt-${BRANCH_PREFIX}`,
        origin: project.connection_uris[0].connection_parameters,
        adopt: true,
      });

      expect(hyperdrive2.hyperdriveId).toEqual(hyperdrive1.hyperdriveId);
    } finally {
      await destroy(scope);
    }
  });

  test("dev.remote creates hyperdrive remotely", async (scope) => {
    let hyperdrive: Hyperdrive | undefined;
    let project: NeonProject | undefined;

    try {
      // Create a Neon PostgreSQL project
      project = await NeonProject(`${testId}-db-remote`, {
        name: `Hyperdrive Test DB Remote ${BRANCH_PREFIX}`,
      });

      // Create hyperdrive with dev.remote: true
      hyperdrive = await Hyperdrive(`${testId}-remote`, {
        name: `test-hyperdrive-remote-${BRANCH_PREFIX}`,
        origin: project.connection_uris[0].connection_parameters,
        dev: {
          remote: true,
        },
      });

      // Verify the hyperdrive was created remotely (has hyperdriveId)
      expect(hyperdrive.hyperdriveId).toBeTruthy();
      expect(hyperdrive.dev.remote).toEqual(true);

      // Verify hyperdrive exists in Cloudflare API
      const getResponse = await api.get(
        `/accounts/${api.accountId}/hyperdrive/configs/${hyperdrive.hyperdriveId}`,
      );
      expect(getResponse.status).toEqual(200);

      const responseData: any = await getResponse.json();
      expect(responseData.result.name).toEqual(
        `test-hyperdrive-remote-${BRANCH_PREFIX}`,
      );
    } finally {
      await destroy(scope);

      // Verify hyperdrive was deleted
      if (hyperdrive?.hyperdriveId) {
        const getDeletedResponse = await api.get(
          `/accounts/${api.accountId}/hyperdrive/configs/${hyperdrive.hyperdriveId}`,
        );
        expect(getDeletedResponse.status).toEqual(404);
      }
    }
  });

  describe("normalizeHyperdriveOrigin", () => {
    it("normalizes postgres string origin", () => {
      const origin = normalizeHyperdriveOrigin(
        "postgresql://user:password@ep-example-host-1234.us-east-1.aws.neon.tech/mydb?sslmode=require",
      );
      expect(origin.scheme).toEqual("postgres");
      expect(origin.user).toEqual("user");
      expect((origin as any).password.unencrypted).toEqual("password");
      expect(origin.host).toEqual(
        "ep-example-host-1234.us-east-1.aws.neon.tech",
      );
      expect(origin.port).toEqual(5432);
      expect(origin.database).toEqual("mydb");
    });

    it("normalizes mysql string origin", () => {
      const origin = normalizeHyperdriveOrigin(
        "mysql://user:password@aws-us-east-2.connect.psdb.cloud/mydb?sslaccept=strict",
      );
      expect(origin.scheme).toEqual("mysql");
      expect(origin.user).toEqual("user");
      expect((origin as any).password.unencrypted).toEqual("password");
      expect(origin.host).toEqual("aws-us-east-2.connect.psdb.cloud");
      expect(origin.port).toEqual(3306);
      expect(origin.database).toEqual("mydb");
    });

    it("normalizes cloudflare access origin", () => {
      const origin = normalizeHyperdriveOrigin({
        access_client_id: "client_id",
        access_client_secret: "client_secret",
        host: "localhost",
        database: "mydb",
        user: "user",
      });
      expect(origin.scheme).toEqual("postgres");
      expect(origin.user).toEqual("user");
      expect((origin as any).access_client_id).toEqual("client_id");
      expect((origin as any).access_client_secret.unencrypted).toEqual(
        "client_secret",
      );
      expect(origin.host).toEqual("localhost");
      expect(origin.port).toEqual(5432);
      expect(origin.database).toEqual("mydb");
    });

    it("normalizes postgres object origin", () => {
      const origin = normalizeHyperdriveOrigin({
        user: "user",
        password: "password",
        host: "localhost",
        database: "mydb",
      });
      expect(origin.scheme).toEqual("postgres");
      expect(origin.user).toEqual("user");
      expect((origin as any).password.unencrypted).toEqual("password");
      expect(origin.host).toEqual("localhost");
      expect(origin.port).toEqual(5432);
      expect(origin.database).toEqual("mydb");
    });

    it("normalizes mysql object origin", () => {
      const origin = normalizeHyperdriveOrigin({
        user: "user",
        password: "password",
        host: "localhost",
        database: "mydb",
        scheme: "mysql",
      });
      expect(origin.scheme).toEqual("mysql");
      expect(origin.user).toEqual("user");
      expect((origin as any).password.unencrypted).toEqual("password");
      expect(origin.host).toEqual("localhost");
      expect(origin.port).toEqual(3306);
      expect(origin.database).toEqual("mydb");
    });

    it("respects port in object origin", () => {
      const origin = normalizeHyperdriveOrigin({
        user: "user",
        password: "password",
        host: "localhost",
        database: "mydb",
        port: 1234,
      });
      expect(origin.port).toEqual(1234);
    });

    it("respects port in string origin", () => {
      const origin = normalizeHyperdriveOrigin(
        "mysql://user:password@localhost:1234/mydb",
      );
      expect(origin.port).toEqual(1234);
    });

    it("throws on invalid scheme", () => {
      expect(() =>
        normalizeHyperdriveOrigin("invalid://user:password@localhost/mydb"),
      ).toThrowError(
        'Unsupported database connection scheme "invalid" for Hyperdrive (expected "postgres" or "mysql")',
      );
    });
  });
});
