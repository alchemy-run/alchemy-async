import { type PrismaApiOptions } from "./api.ts";
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
export declare function WorkspaceRef(identifier: string, props?: PrismaApiOptions): Promise<{
    id: string;
    type: "workspace";
    name: string;
    createdAt: string;
}>;
//# sourceMappingURL=workspace.d.ts.map