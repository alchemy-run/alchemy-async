import type { Context } from "../context.ts";
import { type Secret } from "../secret.ts";
import type { ApiKey as ApiApiKey, Organization } from "./api/types.gen.ts";
export interface ApiKeyProps {
    keyId?: string | Secret<string>;
    secret?: string | Secret<string>;
    organization: string | Organization;
    name?: ApiApiKey["name"];
    expireAt?: ApiApiKey["expireAt"];
    roles?: ApiApiKey["roles"];
    ipAccessList?: ApiApiKey["ipAccessList"];
    state?: ApiApiKey["state"];
}
export interface ApiKey {
    organizationId: string;
    name: string;
    clickhouseId: NonNullable<ApiApiKey["id"]>;
    keyId: string;
    secret: Secret<string>;
    state: NonNullable<ApiApiKey["state"]>;
    roles: NonNullable<ApiApiKey["roles"]>;
    keySuffix: NonNullable<ApiApiKey["keySuffix"]>;
    createdAt: NonNullable<ApiApiKey["createdAt"]>;
    expireAt?: ApiApiKey["expireAt"];
    usedAt?: ApiApiKey["usedAt"];
    ipAccessList: ApiApiKey["ipAccessList"];
}
export declare const ApiKey: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<ApiKey>, id: string, props: ApiKeyProps) => Promise<ApiKey>);
//# sourceMappingURL=api-key.d.ts.map