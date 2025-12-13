import { type PackageManager } from "./detect-package-manager.ts";
export declare class PeerDependencyError extends Error {
    constructor(input: {
        feature?: string;
        missing: string[];
        packageManager?: PackageManager;
    });
}
export declare function importPeer<T>(promise: Promise<T>, feature?: string): Promise<T>;
//# sourceMappingURL=peer.d.ts.map