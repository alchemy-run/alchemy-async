import type { Context } from "../context.ts";
/**
 * Properties for creating a Docker image
 */
export interface RemoteImageProps {
    /**
     * Docker image name (e.g., "nginx")
     */
    name: string;
    /**
     * Tag for the image (e.g., "latest" or "1.19-alpine")
     */
    tag?: string;
    /**
     * Always attempt to pull the image, even if it exists locally
     */
    alwaysPull?: boolean;
}
/**
 * Docker Remote Image resource
 */
export interface RemoteImage extends RemoteImageProps {
    kind: "RemoteImage";
    /**
     * Full image reference (name:tag)
     */
    imageRef: string;
    /**
     * Time when the image was created or pulled
     */
    createdAt: number;
}
/**
 * Create or reference a Docker Remote Image
 *
 * @example
 * // Pull the nginx image
 * const nginxImage = await RemoteImage("nginx", {
 *   name: "nginx",
 *   tag: "latest"
 * });
 *
 */
export declare const RemoteImage: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<RemoteImage>, _id: string, props: RemoteImageProps) => Promise<RemoteImage>);
//# sourceMappingURL=remote-image.d.ts.map