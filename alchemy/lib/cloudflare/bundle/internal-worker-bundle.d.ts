export type InternalWorker = "cloudflare-state-store" | "dofs-state-store" | "remote-binding-proxy" | "tunnel-proxy";
export declare const getInternalWorkerBundle: (name: InternalWorker) => Promise<{
    tag: string;
    bundle: {
        entrypoint: string;
        modules: {
            type: "esm";
            path: string;
            content: string;
        }[];
    };
}>;
//# sourceMappingURL=internal-worker-bundle.d.ts.map