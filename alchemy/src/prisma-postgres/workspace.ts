import { createPrismaApi, type PrismaApiOptions } from "./api.ts";

/**
 * Get a prisma workspace by id or name.
 *
 * @example
 * const workspace = await WorkspaceRef("alchemy-test");
 *
 * @param identifier The id or name of the workspace to get.
 * @param props The api credentials to use.
 * @returns The workspace.
 */
export async function WorkspaceRef(
  identifier: string,
  props?: PrismaApiOptions,
) {
  const api = createPrismaApi(props);

  const workspaces = await api.listWorkspaces();
  const workspace = workspaces.data.data.find(
    (workspace) => workspace.id === identifier || workspace.name === identifier,
  );
  if (!workspace) {
    throw new Error(`Workspace with identifier ${identifier} not found`);
  }
  return workspace;
}
