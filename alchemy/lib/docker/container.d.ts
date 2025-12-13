import type { Context } from "../context.ts";
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
export declare const Container: (((this: any, id: string, props?: {}) => never) & (new (_: never) => never)) | ((this: Context<Container>, id: string, props: ContainerProps) => Promise<Container>);
//# sourceMappingURL=container.d.ts.map