import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { DockerApi } from "./api.ts";
import type { Image } from "./image.ts";
import type { RemoteImage } from "./remote-image.ts";

/**
 * Port mapping configuration
 */
export interface PortMapping {
  /**
   * External port on the host
   */
  external: number | string;

  /**
   * Internal port inside the container
   */
  internal: number | string;

  /**
   * Protocol (tcp or udp)
   */
  protocol?: "tcp" | "udp";
}

/**
 * Volume mapping configuration
 */
export interface VolumeMapping {
  /**
   * Host path
   */
  hostPath: string;

  /**
   * Container path
   */
  containerPath: string;

  /**
   * Read-only flag
   */
  readOnly?: boolean;
}

/**
 * Network mapping configuration
 */
export interface NetworkMapping {
  /**
   * Network name or ID
   */
  name: string;

  /**
   * Aliases for the container in the network
   */
  aliases?: string[];
}

/**
 * Duration value supporting both number (seconds) and string format (value + unit)
 * Units: ms (milliseconds), s (seconds), m (minutes), h (hours)
 * Examples: 30, "30s", "1m", "500ms", "2h"
 */
export type Duration = number | `${number}${"ms" | "s" | "m" | "h"}`;

/**
 * Healthcheck configuration
 */
export interface HealthcheckConfig {
  /**
   * Command to run to check health.
   * Can be an array of command arguments or a shell command string.
   * Examples:
   * - ["curl", "-f", "http://localhost/"]
   * - "curl -f http://localhost/ || exit 1"
   */
  cmd: string[] | string;

  /**
   * Time between running the check
   * Can be a number (in seconds) or string with unit (e.g., "30s", "1m")
   * @default 0
   */
  interval?: Duration;

  /**
   * Maximum time to allow one check to run
   * Can be a number (in seconds) or string with unit (e.g., "10s", "500ms")
   * @default 0
   */
  timeout?: Duration;

  /**
   * Consecutive failures needed to report unhealthy
   */
  retries?: number;

  /**
   * Start period for the container to initialize before starting
   * health-retries countdown
   * Can be a number (in seconds) or string with unit (e.g., "40s", "1m")
   * @default 0
   */
  startPeriod?: Duration;

  /**
   * Time between running the check during the start period
   * Can be a number (in seconds) or string with unit (e.g., "5s", "500ms")
   * Requires Docker API 1.44+
   * @default 0
   */
  startInterval?: Duration;
}

/**
 * Properties for creating a Docker container
 */
export interface ContainerProps {
  /**
   * Image to use for the container
   * Can be an Alchemy Image or RemoteImage resource or a string image reference
   */
  image: Image | RemoteImage | string;

  /**
   * Container name
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Command to run in the container
   */
  command?: string[];

  /**
   * Environment variables
   */
  environment?: Record<string, string>;

  /**
   * Port mappings
   */
  ports?: PortMapping[];

  /**
   * Volume mappings
   */
  volumes?: VolumeMapping[];

  /**
   * Restart policy
   */
  restart?: "no" | "always" | "on-failure" | "unless-stopped";

  /**
   * Networks to connect to
   */
  networks?: NetworkMapping[];

  /**
   * Whether to remove the container when it exits
   */
  removeOnExit?: boolean;

  /**
   * Start the container after creation
   */
  start?: boolean;

  /**
   * Healthcheck configuration
   */
  healthcheck?: HealthcheckConfig;

  /**
   * Whether to adopt the container if it already exists
   * @default false
   */
  adopt?: boolean;
}

/**
 * Docker Container resource
 */
export interface Container extends ContainerProps {
  /**
   * Container ID
   */
  id: string;

  /**
   * Container name
   */
  name: string;

  /**
   * Container state
   */
  state?: "created" | "running" | "paused" | "stopped" | "exited";

  /**
   * Time when the container was created
   */
  createdAt: number;
}

/**
 * Create and manage a Docker Container
 *
 * @example
 * // Create a simple Nginx container
 * const webContainer = await Container("web", {
 *   image: "nginx:latest",
 *   ports: [
 *     { external: 8080, internal: 80 }
 *   ],
 *   start: true
 * });
 *
 * @example
 * // Create a container with environment variables and volume mounts
 * const appContainer = await Container("app", {
 *   image: customImage, // Using an Alchemy RemoteImage resource
 *   environment: {
 *     NODE_ENV: "production",
 *     API_KEY: "secret-key"
 *   },
 *   volumes: [
 *     { hostPath: "./data", containerPath: "/app/data" }
 *   ],
 *   ports: [
 *     { external: 3000, internal: 3000 }
 *   ],
 *   restart: "always",
 *   start: true
 * });
 *
 * @example
 * // Create a container with healthcheck using numeric values (seconds)
 * const healthyContainer = await Container("api", {
 *   image: "my-api:latest",
 *   ports: [
 *     { external: 3000, internal: 3000 }
 *   ],
 *   healthcheck: {
 *     cmd: ["curl", "-f", "http://localhost:3000/health"],
 *     interval: 30,
 *     timeout: 10,
 *     retries: 3,
 *     startPeriod: 40
 *   },
 *   start: true
 * });
 *
 * @example
 * // Create a container with healthcheck using string duration format
 * const healthyContainer2 = await Container("api2", {
 *   image: "my-api:latest",
 *   ports: [
 *     { external: 3001, internal: 3000 }
 *   ],
 *   healthcheck: {
 *     cmd: ["curl", "-f", "http://localhost:3000/health"],
 *     interval: "30s",
 *     timeout: "10s",
 *     retries: 3,
 *     startPeriod: "1m",
 *     startInterval: "500ms"
 *   },
 *   start: true
 * });
 */
export const Container = Resource(
  "docker::Container",
  async function (
    this: Context<Container>,
    id: string,
    props: ContainerProps,
  ): Promise<Container> {
    // Initialize Docker API client
    const api = new DockerApi();

    // Get image reference
    const imageRef =
      typeof props.image === "string" ? props.image : props.image.imageRef;

    // Use provided name or generate one based on resource ID
    const containerName =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "update" && this.output.name !== containerName) {
      this.replace();
    }

    // Handle delete phase
    if (this.phase === "delete") {
      if (this.output?.id) {
        // Stop container if running
        await api.stopContainer(this.output.id);

        // Remove container
        await api.removeContainer(this.output.id, true);
      }

      // Return destroyed state
      return this.destroy();
    }

    let containerState: NonNullable<Container["state"]> = "created";

    // Check if container already exists
    const containerExists = await api.containerExists(containerName);

    if (containerExists) {
      if (this.phase === "update") {
        // Remove existing container for update
        await api.removeContainer(containerName, true);
      } else {
        // Create phase - check for adoption
        if (!props.adopt) {
          throw new Error(
            `Container "${containerName}" already exists. Use adopt: true to adopt it.`,
          );
        }

        // Adopt existing container
        const containerInfos = await api.inspectContainer(containerName);
        const containerInfo = containerInfos[0];
        let adoptedState = containerInfo.State.Status;

        // Optionally start the container if requested
        if (props.start && containerInfo.State.Status !== "running") {
          await api.startContainer(containerName);
          adoptedState = "running";
        }

        return {
          ...props,
          id: containerInfo.Id,
          name: containerName,
          state: adoptedState,
          createdAt: new Date(containerInfo.Created).getTime(),
        };
      }
    }

    // Prepare port mappings
    const portMappings: Record<string, string> = {};
    if (props.ports) {
      for (const port of props.ports) {
        const protocol = port.protocol || "tcp";
        portMappings[`${port.external}`] = `${port.internal}/${protocol}`;
      }
    }

    // Prepare volume mappings
    const volumeMappings: Record<string, string> = {};
    if (props.volumes) {
      for (const volume of props.volumes) {
        const readOnlyFlag = volume.readOnly ? ":ro" : "";
        volumeMappings[volume.hostPath] =
          `${volume.containerPath}${readOnlyFlag}`;
      }
    }

    // Create new container
    const containerId = await api.createContainer(imageRef, containerName, {
      ports: portMappings,
      env: props.environment,
      volumes: volumeMappings,
      cmd: props.command,
      healthcheck: props.healthcheck,
    });

    // Connect to networks if specified
    if (props.networks) {
      for (const network of props.networks) {
        const networkId = typeof network === "string" ? network : network.name;
        await api.connectNetwork(containerId, networkId, {
          aliases: network.aliases,
        });
      }
    }

    // Start container if requested
    if (props.start) {
      await api.startContainer(containerId);
      containerState = "running";
    }

    return {
      ...props,
      id: containerId,
      name: containerName,
      state: containerState,
      createdAt: Date.now(),
    };
  },
);
