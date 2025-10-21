import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { DockerApi } from "./api.ts";

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
export const Volume = Resource(
  "docker::Volume",
  async function (
    this: Context<Volume>,
    id: string,
    props: VolumeProps,
  ): Promise<Volume> {
    // Initialize Docker API client
    const api = new DockerApi();

    const volumeName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    // Process labels to ensure consistent format
    const processedLabels: Record<string, string> = {};
    if (props.labels) {
      if (Array.isArray(props.labels)) {
        // Convert array of label objects to Record
        for (const label of props.labels) {
          processedLabels[label.name] = label.value;
        }
      } else {
        // Use Record directly
        Object.assign(processedLabels, props.labels);
      }
    }

    // Handle delete phase
    if (this.phase === "delete") {
      if (this.output?.name) {
        // Remove volume
        await api.removeVolume(this.output.name);
      }

      // Return destroyed state
      return this.destroy();
    } else {
      // Set default driver if not provided
      const driver = props.driver || "local";
      const driverOpts = props.driverOpts || {};

      // Create the volume
      const volumeId = await api.createVolume(
        volumeName,
        driver,
        driverOpts,
        processedLabels,
      );

      // Get volume details to retrieve mountpoint
      const volumeInfos = await api.inspectVolume(volumeId);
      const mountpoint = volumeInfos[0].Mountpoint;

      return {
        ...props,
        driver: driver,
        id: volumeId,
        name: volumeName,
        mountpoint,
        createdAt: Date.now(),
        labels: Array.isArray(props.labels) ? props.labels : undefined,
        driverOpts: props.driverOpts,
      };
    }
  },
);
