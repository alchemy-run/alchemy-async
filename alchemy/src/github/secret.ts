import sodium from "libsodium-wrappers";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { logger } from "../util/logger.ts";
import { createGitHubClient, verifyGitHubAuth } from "./client.ts";
/**
 * Properties for creating or updating a GitHub Secret
 */
export interface GitHubSecretProps {
  /**
   * Repository owner (user or organization)
   */
  owner: string;

  /**
   * Repository name
   */
  repository: string;

  /**
   * Secret name
   */
  name: string;

  /**
   * Secret value (will be stored securely on GitHub)
   */
  value: Secret;

  /**
   * Optional environment name to create an environment secret
   * If set, the secret will be created in the specified environment instead of at the repository level
   */
  environment?: string;

  /**
   * Optional GitHub API token (overrides environment variable)
   * If not provided, will use GITHUB_TOKEN environment variable
   * Token must have 'repo' scope for private repositories
   * or 'public_repo' scope for public repositories
   */
  token?: Secret;
}

/**
 * Output returned after Secret creation/update
 */
export interface GitHubSecretOutput extends Omit<GitHubSecretProps, "value"> {
  /**
   * The ID of the resource
   */
  id: string;

  /**
   * Time at which the object was created/updated
   */
  updatedAt: string;
}

/**
 * Resource for managing GitHub repository and environment secrets
 *
 * Authentication is handled in the following order:
 * 1. `token` parameter in the resource props (if provided)
 * 2. `GITHUB_TOKEN` environment variable
 *
 * The token must have the following permissions:
 * - 'repo' scope for private repositories
 * - 'public_repo' scope for public repositories
 *
 * @example
 * // Create a repository secret using GITHUB_TOKEN environment variable:
 * const secret = await GitHubSecret("my-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   name: "API_KEY",
 *   value: alchemy.secret("my-secret-value")
 * });
 *
 * @example
 * // Create an environment secret:
 * const secret = await GitHubSecret("my-env-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   environmentName: "production",
 *   name: "DEPLOY_KEY",
 *   value: alchemy.secret("my-secret-deploy-key")
 * });
 *
 * @example
 * // Create a secret with a custom GitHub token:
 * const secret = await GitHubSecret("my-secret", {
 *   owner: "my-github-username",
 *   repository: "my-repo",
 *   name: "API_KEY",
 *   value: alchemy.secret("my-secret-value"),
 *   token: alchemy.secret(process.env.CUSTOM_GITHUB_TOKEN)
 * });
 *
 * @example
 * // Create multiple secrets with environment variables:
 * const secrets = await Promise.all([
 *   GitHubSecret("aws-secret", {
 *     owner: "my-github-username",
 *     repository: "cloud-app",
 *     name: "AWS_ROLE_ARN",
 *     value: alchemy.secret(process.env.AWS_ROLE_ARN)
 *   }),
 *   GitHubSecret("cf-secret", {
 *     owner: "my-github-username",
 *     repository: "cloud-app",
 *     name: "CLOUDFLARE_API_KEY",
 *     value: alchemy.secret(process.env.CLOUDFLARE_API_KEY)
 *   })
 * ]);
 *
 * @example
 * // Create a secret in a secure scope with a password:
 * await alchemy.run("secure-scope", {
 *   password: process.env.SECRET_PASSPHRASE
 * }, async () => {
 *   const secret = await GitHubSecret("deploy-secret", {
 *     owner: "my-github-username",
 *     repository: "my-app",
 *     name: "DEPLOY_TOKEN",
 *     value: alchemy.secret(process.env.DEPLOY_TOKEN),
 *     token: alchemy.secret(process.env.GITHUB_TOKEN)
 *   });
 * });
 */
export const GitHubSecret = Resource(
  "github::Secret",
  async function (
    this: Context<GitHubSecretOutput>,
    _id: string,
    props: GitHubSecretProps,
  ): Promise<GitHubSecretOutput> {
    // Create authenticated Octokit client - will automatically handle token resolution
    /// TODO: use fetch
    const octokit = await createGitHubClient({
      token: props.token?.unencrypted,
    });

    // Verify authentication and permissions
    if (!this.quiet) {
      await verifyGitHubAuth(octokit, props.owner, props.repository);
    }

    // Determine if we're working with an environment secret or repository secret
    const isEnvironmentSecret = !!props.environment;

    if (this.phase === "delete") {
      if (this.output?.id) {
        try {
          // Delete the secret
          if (isEnvironmentSecret) {
            await octokit.rest.actions.deleteEnvironmentSecret({
              owner: props.owner,
              repo: props.repository,
              environment_name: props.environment!,
              secret_name: props.name,
            });
          } else {
            await octokit.rest.actions.deleteRepoSecret({
              owner: props.owner,
              repo: props.repository,
              secret_name: props.name,
            });
          }
        } catch (error: any) {
          // Ignore 404 errors (secret already deleted)
          if (error.status === 404) {
            logger.log("Secret doesn't exist, ignoring");
          } else {
            throw error;
          }
        }
      }

      // Return void (a deleted resource has no content)
      return this.destroy();
    }
    try {
      // Check if we're transitioning between secret types (repo <-> environment)
      if (this.phase === "update") {
        const wasEnvironmentSecret = !!this.output.environment;
        const secretTypeChanged = isEnvironmentSecret !== wasEnvironmentSecret;

        // If secret type changed, we need to delete the old one first
        if (secretTypeChanged) {
          logger.log(
            `Secret type changed from ${
              wasEnvironmentSecret ? "environment" : "repository"
            } to ${
              isEnvironmentSecret ? "environment" : "repository"
            } secret. Deleting the old secret first.`,
          );

          try {
            if (wasEnvironmentSecret) {
              // Delete the old environment secret
              await octokit.rest.actions.deleteEnvironmentSecret({
                owner: this.output.owner,
                repo: this.output.repository,
                environment_name: this.output.environment!,
                secret_name: this.output.name,
              });
            } else {
              // Delete the old repository secret
              await octokit.rest.actions.deleteRepoSecret({
                owner: this.output.owner,
                repo: this.output.repository,
                secret_name: this.output.name,
              });
            }
          } catch (error: any) {
            // Log but don't fail if the old secret doesn't exist or can't be deleted
            if (error.status === 404) {
              logger.log(
                "Old secret not found, continuing with creation of new secret",
              );
            } else {
              throw error;
            }
          }
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      let publicKey;

      // Get the appropriate public key for encrypting secrets
      if (isEnvironmentSecret) {
        // Get the environment's public key
        const { data } = await octokit.rest.actions.getEnvironmentPublicKey({
          owner: props.owner,
          repo: props.repository,
          environment_name: props.environment!,
        });
        publicKey = data;
      } else {
        // Get the repository's public key
        const { data } = await octokit.rest.actions.getRepoPublicKey({
          owner: props.owner,
          repo: props.repository,
        });
        publicKey = data;
      }

      // Encrypt the secret value using libsodium
      const encryptedValue = await encryptString(
        props.value.unencrypted,
        publicKey.key,
      );

      // Create or update the secret with the encrypted value and key_id
      if (isEnvironmentSecret) {
        await octokit.rest.actions.createOrUpdateEnvironmentSecret({
          owner: props.owner,
          repo: props.repository,
          environment_name: props.environment!,
          secret_name: props.name,
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        });
      } else {
        await octokit.rest.actions.createOrUpdateRepoSecret({
          owner: props.owner,
          repo: props.repository,
          secret_name: props.name,
          encrypted_value: encryptedValue,
          key_id: publicKey.key_id,
        });
      }

      // GitHub doesn't return the secret details on create/update, so we need to construct it
      const idParts = [props.owner, props.repository];
      if (isEnvironmentSecret) {
        idParts.push(props.environment!);
      }
      idParts.push(props.name);

      return {
        id: idParts.join("/"),
        owner: props.owner,
        repository: props.repository,
        name: props.name,
        environment: props.environment,
        token: props.token,
        updatedAt: new Date().toISOString(),
      };
    } catch (error: any) {
      if (
        error.status === 403 &&
        error.message?.includes("Must have admin rights")
      ) {
        logger.error(
          "\n⚠️ Error creating/updating GitHub secret: You must have admin rights to the repository.",
        );
        logger.error(
          "Make sure your GitHub token has the required permissions (repo scope for private repos).\n",
        );
      } else {
        logger.error("Error creating/updating GitHub secret:", error.message);
      }
      throw error;
    }
  },
);

/**
 * Encrypt a value for GitHub using libsodium
 * Based on GitHub's documentation for encrypting secrets
 *
 * @param value - The secret value to encrypt
 * @param publicKey - The base64-encoded public key from GitHub
 * @returns The base64-encoded encrypted value
 */
async function encryptString(
  value: string,
  publicKey: string,
): Promise<string> {
  // Initialize libsodium
  await sodium.ready;

  // Convert the public key from base64 to binary
  const binKey = sodium.from_base64(publicKey, sodium.base64_variants.ORIGINAL);

  // Convert the message to a Uint8Array
  const binMessage = sodium.from_string(value);

  // Encrypt the message with the public key using libsodium's sealed box
  const encryptedBin = sodium.crypto_box_seal(binMessage, binKey);

  // Convert the encrypted message to base64
  return sodium.to_base64(encryptedBin, sodium.base64_variants.ORIGINAL);
}
