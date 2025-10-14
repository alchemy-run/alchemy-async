import type { Context } from "../../context.ts";
import { Resource } from "../../resource.ts";
import type { PrismaWorkspace, PrismaPostgresAuthProps } from "./types.ts";
import { PrismaPostgresApi } from "./api.ts";

/**
 * Properties for looking up a Prisma Postgres workspace
 */
export interface WorkspaceProps extends PrismaPostgresAuthProps {
  /**
   * Workspace identifier (e.g. `wksp_cmg94yrap00a9xgfncx1mwt34`)
   */
  id?: string;

  /**
   * Workspace name to resolve
   */
  name?: string;
}

/**
 * Prisma Postgres workspace representation
 */
export interface Workspace extends PrismaWorkspace {}

/**
 * Resolve metadata for an existing Prisma Postgres workspace
 *
 * @example
 * // Lookup by workspace id
 * const workspace = await Workspace("workspace", {
 *   id: "wksp_abc123",
 * });
 *
 * @example
 * // Lookup by workspace name
 * const workspace = await Workspace("workspace", {
 *   name: "Production",
 * });
 *
 * @example
 * // Provide a dedicated service token
 * const workspace = await Workspace("workspace", {
 *   id: "wksp_abc123",
 *   serviceToken: alchemy.secret(process.env.PRISMA_SERVICE_TOKEN),
 * });
 */
export const Workspace = Resource(
  "prisma-postgres::Workspace",
  async function (this: Context<Workspace>, _id, props: WorkspaceProps) {
    if (this.phase === "delete") {
      return this.destroy();
    }

    if (!props.id && !props.name) {
      throw new Error("Workspace props must include either id or name.");
    }

    const api = new PrismaPostgresApi(props);

    let workspace: PrismaWorkspace | undefined;
    if (props.id) {
      workspace = await api.getWorkspaceById(props.id);
      if (props.name && workspace && workspace.name !== props.name) {
        throw new Error(
          `Workspace id ${props.id} does not match workspace named ${props.name}.`,
        );
      }
    } else if (props.name) {
      workspace = await api.getWorkspaceByName(props.name);
    }

    if (!workspace) {
      const identifier = props.id ? `id ${props.id}` : `name ${props.name}`;
      throw new Error(`Prisma workspace with ${identifier} was not found.`);
    }

    return workspace;
  },
);
