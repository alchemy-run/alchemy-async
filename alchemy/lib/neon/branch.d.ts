import type { Context } from "../context.ts";
import { type NeonApiOptions } from "./api.ts";
import type * as neon from "./api/types.gen.ts";
import type { NeonProject } from "./project.ts";
import { type NeonConnectionUri, type NeonRole } from "./utils.ts";
export interface NeonBranchProps extends NeonApiOptions {
    /**
     * The project to create the new branch in.
     * This can be a Project object or an ID string.
     */
    project: string | NeonProject;
    /**
     * The name of the branch.
     * @default `${app}-${stage}-${id}`
     */
    name?: string;
    /**
     * Whether the branch is protected.
     * @default false.
     */
    protected?: boolean;
    /**
     * The parent branch to create the new branch from. Default is the project's default branch.
     * This can be a Branch object or an ID string beginning with `br-`.
     */
    parentBranch?: string | NeonBranch | neon.Branch;
    /**
     * A Log Sequence Number (LSN) on the parent branch. The branch will be created with data from this LSN.
     */
    parentLsn?: string;
    /**
     * A timestamp identifying a point in time on the parent branch. The branch will be created with data starting from this point in time.
     * The timestamp must be provided in ISO 8601 format; for example: `2024-02-26T12:00:00Z`.
     */
    parentTimestamp?: string;
    /**
     * The timestamp when the branch is scheduled to expire and be automatically deleted.
     * Must be set by the client following the [RFC 3339, section 5.6](https://tools.ietf.org/html/rfc3339#section-5.6) format with precision up to seconds (such as 2025-06-09T18:02:16Z).
     * Deletion is performed by a background job and may not occur exactly at the specified time.
     *
     * Access to this feature is currently limited to participants in the Early Access Program.
     */
    expiresAt?: string;
    /**
     * The source of initialization for the branch. Valid values are `schema-only` and `parent-data` (default).
     * * `schema-only` - creates a new root branch containing only the schema. Use `parent_id` to specify the source branch. Optionally, you can provide `parent_lsn` or `parent_timestamp` to branch from a specific point in time or LSN. These fields define which branch to copy the schema from and at what point—they do not establish a parent-child relationship between the `parent_id` branch and the new schema-only branch.
     * * `parent-data` - creates the branch with both schema and data from the parent.
     * @default "parent-data"
     */
    initSource?: "schema-only" | "parent-data";
    /**
     * The endpoints to create for the branch.
     *
     * Warning: If you do not configure endpoints, you will not be able to connect to the branch.
     *
     * @example
     * ```ts
     * [
     *  {
     *   type: "read-write",
     *  },
     *  {
     *   type: "read-only",
     *  },
     * ]
     * ```
     */
    endpoints: neon.BranchCreateRequestEndpointOptions[];
}
export interface NeonBranch {
    /**
     * The branch ID. This value is generated when a branch is created. A branch_id value has a br- prefix. For example: br-small-term-683261.
     */
    id: string;
    /**
     * The ID of the project to which the branch belongs.
     */
    projectId: string;
    /**
     * The ID of the parent branch.
     */
    parentBranchId: string | undefined;
    /**
     * A Log Sequence Number (LSN) on the parent branch. The branch will be created with data from this LSN.
     */
    parentLsn: string | undefined;
    /**
     * A timestamp identifying a point in time on the parent branch. The branch will be created with data starting from this point in time.
     * The timestamp must be provided in ISO 8601 format; for example: `2024-02-26T12:00:00Z`.
     */
    parentTimestamp: string | undefined;
    /**
     * The source of initialization for the branch.
     */
    initSource: "schema-only" | "parent-data" | undefined;
    /**
     * The name of the branch.
     */
    name: string;
    /**
     * Whether the branch is protected.
     */
    protected: boolean;
    /**
     * Whether the branch is the default branch.
     */
    default: boolean;
    /**
     * The timestamp when the branch was created.
     */
    createdAt: Date;
    /**
     * The timestamp when the branch was last updated.
     */
    updatedAt: Date;
    /**
     * The timestamp when the branch is scheduled to expire and be automatically deleted.
     * Must be set by the client following the RFC 3339, section 5.6 format with precision up to seconds (such as 2025-06-09T18:02:16Z).
     * Deletion is performed by a background job and may not occur exactly at the specified time.
     */
    expiresAt: Date | undefined;
    /**
     * The endpoints for the branch.
     */
    endpoints: neon.Endpoint[];
    /**
     * The databases for the branch.
     */
    databases: neon.Database[];
    /**
     * The roles for the branch.
     */
    roles: NeonRole[];
    /**
     * The connection URIs for the branch.
     */
    connectionUris: NeonConnectionUri[];
}
export declare const NeonBranch: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<NeonBranch>, id: string, props: NeonBranchProps) => Promise<{
    id: string;
    name: string;
    projectId: string;
    protected: boolean;
    default: boolean;
    parentBranchId: string | undefined;
    parentLsn: string | undefined;
    parentTimestamp: string | undefined;
    initSource: "schema-only" | "parent-data" | undefined;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date | undefined;
    endpoints: neon.Endpoint[];
    databases: neon.Database[];
    roles: NeonRole[];
    connectionUris: NeonConnectionUri[];
}>);
//# sourceMappingURL=branch.d.ts.map