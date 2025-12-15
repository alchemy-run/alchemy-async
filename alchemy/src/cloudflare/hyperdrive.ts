import { alchemy } from "../alchemy.ts";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { Scope } from "../scope.ts";
import { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  extractCloudflareResult,
  type CloudflareApiErrorPayload,
} from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";

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
export type HyperdriveCaching =
  | HyperdriveCachingEnabled
  | HyperdriveCachingDisabled;

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

export type HyperdriveOriginInput =
  | string
  | Secret
  | HyperdrivePublicOrigin
  | HyperdriveOriginWithAccess;

export type HyperdriveOrigin =
  | HyperdrivePublicOrigin
  | HyperdriveOriginWithAccess;

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
export async function Hyperdrive(
  id: string,
  props: HyperdriveProps,
): Promise<Hyperdrive> {
  const origin = normalizeHyperdriveOrigin(props.origin);
  const dev = {
    origin: toConnectionString(
      normalizeHyperdriveOrigin(props.dev?.origin ?? origin),
    ),
    force: Scope.current.local,
  };
  return await _Hyperdrive(id, {
    ...props,
    origin,
    dev,
  });
}

/**
 * Internal properties for creating or updating a Cloudflare Hyperdrive config.
 * @internal
 */
interface InternalHyperdriveProps extends CloudflareApiOptions {
  name?: string;
  hyperdriveId?: string;
  origin: HyperdriveOrigin;
  caching?: HyperdriveCaching;
  mtls?: HyperdriveMtls;
  dev: {
    origin: Secret;
    force?: boolean;
  };
  adopt?: boolean;
}

const _Hyperdrive = Resource(
  "cloudflare::Hyperdrive",
  async function (
    this: Context<Hyperdrive>,
    id: string,
    props: InternalHyperdriveProps,
  ): Promise<Hyperdrive> {
    const hyperdriveId = props.hyperdriveId || this.output?.hyperdriveId;
    const adopt = props.adopt || this.scope.adopt;
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      return {
        id,
        hyperdriveId: hyperdriveId || "",
        name,
        origin: props.origin,
        caching: props.caching,
        mtls: props.mtls,
        dev: props.dev,
        type: "hyperdrive",
      };
    }
    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      if (!hyperdriveId) {
        logger.warn(`No hyperdriveId found for ${id}, skipping delete`);
        return this.destroy();
      }

      try {
        const deleteResponse = await api.delete(
          `/accounts/${api.accountId}/hyperdrive/configs/${hyperdriveId}`,
        );
        // Only swallow 404 Not Found errors, all other errors should be handled
        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          await handleApiError(deleteResponse, "delete", "hyperdrive", id);
        }
      } catch (error) {
        logger.error(`Error deleting Hyperdrive ${id}:`, error);
        throw error;
      }
      return this.destroy();
    }

    // Prepare request body with unwrapped secrets
    const requestBody = prepareRequestBody({ ...props, name });
    let result: HyperdriveResponse;

    if (hyperdriveId) {
      result = await extractCloudflareResult<HyperdriveResponse>(
        `update hyperdrive config "${hyperdriveId}"`,
        api.put(
          `/accounts/${api.accountId}/hyperdrive/configs/${hyperdriveId}`,
          requestBody,
        ),
      );
    } else {
      try {
        result = await extractCloudflareResult<HyperdriveResponse>(
          `create hyperdrive config "${name}"`,
          api.post(
            `/accounts/${api.accountId}/hyperdrive/configs`,
            requestBody,
          ),
        );
      } catch (error) {
        if (
          error instanceof CloudflareApiError &&
          (error.errorData as CloudflareApiErrorPayload[]).some(
            (e) => e.code === 2017, // 2017 is the error code for name conflict
          )
        ) {
          if (!adopt) {
            throw new Error(
              `Hyperdrive config "${name}" already exists. Use adopt: true to adopt it.`,
              { cause: error },
            );
          }
          const existing = await findHyperdriveConfigByName(api, name);
          if (!existing) {
            throw new Error(
              `Hyperdrive config "${name}" failed to create due to name conflict and could not be found for adoption.`,
              { cause: error },
            );
          }
          result = await extractCloudflareResult<HyperdriveResponse>(
            `adopt hyperdrive config "${name}"`,
            api.put(
              `/accounts/${api.accountId}/hyperdrive/configs/${existing.id}`,
              requestBody,
            ),
          );
        } else {
          throw error;
        }
      }
    }

    // Construct the output object from API response and props
    return {
      id,
      hyperdriveId: result.id, // Store the Cloudflare-assigned UUID
      name: result.name,
      origin: props.origin,
      caching: result.caching,
      mtls: result.mtls,
      dev: props.dev,
      type: "hyperdrive",
    };
  },
);

interface HyperdriveResponse {
  id: string;
  name: string;
  origin: HyperdriveOrigin;
  caching?: HyperdriveCaching;
  created_on?: string;
  modified_on?: string;
  mtls?: HyperdriveMtls;
  origin_connection_limit?: number;
}

async function findHyperdriveConfigByName(
  api: CloudflareApi,
  name: string,
  page = 1,
) {
  const response = await api.get(
    `/accounts/${api.accountId}/hyperdrive/configs?page=${page}`,
  );
  const data: {
    result: HyperdriveResponse[];
    result_info?: { total_pages?: number };
  } = await response.json();
  const found = data.result.find((config) => config.name === name);
  if (found) {
    return found;
  }
  if (data.result_info?.total_pages && page < data.result_info.total_pages) {
    return await findHyperdriveConfigByName(api, name, page + 1);
  }
  return null;
}

/**
 * Prepare the request body by unwrapping secret values
 */
function prepareRequestBody(props: InternalHyperdriveProps): any {
  const requestBody: any = { ...props };

  // Remove internal props
  delete requestBody.hyperdriveId;

  // Deep clone and unwrap secrets in the origin object
  if ("password" in props.origin) {
    // Regular origin with password
    requestBody.origin = {
      ...props.origin,
      password: Secret.unwrap(props.origin.password),
      scheme: props.origin.scheme ?? "postgres",
    };
  } else if ("access_client_secret" in props.origin) {
    // Origin with access client secret
    requestBody.origin = {
      ...props.origin,
      access_client_secret: Secret.unwrap(props.origin.access_client_secret),
    };
  }

  return requestBody;
}

/**
 * Converts a HyperdriveOriginInput to a HyperdriveOrigin.
 * This includes:
 * - parsing the origin from a string
 * - ensuring the scheme is "postgres" or "mysql"
 * - normalizing the port to a number with default values
 * - wrapping secrets in a Secret object
 * @internal - Exported for testing
 */
export const normalizeHyperdriveOrigin = (
  input: HyperdriveOriginInput,
): Required<HyperdrivePublicOrigin> | Required<HyperdriveOriginWithAccess> => {
  const origin = Secret.unwrap(input);
  if (typeof origin === "string") {
    const url = new URL(origin);
    const scheme = normalizeScheme(url.protocol.slice(0, -1));
    return {
      scheme,
      user: url.username,
      password: alchemy.secret(url.password),
      host: url.hostname,
      port: normalizePort(scheme, url.port),
      database: url.pathname.slice(1),
    };
  }
  const scheme = normalizeScheme(origin.scheme);
  return {
    ...origin,
    ...("password" in origin && {
      password: Secret.wrap(origin.password),
    }),
    ...("access_client_secret" in origin && {
      access_client_secret: Secret.wrap(origin.access_client_secret),
    }),
    scheme,
    port: normalizePort(scheme, origin.port),
  };
};

const normalizeScheme = (scheme: string | undefined) => {
  if (!scheme || scheme === "postgres" || scheme === "postgresql") {
    return "postgres";
  }
  if (scheme === "mysql" || scheme === "mysql2") {
    return "mysql";
  }
  throw new Error(
    `Unsupported database connection scheme "${scheme}" for Hyperdrive (expected "postgres" or "mysql")`,
  );
};

const normalizePort = (
  scheme: "postgres" | "mysql",
  port: string | number | undefined,
) => {
  if (typeof port === "number") {
    return port;
  }
  if (port) {
    return Number.parseInt(port, 10);
  }
  return scheme === "postgres" ? 5432 : 3306;
};

const toConnectionString = (
  origin:
    | Required<HyperdrivePublicOrigin>
    | Required<HyperdriveOriginWithAccess>,
) => {
  const password = Secret.unwrap(
    "password" in origin ? origin.password : origin.access_client_secret,
  );
  return new Secret(
    `${origin.scheme}://${origin.user}:${password}@${origin.host}:${origin.port}/${origin.database}`,
  );
};
