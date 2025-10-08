import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { createGitHubClient, verifyGitHubAuth } from "./client.ts";

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
export const GitHubComment = Resource(
  "github::Comment",
  async function (
    this: Context<GitHubComment>,
    _id: string,
    props: GitHubCommentProps,
  ): Promise<GitHubComment> {
    // Create authenticated Octokit client - will automatically handle token resolution

    if (this.phase === "delete") {
      if (this.output?.commentId && props.allowDelete) {
        const octokit = await createGitHubClient({
          token: props.token?.unencrypted,
        });

        // Verify authentication and permissions
        if (!this.quiet) {
          await verifyGitHubAuth(octokit, props.owner, props.repository);
        }
        try {
          // Delete the comment
          await octokit.rest.issues.deleteComment({
            owner: props.owner,
            repo: props.repository,
            comment_id: this.output.commentId,
          });
        } catch (error: any) {
          // Ignore 404 errors (comment already deleted)
          if (error.status === 404) {
            logger.log("Comment doesn't exist, ignoring");
          } else {
            throw error;
          }
        }
      } else if (this.output?.commentId && !props.allowDelete) {
        logger.log(
          "Comment deletion skipped - allowDelete is false (default behavior to preserve discussion history)",
        );
      }

      // Return void (a deleted resource has no content)
      return this.destroy();
    }

    const octokit = await createGitHubClient({
      token: props.token?.unencrypted,
    });

    // Verify authentication and permissions
    if (!this.quiet) {
      await verifyGitHubAuth(octokit, props.owner, props.repository);
    }

    try {
      if (this.phase === "update" && this.output?.commentId) {
        // Update existing comment
        const { data: updatedComment } =
          await octokit.rest.issues.updateComment({
            owner: props.owner,
            repo: props.repository,
            comment_id: this.output.commentId,
            body: props.body,
          });

        return {
          id: `${props.owner}/${props.repository}/issues/${props.issueNumber}/comments/${updatedComment.id}`,
          commentId: updatedComment.id,
          owner: props.owner,
          repository: props.repository,
          issueNumber: props.issueNumber,
          body: props.body,
          allowDelete: props.allowDelete,
          htmlUrl: updatedComment.html_url,
          updatedAt: updatedComment.updated_at,
        };
      } else {
        // Create new comment
        const { data: newComment } = await octokit.rest.issues.createComment({
          owner: props.owner,
          repo: props.repository,
          issue_number: props.issueNumber,
          body: props.body,
        });

        return {
          id: `${props.owner}/${props.repository}/issues/${props.issueNumber}/comments/${newComment.id}`,
          commentId: newComment.id,
          owner: props.owner,
          repository: props.repository,
          issueNumber: props.issueNumber,
          body: props.body,
          allowDelete: props.allowDelete,
          htmlUrl: newComment.html_url,
          updatedAt: newComment.updated_at,
        };
      }
    } catch (error: any) {
      if (error.status === 403) {
        logger.error(
          "\n⚠️ Error creating/updating GitHub comment: Insufficient permissions.",
        );
        logger.error(
          "Make sure your GitHub token has the required permissions (repo scope for private repos).\n",
        );
      } else if (error.status === 404) {
        logger.error(
          `\n⚠️ Issue or Pull Request #${props.issueNumber} not found in ${props.owner}/${props.repository}`,
        );
        logger.error(
          "Make sure the issue/PR exists and you have access to it\n",
        );
      } else {
        logger.error("Error creating/updating GitHub comment:", error.message);
      }
      throw error;
    }
  },
);
