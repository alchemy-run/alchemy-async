interface Props {
    profile: string;
    provider: string;
}
export interface Profile {
    [provider: string]: Provider;
}
export declare namespace Profile {
    const get: (name: string) => Promise<Profile | undefined>;
}
export interface Provider<Metadata extends Record<string, string> = Record<string, string>> {
    metadata: Metadata;
    method: "api-key" | "api-token" | "oauth";
    scopes?: string[];
}
export declare namespace Provider {
    const get: <Metadata extends Record<string, string> = Record<string, string>>(props: Props) => Promise<Provider<Metadata> | undefined>;
    const getWithCredentials: <Metadata extends Record<string, string> = Record<string, string>>(props: Props) => Promise<{
        provider: Provider<Metadata>;
        credentials: Credentials;
    }>;
    const set: <Metadata extends Record<string, string> = Record<string, string>>(props: Props, provider: Provider<Metadata>) => Promise<void>;
    const del: (props: Props) => Promise<void>;
}
export type Credentials = Credentials.ApiKey | Credentials.ApiToken | Credentials.OAuth;
export declare namespace Credentials {
    interface ApiKey {
        type: "api-key";
        apiKey: string;
        email: string;
    }
    interface ApiToken {
        type: "api-token";
        apiToken: string;
    }
    interface OAuth {
        type: "oauth";
        access: string;
        refresh: string;
        expires: number;
        scopes: string[];
    }
    /**
     * Gets the credentials file.
     * @param props The profile and provider of the credentials.
     */
    const get: (props: Props) => Promise<Credentials | undefined>;
    /**
     * Sets the credentials file.
     * @param props The profile and provider of the credentials.
     * @param credentials The credentials to set.
     */
    const set: (props: Props, credentials: Credentials) => Promise<void>;
    /**
     * Deletes the credentials file.
     * @param props The profile and provider of the credentials.
     */
    const del: (props: Props) => Promise<void>;
    /**
     * Fetches OAuth credentials for the given provider and profile, refreshing them if they are expired.
     * @param props The properties of the credentials.
     * @param refresh The function to refresh the credentials.
     * @returns The refreshed credentials.
     */
    const getRefreshed: (props: Props, refresh: (credentials: Credentials.OAuth) => Promise<Credentials.OAuth>) => Promise<Credentials>;
    /**
     * Returns true if the given credentials are OAuth and expired.
     */
    const isOAuthExpired: (credentials: Credentials, tolerance?: number) => credentials is Credentials.OAuth;
}
export {};
//# sourceMappingURL=auth.d.ts.map