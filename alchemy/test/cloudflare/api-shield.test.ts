import os from "node:os";
import type { OpenAPIV3 } from "openapi-types";
import path from "pathe";
import { describe, expect } from "vitest";
import { alchemy } from "../../src/alchemy.ts";
import {
  getOperations,
  getOperationSchemaValidationSetting,
} from "../../src/cloudflare/api-gateway-operation.ts";
import {
  APIShield,
  getGlobalSettingsForZone,
} from "../../src/cloudflare/api-shield.ts";
import { createCloudflareApi } from "../../src/cloudflare/api.ts";
import { destroy } from "../../src/destroy.ts";
import { BRANCH_PREFIX } from "../util.ts";

import fs from "node:fs/promises";
import { getSchema } from "../../src/cloudflare/api-schema.ts";
import { findZoneForHostname } from "../../src/cloudflare/zone.ts";
import "../../src/test/vitest.ts";

const test = alchemy.test(import.meta, {
  prefix: BRANCH_PREFIX,
});

const api = await createCloudflareApi({});

// Use existing zone instead of creating new ones
const ZONE_NAME = process.env.ALCHEMY_TEST_DOMAIN!;

const zoneId = (await findZoneForHostname(api, ZONE_NAME)).zoneId;

describe.skipIf(!process.env.ALL_TESTS).sequential("APIShield", () => {
  test("create and update schema validation with typed OpenAPI object", async (scope) => {
    let oldSchemaId: string | undefined;
    let newSchemaId: string | undefined;
    try {
      // Define a typed OpenAPI schema as an object
      const apiSchema = {
        openapi: "3.0.0",
        info: {
          title: "Typed API Shield Test",
          version: "1.0.0",
        },
        servers: [{ url: `https://${ZONE_NAME}` }],
        paths: {
          "/api/users": {
            get: {
              operationId: "listUsers",
              responses: {
                "200": {
                  description: "List of users",
                  content: {
                    "application/json": {
                      schema: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            post: {
              operationId: "createUser",
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                      required: ["name", "email"],
                    },
                  },
                },
              },
              responses: {
                "201": {
                  description: "User created",
                },
              },
            },
          },
          "/api/users/{userId}": {
            get: {
              operationId: "getUser",
              parameters: [
                {
                  name: "userId",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                },
              ],
              responses: {
                "200": {
                  description: "User details",
                },
                "404": {
                  description: "User not found",
                },
              },
            },
            put: {
              operationId: "updateUser",
              parameters: [
                {
                  name: "userId",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                },
              ],
              requestBody: {
                required: true,
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                    },
                  },
                },
              },
              responses: {
                "200": {
                  description: "User updated",
                },
              },
            },
            delete: {
              operationId: "deleteUser",
              parameters: [
                {
                  name: "userId",
                  in: "path",
                  required: true,
                  schema: { type: "string" },
                },
              ],
              responses: {
                "204": {
                  description: "User deleted",
                },
              },
            },
          },
          "/api/health": {
            get: {
              operationId: "healthCheck",
              responses: {
                "200": {
                  description: "Health status",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: {
                          status: { type: "string" },
                          timestamp: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      } as const satisfies OpenAPIV3.Document;

      // Create schema validation using the typed object
      let shield = await APIShield(`${BRANCH_PREFIX}-typed-validation`, {
        zone: ZONE_NAME,
        enabled: true,
        defaultMitigation: "none",
        schema: apiSchema,
      });
      oldSchemaId = shield.schema.id;

      // Verify that operations were created correctly from the object schema
      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/health",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users",
          mitigation: "none",
        },
        {
          method: "put",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "none",
        },
      ]);

      // Update with operation overrides using path-based configuration
      shield = await APIShield(`${BRANCH_PREFIX}-typed-validation`, {
        zone: ZONE_NAME,
        schema: apiSchema,
        defaultMitigation: "none",
        unknownOperationMitigation: "none",
        enabled: true,
        mitigations: {
          "/api/users": {
            get: "none",
            post: "block",
          },
          "/api/users/{userId}": {
            get: "none",
            put: "block",
            delete: "block",
          },
          "/api/health": "none", // Blanket allow for health check
        },
      });
      newSchemaId = shield.schema.id;

      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "block",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/health",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users",
          mitigation: "block",
        },
        {
          method: "put",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/api/users/{userId}",
          mitigation: "block",
        },
      ]);

      // Verify global settings
      const globalSettings = await getGlobalSettingsForZone(api, zoneId);
      expect(globalSettings.validation_default_mitigation_action).toBe("none");
      expect(globalSettings.validation_override_mitigation_action).toBe("none");
    } finally {
      await scope.finalize();
      await destroy(scope);
      await assertSchemaDeleted(oldSchemaId);
      await assertSchemaDeleted(newSchemaId);
    }
  });

  test("create and update schema validation with default actions", async (scope) => {
    try {
      const schema = `
openapi: 3.0.0
info:
  title: API Shield Test API
  version: 1.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /users:
    get:
      operationId: getUsers
      responses:
        '200':
          description: List of users
    post:
      operationId: createUser
      responses:
        '201':
          description: User created
  /users/{id}:
    get:
      operationId: getUser
      responses:
        '200':
          description: User details
    delete:
      operationId: deleteUser
      responses:
        '204':
          description: User deleted
`;
      // Create schema validation using the schema
      let shield = await APIShield(`${BRANCH_PREFIX}-validation`, {
        zone: ZONE_NAME,
        name: "api-shield-test-schema",
        enabled: true,
        defaultMitigation: "none",
        schema,
      });

      // Verify that operations were created correctly from the schema
      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users/{id}",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users/{id}",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        },
      ]);

      // Update with operation overrides using path-based configuration
      shield = await APIShield(`${BRANCH_PREFIX}-validation`, {
        zone: ZONE_NAME,
        schema,
        defaultMitigation: "none",
        unknownOperationMitigation: "none",
        mitigations: {
          "/users": {
            get: "none",
            post: "block",
          },
          "/users/{id}": {
            get: "none",
            delete: "block",
          },
        },
      });

      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users/{id}",
          mitigation: "block",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users/{id}",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "block",
        },
      ]);

      // Verify global settings
      const globalSettings = await getGlobalSettingsForZone(api, zoneId);
      expect(globalSettings.validation_default_mitigation_action).toBe("none");
      expect(globalSettings.validation_override_mitigation_action).toBe("none");
    } finally {
      await destroy(scope);
    }
  });

  test("mixed action configuration with partial route overrides", async (scope) => {
    try {
      // Create schema validation with mixed action configuration
      const shield = await APIShield(`${BRANCH_PREFIX}-mixed-validation`, {
        name: "mixed-actions-schema",
        zone: ZONE_NAME,
        schema: `
openapi: 3.0.0
info:
  title: Mixed Actions API
  version: 1.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /users:
    get:
      operationId: getUsers
      responses:
        '200':
          description: Success
    post:
      operationId: createUser
      responses:
        '201':
          description: Success
  /products:
    get:
      operationId: getProducts
      responses:
        '200':
          description: Success
    post:
      operationId: createProduct
      responses:
        '201':
          description: Success
  /admin:
    get:
      operationId: getAdmin
      responses:
        '200':
          description: Success
    post:
      operationId: adminAction
      responses:
        '200':
          description: Success
`,
        enabled: true,
        defaultMitigation: "none", // Default action
        mitigations: {
          // Override specific routes/methods
          "/users": "none", // Blanket action for all methods on /users
          "/admin": "block", // Block all admin operations
          "/products": {
            get: "none", // Allow product reads
            post: "block", // Block product creation
          },
        },
      });

      // Verify mixed actions:
      // - /users/* should be "none" (blanket override)
      // - /admin/* should be "block" (blanket override)
      // - /products/get should be "none", /products/post should be "block" (per-method)
      await expectOperations(shield, [
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/admin",
          mitigation: "block",
        }, // Blanket admin block
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        }, // Per-method override
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        }, // Blanket override
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/admin",
          mitigation: "block",
        }, // Blanket admin block
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "block",
        }, // Per-method override
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        }, // Blanket override
      ]);
    } finally {
      await destroy(scope);
    }
  });

  test("schema change with operation removal", async (scope) => {
    let oldSchemaId: string | undefined;
    let newSchemaId: string | undefined;
    try {
      // Create initial schema with multiple operations

      // Create initial validation
      let shield = await APIShield("shield", {
        name: `${BRANCH_PREFIX}-change-schema`,
        zone: ZONE_NAME,
        enabled: true,
        defaultMitigation: "none",
        schema: `
openapi: 3.0.0
info:
  title: Initial API
  version: 1.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /users:
    get:
      operationId: getUsers
      responses:
        '200':
          description: Success
    post:
      operationId: createUser
      responses:
        '201':
          description: Success
  /products:
    get:
      operationId: getProducts
      responses:
        '200':
          description: Success
    delete:
      operationId: deleteProduct
      responses:
        '204':
          description: Success
  /legacy:
    get:
      operationId: getLegacy
      responses:
        '200':
          description: Success
`,
      });
      oldSchemaId = shield.schema.id;
      // Verify all initial operations are created
      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/legacy",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        },
      ]);

      // Update validation with the new schema
      shield = await APIShield("shield", {
        zone: ZONE_NAME,
        schema: `
openapi: 3.0.0
info:
  title: Updated API
  version: 2.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /users:
    get:
      operationId: getUsers
      responses:
        '200':
          description: Success
    post:
      operationId: createUser
      responses:
        '201':
          description: Success
  /products:
    get:
      operationId: getProducts
      responses:
        '200':
          description: Success
    delete:
      operationId: deleteProduct
      responses:
        '204':
          description: Success
`,
        defaultMitigation: "none",
        mitigations: {
          "/products": {
            delete: "block", // Override delete action
          },
        },
      });
      newSchemaId = shield.schema.id;
      // Verify only the remaining operations exist with updated actions
      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "block",
        }, // Overridden action
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        }, // Default action
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        }, // Default action
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/users",
          mitigation: "none",
        }, // Default action
      ]);
    } finally {
      await destroy(scope);
      await assertSchemaDeleted(oldSchemaId);
      await assertSchemaDeleted(newSchemaId);
    }
  });

  test("create and update schema validation with file path", async (scope) => {
    let tmpDir: string | undefined;

    try {
      // Create temporary directory
      tmpDir = await fs.mkdtemp(
        path.join(os.tmpdir(), `${BRANCH_PREFIX}-schema-`),
      );
      const schemaPath = path.join(tmpDir, "openapi.yaml");

      // Write initial schema to file
      const initialSchema = `
openapi: 3.0.0
info:
  title: File-based API
  version: 1.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /products:
    get:
      operationId: getProducts
      responses:
        '200':
          description: List of products
    post:
      operationId: createProduct
      responses:
        '201':
          description: Product created
  /health:
    get:
      operationId: healthCheck
      responses:
        '200':
          description: Health status
`;

      await fs.writeFile(schemaPath, initialSchema, "utf-8");

      // Create APIShield with file path
      let shield = await APIShield(`${BRANCH_PREFIX}-file-validation`, {
        zone: ZONE_NAME,
        name: "file-based-test",
        enabled: true,
        defaultMitigation: "none",
        schema: schemaPath,
      });

      // Verify initial operations
      await expectOperations(shield, [
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/health",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
      ]);

      // Update the schema file with new operations
      const updatedSchema = `
openapi: 3.0.0
info:
  title: File-based API
  version: 2.0.0
servers:
  - url: https://${ZONE_NAME}
paths:
  /products:
    get:
      operationId: getProducts
      responses:
        '200':
          description: List of products
    post:
      operationId: createProduct
      responses:
        '201':
          description: Product created
    delete:
      operationId: deleteProduct
      responses:
        '204':
          description: Product deleted
  /orders:
    get:
      operationId: getOrders
      responses:
        '200':
          description: List of orders
    post:
      operationId: createOrder
      responses:
        '201':
          description: Order created
  /health:
    get:
      operationId: healthCheck
      responses:
        '200':
          description: Health status
`;

      await fs.writeFile(schemaPath, updatedSchema, "utf-8");

      // Re-apply APIShield with updated file and custom mitigations
      shield = await APIShield(`${BRANCH_PREFIX}-file-validation`, {
        zone: ZONE_NAME,
        schema: schemaPath,
        defaultMitigation: "none",
        mitigations: {
          "/products": {
            delete: "block",
          },
          "/orders": {
            post: "block",
          },
        },
      });

      // Verify updated operations with mitigations
      await expectOperations(shield, [
        {
          method: "delete",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "block",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/health",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/orders",
          mitigation: "none",
        },
        {
          method: "get",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/orders",
          mitigation: "block",
        },
        {
          method: "post",
          host: process.env.ALCHEMY_TEST_DOMAIN!,
          endpoint: "/products",
          mitigation: "none",
        },
      ]);
    } finally {
      // Clean up temporary directory
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true });
      }
      await destroy(scope);
    }
  });
});

// Helper function for clean operation testing
async function expectOperations(
  shield: APIShield,
  expected: Array<{
    method: string;
    host: string;
    endpoint: string;
    mitigation: string;
  }>,
) {
  const operations = await getOperations(api, shield.zoneId);
  // Sort operations for consistent comparison
  const sorted = operations.sort((a, b) => {
    const aKey = `${a.endpoint}-${a.method}`;
    const bKey = `${b.endpoint}-${b.method}`;
    return aKey.localeCompare(bKey);
  });

  // Sort expected operations the same way
  const sortedExpected = expected.sort((a, b) =>
    `${a.endpoint}-${a.method}`.localeCompare(`${b.endpoint}-${b.method}`),
  );

  // Check length
  expect(sorted.length).toBe(sortedExpected.length);

  // Check each operation
  for (let i = 0; i < sorted.length; i++) {
    const actual = sorted[i];
    const exp = sortedExpected[i];

    expect(actual.method.toLowerCase()).toBe(exp.method.toLowerCase());
    const sanitize = (endpoint: string) =>
      endpoint.replace(/\{[a-zA-Z0-9]+\}/g, "{var1}");
    // stupid Cloudflare changes the {id} to {var1} in the endpoint
    expect(sanitize(actual.endpoint)).toBe(sanitize(exp.endpoint));
    expect(actual.host).toBe(exp.host);

    const { mitigation_action } = await getOperationSchemaValidationSetting(
      api,
      shield.zoneId,
      actual.operation_id,
    );
    expect(mitigation_action).toBe(exp.mitigation);
  }
}

async function assertSchemaDeleted(id: string | undefined) {
  if (id === undefined) {
    return;
  }
  const cloudflareSchema = await getSchema(api, zoneId, id);
  expect(!cloudflareSchema).toBe(true);
}
