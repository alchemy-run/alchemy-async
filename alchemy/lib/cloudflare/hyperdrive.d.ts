import { Secret } from "../secret.ts";
import { type CloudflareApiOptions } from "./api.ts";
/**
 * Origin configuration for a PostgreSQL or MySQL database connection
 */
export interface HyperdrivePublicOrigin {
    /**
     * Database name
     */
    database: string;
    /**
     * Database host
     */
    host: string;
    /**
     * Database password
     * Use alchemy.secret() to securely store this value
     */
    password: string | Secret;
    /**
     * Database port
     * @default 5432 for postgres, 3306 for mysql
     */
    port?: number;
    /**
     * Connection scheme
     * @default "postgres"
     */
    scheme?: "postgres" | "mysql";
    /**
     * Database user
     */
    user: string;
}
/**
 * Origin configuration for a database connection with access tokens
 */
export interface HyperdriveOriginWithAccess {
    /**
     * Access client ID
     */
    access_client_id: string;
    /**
     * Access client secret
     * Use alchemy.secret() to securely store this value
     */
    access_client_secret: string | Secret;
    /**
     * Database host
     */
    host: string;
    /**
     * Database name
     */
    database: string;
    /**
     * Database port
     * @default 5432 for postgres, 3306 for mysql
     */
    port?: number;
    /**
     * Connection scheme
     * @default "postgres"
     */
    scheme?: "postgres" | "mysql";
    /**
     * Database user
     */
    user: string;
}
export interface HyperdriveCachingEnabled {
    /**
     * Whether caching is disabled
     * @default false
     */
    disabled?: false;
    /**
     * Specify the maximum duration items should persist in the cache. Not returned if set to the default (60).
     * @default 60
     */
    max_age?: number;
    /**
     * Specify the number of seconds the cache may serve a stale response. Omitted if set to the default (15).
     * @default 15
     */
    stale_while_revalidate?: number;
}
export interface HyperdriveCachingDisabled {
    /**
     * Whether caching is disabled
     * @default false
     */
    disabled: true;
}
/**
 * Caching configuration for Hyperdrive
 */
export type HyperdriveCaching = HyperdriveCachingEnabled | HyperdriveCachingDisabled;
/**
 * mTLS configuration for Hyperdrive
 */
export interface HyperdriveMtls {
    /**
     * CA certificate ID
     */
    ca_certificate_id?: string;
    /**
     * mTLS certificate ID
     */
    mtls_certificate_id?: string;
    /**
     * SSL mode
     * @default "verify-full"
     */
    sslmode?: "verify-ca" | "verify-full";
}
export type HyperdriveOriginInput = string | Secret | HyperdrivePublicOrigin | HyperdriveOriginWithAccess;
export type HyperdriveOrigin = HyperdrivePublicOrigin | HyperdriveOriginWithAccess;
/**
 * Properties for creating or updating a Cloudflare Hyperdrive.
 */
export interface HyperdriveProps extends CloudflareApiOptions {
    /**
     * Name of the Hyperdrive configuration
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Database connection origin configuration
     */
    origin: HyperdriveOriginInput;
    /**
     * Caching configuration
     */
    caching?: HyperdriveCaching;
    /**
     * mTLS configuration
     */
    mtls?: HyperdriveMtls;
    /**
     * UUID of the hyperdrive (only used for update/delete operations)
     * This is provided by Cloudflare and is different from the resource ID
     */
    hyperdriveId?: string;
    /**
     * Whether to adopt an existing hyperdrive config
     * @default false
     */
    adopt?: boolean;
    dev?: {
        /**
         * The database connection origin configuration for local development
         * @default origin
         */
        origin?: HyperdriveOriginInput;
    };
}
/**
 * Output returned after Cloudflare Hyperdrive creation/update.
 * IMPORTANT: The interface name MUST match the exported resource name.
 */
export type Hyperdrive = Omit<HyperdriveProps, "origin" | "dev"> & {
    /**
     * The ID of the resource
     */
    id: string;
    /**
     * Name of the Hyperdrive configuration
     */
    name: string;
    /**
     * The Cloudflare-generated UUID of the hyperdrive
     */
    hyperdriveId: string;
    /**
     * Database connection origin configuration
     */
    origin: HyperdrivePublicOrigin | HyperdriveOriginWithAccess;
    /**
     * Local development configuration
     * @internal
     */
    dev: {
        /**
         * The connection string to use for local development
         */
        origin: Secret;
    };
    /**
     * Resource type identifier for binding.
     * @internal
     */
    type: "hyperdrive";
};
/**
 * Represents a Cloudflare Hyperdrive configuration.
 *
 * @example
 * // Create a basic Hyperdrive connection to a PostgreSQL database
 * const basicHyperdrive = await Hyperdrive("my-postgres-db", {
 *   name: "my-postgres-db",
 *   origin: {
 *     database: "postgres",
 *     host: "database.example.com",
 *     password: alchemy.secret("your-password"),
 *     port: 5432,
 *     user: "postgres"
 *   }
 * });
 *
 * @example
 * // Create a basic Hyperdrive connection to a MySQL database
 * const mysqlHyperdrive = await Hyperdrive("my-mysql-db", {
 *   name: "my-mysql-db",
 *   origin: {
 *     database: "mydb",
 *     host: "mysql.example.com",
 *     password: alchemy.secret("your-password"),
 *     port: 3306,
 *     scheme: "mysql",
 *     user: "mysql_user"
 *   }
 * });
 *
 * @example
 * // Create a Hyperdrive with caching disabled
 * const noCacheHyperdrive = await Hyperdrive("no-cache-db", {
 *   name: "no-cache-db",
 *   origin: {
 *     database: "postgres",
 *     host: "database.example.com",
 *     password: alchemy.secret(process.env.DB_PASSWORD),
 *     port: 5432,
 *     user: "postgres"
 *   },
 *   caching: {
 *     disabled: true
 *   }
 * });
 *
 * @example
 * // Create a Hyperdrive with mTLS configuration
 * const mtlsHyperdrive = await Hyperdrive("secure-db", {
 *   name: "secure-db",
 *   origin: {
 *     database: "postgres",
 *     host: "database.example.com",
 *     password: alchemy.secret(process.env.DB_PASSWORD),
 *     port: 5432,
 *     user: "postgres"
 *   },
 *   mtls: {
 *     ca_certificate_id: "00000000-0000-0000-0000-0000000000",
 *     mtls_certificate_id: "00000000-0000-0000-0000-0000000000",
 *     sslmode: "verify-full"
 *   }
 * });
 *
 * @example
 * // Create a Hyperdrive with access client credentials
 * const accessHyperdrive = await Hyperdrive("access-db", {
 *   name: "access-db",
 *   origin: {
 *     database: "postgres",
 *     host: "database.example.com",
 *     access_client_id: "client-id",
 *     access_client_secret: alchemy.secret(process.env.ACCESS_CLIENT_SECRET),
 *     port: 5432,
 *     user: "postgres"
 *   }
 * });
 */
export declare function Hyperdrive(id: string, props: HyperdriveProps): Promise<Hyperdrive>;
/**
 * Converts a HyperdriveOriginInput to a HyperdriveOrigin.
 * This includes:
 * - parsing the origin from a string
 * - ensuring the scheme is "postgres" or "mysql"
 * - normalizing the port to a number with default values
 * - wrapping secrets in a Secret object
 * @internal - Exported for testing
 */
export declare const normalizeHyperdriveOrigin: (input: HyperdriveOriginInput) => Required<HyperdrivePublicOrigin> | Required<HyperdriveOriginWithAccess>;
//# sourceMappingURL=hyperdrive.d.ts.map