import type { Context } from "../context.ts";
import type { APIMitigation } from "./api-mitigation.ts";
import { type CloudflareApi, type CloudflareApiOptions } from "./api.ts";
import type { Zone } from "./zone.ts";
/**
 * HTTP methods supported by API Gateway
 */
export type HTTPMethod = "get" | "post" | "put" | "patch" | "delete" | "head" | "options" | "trace";
/**
 * Properties for creating or updating an API Operation
 */
export interface APIGatewayOperationProps extends CloudflareApiOptions {
    /**
     * The zone this operation belongs to
     */
    zone: string | Zone;
    /**
     * The API endpoint path (can contain path variables like /users/{id})
     */
    endpoint: string;
    /**
     * The host for this operation
     */
    host: string;
    /**
     * The HTTP method (GET, POST, PUT, DELETE, etc.)
     */
    method: string;
    /**
     * Mitigation action for this operation
     * @default "none"
     */
    mitigation?: APIMitigation;
}
/**
 * API Operation output
 */
export interface APIGatewayOperation {
    /**
     * Zone ID
     */
    zoneId: string;
    /**
     * Zone name
     */
    zoneName: string;
    /**
     * Operation ID assigned by Cloudflare
     */
    operationId: string;
    /**
     * The API endpoint path
     */
    endpoint: string;
    /**
     * The host for this operation
     */
    host: string;
    /**
     * The HTTP method
     */
    method: string;
    /**
     * The mitigation action for this operation
     */
    action: APIMitigation;
}
/**
 * Cloudflare API Gateway Operation manages individual API endpoints that can be
 * monitored, secured, and configured through Cloudflare's API Shield.
 *
 * Operations are the building blocks for API management, representing specific
 * HTTP method + endpoint + host combinations that your API exposes.
 *
 * @example
 * ## Basic API operation
 *
 * Create a simple GET endpoint for user retrieval
 *
 * const getUserOp = await APIGatewayOperation("get-users", {
 *   zone: myZone,
 *   endpoint: "/users",
 *   host: "api.example.com",
 *   method: "GET"
 * });
 *
 * @example
 * ## API operation with path parameters
 *
 * Create an operation that includes path variables
 *
 * const getUserByIdOp = await APIGatewayOperation("get-user-by-id", {
 *   zone: "api.example.com",
 *   endpoint: "/users/{id}",
 *   host: "api.example.com",
 *   method: "GET"
 * });
 *
 * @example
 * ## RESTful CRUD operations
 *
 * Create a complete set of CRUD operations for a resource
 *
 * const createUserOp = await APIGatewayOperation("create-user", {
 *   zone: myZone,
 *   endpoint: "/users",
 *   host: "api.example.com",
 *   method: "POST"
 * });
 *
 * const updateUserOp = await APIGatewayOperation("update-user", {
 *   zone: myZone,
 *   endpoint: "/users/{id}",
 *   host: "api.example.com",
 *   method: "PUT"
 * });
 *
 * const deleteUserOp = await APIGatewayOperation("delete-user", {
 *   zone: myZone,
 *   endpoint: "/users/{id}",
 *   host: "api.example.com",
 *   method: "DELETE"
 * });
 *
 * @see https://developers.cloudflare.com/api/resources/api_gateway/subresources/operations/
 * @see https://developers.cloudflare.com/api-shield/management-and-monitoring/endpoint-management/
 */
export declare const APIGatewayOperation: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<APIGatewayOperation>, _id: string, props: APIGatewayOperationProps) => Promise<APIGatewayOperation>);
export interface CloudflareOperation {
    operation_id: string;
    method: string;
    host: string;
    endpoint: string;
}
export declare function getOperations(api: CloudflareApi, zoneId: string): Promise<CloudflareOperation[]>;
export declare function getOperationSchemaValidationSetting(api: CloudflareApi, zoneId: string, operationId: string): Promise<{
    mitigation_action: APIMitigation;
    operation_id: string;
}>;
//# sourceMappingURL=api-gateway-operation.d.ts.map