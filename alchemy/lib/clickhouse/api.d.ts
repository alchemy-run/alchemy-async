import type { Secret } from "../secret.ts";
import { ClickhouseClient } from "./api/sdk.gen.ts";
/**
 * Options for Neon API requests
 */
export interface ClickhouseApiOptions {
    /**
     * The key ID for the Clickhouse API
     */
    keyId?: string | Secret<string>;
    /**
     * The secret for the Clickhouse API
     */
    secret?: string | Secret<string>;
}
export declare class ClickhouseError extends Error {
    status: number;
    method: string;
    url: string;
    code: string;
    constructor(props: {
        error: {
            status?: number;
            error?: string;
        };
        request: Request;
        response: Response;
    });
}
/**
 * Create a ClickhouseApi instance with environment variable fallback
 * @param options API options
 * @returns ClickhouseApi instance
 */
export declare function createClickhouseApi(options?: Partial<ClickhouseApiOptions>): ClickhouseClient;
//# sourceMappingURL=api.d.ts.map