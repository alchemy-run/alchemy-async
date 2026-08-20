import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Secret } from "../secret.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Environment } from "./environment.ts";
import type { Project } from "./project.ts";
import type { Service } from "./service.ts";

/**
 * Properties for creating or updating Railway Variables
 */
export interface VariableProps extends RailwayApiOptions {
  /**
   * The project the variables belong to
   */
  project: string | Project;

  /**
   * The environment the variables belong to
   */
  environment: string | Environment;

  /**
   * The service the variables are scoped to (optional, for shared variables omit this)
   */
  service?: string | Service;

  /**
   * The variables to set as key-value pairs.
   * Values can be strings or Secrets for sensitive data.
   */
  variables: Record<string, string | Secret>;
}

/**
 * Output type for Railway Variables
 */
export type Variable = Omit<
  VariableProps,
  "project" | "environment" | "service" | "variables"
> & {
  /**
   * The project ID
   */
  projectId: string;

  /**
   * The environment ID
   */
  environmentId: string;

  /**
   * The service ID (if scoped to a service)
   */
  serviceId?: string;

  /**
   * The variable keys that were set
   */
  keys: string[];
};

/**
 * Type guard for Railway Variable
 */
export function isVariable(resource: any): resource is Variable {
  return resource?.[ResourceKind] === "railway::Variable";
}

/**
 * Creates and manages Railway environment variables.
 *
 * @example
 * ## Set variables on a service
 *
 * Set environment variables for a specific service.
 *
 * ```ts
 * const vars = await Variable("api-vars", {
 *   project,
 *   environment: project.defaultEnvironmentId,
 *   service,
 *   variables: {
 *     NODE_ENV: "production",
 *     PORT: "3000",
 *     DATABASE_URL: alchemy.secret.env.DATABASE_URL,
 *   },
 * });
 * ```
 *
 * @example
 * ## Set shared project variables
 *
 * Set variables shared across all services in an environment.
 *
 * ```ts
 * const vars = await Variable("shared-vars", {
 *   project: "project-id",
 *   environment: "environment-id",
 *   variables: {
 *     APP_NAME: "My App",
 *   },
 * });
 * ```
 */
export const Variable = Resource(
  "railway::Variable",
  async function (
    this: Context<Variable>,
    id: string,
    props: VariableProps,
  ): Promise<Variable> {
    const projectId =
      typeof props.project === "string"
        ? props.project
        : props.project.projectId;
    const environmentId =
      typeof props.environment === "string"
        ? props.environment
        : props.environment.environmentId;
    const serviceId = props.service
      ? typeof props.service === "string"
        ? props.service
        : props.service.serviceId
      : undefined;

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        projectId,
        environmentId,
        serviceId,
        keys: Object.keys(props.variables),
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      // Delete all tracked keys
      const keys = this.output?.keys ?? [];
      await Promise.all(
        keys.map((key) =>
          runRailwayDeleteMutation(() =>
            api.query(
              `mutation variableDelete($input: VariableDeleteInput!) {
                variableDelete(input: $input)
              }`,
              {
                input: {
                  projectId,
                  environmentId,
                  serviceId,
                  name: key,
                },
              },
            ),
          ),
        ),
      );
      return this.destroy();
    }

    // Build the variables object with unwrapped secrets
    const variables: Record<string, string> = {};
    for (const [key, value] of Object.entries(props.variables)) {
      variables[key] = Secret.unwrap(value) as string;
    }

    // Detect removed keys on update
    if (this.output?.keys) {
      const newKeys = new Set(Object.keys(props.variables));
      const removedKeys = this.output.keys.filter((k) => !newKeys.has(k));
      await Promise.all(
        removedKeys.map((key) =>
          runRailwayDeleteMutation(() =>
            api.query(
              `mutation variableDelete($input: VariableDeleteInput!) {
                variableDelete(input: $input)
              }`,
              {
                input: {
                  projectId,
                  environmentId,
                  serviceId,
                  name: key,
                },
              },
            ),
          ),
        ),
      );
    }

    // Upsert all variables
    await api.query(
      `mutation variableCollectionUpsert($input: VariableCollectionUpsertInput!) {
        variableCollectionUpsert(input: $input)
      }`,
      {
        input: {
          projectId,
          environmentId,
          serviceId,
          variables,
        },
      },
    );

    return {
      projectId,
      environmentId,
      serviceId,
      keys: Object.keys(props.variables),
    };
  },
);
