import * as miniflare from "miniflare";
import type { HTTPServer } from "../../util/http.ts";
import type { CloudflareApi } from "../api.ts";
import type { Bindings } from "../bindings.ts";
import { type EventSource } from "../event-source.ts";
import type { WorkerBundleSource } from "../worker-bundle.ts";
import type { AssetsConfig } from "../worker.ts";
export interface MiniflareWorkerInput {
    api: CloudflareApi;
    id: string;
    name: string;
    compatibilityDate: string | undefined;
    compatibilityFlags: string[] | undefined;
    bindings: Bindings | undefined;
    eventSources: EventSource[] | undefined;
    assets: AssetsConfig | undefined;
    bundle: WorkerBundleSource;
    port: number | undefined;
    tunnel: boolean | undefined;
    cwd: string;
}
export declare const buildWorkerOptions: (input: MiniflareWorkerInput) => Promise<{
    watch: (signal: AbortSignal) => AsyncGenerator<miniflare.WorkerOptions>;
    remoteProxy: HTTPServer | undefined;
}>;
//# sourceMappingURL=build-worker-options.d.ts.map