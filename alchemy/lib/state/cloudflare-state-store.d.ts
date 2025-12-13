import type { CloudflareApiOptions } from "../cloudflare/api.ts";
import type { Scope } from "../scope.ts";
import type { Secret } from "../secret.ts";
import { StateStoreProxy } from "./proxy.ts";
export interface CloudflareStateStoreOptions extends CloudflareApiOptions {
    /**
     * The name of the script to use for the state store.
     * @default "alchemy-state-service"
     */
    scriptName?: string;
    /**
     * Whether to force the worker to be updated.
     * This may be useful if you've lost the token for the state store and need to overwrite it.
     * @default false
     */
    forceUpdate?: boolean;
    /**
     * The token to use for the state store.
     * @default process.env.ALCHEMY_STATE_TOKEN
     * @note You must use the same token for all deployments on your Cloudflare account.
     */
    stateToken?: Secret<string>;
}
/**
 * A state store backed by a SQLite database in a Cloudflare Durable Object.
 *
 * @see {@link https://alchemy.run/guides/do-state-store DOStateStore}
 */
export declare class CloudflareStateStore extends StateStoreProxy {
    options: CloudflareStateStoreOptions & {
        stateToken: Secret<string>;
    };
    constructor(scope: Scope, options?: CloudflareStateStoreOptions);
    provision(): Promise<StateStoreProxy.Dispatch>;
}
//# sourceMappingURL=cloudflare-state-store.d.ts.map