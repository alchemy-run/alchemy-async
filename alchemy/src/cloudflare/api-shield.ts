import fs from "node:fs/promises";
import type { OpenAPIV3 } from "openapi-types";
import * as yaml from "yaml";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { handleApiError } from "./api-error.ts";
import { APIGatewayOperation } from "./api-gateway-operation.ts";
import type { APIMitigation, APIMitigations } from "./api-mitigation.ts";
import { APISchema } from "./api-schema.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { Zone } from "./zone.ts";
import { findZoneForHostname } from "./zone.ts";

/**
 * Properties for creating or updating Schema Validation
 */
export interface APIShieldProps<
  S extends string | URL | OpenAPIV3.Document,
> extends CloudflareApiOptions {
  /**
   * The zone to configure schema validation for
   */
  zone: string | Zone;

  /**
   * The name of the schema validation
   *
   * @default ${app.name}-${app.stage}-${id}
   */
  name?: string;

  /**
   * The schema resource to use for validation
   *
   * Can be one of:
   * 1. a string containing OpenAPI v3 schema
   * 2. a string path to a file containing OpenAPI v3 schema
   * 3. a file://, http:// or https:// URL pointing to an OpenAPI v3 schema
   * 4. a literal OpenAPI v3 schema object
   *
   * @example
   * await APIShield("my-validation", {
   *   zone: myZone,
   *   schema: "path/to/openapi.yaml",
   * });
   *
   * @example
   * await APIShield("my-validation", {
   *   zone: myZone,
   *   schema: new URL("file:///path/to/openapi.yaml"),
   * });
   *
   * @example
   * await APIShield("my-validation", {
   *   zone: myZone,
   *   schema: new URL("https://api.example.com/openapi.yaml"),
   * });
   *
   * @example
   * await APIShield("my-validation", {
   *   zone: myZone,
   *   schema: `
   *     openapi: 3.0.0
   *     info:
   *       title: My API
   *       version: 1.0.0
   *     paths:
   *       /users:
   *         get:
   *           operationId: getUsers
   *           responses:
   *             '200':
   *               description: Success
   *   `,
   * });
   *
   * @example
   * await APIShield("my-validation", {
   *   zone: myZone,
   *   schema: `
   *     openapi: 3.0.0
   *     info:
   *       title: My API
   *       version: 1.0.0
   *     paths:
   *       /users:
   *         get:
   *           operationId: getUsers
   *           responses:
   *             '200':
   *               description: Success
   *   `
   * });
   */
  schema: S;

  /**
   * Whether to enable the schema validation
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Per-operation validation overrides using OpenAPI-style path structure
   *
   * Can specify mitigations per HTTP method or a blanket action for all methods on a path:
   *
   * @example
   * // Per-method configuration
   * {
   *   "/users": {
   *     get: "none",
   *     post: "block"
   *   },
   *   "/users/{id}": {
   *     delete: "block"
   *   }
   * }
   *
   * @example
   * // Blanket action for all methods on a path
   * {
   *   "/users": "none",
   *   "/users/{id}": "block",
   *   "/admin": "block"
   * }
   */
  mitigations?: APIMitigations<S extends string | URL ? OpenAPIV3.Document : S>;

  /**
   * Default validation action for all operations
   *
   * @default "none"
   */
  defaultMitigation?: APIMitigation;

  /**
   * Action for requests that don't match any operation
   * @default "none"
   */
  unknownOperationMitigation?: APIMitigation;
}

/**
 * Global validation settings
 */
export interface ValidationSettings {
  /**
   * Default mitigation action
   */
  defaultMitigation: APIMitigation;

  /**
   * Override mitigation action for specific operations
   */
  overrideMitigation?: APIMitigation;
}

/**
 * Schema Validation output
 */
export interface APIShield<S extends OpenAPIV3.Document = OpenAPIV3.Document> {
  /**
   * Name of the API Shield.
   */
  name: string;

  /**
   * The schema resource
   */
  schema: APISchema<S>;

  /**
   * Zone ID
   */
  zoneId: string;

  /**
   * The API Schema's API Gateway Operations (and their respective mitigation actions)
   */
  operations: APIGatewayOperation[];
}

/**
 * Cloudflare Schema Validation protects your API endpoints by validating incoming requests
 * against an OpenAPI v3 schema. It can log or block requests that don't match your schema,
 * helping prevent malformed requests and potential security issues.
 *
 * @example
 * ## Basic schema validation with inline YAML
 *
 * Enable schema validation with a simple OpenAPI schema as YAML string
 *
 * const apiSchema = await APISchema("my-schema", {
 *   zone: myZone,
 *   schema: `
 *     openapi: 3.0.0
 *     info:
 *       title: My API
 *       version: 1.0.0
 *     servers:
 *       - url: https://api.example.com
 *     paths:
 *       /users:
 *         get:
 *           operationId: getUsers
 *           responses:
 *             '200':
 *               description: Success
 *       /users/{id}:
 *         get:
 *           operationId: getUser
 *           parameters:
 *             - name: id
 *               in: path
 *               required: true
 *               schema:
 *                 type: string
 *   `,
 * });
 *
 * const shield = await APIShield("api-validation", {
 *   zone: myZone,
 *   schema: apiSchema,
 *   defaultAction: "none"
 * });
 *
 * @example
 * ## API Shield with typed OpenAPI object
 *
 * Use strongly-typed OpenAPI v3 objects for better IDE support
 *
 * import type { OpenAPIV3 } from "openapi-types";
 *
 * const apiSchema: OpenAPIV3.Document = {
 *   openapi: "3.0.0",
 *   info: {
 *     title: "My API",
 *     version: "1.0.0",
 *   },
 *   servers: [
 *     { url: "https://api.example.com" }
 *   ],
 *   paths: {
 *     "/users": {
 *       get: {
 *         operationId: "getUsers",
 *         responses: {
 *           "200": {
 *             description: "Success",
 *             content: {
 *               "application/json": {
 *                 schema: {
 *                   type: "array",
 *                   items: {
 *                     type: "object",
 *                     properties: {
 *                       id: { type: "string" },
 *                       name: { type: "string" }
 *                     }
 *                   }
 *                 }
 *               }
 *             }
 *           }
 *         }
 *       }
 *     }
 *   }
 * };
 *
 * const schema = await APISchema("my-schema", {
 *   zone: myZone,
 *   schema: apiSchema,
 * });
 *
 * const shield = await APIShield("api-validation", {
 *   zone: myZone,
 *   schema: schema,
 *   defaultAction: "none"
 * });
 *
 * @example
 * ## API Shield with file
 *
 * Load schema from an external file with custom settings
 *
 * const schema = await APISchema("my-schema", {
 *   zone: "example.com",
 *   schema: new URL("file:///path/to/openapi.yaml"),
 *   name: "production-api-v2",
 * });
 *
 * const shield = await APIShield("api-validation", {
 *   zone: "example.com",
 *   schema: schema,
 *   defaultAction: "none",
 *   mitigations: {
 *     "/users": {
 *       get: "none",        // No mitigation for read operations
 *       post: "log",        // Log violations for writes (requires paid plan)
 *     },
 *     "/users/{id}": {
 *       delete: "block"     // Block destructive operations (requires paid plan)
 *     }
 *   },
 *   unknownOperationAction: "none"
 * });
 *
 * @example
 * ## Monitor API traffic without impact
 *
 * Use validation in monitoring mode to understand traffic patterns
 *
 * const schema = await APISchema("my-schema", {
 *   zone: myZone,
 *   schema: new URL("file:///path/to/api-schema.json"),
 * });
 *
 * const monitoring = await APIShield("api-monitoring", {
 *   zone: myZone,
 *   schema: schema,
 *   defaultAction: "none"
 * });
 *
 * @example
 * ## Log schema violations
 *
 * Track non-compliant requests without blocking (requires paid plan)
 *
 * const schema = await APISchema("my-schema", {
 *   zone: myZone,
 *   schema: new URL("file:///path/to/api-schema.json"),
 * });
 *
 * const withLogging = await APIShield("api-logging", {
 *   zone: myZone,
 *   schema: schema,
 *   defaultAction: "log"
 * });
 *
 * @example
 * ## Protect critical endpoints with blanket mitigations
 *
 * Apply mitigations to entire paths or specific methods (requires paid plan)
 *
 * const schema = await APISchema("my-schema", {
 *   zone: myZone,
 *   schema: new URL("file:///path/to/api-schema.json"),
 * });
 *
 * const protection = await APIShield("api-protection", {
 *   zone: myZone,
 *   schema: schema,
 *   defaultAction: "log",
 *   mitigations: {
 *     "/admin": "block",              // Block all methods on admin endpoints
 *     "/payments": {
 *       post: "block",                // Block payment creation
 *       put: "block"                  // Block payment updates
 *     },
 *     "/users/{id}": {
 *       delete: "block"               // Block user deletion
 *     },
 *     "/public": "none",              // Allow all methods on public endpoints
 *     "/products": "none"             // Allow all methods on products
 *   }
 * });
 *
 * @see https://developers.cloudflare.com/api-shield/security/schema-validation/
 */
export async function APIShield<S extends string | URL | OpenAPIV3.Document>(
  id: string,
  props: APIShieldProps<S>,
): Promise<APIShield<S extends string | URL ? OpenAPIV3.Document : S>> {
  return (await _APIShield(id, {
    ...props,
    // resolve file URLs to documents prior to passing input to the resource
    // so that updates to the schema trigger changes to the resource
    schema: await loadSchemaContent(props.schema),
  })) as APIShield<S extends string | URL ? OpenAPIV3.Document : S>;
}

const _APIShield = Resource(
  "cloudflare::APIShield",
  {
    // delete the api gateway operations in parallel
    destroyStrategy: "parallel",
  },
  async function <const S extends OpenAPIV3.Document>(
    this: Context<APIShield<S>>,
    id: string,
    props: Omit<APIShieldProps<S>, "schema"> & { schema: S },
  ): Promise<APIShield<S>> {
    const api = await createCloudflareApi(props);

    // Resolve zone ID and name
    const zoneId =
      typeof props.zone === "string"
        ? (await findZoneForHostname(api, props.zone)).zoneId
        : props.zone.id;

    if (this.phase === "delete") {
      // Reset settings to default
      await updateGlobalSettings(api, zoneId, {
        validation_default_mitigation_action: "none",
      });

      return this.destroy();
    }

    const schemaName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "update" && this.output?.name !== schemaName) {
      this.replace();
    }

    // Update global settings
    const defaultAction = props.defaultMitigation || "none";
    await updateGlobalSettings(api, zoneId, {
      validation_default_mitigation_action: defaultAction,
      validation_override_mitigation_action: props.unknownOperationMitigation,
    });

    const schema = await APISchema("schema", {
      schema: props.schema,
      zone: props.zone,
      name: schemaName,
      enabled: props.enabled,
      accountId: props.accountId,
      apiKey: props.apiKey,
      apiToken: props.apiToken,
      baseUrl: props.baseUrl,
      email: props.email,
    });

    return {
      zoneId,
      schema,
      name: schemaName,
      operations: await Promise.all(
        parseSchemaOperations(schema.schema).map(async (parsedOp) => {
          let operationAction = defaultAction;
          const method = parsedOp.method.toLowerCase();
          if (props.mitigations) {
            const pathActions = props.mitigations[parsedOp.endpoint];
            if (typeof pathActions === "string") {
              // Blanket action for all methods on this path
              operationAction = pathActions;
            } else if (pathActions && typeof pathActions === "object") {
              // Per-method configuration
              const methodAction =
                pathActions[method as keyof typeof pathActions];
              if (methodAction) {
                operationAction = methodAction;
              }
            }
          }
          return APIGatewayOperation(
            // Create a deterministic ID for the operation
            `${id}-${method}-${parsedOp.endpoint.replace(/[^a-z0-9]/gi, "-")}`,
            {
              zone: zoneId,
              endpoint: parsedOp.endpoint,
              host: parsedOp.host,
              method: parsedOp.method,
              mitigation: operationAction,
            },
          );
        }),
      ),
    };
  },
);

// Helper functions for API calls

async function getGlobalSettings(
  api: CloudflareApi,
  zoneId: string,
): Promise<CloudflareGlobalSettings> {
  const response = await api.get(
    `/zones/${zoneId}/api_gateway/settings/schema_validation`,
  );

  if (!response.ok) {
    await handleApiError(response, "getting", "global settings");
  }

  const data = (await response.json()) as { result: CloudflareGlobalSettings };
  return data.result;
}

async function updateGlobalSettings(
  api: CloudflareApi,
  zoneId: string,
  params: Partial<CloudflareGlobalSettings>,
): Promise<void> {
  const response = await api.put(
    `/zones/${zoneId}/api_gateway/settings/schema_validation`,
    params,
  );

  if (!response.ok) {
    await handleApiError(response, "updating", "global settings");
  }
}

/**
 * Get global schema validation settings for a zone
 */
export async function getGlobalSettingsForZone(
  api: CloudflareApi,
  zoneId: string,
): Promise<CloudflareGlobalSettings> {
  return getGlobalSettings(api, zoneId);
}

// Cloudflare API response types

export interface CloudflareGlobalSettings {
  validation_default_mitigation_action: APIMitigation;
  validation_override_mitigation_action?: APIMitigation;
}

/**
 * Extract operations from an OpenAPI schema
 */
export function parseSchemaOperations(schema: OpenAPIV3.Document): Array<{
  method: string;
  endpoint: string;
  operationId?: string;
  host: string;
}> {
  const operations: Array<{
    method: string;
    endpoint: string;
    operationId?: string;
    host: string;
  }> = [];

  if (!schema?.paths) {
    return operations;
  }

  // Determine the host from servers
  const defaultHost = extractHostFromSchema(schema);

  // Extract operations from each path
  for (const [path, pathItem] of Object.entries(schema.paths)) {
    if (!pathItem || typeof pathItem !== "object") continue;

    // Check each HTTP method
    for (const method of [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "head",
      "options",
      "trace",
    ]) {
      const operation = pathItem[method as keyof typeof pathItem];
      if (
        operation &&
        typeof operation === "object" &&
        !Array.isArray(operation)
      ) {
        // Determine host for this operation (operation-level servers override global)
        const operationHost = (operation as any).servers?.[0]?.url
          ? extractHostFromUrl((operation as any).servers[0].url)
          : defaultHost;

        operations.push({
          method: method.toUpperCase(),
          endpoint: path,
          operationId: (operation as any).operationId,
          host: operationHost,
        });
      }
    }
  }
  return operations;
}

/**
 * Extract host from OpenAPI schema servers
 */
function extractHostFromSchema(schema: OpenAPIV3.Document): string {
  if (schema.servers && schema.servers.length > 0) {
    return extractHostFromUrl(schema.servers[0].url);
  }

  // Fallback to a default host
  return "api.example.com";
}

/**
 * Extract hostname from a URL
 */
function extractHostFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    // If URL parsing fails, return the URL as-is (might be relative)
    return url;
  }
}

/**
 * Helper function to load schema content from various sources
 */
async function loadSchemaContent(
  schema: string | URL | OpenAPIV3.Document,
): Promise<OpenAPIV3.Document> {
  // Handle string content (YAML/JSON)
  try {
    if (typeof schema === "string") {
      if (schema.startsWith("http://") || schema.startsWith("https://")) {
        return loadSchemaContent(new URL(schema));
      } else if (schema.includes("\n")) {
        // json or YAML
        return tryParse(schema);
      } else {
        try {
          return tryParse(await fs.readFile(schema, "utf-8"));
        } catch {
          // maybe minified JSON
          return tryParse(schema);
        }
      }
    } else if (schema instanceof URL) {
      return yaml.parse(await fetchUrl(schema));
    } else if (typeof schema === "object") {
      return schema as OpenAPIV3.Document;
    } else {
      // should be unreachable
      throw SchemaError(new Error(`Unsupported schema type: ${typeof schema}`));
    }
  } catch (err) {
    throw SchemaError(err);
  }
}

const SchemaError = (cause?: any) =>
  new Error(
    `Invalid OpenAPI schema. Please provide a:
1. a string containing OpenAPI v3.0 schema (in YAML or JSON format)
2. a string path to a file containing OpenAPI v3.0 schema (in YAML or JSON format)
3. a file://, http:// or https:// URL pointing to an OpenAPI v3.0 schema (in YAML or JSON format)
4. a literal OpenAPI v3.0 schema object`,
    { cause },
  );

function tryParse(schema: string): OpenAPIV3.Document {
  try {
    return yaml.parse(schema);
  } catch {
    return JSON.parse(schema);
  }
}

async function fetchUrl(url: URL): Promise<string> {
  if (url.protocol === "file:") {
    // Read from local filesystem for file:// URLs
    return await fs.readFile(url.pathname, "utf-8");
  } else if (url.protocol === "http:" || url.protocol === "https:") {
    // Fetch from remote for http/https URLs
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(
        `Failed to fetch schema from URL: ${response.statusText}`,
      );
    }
    return await response.text();
  } else {
    throw new Error(
      `Unsupported URL protocol: ${url.protocol}. Only http:, https:, and file: are supported.`,
    );
  }
}
