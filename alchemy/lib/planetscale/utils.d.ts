import type { PlanetScaleClient } from "./api/sdk.gen.ts";
import type { DatabaseBranch } from "./api/types.gen.ts";
export type PlanetScaleClusterSize = "PS_DEV" | "PS_10" | "PS_20" | "PS_40" | "PS_80" | "PS_160" | "PS_320" | "PS_400" | "PS_640" | "PS_700" | "PS_900" | "PS_1280" | "PS_1400" | "PS_1800" | "PS_2100" | "PS_2560" | "PS_2700" | "PS_2800" | (string & {});
/**
 * Ensures that the given cluster size is in the correct format.
 */
export declare function sanitizeClusterSize(input: {
    size: PlanetScaleClusterSize;
    kind?: "mysql" | "postgresql";
    arch?: "x86" | "arm";
    region?: string;
}): string;
/**
 * Polls a branch until it is ready.
 */
export declare function waitForBranchReady(api: PlanetScaleClient, organization: string, database: string, branch: string): Promise<DatabaseBranch>;
/**
 * Polls a database until it is ready.
 */
export declare function waitForDatabaseReady(api: PlanetScaleClient, organization: string, database: string): Promise<void>;
/**
 * Polls a keyspace until it is finished resizing.
 */
export declare function waitForKeyspaceReady(api: PlanetScaleClient, organization: string, database: string, branch: string, keyspace: string): Promise<void>;
/**
 * Ensure a branch is production and has the correct cluster size.
 * If a branch is not production, it will be promoted to production because
 * cluster sizes can only be configured for production branches.
 */
export declare function ensureProductionBranchClusterSize(api: PlanetScaleClient, organization: string, database: string, branch: string, kind: "mysql" | "postgresql", expectedClusterSize: PlanetScaleClusterSize): Promise<void>;
//# sourceMappingURL=utils.d.ts.map