import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a Project
 */
export interface ProjectProps {
    /**
     * The name for the project
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Uniquely identifies a project and is used for the interface
     */
    slug?: string;
    /**
     * The platform for the project
     */
    platform?: string;
    /**
     * Whether to alert on every new issue
     */
    defaultRules?: boolean;
    /**
     * The team slug that owns the project
     */
    team: string;
    /**
     * The organization ID or slug that owns the project
     */
    organization: string;
    /**
     * Auth token to use (overrides environment variable)
     */
    authToken?: Secret;
    /**
     * Whether to adopt an existing project with the same slug if it exists
     * If true and a project with the same slug exists, it will be adopted rather than creating a new one
     *
     * @default false
     */
    adopt?: boolean;
}
/**
 * Output returned after Project creation/update
 */
export interface Project extends Omit<ProjectProps, "team"> {
    /**
     * The ID of the project
     */
    id: string;
    /**
     * The name for the project
     */
    name: string;
    /**
     * The team that owns the project
     */
    team: {
        id: string;
        name: string;
        slug: string;
    };
    /**
     * All teams that have access to the project
     */
    teams: Array<{
        id: string;
        name: string;
        slug: string;
    }>;
    /**
     * Whether the project is bookmarked
     */
    isBookmarked: boolean;
    /**
     * Whether the current user is a member of the project
     */
    isMember: boolean;
    /**
     * Access permissions for the project
     */
    access: string[];
    /**
     * Whether the current user has access to the project
     */
    hasAccess: boolean;
    /**
     * Time at which the project was created
     */
    dateCreated: string;
    /**
     * List of environments in the project
     */
    environments: string[];
    /**
     * Event processing status
     */
    eventProcessing: {
        symbolicationDegraded: boolean;
    };
    /**
     * List of features enabled for the project
     */
    features: string[];
    /**
     * Whether the project has received its first event
     */
    firstEvent: string | null;
    /**
     * Whether the project has received its first transaction event
     */
    firstTransactionEvent: boolean;
    /**
     * Whether the project has sessions
     */
    hasSessions: boolean;
    /**
     * Whether the project has profiles
     */
    hasProfiles: boolean;
    /**
     * Whether the project has replays
     */
    hasReplays: boolean;
    /**
     * Whether the project has flags
     */
    hasFlags: boolean;
    /**
     * Whether the project has monitors
     */
    hasMonitors: boolean;
    /**
     * Whether the project has feedback
     */
    hasFeedbacks: boolean;
    /**
     * Whether the project has new feedback
     */
    hasNewFeedbacks: boolean;
    /**
     * Whether the project has minified stack traces
     */
    hasMinifiedStackTrace: boolean;
    /**
     * Whether the project has HTTP insights
     */
    hasInsightsHttp: boolean;
    /**
     * Whether the project has database insights
     */
    hasInsightsDb: boolean;
    /**
     * Whether the project has asset insights
     */
    hasInsightsAssets: boolean;
    /**
     * Whether the project has app start insights
     */
    hasInsightsAppStart: boolean;
    /**
     * Whether the project has screen load insights
     */
    hasInsightsScreenLoad: boolean;
    /**
     * Whether the project has vitals insights
     */
    hasInsightsVitals: boolean;
    /**
     * Whether the project has cache insights
     */
    hasInsightsCaches: boolean;
    /**
     * Whether the project has queue insights
     */
    hasInsightsQueues: boolean;
    /**
     * Whether the project has LLM monitoring
     */
    hasInsightsLlmMonitoring: boolean;
    /**
     * List of platforms in the project
     */
    platforms: string[];
    /**
     * Latest release information
     */
    latestRelease: string | null;
    /**
     * Whether the project has user reports
     */
    hasUserReports: boolean;
    /**
     * Latest deployment information
     */
    latestDeploys: string | null;
}
/**
 * Create and manage Sentry projects
 *
 * @example
 * // Create a basic Sentry project:
 * const project = await Project("my-project", {
 *   name: "My Project",
 *   team: "my-team",
 *   organization: "my-org"
 * });
 *
 * @example
 * // Create a project for a specific platform:
 * const project = await Project("js-project", {
 *   name: "JavaScript Project",
 *   team: "my-team",
 *   organization: "my-org",
 *   platform: "javascript"
 * });
 *
 * @example
 * // Create a project with a custom slug and disabled default rules:
 * const project = await Project("custom-project", {
 *   name: "Custom Project",
 *   team: "my-team",
 *   organization: "my-org",
 *   slug: "custom-project-slug",
 *   defaultRules: false
 * });
 *
 * @example
 * // Create or adopt an existing project with the same slug:
 * const project = await Project("existing-project", {
 *   name: "Existing Project",
 *   team: "my-team",
 *   organization: "my-org",
 *   adopt: true
 * });
 */
export declare const Project: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Project>, id: string, props: ProjectProps) => Promise<Project>);
//# sourceMappingURL=project.d.ts.map