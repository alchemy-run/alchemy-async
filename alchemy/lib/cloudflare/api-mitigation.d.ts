import type { OpenAPIV3 } from "openapi-types";
/**
 * Specifies the mitigation action to apply when a request does not conform to
 * the schema for this operation:
 * - `"log"`: Log the request.
 * - `"block"`: Deny access to the site.
 * - `"none"`: Skip mitigation for this operation.
 * - `null`: Clear any mitigation action.
 */
export type APIMitigation = "none" | "log" | "block" | null;
/**
 * Mitigation actions for a given API schema.
 */
export type APIMitigations<S extends OpenAPIV3.Document> = {
    [path in keyof S["paths"]]?: APIMitigation | {
        [method in keyof S["paths"][path]]?: APIMitigation;
    };
};
//# sourceMappingURL=api-mitigation.d.ts.map