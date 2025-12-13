import type { CloudflareApi } from "../../cloudflare/api.ts";
import type { DOStateStoreAPI } from "./api.ts";
interface DOStateStoreClientOptions {
    app: string;
    stage: string;
    url: string;
    token: string;
}
export declare class DOFSStateStoreClient {
    private readonly options;
    constructor(options: DOStateStoreClientOptions);
    rpc<T extends keyof DOStateStoreAPI.API>(method: T, params: DOStateStoreAPI.API[T]["params"]): Promise<DOStateStoreAPI.API[T]["result"]>;
    validate(): Promise<Response>;
    waitUntilReady(): Promise<void>;
    fetch(path: string, init?: RequestInit): Promise<Response>;
}
export declare function upsertStateStoreWorker(api: CloudflareApi, workerName: string, token: string, force: boolean): Promise<void>;
export {};
//# sourceMappingURL=store.d.ts.map