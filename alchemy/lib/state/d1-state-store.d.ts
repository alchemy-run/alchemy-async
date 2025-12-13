import { type CloudflareApiOptions } from "../cloudflare/api.ts";
import type { Scope } from "../scope.ts";
import { StateStoreProxy } from "./proxy.ts";
export interface D1StateStoreOptions extends CloudflareApiOptions {
    databaseName?: string;
}
/**
 * @deprecated Use `CloudflareStateStore` from `alchemy/state` instead.
 */
export declare class D1StateStore extends StateStoreProxy {
    private options;
    constructor(scope: Scope, options?: D1StateStoreOptions);
    provision(): Promise<StateStoreProxy.Dispatch>;
}
//# sourceMappingURL=d1-state-store.d.ts.map