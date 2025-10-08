import type { OpenAPIV3 } from "openapi-types";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import { APISchema, getSchema } from "../../src/cloudflare/api-schema.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import { findZoneForHostname } from "../../src/cloudflare/zone.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi({});

// Use existing zone instead of creating new ones
const ZONE_NAME = process.env.ALCHEMY_TEST_DOMAIN!;

const zoneId = (await findZoneForHostname(api, ZONE_NAME)).zoneId;

describe.skipIf(!process.env.ALL_TESTS).sequential("Schema", () => {
  test("create, update, and delete schema", async (scope) => {
    let schema: APISchema | undefined;
    let initialSchemaId: string | undefined;

    try {
      // Create schema with OpenAPI object using existing zone
      const apiSchema: OpenAPIV3.Document = {
        openapi: "3.0.0",
        info: {
          title: "Test API",
          version: "1.0.0",
        },
        servers: [{ url: `https://${ZONE_NAME}` }],
        paths: {
          "/users": {
            get: {
              operationId: "getUsers",
              responses: {
                "200": {
                  description: "List of users",
                },
              },
            },
            post: {
              operationId: "createUser",
              responses: {
                "201": {
                  description: "User created",
                },
              },
            },
          },
          "/users/{id}": {
            get: {
              operationId: "getUser",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              responses: {
                "200": {
                  description: "User details",
                },
              },
            },
            delete: {
              operationId: "deleteUser",
              parameters: [
                {
                  name: "id",
                  in: "path",
                  required: true,
                  schema: {
                    type: "string",
                  },
                },
              ],
              responses: {
                "204": {
                  description: "User deleted",
                },
              },
            },
          },
        },
      };

      schema = await APISchema(`${BRANCH_PREFIX}-object-schema`, {
        zone: ZONE_NAME,
        name: "test-api-schema",
        enabled: true,
        schema: apiSchema,
      });
      initialSchemaId = schema.id;

      expect(schema).toMatchObject({
        id: expect.any(String),
        name: "test-api-schema",
        enabled: true,
        schema: {
          info: {
            title: "Test API",
          },
        },
      });

      // Verify schema exists in Cloudflare
      await assertSchemaExists(schema.id, true);

      // Update schema validation setting (disable validation)
      schema = await APISchema(`${BRANCH_PREFIX}-object-schema`, {
        zone: ZONE_NAME,
        schema: schema.schema, // Use parsed content
        name: "test-api-schema", // Keep the same name
        enabled: false,
      });

      expect(schema).toMatchObject({
        enabled: false,
        name: "test-api-schema",
      });

      await assertSchemaExists(schema.id, false);
    } finally {
      await destroy(scope);
      await assertSchemaDeleted(initialSchemaId!);
      await assertSchemaDeleted(schema!.id);
    }
  });

  test("error handling for invalid schema", async (scope) => {
    try {
      await expect(
        APISchema(`${BRANCH_PREFIX}-invalid-structure`, {
          zone: ZONE_NAME,
          schema: {
            openapi: "3.0.0",
            info: {
              title: "Test",
              version: "1.0.0",
            },
            paths: {
              "/test": {
                get: {
                  // Missing operationId and responses
                },
              },
            },
          } as any,
        }),
      ).rejects.toThrow();
    } finally {
      await destroy(scope);
    }
  });
});

async function assertSchemaExists(id: string, enabled: boolean) {
  const cloudflareSchema = await getSchema(api, zoneId, id);
  expect(cloudflareSchema).toBeTruthy();
  expect(cloudflareSchema?.validationEnabled).toBe(enabled);
}

async function assertSchemaDeleted(id: string) {
  const cloudflareSchema = await getSchema(api, zoneId, id);
  expect(cloudflareSchema).toBe(null);
}
