import { alchemy } from "../alchemy.ts";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { createPlanetScaleClient, type PlanetScaleProps } from "./api.ts";
import type { Branch } from "./branch.ts";
import type { Database } from "./database.ts";
import type { Role } from "./role.ts";
import { waitForBranchReady } from "./utils.ts";

export interface DefaultRoleProps extends PlanetScaleProps {
  /**
   * The organization where the role will be created
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
   * Whether to force reset the default role if it already exists.
   * This will delete the existing role and create a new one.
   *
   * Note: Adopting an existing role is not supported because the password is only returned after create.
   *
   * @default false
   */
  forceReset?: boolean;
}

export type DefaultRole = Omit<Role, "successor">;

/**
 * Create and manage the default role for a PlanetScale PostgreSQL database branch.
 *
 * If a default role already exists for this database and branch combination, you may need to use the `forceReset` property to reset the role.
 *
 * For MySQL, use [Passwords](./password.ts) instead.
 *
 * @example
 * const database = await Database("my-database", {
 *   kind: "postgresql",
 * });
 * const defaultRole = await DefaultRole("my-default-role", {
 *   database,
 * });
 */
export const DefaultRole = Resource(
  "planetscale::DefaultRole",
  async function (
    this: Context<DefaultRole, DefaultRoleProps>,
    _id: string,
    props: DefaultRoleProps,
  ): Promise<DefaultRole> {
    const api = createPlanetScaleClient(props);
    const organization =
      props.organization ??
      (typeof props.database !== "string"
        ? props.database.organization
        : (process.env.PLANETSCALE_ORGANIZATION ??
          process.env.PLANETSCALE_ORG_ID));
    if (!organization) {
      throw new Error(
        "PlanetScale organization is required. Please set the `organization` property or the `PLANETSCALE_ORGANIZATION` environment variable.",
      );
    }

    const database =
      typeof props.database === "string" ? props.database : props.database.name;
    const branch =
      typeof props.branch === "string"
        ? props.branch
        : (props.branch?.name ?? "main");

    switch (this.phase) {
      case "create": {
        if (!props.forceReset) {
          const existing = await api.getDefaultRole({
            path: {
              organization,
              database,
              branch,
            },
            throwOnError: false,
          });
          if (existing.data) {
            throw new Error(
              `Default role already exists for database "${database}" branch "${branch}". Use forceReset to reset the role.`,
            );
          } else if (existing.error && existing.response.status !== 404) {
            throw new Error(
              `Failed to check for default role in database "${database}" branch "${branch}".`,
              {
                cause: existing.error,
              },
            );
          }
        }
        await waitForBranchReady(api, organization, database, branch);
        const { data } = await api.resetDefaultRole({
          path: {
            organization,
            database,
            branch,
          },
        });
        return {
          id: data.id,
          name: data.name,
          expiresAt: data.expires_at,
          host: data.access_host_url,
          username: data.username,
          ttl: data.ttl,
          password: alchemy.secret(data.password),
          databaseName: data.database_name,
          connectionUrl: alchemy.secret(
            `postgresql://${data.username}:${data.password}@${data.access_host_url}:5432/${data.database_name}?sslmode=verify-full`,
          ),
          connectionUrlPooled: alchemy.secret(
            `postgresql://${data.username}:${data.password}@${data.access_host_url}:6432/${data.database_name}?sslmode=verify-full`,
          ),
          inheritedRoles: data.inherited_roles,
          database,
          branch,
          organization,
        };
      }
      case "update": {
        if (
          database !== this.output.database ||
          branch !== this.output.branch
        ) {
          return this.replace();
        }
        return this.output;
      }
      case "delete": {
        // reset default role - even though we don't need new credentials,
        // it's best to invalidate existing ones, and there's no delete endpoint
        await api.resetDefaultRole({
          path: {
            organization,
            database,
            branch,
          },
        });
        return this.destroy();
      }
    }
  },
);
