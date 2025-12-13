import type { OpenAPIV3 } from "openapi-types";
import type { Context } from "../context.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
/**
 * Properties for creating or updating a Schema
 */
export interface APISchemaProps<S extends OpenAPIV3.Document> extends CloudflareApiOptions {
    /**
     * The zone to upload the schema to
     */
    zone: string | Zone;
    /**
     * OpenAPI v3.0.x schema content (YAML string, JSON string, or OpenAPI object)
     * Provide either this or schemaFile
     *
     * Note: Cloudflare only supports OpenAPI v3.0.x, not v3.1
     */
    schema: S;
    /**
     * Name for the schema
     * @default resource id
     */
    name?: string;
    /**
     * Enable validation immediately after upload
     *
     * Warning: will trigger a replace when disabling validation.
     *
     * @default true
     */
    enabled?: boolean;
}
/**
 * APISchema resource attributes.
 */
export type APISchema<S extends OpenAPIV3.Document = OpenAPIV3.Document> = {
    /**
     * Schema ID
     */
    id: string;
    /**
     * Name for the schema
     */
    name: string;
    /**
     * The API Schema
     */
    schema: S;
    /**
     * Source of the schema
     */
    source: string;
    /**
     * Whether validation is enabled
     */
    enabled: boolean;
};
/**
 * Cloudflare API Gateway Schema manages OpenAPI v3 schemas for API validation.
 *
 * @example
 * ## Basic schema upload with inline YAML
 *
 * const apiSchema = await APISchema("my-api-schema", {
 *   zone: myZone,
 *   name: "my-api-v1"
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
 *   `,
 * });
 *
 * @example
 * ## Schema upload from file
 *
 * const fileSchema = await APISchema("api-schema-from-file", {
 *   zone: "example.com",
 *   schemaFile: "./openapi.yaml",
 *   name: "production-api-v2",
 *   enabled: false  // Upload but don't enable validation yet
 * });
 *
 * @example
 * ## Schema with typed OpenAPI object
 *
 * import type { OpenAPIV3 } from "openapi-types";
 *
 * const typedSchema: OpenAPIV3.Document = {
 *   openapi: "3.0.0",
 *   info: { title: "Typed API", version: "1.0.0" },
 *   paths: {
 *     "/health": {
 *       get: {
 *         operationId: "healthCheck",
 *         responses: { "200": { description: "OK" } }
 *       }
 *     }
 *   }
 * };
 *
 * const schema = await APISchema("typed-schema", {
 *   zone: myZone,
 *   schema: typedSchema
 * });
 */
export declare const APISchema: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | (<S extends OpenAPIV3.Document>(this: Context<APISchema<S>>, id: string, props: APISchemaProps<S>) => Promise<APISchema<S>>);
interface CloudflareSchemaDetails {
    id: string;
    name: string;
    source: string;
    validationEnabled: boolean;
    createdAt: string;
}
export declare function deleteSchema(api: CloudflareApi, zoneId: string, schemaId: string): Promise<void>;
/**
 * Get schema details
 */
export declare function getSchema(api: CloudflareApi, zoneId: string, schemaId: string): Promise<CloudflareSchemaDetails | null>;
/**
 * List all schemas in a zone
 */
export declare function listSchemas(api: CloudflareApi, zoneId: string): Promise<CloudflareSchemaDetails[]>;
export {};
//# sourceMappingURL=api-schema.d.ts.map