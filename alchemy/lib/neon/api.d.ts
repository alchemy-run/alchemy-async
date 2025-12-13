import type { Secret } from "../secret.ts";
import { NeonClient } from "./api/sdk.gen.ts";
import type { GeneralError } from "./api/types.gen.ts";
/**
 * Options for Neon API requests
 */
export interface NeonApiOptions {
    /**
     * Base URL for Neon API
     * @default https://console.neon.tech/api/v2
     */
    baseUrl?: string;
    /**
     * API Key to use (overrides NEON_API_KEY env var)
     */
    apiKey?: Secret;
}
export declare class NeonError extends Error {
    status: number;
    method: string;
    url: string;
    code: string;
    constructor(props: {
        error: GeneralError;
        request: Request;
        response: Response;
    });
}
/**
 * Create a NeonApi instance with environment variable fallback
 * @param options API options
 * @returns NeonApi instance
 */
export declare function createNeonApi(options?: Partial<NeonApiOptions>): NeonClient;
//# sourceMappingURL=api.d.ts.map