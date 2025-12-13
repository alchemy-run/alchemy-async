import type { RemoteProxyConnectionString } from "miniflare";
import { HTTPServer } from "../../util/http.ts";
import type { CloudflareApi } from "../api.ts";
import type { WorkerBindingSpec } from "../bindings.ts";
export interface RemoteBindingProxy {
    server: HTTPServer;
    bindings: WorkerBindingSpec[];
    connectionString: RemoteProxyConnectionString;
}
export declare function createRemoteProxyWorker(input: {
    api: CloudflareApi;
    name: string;
    bindings: WorkerBindingSpec[];
}): Promise<RemoteBindingProxy>;
//# sourceMappingURL=remote-binding-proxy.d.ts.map