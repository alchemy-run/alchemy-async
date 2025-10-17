import fs from "node:fs/promises";
import os from "node:os";
import path from "pathe";
import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { DockerApi } from "./api.ts";

/**
 * Options for building a Docker image
 */
export interface DockerBuildOptions {
  /**
   * Path to the build context directory
   *
   * @default - the `dirname(dockerfile)` if provided or otherwise `process.cwd()`
   */
  context?: string;

  /**
   * Path to the Dockerfile, relative to context
   *
   * @default - `Dockerfile`
   */
  dockerfile?: string;

  /**
   * Target build platform (e.g., linux/amd64)
   */
  platform?: string;

  /**
   * Build arguments as key-value pairs
   */
  args?: Record<string, string>;

  /**
   * Target build stage in multi-stage builds
   */
  target?: string;

  /**
   * List of images to use for cache
   */
  cacheFrom?: string[];
}

export interface ImageRegistry {
  username: string;
  password: Secret;
  server: string;
}

/**
 * Properties for creating a Docker image
 */
export interface ImageProps {
  /**
   * Repository name for the image (e.g., "username/image")
   */
  name?: string;

  /**
   * Tag for the image (e.g., "latest")
   */
  tag?: string;

  /**
   * Build configuration
   */
  build?: DockerBuildOptions;

  /**
   * Registry credentials
   */
  registry?: ImageRegistry;

  /**
   * Whether to skip pushing the image to registry
   */
  skipPush?: boolean;
}

/**
 * Docker Image resource
 */
export interface Image extends ImageProps {
  /**
   * Image name
   */
  name: string;

  /**
   * Full image reference (name:tag)
   */
  imageRef: string;

  /**
   * Image ID
   */
  imageId?: string;

  /**
   * Repository digest if pushed
   */
  repoDigest?: string;

  /**
   * Time when the image was built
   */
  builtAt: number;
}

/**
 * Build and manage a Docker image from a Dockerfile
 *
 * @example
 * // Build a Docker image from a Dockerfile
 * const appImage = await Image("app-image", {
 *   name: "myapp",
 *   tag: "latest",
 *   build: {
 *     context: "./app",
 *     dockerfile: "Dockerfile",
 *     buildArgs: {
 *       NODE_ENV: "production"
 *     }
 *   }
 * });
 */
export const Image = Resource(
  "docker::Image",
  async function (
    this: Context<Image>,
    id: string,
    props: ImageProps,
  ): Promise<Image> {
    // Initialize Docker API client with the isolated config directory
    const api = new DockerApi();

    if (this.phase === "delete") {
      // No action needed for delete as Docker images aren't automatically removed
      // This is intentional as other resources might depend on the same image
      return this.destroy();
    } else {
      // Normalize properties
      const tag = props.tag || "latest";
      const name = props.name || id;
      const imageRef = `${name}:${tag}`;

      let context: string;
      let dockerfile: string;
      if (props.build?.dockerfile && props.build?.context) {
        context = path.resolve(props.build.context);
        dockerfile = path.resolve(context, props.build.dockerfile);
      } else if (props.build?.dockerfile) {
        context = process.cwd();
        dockerfile = path.resolve(context, props.build.dockerfile);
      } else if (props.build?.context) {
        context = path.resolve(props.build.context);
        dockerfile = path.resolve(context, "Dockerfile");
      } else {
        context = process.cwd();
        dockerfile = path.resolve(context, "Dockerfile");
      }
      await fs.access(context);
      await fs.access(dockerfile);

      // Prepare build options
      const buildOptions: Record<string, string> = props.build?.args || {};

      // Add platform if specified
      let buildArgs = ["build", "-t", imageRef];

      if (props.build?.platform) {
        buildArgs.push("--platform", props.build.platform);
      }

      // Add target if specified
      if (props.build?.target) {
        buildArgs.push("--target", props.build.target);
      }

      // Add cache sources if specified
      if (props.build?.cacheFrom && props.build.cacheFrom.length > 0) {
        for (const cacheSource of props.build.cacheFrom) {
          buildArgs.push("--cache-from", cacheSource);
        }
      }

      // Add build arguments
      for (const [key, value] of Object.entries(buildOptions)) {
        buildArgs.push("--build-arg", `${key}=${value}`);
      }

      buildArgs.push("-f", dockerfile);

      // Add context path
      buildArgs.push(context);

      // Execute build command
      const { stdout } = await api.exec(buildArgs);

      // Extract image ID from build output if available
      const imageIdMatch = /Successfully built ([a-f0-9]+)/.exec(stdout);
      const imageId = imageIdMatch ? imageIdMatch[1] : undefined;

      // Handle push if required
      let repoDigest: string | undefined;
      let finalImageRef = imageRef;
      if (props.registry && !props.skipPush) {
        const { server, username, password } = props.registry;

        // Ensure the registry server does not have trailing slash
        const registryHost = server.replace(/\/$/, "");

        // Determine if the built image already includes a registry host (e.g. ghcr.io/user/repo)
        const firstSegment = imageRef.split("/")[0];
        const hasRegistryPrefix = firstSegment.includes(".");

        // Compose the target image reference that will be pushed
        const targetImage = hasRegistryPrefix
          ? imageRef // already fully-qualified
          : `${registryHost}/${imageRef}`;

        try {
          // Create a temporary directory that will act as an isolated Docker config
          // (credentials) directory. This prevents race-conditions when multiple
          // concurrent tests perform `docker login` / `logout` by ensuring each
          // Image operation has its own credential store.
          const tempConfigDir = await fs.mkdtemp(
            path.join(os.tmpdir(), "docker-config-"),
          );
          const api = new DockerApi({ configDir: tempConfigDir });

          // Authenticate to registry using the isolated config directory
          await api.login(registryHost, username, password.unencrypted);

          // Tag local image with fully qualified name if necessary
          if (targetImage !== imageRef) {
            await api.exec(["tag", imageRef, targetImage]);
          }

          // Push the image
          const { stdout: pushOut } = await api.exec(["push", targetImage]);

          // Attempt to extract the repo digest from push output
          const digestMatch = /digest:\s+([a-z0-9]+:[a-f0-9]{64})/.exec(
            pushOut,
          );
          if (digestMatch) {
            const digestHash = digestMatch[1];
            // Strip tag (anything after last :) to build image@digest reference
            const [repoWithoutTag] =
              targetImage.split(":").length > 2
                ? [targetImage] // unlikely but safety
                : [targetImage.substring(0, targetImage.lastIndexOf(":"))];
            repoDigest = `${repoWithoutTag}@${digestHash}`;
          }

          // Update the final image reference to point at the pushed image
          finalImageRef = targetImage;
        } finally {
          // Clean up credentials from the isolated config
          await api.logout(registryHost);
        }
      }

      return {
        ...props,
        name,
        imageRef: finalImageRef,
        imageId,
        repoDigest,
        builtAt: Date.now(),
      };
    }
  },
);
