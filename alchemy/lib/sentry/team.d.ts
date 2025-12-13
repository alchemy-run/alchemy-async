import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a Team
 */
export interface TeamProps {
    /**
     * The name for the team
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Uniquely identifies a team and is used for the interface
     */
    slug?: string;
    /**
     * The organization ID or slug that owns the team
     */
    organization: string;
    /**
     * Auth token to use (overrides environment variable)
     */
    authToken?: Secret;
    /**
     * Whether to adopt an existing team with the same slug if it exists
     * If true and a team with the same slug exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
}
/**
 * Output returned after Team creation/update
 */
export interface Team extends TeamProps {
    /**
     * The ID of the team
     */
    id: string;
    /**
     * Name of the Team.
     */
    name: string;
    /**
     * Time at which the team was created
     */
    dateCreated: string;
    /**
     * Whether the current user is a member of the team
     */
    isMember: boolean;
    /**
     * The role of the current user in the team
     */
    teamRole: string;
    /**
     * Team flags
     */
    flags: {
        "idp:provisioned": boolean;
    };
    /**
     * Access permissions for the team
     */
    access: string[];
    /**
     * Whether the current user has access to the team
     */
    hasAccess: boolean;
    /**
     * Whether the team membership is pending
     */
    isPending: boolean;
    /**
     * Number of members in the team
     */
    memberCount: number;
    /**
     * Team avatar information
     */
    avatar: {
        avatarType: string;
        avatarUuid: string | null;
    };
}
/**
 * Create and manage Sentry teams
 *
 * @example
 * // Create a basic Sentry team:
 * const team = await Team("my-team", {
 *   name: "My Team",
 *   organization: "my-org"
 * });
 *
 * @example
 * // Create a team with a custom slug:
 * const team = await Team("custom-team", {
 *   name: "Custom Team",
 *   organization: "my-org",
 *   slug: "custom-team-slug"
 * });
 *
 * @example
 * // Create or adopt an existing team with the same slug:
 * const team = await Team("existing-team", {
 *   name: "Existing Team",
 *   organization: "my-org",
 *   adopt: true
 * });
 */
export declare const Team: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Team>, id: string, props: TeamProps) => Promise<Team>);
//# sourceMappingURL=team.d.ts.map