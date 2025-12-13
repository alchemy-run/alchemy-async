import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import { type PlanetScaleProps } from "./api.ts";
import type { Branch } from "./branch.ts";
import type { Database } from "./database.ts";
/**
 * Properties for creating or updating a PlanetScale Branch
 */
export interface PasswordProps extends PlanetScaleProps {
    /**
     * The name of the password
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * The organization ID where the password will be created
     * Required when using string database name, optional when using Database or Branch resource
     * @default process.env.PLANETSCALE_ORGANIZATION
     */
    organization?: string;
    /**
     * The database where the password will be created
     * Can be either a database name (string) or Database resource
     */
    database: string | Database;
    /**
     * The branch where the password will be created
     * Can be either a branch name (string) or Branch resource
     * @default "main"
     */
    branch?: string | Branch;
    /**
     * The password
     */
    role: "reader" | "writer" | "admin" | "readwriter";
    /**
     * Whether the password is for a read replica
     */
    replica?: boolean;
    /**
     * The TTL of the password in seconds
     */
    ttl?: number;
    /**
     * The CIDRs of the password
     */
    cidrs?: string[];
    /**
     * Whether to delete the password when the resource is destroyed.
     * When false, the password will only be removed from the state but not deleted via API.
     * @default true
     */
    delete?: boolean;
}
/**
 * Represents a PlanetScale Branch
 */
export interface Password extends PasswordProps {
    /**
     * The unique identifier for the password
     */
    id: string;
    /**
     * Name of the Password.
     */
    name: string;
    /**
     * The timestamp when the password expires (ISO 8601 format)
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
     * The name slug for the password
     */
    nameSlug: string;
}
/**
 * Create and manage database passwords for PlanetScale MySQL branches. Database passwords provide secure access to your database with specific roles and permissions.
 *
 * For Postgres, use [Roles](./role.ts) instead.
 *
 * @example
 * ## Basic Reader Password
 *
 * Create a read-only password for a database branch:
 *
 * ```ts
 * import { Password } from "alchemy/planetscale";
 *
 * const readerPassword = await Password("app-reader", {
 *   name: "app-reader",
 *   organization: "my-org",
 *   database: "my-app-db",
 *   branch: "main",
 *   role: "reader"
 * });
 *
 * // Access connection details
 * console.log(`Host: ${readerPassword.password.host}`);
 * console.log(`Username: ${readerPassword.password.username}`);
 * console.log(`Password: ${readerPassword.password.password.unencrypted}`);
 * ```
 *
 * @example
 * ## Writer Password with TTL
 *
 * Create a writer password that expires after 24 hours:
 *
 * ```ts
 * import { Password } from "alchemy/planetscale";
 *
 * const writerPassword = await Password("app-writer", {
 *   name: "app-writer",
 *   organization: "my-org",
 *   database: "my-app-db",
 *   branch: "development",
 *   role: "writer",
 *   ttl: 86400 // 24 hours in seconds
 * });
 *
 * // Password will expire at the specified time
 * console.log(`Expires at: ${writerPassword.expiresAt}`);
 * ```
 *
 * @example
 * ## Admin Password with IP Restrictions
 *
 * Create an admin password that only allows connections from specific IP addresses:
 *
 * ```ts
 * import { Password } from "alchemy/planetscale";
 *
 * const adminPassword = await Password("admin-access", {
 *   name: "admin-access",
 *   organization: "my-org",
 *   database: "my-app-db",
 *   branch: "main",
 *   role: "admin",
 *   cidrs: ["203.0.113.0/24", "198.51.100.0/24"],
 *   ttl: 3600 // 1 hour
 * });
 * ```
 *
 * @example
 * ## Database Password with Custom API Key
 *
 * Create a password using a specific API key instead of the default environment variable:
 *
 * ```ts
 * import { Password } from "alchemy/planetscale";
 *
 * const password = await Password("custom-auth", {
 *   name: "custom-auth",
 *   organization: "my-org",
 *   database: "my-app-db",
 *   branch: "main",
 *   role: "readwriter",
 *   apiKey: alchemy.secret(process.env.CUSTOM_PLANETSCALE_TOKEN)
 * });
 * ```
 *
 * @example
 * ## Read Replica Password
 *
 * Create a password for accessing a read replica:
 *
 * ```ts
 * import { Password } from "alchemy/planetscale";
 *
 * const replicaPassword = await Password("replica-reader", {
 *   name: "replica-reader",
 *   organization: "my-org",
 *   database: "my-app-db",
 *   branch: "main",
 *   role: "reader",
 *   replica: true
 * });
 *
 * @example
 * ## Using Database Resource Instance
 *
 * Create a password using a Database resource instead of string:
 *
 * ```ts
 * import { Database, Password } from "alchemy/planetscale";
 *
 * const database = await Database("my-db", {
 *   name: "my-app-db",
 *   organization: "my-org",
 *   clusterSize: "PS_10"
 * });
 *
 * const password = await Password("db-reader", {
 *   name: "db-reader",
 *   database: database, // Using Database resource
 *   role: "reader"
 * });
 * ```
 *
 * @example
 * ## Using Both Database and Branch Resources
 *
 * Create a password using both Database and Branch resources:
 *
 * ```ts
 * import { Database, Branch, Password } from "alchemy/planetscale";
 *
 * const database = await Database("my-db", {
 *   name: "my-app-db",
 *   organization: "my-org",
 *   clusterSize: "PS_10"
 * });
 *
 * const branch = await Branch("feature-branch", {
 *   name: "feature-branch",
 *   organization: "my-org",
 *   databaseName: "my-app-db",
 *   parentBranch: "main",
 *   isProduction: false
 * });
 *
 * const password = await Password("feature-writer", {
 *   name: "feature-writer",
 *   database: database, // Using Database resource
 *   branch: branch, // Using Branch resource
 *   role: "writer"
 * });
 * ```
 * ```
 */
export declare const Password: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Password>, id: string, props: PasswordProps) => Promise<Password>);
//# sourceMappingURL=password.d.ts.map