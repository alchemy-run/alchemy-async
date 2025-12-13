import type { Octokit } from "@octokit/rest";
/**
 * Try to get a GitHub token from the GitHub CLI
 */
export declare function getGitHubTokenFromCLI(): Promise<string | null>;
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
export declare function getGitHubToken(token?: string): Promise<string | null>;
/**
 * Create an authenticated Octokit client
 *
 * @param options Options for creating the client
 * @returns An authenticated Octokit client
 */
export declare function createGitHubClient(options?: {
    token?: string;
}): Promise<Octokit>;
/**
 * Verifies GitHub authentication and provides helpful error messages
 *
 * @param octokit Octokit client
 * @param owner Repository owner
 * @param repo Repository name
 */
export declare function verifyGitHubAuth(octokit: Octokit, owner: string, repo: string): Promise<void>;
//# sourceMappingURL=client.d.ts.map