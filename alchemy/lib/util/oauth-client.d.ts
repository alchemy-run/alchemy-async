import type { Credentials } from "../auth.ts";
export declare class OAuthError extends Error {
    readonly error: string;
    constructor({ error, error_description, ...rest }: OAuthClient.ErrorResponse);
}
/**
 * Generic OAuth 2.0 client.
 *
 * Currently only handles the subset required for Cloudflare, but can be modified easily:
 * - authorization and refresh code flow
 * - S256 code challenge
 * - no client secret
 */
export declare class OAuthClient {
    private readonly options;
    constructor(options: {
        clientId: string;
        redirectUri: string;
        endpoints: {
            authorize: string;
            token: string;
            revoke: string;
        };
    });
    /**
     * Generate an authorization URL, state, and verifier for the given scopes.
     */
    authorize(scopes: string[]): OAuthClient.Authorization;
    /**
     * Exchange an authorization code for credentials.
     */
    exchange(code: string, verifier: string): Promise<Credentials.OAuth>;
    /**
     * Refresh OAuth 2.0 credentials.
     */
    refresh(credentials: Credentials.OAuth): Promise<Credentials.OAuth>;
    /**
     * Revoke OAuth 2.0 credentials.
     */
    revoke(credentials: Credentials.OAuth): Promise<void>;
    /**
     * Make a POST request to the OAuth provider with the given urlencoded body.
     */
    private request;
    /**
     * Listens for the callback from the provider by starting a local HTTP server and exchanges the authorization code for credentials.
     * Should be called with the authorization object returned by {@link authorize}.
     * Listens for the callback on the client's redirect URI.
     * Throws if the request is invalid, the code exchange fails, or if no callback is received within 5 minutes.
     */
    callback(authorization: OAuthClient.Authorization): Promise<Credentials.OAuth>;
}
export declare namespace OAuthClient {
    interface ErrorResponse {
        error: string;
        error_description: string;
    }
    interface SuccessResponse {
        access_token: string;
        refresh_token: string;
        expires_in: number;
        scope: string;
        token_type: string;
    }
    interface Authorization {
        url: string;
        state: string;
        verifier: string;
    }
}
//# sourceMappingURL=oauth-client.d.ts.map