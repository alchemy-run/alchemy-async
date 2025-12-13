import type { Context } from "../context.ts";
import type { Secret } from "../secret.ts";
import type { RemoteImage } from "./remote-image.ts";
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
     * Use an external cache source for a build
     *
     * @see https://docs.docker.com/reference/cli/docker/buildx/build/#cache-from
     *
     */
    cacheFrom?: string[];
    /**
     * Export build cache to an external cache destination
     *
     * @see https://docs.docker.com/reference/cli/docker/buildx/build/#cache-to
     *
     */
    cacheTo?: string[];
    /**
     * Additional options to pass to the Docker build command. This serves as an escape hatch for any additional options that are not supported by the other properties.
     *
     * @see https://docs.docker.com/reference/cli/docker/buildx/build/#options
     *
     */
    options?: string[];
}
export interface ImageRegistry {
    username: string;
    password: Secret;
    server: string;
}
/**
 * Properties for creating a Docker image
 */
export type ImageProps = {
    /**
     * Tag for the image (e.g., "latest")
     */
    tag?: string;
    /**
     * Registry credentials
     */
    registry?: ImageRegistry;
    /**
     * Whether to skip pushing the image to registry
     */
    skipPush?: boolean;
} & ({
    /**
     * Image name or reference (e.g., "nginx:alpine")
     */
    image: string | Image | RemoteImage;
    build?: never;
    name?: never;
} | {
    /**
     * Repository name for the image (e.g., "username/image")
     *
     * @default - the id
     */
    name?: string;
    /**
     * Build configuration
     */
    build: DockerBuildOptions;
    image?: never;
});
/**
 * Docker Image resource
 */
export interface Image {
    kind: "Image";
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
    /**
     * Tag for the image
     */
    tag: string;
    /**
     * Build configuration
     */
    build: DockerBuildOptions | undefined;
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
export declare const Image: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Image>, id: string, props: ImageProps) => Promise<Image>);
//# sourceMappingURL=image.d.ts.map