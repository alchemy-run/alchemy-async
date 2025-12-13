import type { Context } from "../context.ts";
import { type Secret } from "../secret.ts";
import type { Database } from "./database.ts";
export interface ConnectionProps {
    /**
     * Database (id or resource) the connection belongs to
     */
    database: Database | string;
    /**
     * The name of the connection
     */
    name?: string;
    /**
     * The service token to use for the API
     */
    serviceToken?: Secret<string>;
}
export interface Connection {
    /**
     * The prisma id of the connection
     */
    id: string;
    /**
     * The name of the connection
     */
    name: string;
    /**
     * The timestamp of the connection creation
     */
    createdAt: string;
    /**
     * The prisma connection string (prefixed with `prisma+postgres://`)
     */
    prismaConnectionString: Secret<string>;
    /**
     * The connection string
     */
    connectionString: Secret<string>;
    /**
     * The prisma id of the database the connection belongs to
     */
    database: string;
    /**
     * The host of the connection
     */
    host: string | null;
    /**
     * The password of the connection
     */
    password: Secret<string> | null;
    /**
     * The user of the connection
     */
    user: string | null;
}
/**
 * Creates and manages Prisma Postgres database connections.
 *
 * Prisma Postgres database connections provide secure credentials
 * and connection details for accessing your databases. Connections
 * belong to a Prisma Postgres database.
 *
 * @example
 * // Create a database connection for a database
 * import { Database, Connection } from "alchemy/prisma-postgres";
 * const project = await Project("my-project");
 * const database = await Database("my-database", { project });
 * const connection = await Connection("my-connection", {
 *   database: database,
 * });
 * console.log(`Connection String: ${connection.connectionString.unencrypted}`);
 *
 * @example
 * // Create a database connection and connect it to Cloudflare Hyperdrive
 * import { Hyperdrive } from "alchemy/cloudflare";
 * import { Database, Connection } from "alchemy/prisma-postgres";
 * const project = await Project("my-project");
 * const database = await Database("my-database", { project });
 * const connection = await Connection("my-connection", {
 *   database: database,
 * });
 * const db = await Hyperdrive("prisma-postgres", {
 *   origin: connection.connectionString.unencrypted,
 * });
 */
export declare const Connection: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Connection>, id: string, props: ConnectionProps) => Promise<Connection>);
//# sourceMappingURL=connection.d.ts.map