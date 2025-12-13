import type { Secret } from "../secret.ts";
import { PlanetScaleClient } from "./api/sdk.gen.ts";
import type { GeneralError } from "./api/types.gen.ts";
/**
 * Properties for configuring the PlanetScale API.
 */
export interface PlanetScaleProps {
    /**
     * The base URL of the PlanetScale API. Defaults to https://api.planetscale.com/v1.
     */
    baseUrl?: string;
    /**
     * The ID of the service token to use for authentication. Defaults to the value of the PLANETSCALE_SERVICE_TOKEN_ID environment variable.
     */
    serviceTokenId?: Secret;
    /**
     * The secret of the service token to use for authentication. Defaults to the value of the PLANETSCALE_SERVICE_TOKEN environment variable.
     */
    serviceToken?: Secret;
    /**
     * The API key to use for authentication. Defaults to the value of the PLANETSCALE_API_TOKEN environment variable.
     * @deprecated Use serviceTokenId and serviceToken instead.
     */
    apiKey?: Secret;
}
export declare class PlanetScaleError extends Error {
    status: number;
    method: string;
    url: string;
    code: string | undefined;
    constructor(props: {
        error: GeneralError;
        request: Request;
        response: Response;
    });
}
export type { PlanetScaleClient };
export declare function createPlanetScaleClient(options?: PlanetScaleProps): PlanetScaleClient;
//# sourceMappingURL=api.d.ts.map