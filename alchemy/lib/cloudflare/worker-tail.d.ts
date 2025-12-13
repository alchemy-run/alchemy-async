import type { CloudflareApi } from "./api.ts";
export declare const createTail: (api: CloudflareApi, id: string, scriptName: string) => Promise<TailClient>;
declare class TailClient {
    private api;
    private id;
    private scriptName;
    private tail?;
    private ws?;
    private pingInterval?;
    private clean;
    constructor(api: CloudflareApi, id: string, scriptName: string);
    private create;
    connect(attempt?: number): Promise<void>;
    private ping;
    close(): Promise<void>;
}
export {};
//# sourceMappingURL=worker-tail.d.ts.map