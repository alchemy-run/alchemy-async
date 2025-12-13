import type { Secret } from "../secret.ts";
import { PrismaClient } from "./api/sdk.gen.ts";
export interface PrismaApiOptions {
    /**
     * The service token to use for the API
     */
    serviceToken?: Secret<string>;
}
export declare class PrismaApi extends Error {
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
 * Create a PrismaApi instance with environment variable fallback
 * @param options API options
 * @returns PrismaApi instance
 */
export declare function createPrismaApi(options?: Partial<PrismaApiOptions>): PrismaClient;
//# sourceMappingURL=api.d.ts.map