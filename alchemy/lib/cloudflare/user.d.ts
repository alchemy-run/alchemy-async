import type { Credentials } from "../auth.ts";
import type { Secret } from "../secret.ts";
export interface CloudflareAccount {
    name: string;
    id: string;
    type: "standard" | "zero_rating" | "full_control";
    settings: {
        enforce_twofactor: boolean;
        api_access_enabled: null;
        access_approval_expiry: null;
        abuse_contact_email: null;
    };
    legacy_flags: {
        enterprise_zone_quota: {
            maximum: number;
            current: number;
            available: number;
        };
    };
}
export interface CloudflareUserInfo {
    apiToken?: Secret;
    apiKey?: Secret;
    email: string;
    username: string;
    accounts: CloudflareAccount[];
    organizations: CloudflareOrganization[];
    tokenPermissions: string[] | undefined;
    first_name: string | null;
    last_name: string | null;
    telephone: string | null;
    country: string | null;
    zipcode: string | null;
    two_factor_authentication_enabled: boolean;
    two_factor_authentication_locked: boolean;
    has_pro_zones: boolean;
    has_business_zones: boolean;
    has_enterprise_zones: boolean;
    suspended: boolean;
    betas: string[];
}
export interface CloudflareOrganization {
    id: string;
    name: string;
    status: string;
    permissions: string[];
    roles: string[];
}
export declare const listCloudflareAccounts: (credentials: Credentials) => Promise<CloudflareAccount[]>;
export declare const getCloudflareAccountId: (credentials: Credentials) => Promise<string>;
export declare const getUserEmailFromApiKey: (apiKey: string) => Promise<string>;
//# sourceMappingURL=user.d.ts.map