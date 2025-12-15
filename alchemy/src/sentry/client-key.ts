import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { SentryApi } from "./api.ts";

/**
 * Properties for creating or updating a ClientKey
 */
export interface ClientKeyProps {
  /**
   * The name of the key
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Rate limit configuration
   */
  rateLimit?: {
    /**
     * Time window in seconds
     */
    window: number;

    /**
     * Maximum number of events allowed in the window
     */
    count: number;
  };

  /**
   * The use case for the key
   */
  useCase?: "user" | "profiling" | "escalating_issues" | "tempest" | "demo";

  /**
   * The project slug that owns the key
   */
  project: string;

  /**
   * The organization ID or slug that owns the key
   */
  organization: string;

  /**
   * Auth token to use (overrides environment variable)
   */
  authToken?: Secret;

  /**
   * Whether to adopt an existing key with the same name if it exists
   * If true and a key with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;
}

/**
 * Output returned after ClientKey creation/update
 */
export interface ClientKey extends ClientKeyProps {
  /**
   * The ID of the key
   */
  id: string;

  /**
   * Name of the Client Key.
   */
  name: string;

  /**
   * The label of the key
   */
  label: string;

  /**
   * The public key
   */
  public: string;

  /**
   * The secret key
   */
  secret: string;

  /**
   * The project ID
   */
  projectId: number;

  /**
   * Whether the key is active
   */
  isActive: boolean;

  /**
   * DSN configuration
   */
  dsn: {
    secret: string;
    public: string;
    csp: string;
    security: string;
    minidump: string;
    nel: string;
    unreal: string;
    cdn: string;
    crons: string;
  };

  /**
   * Browser SDK version
   */
  browserSdkVersion: string;

  /**
   * Browser SDK choices
   */
  browserSdk: {
    choices: Array<[string, string]>;
  };

  /**
   * Time at which the key was created
   */
  dateCreated: string;

  /**
   * Dynamic SDK loader options
   */
  dynamicSdkLoaderOptions: {
    hasReplay: boolean;
    hasPerformance: boolean;
    hasDebug: boolean;
  };
}

/**
 * Create and manage Sentry client keys
 *
 * @example
 * // Create a basic Sentry client key:
 * const key = await ClientKey("my-key", {
 *   name: "My Key",
 *   project: "my-project",
 *   organization: "my-org"
 * });
 *
 * @example
 * // Create a client key with rate limiting:
 * const key = await ClientKey("rate-limited-key", {
 *   name: "Rate Limited Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   rateLimit: {
 *     window: 3600, // 1 hour
 *     count: 1000   // 1000 events per hour
 *   }
 * });
 *
 * @example
 * // Create a client key for a specific use case:
 * const key = await ClientKey("profiling-key", {
 *   name: "Profiling Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   useCase: "profiling"
 * });
 *
 * @example
 * // Create or adopt an existing key with the same name:
 * const key = await ClientKey("existing-key", {
 *   name: "Existing Key",
 *   project: "my-project",
 *   organization: "my-org",
 *   adopt: true
 * });
 */
export const ClientKey = Resource(
  "sentry::ClientKey",
  async function (
    this: Context<ClientKey>,
    id: string,
    props: ClientKeyProps,
  ): Promise<ClientKey> {
    const api = new SentryApi({ authToken: props.authToken });

    // it's possible that `this.output.name` is undefined because a previous version
    // of alchemy had a bug where it didn't set the name on the output
    // so, we try to find the key by ID and use the name from the API response
    const lookupName = async () => {
      if (!this.output?.id) {
        // not running in the update phase
        return undefined;
      } else if (this.output.name) {
        return this.output.name;
      }
      const name = (
        await getClientKeyName(api, {
          organization: props.organization,
          project: props.project,
          keyId: this.output.id,
        })
      )?.name;

      if (name) {
        this.output.name = name;
      }

      return name;
    };

    const clientKeyName =
      props.name ?? (await lookupName()) ?? this.scope.createPhysicalName(id);

    if (this.phase === "update") {
      if (this.output.name !== clientKeyName) {
        this.replace();
      }
    }

    if (this.phase === "delete") {
      try {
        if (this.output?.id) {
          const response = await api.delete(
            `/projects/${props.organization}/${props.project}/keys/${this.output.id}/`,
          );
          if (!response.ok && response.status !== 404) {
            logger.error("Error deleting client key:", response.statusText);
          }
        }
      } catch (error) {
        logger.error("Error deleting client key:", error);
      }
      return this.destroy();
    } else {
      try {
        let response;

        if (this.phase === "update" && this.output?.id) {
          response = await api.put(
            `/projects/${props.organization}/${props.project}/keys/${this.output.id}/`,
            props,
          );
        } else {
          try {
            response = await api.post(
              `/projects/${props.organization}/${props.project}/keys/`,
              props,
            );
          } catch (error) {
            // Check if this is a "key already exists" error and adopt is enabled
            if (
              (props.adopt ?? this.scope.adopt) &&
              error instanceof Error &&
              error.message.includes("already exists") &&
              clientKeyName
            ) {
              logger.log(
                `Client key '${clientKeyName}' already exists, adopting it`,
              );
              // Find the existing key by name
              const existingKey = await findClientKeyByName(
                api,
                props.organization,
                props.project,
                clientKeyName,
              );
              if (!existingKey) {
                throw new Error(
                  `Failed to find existing client key '${clientKeyName}' for adoption`,
                );
              }
              response = await api.get(
                `/projects/${props.organization}/${props.project}/keys/${existingKey.id}/`,
              );
            } else {
              throw error;
            }
          }
        }

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = (await response.json()) as Omit<
          ClientKey,
          keyof ClientKeyProps
        >;
        return {
          ...props,
          id: data.id,
          name: clientKeyName,
          label: data.label,
          public: data.public,
          secret: data.secret,
          projectId: data.projectId,
          isActive: data.isActive,
          dsn: data.dsn,
          browserSdkVersion: data.browserSdkVersion,
          browserSdk: data.browserSdk,
          dateCreated: data.dateCreated,
          dynamicSdkLoaderOptions: data.dynamicSdkLoaderOptions,
        };
      } catch (error) {
        logger.error("Error creating/updating client key:", error);
        throw error;
      }
    }
  },
);

/**
 * Find a client key by name
 */
async function findClientKeyByName(
  api: SentryApi,
  organization: string,
  project: string,
  name: string,
): Promise<{ id: string } | null> {
  const response = await api.get(`/projects/${organization}/${project}/keys/`);
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const keys = (await response.json()) as Array<{ id: string; name: string }>;
  const key = keys.find((k) => k.name === name);
  return key ? { id: key.id } : null;
}

/**
 * Find a client key by ID
 */
async function getClientKeyName(
  api: SentryApi,
  { organization, project, keyId }: {
    organization: string;
    project: string;
    keyId: string;
  },
): Promise<{ id: string; name: string } | null> {
  const response = await api.get(
    `/projects/${organization}/${project}/keys/${keyId}`,
  );
  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const key = (await response.json()) as { id: string; name: string };
  return key ? { id: key.id, name: key.name } : null;
}
