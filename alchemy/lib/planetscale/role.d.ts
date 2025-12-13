import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type PlanetScaleProps } from "./api.ts";
import type { Branch } from "./branch.ts";
import type { Database } from "./database.ts";
/**
 * Properties for creating or updating a PlanetScale PostgreSQL Role
 */
export interface RoleProps extends PlanetScaleProps {
    /**
     * The organization ID where the role will be created
     * Required when using string database name, optional when using Database resource
     * @default process.env.PLANETSCALE_ORGANIZATION
     */
    organization?: string;
    /**
     * The database where the role will be created
     * Can be either a database name (string) or Database resource
     */
    database: string | Database;
    /**
     * The branch where the role will be created
     * Can be either a branch name (string) or Branch resource
     * @default "main"
     */
    branch?: string | Branch;
    /**
     * Time to live in seconds
     */
    ttl?: number;
    /**
     * Roles to inherit from.
     * The `"postgres"` role provides full administrator access to the database.
     * You can also inherit from another Role resource.
     */
    inheritedRoles: InheritedRole[] | Role;
    /**
     * Whether to delete the role when the resource is destroyed.
     * When false, the role will only be removed from the state but not deleted via API.
     * @default true
     */
    delete?: boolean;
    /**
     * successor role
     * @default postgres
     */
    successor?: string | Role;
}
/**
 * Roles that can be inherited from.
 */
export type InheritedRole = "postgres" | "pg_checkpoint" | "pg_create_subscription" | "pg_maintain" | "pg_monitor" | "pg_read_all_data" | "pg_read_all_settings" | "pg_read_all_stats" | "pg_signal_backend" | "pg_stat_scan_tables" | "pg_use_reserved_connections" | "pg_write_all_data" | (string & {});
export interface Role extends Omit<RoleProps, "inheritedRoles"> {
    /**
     * The unique identifier for the role
     */
    id: string;
    /**
     * The name of the role
     */
    name: string;
    /**
     * The timestamp when the role expires (ISO 8601 format)
     */
    expiresAt: string;
    /**
     * The host URL for database connection
     */
    host: string;
    /**
     * The username for database authentication
     */
    username: string;
    /**
     * The encrypted password for database authentication
     */
    password: Secret<string>;
    /**
     * The database name
     */
    databaseName: string;
    /**
     * The direct connection URL for the database.
     */
    connectionUrl: Secret<string>;
    /**
     * The pooled connection URL for the database.
     * Uses PSBouncer on port 6432. Recommended for production.
     * @see https://planetscale.com/docs/postgres/connecting/psbouncer
     */
    connectionUrlPooled: Secret<string>;
    /**
     * The roles that this role inherits from.
     */
    inheritedRoles: InheritedRole[];
    /**
     * The successor role
     */
    successor: string;
}
/**
 * Create and manage database roles for PlanetScale PostgreSQL branches. Database roles provide secure access to your database with specific roles and permissions.
 *
 * For MySQL, use [Passwords](./password.ts) instead.
 *
 * @example
 * ## Basic Role
 *
 * Create a default role with all permissions:
 *
 * ```ts
 * const role = await Role("my-role", {
 *   database: "my-database",
 *   inheritedRoles: ["postgres"],
 * });
 * ```
 *
 * ## Role with TTL
 *
 * Create a role with a TTL of 1 hour:
 *
 * ```ts
 * const role = await Role("my-role", {
 *   database: "my-database",
 *   ttl: 3600,
 * });
 * ```
 *
 * ## Role with Inherited Permissions
 *
 * Create a role with read-only access to all data and settings:
 *
 * ```ts
 * const role = await Role("my-role", {
 *   database: "my-database",
 *   inheritedRoles: ["pg_read_all_data", "pg_read_all_settings"],
 * });
 * ```
 */
export declare const Role: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Role, RoleProps>, id: string, props: RoleProps) => Promise<Role>);
//# sourceMappingURL=role.d.ts.map