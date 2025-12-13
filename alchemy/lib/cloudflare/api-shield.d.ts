import type { OpenAPIV3 } from "openapi-types";
import { APIGatewayOperation } from "./api-gateway-operation.ts";
import type { APIMitigation, APIMitigations } from "./api-mitigation.ts";
import { APISchema } from "./api-schema.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
/**
 * Properties for creating or updating Schema Validation
 */
export interface APIShieldProps<S extends string | URL | OpenAPIV3.Document> extends CloudflareApiOptions {
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
export declare function APIShield<S extends string | URL | OpenAPIV3.Document>(id: string, props: APIShieldProps<S>): Promise<APIShield<S extends string | URL ? OpenAPIV3.Document : S>>;
/**
 * Get global schema validation settings for a zone
 */
export declare function getGlobalSettingsForZone(api: CloudflareApi, zoneId: string): Promise<CloudflareGlobalSettings>;
export interface CloudflareGlobalSettings {
    validation_default_mitigation_action: APIMitigation;
    validation_override_mitigation_action?: APIMitigation;
}
/**
 * Extract operations from an OpenAPI schema
 */
export declare function parseSchemaOperations(schema: OpenAPIV3.Document): Array<{
    method: string;
    endpoint: string;
    operationId?: string;
    host: string;
}>;
//# sourceMappingURL=api-shield.d.ts.map