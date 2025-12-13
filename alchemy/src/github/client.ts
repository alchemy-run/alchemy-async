import type { Octokit } from "@octokit/rest";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { logger } from "../util/logger.ts";
import { importPeer } from "../util/peer.ts";

// Convert exec to promise-based
const execAsync = promisify(exec);

/**
 * Try to get a GitHub token from the GitHub CLI
 */
export async function getGitHubTokenFromCLI(): Promise<string | null> {
  try {
    // Check if GitHub CLI is installed
    const { stdout: ghVersion } = await execAsync("gh --version");
    if (!ghVersion) return null;

    // Get the auth token
    const { stdout: token } = await execAsync("gh auth token");
    return token?.trim() || null;
  } catch {
    return null;
  }
}

/**
 * Get GitHub authentication token with the following priority:
 * 1. Explicit token provided in props
 * 2. GITHUB_ACCESS_TOKEN environment variable (for actions with admin permissions)
 * 3. GITHUB_TOKEN environment variable
 * 4. GitHub CLI token (if gh is installed and authenticated)
 *
 * @param token Optional token to use
 * @returns The resolved token or null if not available
 */
export async function getGitHubToken(token?: string): Promise<string | null> {
  return (
    token ||
    process.env.GITHUB_ACCESS_TOKEN ||
    process.env.GITHUB_TOKEN ||
    (await getGitHubTokenFromCLI())
  );
}

/**
 * Create an authenticated Octokit client
 *
 * @param options Options for creating the client
 * @returns An authenticated Octokit client
 */
export async function createGitHubClient(
  options: { token?: string } = {},
): Promise<Octokit> {
  const token = await getGitHubToken(options.token);
  const { Octokit } = await importPeer(
    import("@octokit/rest"),
    "GitHub resources",
  );
  return new Octokit({
    auth: token,
  });
}

/**
 * Verifies GitHub authentication and provides helpful error messages
 *
 * @param octokit Octokit client
 * @param owner Repository owner
 * @param repo Repository name
 */
export async function verifyGitHubAuth(
  octokit: Octokit,
  owner: string,
  repo: string,
): Promise<void> {
  try {
    // Make a test request to check authentication
    await octokit.rest.repos.get({
      owner,
      repo,
    });
  } catch (error: any) {
    if (error.status === 401) {
      logger.error(
        "\n⚠️ GitHub authentication failed. Please try one of the following:",
      );
      logger.error(
        "1. Run 'gh auth login' to authenticate with the GitHub CLI",
      );
      logger.error(
        "2. Set the GITHUB_TOKEN environment variable with a personal access token",
      );
      logger.error("3. Pass a token directly to the constructor");
      logger.error(
        "\nTo create a token, visit: https://github.com/settings/tokens",
      );
      logger.error(
        "Required scopes: 'repo' for private repos or 'public_repo' for public repos\n",
      );
      throw new Error("GitHub authentication failed");
    }
    if (error.status === 403) {
      logger.error(
        "\n⚠️ Insufficient permissions. You need admin access to the repository.",
      );
      logger.error(
        "Make sure your token has the 'repo' scope for private repos or 'public_repo' for public repos\n",
      );
      throw new Error("Insufficient GitHub permissions");
    }
    if (error.status === 404) {
      logger.error(`\n⚠️ Repository not found: ${owner}/${repo}`);
      logger.error(
        "Make sure the repository exists and you have access to it\n",
      );
      throw new Error("GitHub repository not found");
    }
    throw error;
  }
}
