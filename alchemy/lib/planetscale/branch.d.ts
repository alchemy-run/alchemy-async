import type { Context } from "../context.ts";
import { type PlanetScaleProps } from "./api.ts";
import type { Database } from "./database.ts";
import { type PlanetScaleClusterSize } from "./utils.ts";
/**
 * Properties for creating or updating a PlanetScale Branch
 */
export interface BranchProps extends PlanetScaleProps {
    /**
     * The name of the branch
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * The organization name. Automatically inferred from the database if the database is provided as an object.
     */
    organization?: string;
    /**
     * The database name
     */
    database: string | Database;
    /**
     * Whether or not the branch should be set to a production branch or not.
     */
    isProduction: boolean;
    /**
     * Whether to adopt an existing branch if it exists.
     * If false and the branch exists, an error will be thrown.
     * If true and the branch exists, it will be updated with the provided properties.
     */
    adopt?: boolean;
    /**
     * Whether to delete the branch when the resource is destroyed.
     * When false, the branch will only be removed from the state but not deleted via API.
     * @default true
     */
    delete?: boolean;
    /**
     * The parent branch name or Branch object
     * @default "main"
     */
    parentBranch?: string | Branch;
    /**
     * If provided, restores the backup's schema and data to the new branch.
     * Must have restore_production_branch_backup(s) or restore_backup(s) access.
     *
     * Ignored if the branch already exists.
     */
    backupId?: string;
    /**
     * If provided, restores the last successful backup's schema and data to the new branch.
     * Must have restore_production_branch_backup(s) or restore_backup(s) access,
     * in addition to Data Branching being enabled for the branch.
     * Use 'last_successful_backup' or undefined.
     *
     * Ignored if the branch already exists.
     */
    seedData?: "last_successful_backup";
    /**
     * The database cluster size is required if a backup_id is provided. If the branch is not a production branch, the cluster size MUST be "PS_DEV".
     */
    clusterSize?: PlanetScaleClusterSize;
    /**
     * Enable or disable safe migrations on this branch
     */
    safeMigrations?: boolean;
}
/**
 * Represents a PlanetScale Branch
 */
export interface Branch extends BranchProps {
    /**
     * The name of the branch
     */
    name: string;
    /**
     * The name of the parent branch
     */
    parentBranch: string;
    /**
     * Time at which the branch was created
     */
    createdAt: string;
    /**
     * Time at which the branch was last updated
     */
    updatedAt: string;
    /**
     * HTML URL to access the branch
     */
    htmlUrl: string;
}
/**
 * Create or manage a PlanetScale database branch
 *
 * @example
 * // Create a branch from 'main'
 * const branch = await Branch("feature-123", {
 *   name: "feature-123",
 *   organization: "my-org",
 *   database: "my-database",
 *   parentBranch: "main"
 * });
 *
 * @example
 * // Create a branch from another branch object
 * const parentBranch = await Branch("staging", {
 *   name: "staging",
 *   organization: "my-org",
 *   database: "my-database",
 *   parentBranch: "main"
 * });
 *
 * const featureBranch = await Branch("feature-456", {
 *   name: "feature-456",
 *   organization: "my-org",
 *   database: "my-database",
 *   parentBranch: parentBranch // Using Branch object instead of string
 * });
 *
 * @example
 * // Create a branch from a backup
 * const branch = await Branch("restored-branch", {
 *   name: "restored-branch",
 *   organization: "my-org",
 *   database: "my-database",
 *   parentBranch: "main",
 *   backupId: "backup-123",
 *   clusterSize: "PS_10"
 * });
 */
export declare const Branch: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Branch>, id: string, props: BranchProps) => Promise<Branch>);
//# sourceMappingURL=branch.d.ts.map