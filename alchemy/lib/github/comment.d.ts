import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
/**
 * Properties for creating or updating a GitHub Comment
 */
export interface GitHubCommentProps {
    /**
     * Repository owner (user or organization)
     */
    owner: string;
    /**
     * Repository name
     */
    repository: string;
    /**
     * Issue or Pull Request number to comment on
     */
    issueNumber: number;
    /**
     * Comment body (supports GitHub Markdown)
     */
    body: string;
    /**
     * Whether to allow deletion of the comment
     * By default, comments are never deleted to preserve discussion history
     * @default false
     */
    allowDelete?: boolean;
    /**
     * Optional GitHub API token (overrides environment variable)
     * If not provided, will use GITHUB_TOKEN or GITHUB_ACCESS_TOKEN environment variables
     * Token must have 'repo' scope for private repositories
     * or 'public_repo' scope for public repositories
     */
    token?: Secret;
}
/**
 * Output returned after Comment creation/update
 */
export interface GitHubComment extends Omit<GitHubCommentProps, "token"> {
    /**
     * The ID of the resource
     */
    id: string;
    /**
     * The numeric ID of the comment in GitHub
     */
    commentId: number;
    /**
     * URL to view the comment
     */
    htmlUrl: string;
    /**
     * Time at which the comment was created/updated
     */
    updatedAt: string;
}
/**
 * Resource for managing GitHub issue and pull request comments
 *
 * By default, comments are never deleted to preserve discussion history.
 * Set `allowDelete: true` to enable deletion when the resource is destroyed.
 *
 * Authentication is handled in the following order:
 * 1. `token` parameter in the resource props (if provided)
 * 2. `GITHUB_ACCESS_TOKEN` environment variable (for actions with admin permissions)
 * 3. `GITHUB_TOKEN` environment variable
 * 4. GitHub CLI token (if gh is installed and authenticated)
 *
 * The token must have the following permissions:
 * - 'repo' scope for private repositories
 * - 'public_repo' scope for public repositories
 *
 * @example
 * ## Create a comment on an issue
 *
 * Create a comment on issue #123 using the default GITHUB_TOKEN
 *
 * ```ts
 * const comment = await GitHubComment("issue-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 123,
 *   body: "This is a comment created by Alchemy!"
 * });
 * ```
 *
 * @example
 * ## Create a comment on a pull request
 *
 * Comments work the same way for pull requests
 *
 * ```ts
 * const prComment = await GitHubComment("pr-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 456, // PR number
 *   body: "## Deployment Status\n\n✅ Successfully deployed to staging!"
 * });
 * ```
 *
 * @example
 * ## Update comment content
 *
 * Comments can be updated by changing the body content
 *
 * ```ts
 * const comment = await GitHubComment("status-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 789,
 *   body: "🔄 Deployment in progress..."
 * });
 *
 * // Later, update the comment
 * await GitHubComment("status-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 789,
 *   body: "✅ Deployment completed successfully!"
 * });
 * ```
 *
 * @example
 * ## Allow comment deletion
 *
 * By default comments are preserved, but you can opt-in to deletion
 *
 * ```ts
 * const comment = await GitHubComment("temp-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 123,
 *   body: "This comment can be deleted",
 *   allowDelete: true
 * });
 * ```
 *
 * @example
 * ## Use custom authentication token
 *
 * Pass a custom GitHub token for authentication
 *
 * ```ts
 * const comment = await GitHubComment("authenticated-comment", {
 *   owner: "my-org",
 *   repository: "my-repo",
 *   issueNumber: 123,
 *   body: "Comment with custom token",
 *   token: alchemy.secret(process.env.CUSTOM_GITHUB_TOKEN)
 * });
 * ```
 */
export declare const GitHubComment: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<GitHubComment>, _id: string, props: GitHubCommentProps) => Promise<GitHubComment>);
//# sourceMappingURL=comment.d.ts.map