import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Secret } from "../secret.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isProject, type Project } from "./project.ts";

/**
 * Railway database template IDs
 * @internal
 */
const DATABASE_TEMPLATES = {
  postgres: "postgres",
  mysql: "mysql",
  redis: "redis",
  mongodb: "mongo",
} as const;

/**
 * Base properties for creating a Railway database
 */
interface BaseDatabaseProps extends RailwayApiOptions {
  /**
   * The project to create the database in
   */
  project: string | Project;

  /**
   * The environment to create the database in (optional)
   */
  environment?: string | Environment;

  /**
   * Name of the database service
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Whether to delete the database when the resource is destroyed.
   * Note: Deleting a database will permanently delete all data.
   * @default true
   */
  delete?: boolean;
}

/**
 * Properties for creating a Railway PostgreSQL database
 */
export interface PostgresDatabaseProps extends BaseDatabaseProps {}

/**
 * Properties for creating a Railway MySQL database
 */
export interface MysqlDatabaseProps extends BaseDatabaseProps {}

/**
 * Properties for creating a Railway Redis database
 */
export interface RedisDatabaseProps extends BaseDatabaseProps {}

/**
 * Properties for creating a Railway MongoDB database
 */
export interface MongoDatabaseProps extends BaseDatabaseProps {}

/**
 * Base output for Railway database
 */
interface BaseDatabase {
  /**
   * The ID of the database service
   */
  id: string;

  /**
   * Name of the database service
   */
  name: string;

  /**
   * The project ID this database belongs to
   */
  projectId: string;

  /**
   * Time at which the database was created
   */
  createdAt: string;
}

/**
 * Output returned after Railway PostgreSQL database creation
 */
export interface PostgresDatabase extends BaseDatabase {
  /**
   * PostgreSQL connection URL
   */
  connectionUrl: Secret;

  /**
   * Database host
   */
  host: string;

  /**
   * Database port
   */
  port: number;

  /**
   * Database name
   */
  database: string;

  /**
   * Database user
   */
  user: string;

  /**
   * Database password
   */
  password: Secret;

  /**
   * Database type identifier
   */
  type: "postgres";
}

/**
 * Output returned after Railway MySQL database creation
 */
export interface MysqlDatabase extends BaseDatabase {
  /**
   * MySQL connection URL
   */
  connectionUrl: Secret;

  /**
   * Database host
   */
  host: string;

  /**
   * Database port
   */
  port: number;

  /**
   * Database name
   */
  database: string;

  /**
   * Database user
   */
  user: string;

  /**
   * Database password
   */
  password: Secret;

  /**
   * Database type identifier
   */
  type: "mysql";
}

/**
 * Output returned after Railway Redis database creation
 */
export interface RedisDatabase extends BaseDatabase {
  /**
   * Redis connection URL
   */
  connectionUrl: Secret;

  /**
   * Redis host
   */
  host: string;

  /**
   * Redis port
   */
  port: number;

  /**
   * Redis password
   */
  password: Secret;

  /**
   * Database type identifier
   */
  type: "redis";
}

/**
 * Output returned after Railway MongoDB database creation
 */
export interface MongoDatabase extends BaseDatabase {
  /**
   * MongoDB connection URL
   */
  connectionUrl: Secret;

  /**
   * Database type identifier
   */
  type: "mongodb";
}

/**
 * GraphQL response types
 * @internal
 */
interface TemplateDeployResponse {
  templateDeploy: {
    projectId: string;
    workflowId: string;
  };
}

interface ServiceCreateResponse {
  serviceCreate: {
    id: string;
    name: string;
    projectId: string;
    createdAt: string;
    updatedAt: string;
  };
}

interface VariablesQueryResponse {
  variables: Record<string, string>;
}

interface ServicesQueryResponse {
  project: {
    services: {
      edges: Array<{
        node: {
          id: string;
          name: string;
          projectId: string;
          createdAt: string;
          updatedAt: string;
        };
      }>;
    };
  };
}

/**
 * Type guards for Railway databases
 */
export function isPostgresDatabase(
  resource: any,
): resource is PostgresDatabase {
  return resource?.[ResourceKind] === "railway::PostgresDatabase";
}

export function isMysqlDatabase(resource: any): resource is MysqlDatabase {
  return resource?.[ResourceKind] === "railway::MysqlDatabase";
}

export function isRedisDatabase(resource: any): resource is RedisDatabase {
  return resource?.[ResourceKind] === "railway::RedisDatabase";
}

export function isMongoDatabase(resource: any): resource is MongoDatabase {
  return resource?.[ResourceKind] === "railway::MongoDatabase";
}

/**
 * Get the project ID from a project reference
 */
function getProjectId(project: string | Project): string {
  if (isProject(project)) {
    return project.id;
  }
  return project;
}

/**
 * Get the environment ID from an environment reference
 */
function getEnvironmentId(
  environment: string | Environment | undefined,
): string | undefined {
  if (environment === undefined) {
    return undefined;
  }
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Helper to fetch variables for a service
 */
async function fetchServiceVariables(
  api: ReturnType<typeof createRailwayApi>,
  projectId: string,
  serviceId: string,
  environmentId?: string,
): Promise<Record<string, string>> {
  // Get the first environment if not specified
  let envId = environmentId;
  if (!envId) {
    const projectData = await api.request<{
      project: {
        environments: {
          edges: Array<{ node: { id: string; name: string } }>;
        };
      };
    }>(
      `
      query project($id: String!) {
        project(id: $id) {
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `,
      { id: projectId },
    );

    const firstEnv = projectData.project.environments.edges[0];
    if (firstEnv) {
      envId = firstEnv.node.id;
    }
  }

  if (!envId) {
    return {};
  }

  const data = await api.request<VariablesQueryResponse>(
    `
    query variables($projectId: String!, $environmentId: String!, $serviceId: String) {
      variables(projectId: $projectId, environmentId: $environmentId, serviceId: $serviceId)
    }
  `,
    {
      projectId,
      environmentId: envId,
      serviceId,
    },
  );

  return data.variables;
}

/**
 * Helper to delete a database service
 */
async function deleteDatabase(
  api: ReturnType<typeof createRailwayApi>,
  serviceId: string,
): Promise<void> {
  try {
    await api.request(
      `
      mutation serviceDelete($id: String!) {
        serviceDelete(id: $id)
      }
    `,
      { id: serviceId },
    );
  } catch (error) {
    // Ignore 404 errors (service already deleted)
    if (error instanceof RailwayError && error.code === "NOT_FOUND") {
      // Already deleted, that's fine
    } else {
      throw error;
    }
  }
}

/**
 * Creates a Railway PostgreSQL database.
 *
 * @example
 * // Create a PostgreSQL database:
 * const db = await PostgresDatabase("db", {
 *   project: project,
 *   name: "my-postgres"
 * });
 *
 * // Use the connection URL in another service:
 * await Variable("db-url", {
 *   project,
 *   environment: production,
 *   service: apiService,
 *   name: "DATABASE_URL",
 *   value: db.connectionUrl
 * });
 */
export const PostgresDatabase = Resource(
  "railway::PostgresDatabase",
  async function (
    this: Context<PostgresDatabase>,
    id: string,
    props: PostgresDatabaseProps,
  ): Promise<PostgresDatabase> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        await deleteDatabase(api, this.output.id);
      }
      return this.destroy();
    }

    // For updates, we can only update the name - other properties require replacement
    if (this.phase === "update" && this.output?.id) {
      // Just return the current state - name updates would require service update
      return this.output;
    }

    // Create database service using Docker image
    const data = await api.request<ServiceCreateResponse>(
      `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          projectId
          createdAt
          updatedAt
        }
      }
    `,
      {
        input: {
          name,
          projectId,
          source: {
            image: "postgres:16",
          },
        },
      },
    );

    // Wait a moment for variables to be populated
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fetch variables to get connection info
    const variables = await fetchServiceVariables(
      api,
      projectId,
      data.serviceCreate.id,
      environmentId,
    );

    const connectionUrl =
      variables.DATABASE_URL || variables.POSTGRES_URL || "";
    const host = variables.PGHOST || variables.POSTGRES_HOST || "localhost";
    const port = parseInt(
      variables.PGPORT || variables.POSTGRES_PORT || "5432",
      10,
    );
    const database =
      variables.PGDATABASE || variables.POSTGRES_DB || "postgres";
    const user = variables.PGUSER || variables.POSTGRES_USER || "postgres";
    const password = variables.PGPASSWORD || variables.POSTGRES_PASSWORD || "";

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
      createdAt: data.serviceCreate.createdAt,
      connectionUrl: Secret.wrap(connectionUrl),
      host,
      port,
      database,
      user,
      password: Secret.wrap(password),
      type: "postgres",
    };
  },
);

/**
 * Creates a Railway MySQL database.
 *
 * @example
 * // Create a MySQL database:
 * const db = await MysqlDatabase("db", {
 *   project: project,
 *   name: "my-mysql"
 * });
 */
export const MysqlDatabase = Resource(
  "railway::MysqlDatabase",
  async function (
    this: Context<MysqlDatabase>,
    id: string,
    props: MysqlDatabaseProps,
  ): Promise<MysqlDatabase> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        await deleteDatabase(api, this.output.id);
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.id) {
      return this.output;
    }

    // Create database service using Docker image
    const data = await api.request<ServiceCreateResponse>(
      `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          projectId
          createdAt
          updatedAt
        }
      }
    `,
      {
        input: {
          name,
          projectId,
          source: {
            image: "mysql:8",
          },
        },
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const variables = await fetchServiceVariables(
      api,
      projectId,
      data.serviceCreate.id,
      environmentId,
    );

    const connectionUrl = variables.DATABASE_URL || variables.MYSQL_URL || "";
    const host = variables.MYSQL_HOST || variables.MYSQLHOST || "localhost";
    const port = parseInt(
      variables.MYSQL_PORT || variables.MYSQLPORT || "3306",
      10,
    );
    const database =
      variables.MYSQL_DATABASE || variables.MYSQLDATABASE || "mysql";
    const user = variables.MYSQL_USER || variables.MYSQLUSER || "root";
    const password = variables.MYSQL_PASSWORD || variables.MYSQLPASSWORD || "";

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
      createdAt: data.serviceCreate.createdAt,
      connectionUrl: Secret.wrap(connectionUrl),
      host,
      port,
      database,
      user,
      password: Secret.wrap(password),
      type: "mysql",
    };
  },
);

/**
 * Creates a Railway Redis database.
 *
 * @example
 * // Create a Redis database:
 * const redis = await RedisDatabase("cache", {
 *   project: project,
 *   name: "my-redis"
 * });
 */
export const RedisDatabase = Resource(
  "railway::RedisDatabase",
  async function (
    this: Context<RedisDatabase>,
    id: string,
    props: RedisDatabaseProps,
  ): Promise<RedisDatabase> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        await deleteDatabase(api, this.output.id);
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.id) {
      return this.output;
    }

    // Create database service using Docker image
    const data = await api.request<ServiceCreateResponse>(
      `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          projectId
          createdAt
          updatedAt
        }
      }
    `,
      {
        input: {
          name,
          projectId,
          source: {
            image: "redis:7",
          },
        },
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const variables = await fetchServiceVariables(
      api,
      projectId,
      data.serviceCreate.id,
      environmentId,
    );

    const connectionUrl = variables.REDIS_URL || "";
    const host = variables.REDIS_HOST || variables.REDISHOST || "localhost";
    const port = parseInt(
      variables.REDIS_PORT || variables.REDISPORT || "6379",
      10,
    );
    const password = variables.REDIS_PASSWORD || variables.REDISPASSWORD || "";

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
      createdAt: data.serviceCreate.createdAt,
      connectionUrl: Secret.wrap(connectionUrl),
      host,
      port,
      password: Secret.wrap(password),
      type: "redis",
    };
  },
);

/**
 * Creates a Railway MongoDB database.
 *
 * @example
 * // Create a MongoDB database:
 * const mongo = await MongoDatabase("db", {
 *   project: project,
 *   name: "my-mongo"
 * });
 */
export const MongoDatabase = Resource(
  "railway::MongoDatabase",
  async function (
    this: Context<MongoDatabase>,
    id: string,
    props: MongoDatabaseProps,
  ): Promise<MongoDatabase> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        await deleteDatabase(api, this.output.id);
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output?.id) {
      return this.output;
    }

    // Create database service using Docker image
    const data = await api.request<ServiceCreateResponse>(
      `
      mutation serviceCreate($input: ServiceCreateInput!) {
        serviceCreate(input: $input) {
          id
          name
          projectId
          createdAt
          updatedAt
        }
      }
    `,
      {
        input: {
          name,
          projectId,
          source: {
            image: "mongo:7",
          },
        },
      },
    );

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const variables = await fetchServiceVariables(
      api,
      projectId,
      data.serviceCreate.id,
      environmentId,
    );

    const connectionUrl = variables.MONGO_URL || variables.MONGODB_URL || "";

    return {
      id: data.serviceCreate.id,
      name: data.serviceCreate.name,
      projectId: data.serviceCreate.projectId,
      createdAt: data.serviceCreate.createdAt,
      connectionUrl: Secret.wrap(connectionUrl),
      type: "mongodb",
    };
  },
);
