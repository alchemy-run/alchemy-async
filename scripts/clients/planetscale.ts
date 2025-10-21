import type { OpenApi, UserConfig } from "@hey-api/openapi-ts";
import { isMethod, keys } from "./utils.ts";

type Patch = NonNullable<UserConfig["parser"]>["patch"];

export const patchMissingProperties: Patch = {
  // Add missing properties from the OpenAPI spec.
  // You can't add new endpoints here (hence the patchMissingEndpoints function),
  // but you can add missing properties to existing endpoints.

  operations: {
    "PATCH /organizations/{organization}/databases/{database}/branches/{branch}/changes":
      (operation) => {
        // @ts-expect-error
        operation.parameters = [
          ...(operation.parameters ?? []),
          {
            name: "body",
            in: "body",
            required: true,
            schema: {
              type: "object",
              properties: {
                cluster_size: {
                  type: "string",
                },
              },
              required: ["cluster_size"],
            },
          },
        ];
      },
  },
  schemas: {
    DatabaseBranch: (schema) => {
      schema.properties = {
        ...schema.properties,
        cluster_architecture: {
          type: "string",
          description:
            "The architecture of the cluster for Postgres databases.",
          enum: ["x86_64", "aarch64"],
        },
      };
    },
  },
};

export function patchMissingEndpoints(spec: OpenApi.V2_0_X) {
  spec.paths[
    "/organizations/{organization}/databases/{database}/branches/{branch}/keyspaces/{name}/resizes"
  ] = {
    get: {
      tags: ["Database branch keyspaces"],
      consumes: ["application/json"],
      operationId: "list_keyspace_resizes",
      summary: "List keyspace resizes",
      parameters: [
        {
          name: "organization",
          type: "string",
          in: "path",
          required: true,
          description: "The name of the organization the branch belongs to",
        },
        {
          name: "database",
          type: "string",
          in: "path",
          required: true,
          description: "The name of the database the branch belongs to",
        },
        {
          name: "branch",
          type: "string",
          in: "path",
          required: true,
          description: "The name of the branch",
        },
        {
          name: "name",
          type: "string",
          in: "path",
          required: true,
          description: "The name of the keyspace",
        },
      ],
      responses: {
        "200": {
          description: "List the keyspace resize requests",
          schema: {
            $ref: "#/definitions/PaginatedKeyspaceResizeRequest",
          },
        },
        "401": {
          description: "Unauthorized",
        },
        "403": {
          description: "Forbidden",
        },
        "404": {
          description: "Not Found",
        },
        "500": {
          description: "Internal Server Error",
        },
      },
    },
  };
  spec.definitions!.KeyspaceResizeRequest = {
    type: "object",
    properties: {
      id: { type: "string" },
      type: { type: "string", enum: ["KeyspaceResizeRequest"] },
      state: { type: "string", enum: ["resizing", "completed"] },
      started_at: { type: "string" },
      completed_at: { type: "string" },
      created_at: { type: "string" },
      updated_at: { type: "string" },
      extra_replicas: { type: "number" },
      vector_pool_allocation: { type: "string" },
      previous_vector_pool_allocation: { type: "string" },
      cluster_name: { type: "string" },
      cluster_display_name: { type: "string" },
      previous_cluster_name: { type: "string" },
      previous_cluster_display_name: { type: "string" },
      replicas: { type: "number" },
      previous_replicas: { type: "number" },
      cluster_rank: { type: "number" },
      previous_cluster_rank: { type: "number" },
      actor: { type: "object" },
      cluster_rate_name: { type: "string" },
      cluster_rate_display_name: { type: "string" },
      previous_cluster_rate_name: { type: "string" },
      previous_cluster_rate_display_name: { type: "string" },
    },
    required: [
      "id",
      "type",
      "state",
      "started_at",
      "completed_at",
      "created_at",
      "updated_at",
    ],
    additionalProperties: false,
  };
  spec.definitions!.PaginatedKeyspaceResizeRequest = {
    type: "object",
    properties: {
      current_page: {
        type: "number",
        description: "The current page number",
      },
      next_page: {
        type: "number",
        description: "The next page number",
      },
      next_page_url: {
        type: "string",
        description: "The next page of results",
      },
      prev_page: {
        type: "number",
        description: "The previous page number",
      },
      prev_page_url: {
        type: "string",
        description: "The previous page of results",
      },
      data: {
        type: "array",
        items: { $ref: "#/definitions/KeyspaceResizeRequest" },
      },
    },
    required: [
      "current_page",
      "next_page",
      "next_page_url",
      "prev_page",
      "prev_page_url",
      "data",
    ],
    additionalProperties: false,
  };
  spec.definitions!.GeneralError = {
    type: "object",
    properties: {
      code: { type: "string" },
      message: { type: "string" },
    },
  };

  for (const path of Object.keys(spec.paths) as `/${string}`[]) {
    const methods = spec.paths[path];
    for (const method of keys(methods)) {
      if (!isMethod(method)) continue;
      if (!spec.paths[path][method]) continue;
      for (const code of keys(spec.paths[path][method].responses)) {
        const response = spec.paths[path][method].responses[code]!;
        if (String(code).match(/^[45]\d\d$/) && "description" in response) {
          spec.paths[path][method].responses[code] = {
            description: response.description,
            schema: {
              $ref: "#/definitions/GeneralError",
            },
          };
        }
      }
    }
  }

  return spec;
}

const spec = await fetch("https://api.planetscale.com/v1/openapi-spec")
  .then((res) => res.json() as Promise<OpenApi.V2_0_X>)
  .then(patchMissingEndpoints);

export default {
  input: spec as any,
  output: {
    path: "alchemy/src/planetscale/api",
  },
  plugins: [
    {
      name: "@hey-api/typescript",
      exportFromIndex: false,
    },
    {
      name: "@hey-api/sdk",
      instance: "PlanetScaleClient",
      exportFromIndex: false,
      auth: false,
    },
    {
      name: "@hey-api/client-fetch",
      throwOnError: true,
      exportFromIndex: false,
    },
  ],
  parser: {
    patch: patchMissingProperties,
  },
} satisfies UserConfig;
