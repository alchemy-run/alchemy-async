import type { Context } from "../context.ts";
/**
 * Interface for volume label
 */
export interface VolumeLabel {
    /**
     * Label name
     */
    name: string;
    /**
     * Label value
     */
    value: string;
}
/**
 * Properties for creating a Docker volume
 */
export interface VolumeProps {
    /**
     * Volume name
     *
     * @default ${app}-${stage}-${id}
     */
    name?: string;
    /**
     * Volume driver to use
     * @default "local"
     */
    driver?: string;
    /**
     * Driver-specific options
     */
    driverOpts?: Record<string, string>;
    /**
     * Custom metadata labels for the volume
     */
    labels?: VolumeLabel[] | Record<string, string>;
    /**
     * Whether to adopt the volume if it already exists
     * @default false
     */
    adopt?: boolean;
}
/**
 * Docker Volume resource
 */
export interface Volume extends VolumeProps {
    /**
     * Volume ID (same as name for Docker volumes)
     */
    id: string;
    /**
     * Volume name
     */
    name: string;
    /**
     * Volume mountpoint path on the host
     */
    mountpoint?: string;
    /**
     * Time when the volume was created
     */
    createdAt: number;
}
/**
 * Create and manage a Docker Volume
 *
 * @see https://docs.docker.com/engine/reference/commandline/volume/
 *
 * @example
 * // Create a simple Docker volume
 * const dataVolume = await Volume("data-volume", {
 *   name: "data-volume"
 * });
 *
 * @example
 * // Create a Docker volume with custom driver and options
 * const dbVolume = await Volume("db-data", {
 *   name: "db-data",
 *   driver: "local",
 *   driverOpts: {
 *     "type": "nfs",
 *     "o": "addr=10.0.0.1,rw",
 *     "device": ":/path/to/dir"
 *   },
 *   labels: [
 *     { name: "com.example.usage", value: "database-storage" },
 *     { name: "com.example.backup", value: "weekly" }
 *   ]
 * });
 */
export declare const Volume: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Volume>, id: string, props: VolumeProps) => Promise<Volume>);
//# sourceMappingURL=volume.d.ts.map