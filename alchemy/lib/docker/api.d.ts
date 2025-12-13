import type { Duration, HealthcheckConfig } from "./container.ts";
/**
 * Normalize a duration value to Docker CLI format
 * Accepts either a number (seconds) or a string with unit suffix (ms|s|m|h)
 * Returns a string in Docker CLI format
 *
 * The Duration type provides compile-time type safety, ensuring only valid
 * formats are accepted: number or string matching the pattern `${number}${unit}`
 *
 * @param duration Duration value (number in seconds or string with unit)
 * @returns Normalized duration string for Docker CLI
 *
 * @example
 * normalizeDuration(30) // "30s"
 * normalizeDuration("30s") // "30s"
 * normalizeDuration("1m") // "1m"
 * normalizeDuration("500ms") // "500ms"
 * normalizeDuration("1.5s") // "1.5s"
 */
export declare function normalizeDuration(duration: Duration): string;
/**
 * Options for Docker API requests
 */
export interface DockerApiOptions {
    /**
     * Custom path to Docker binary
     */
    dockerPath?: string;
    /**
     * Optional directory that will be used as the Docker CLI configuration
     * directory (equivalent to setting the DOCKER_CONFIG environment variable).
     *
     * This makes authentication actions like `docker login` operate on an
     * isolated credentials store which avoids race-conditions when multiple
     * processes manipulate the default global config simultaneously.
     */
    configDir?: string;
}
type VolumeInfo = {
    CreatedAt: string;
    Driver: string;
    Labels: Record<string, string>;
    Mountpoint: string;
    Name: string;
    Options: Record<string, string>;
    Scope: string;
};
type ContainerInfo = {
    Id: string;
    State: {
        Status: "created" | "running" | "paused" | "stopped" | "exited";
    };
    Created: string;
};
/**
 * Docker API client that wraps Docker CLI commands
 */
export declare class DockerApi {
    /** Path to Docker CLI */
    readonly dockerPath: string;
    /** Directory to use for Docker CLI config */
    readonly configDir?: string;
    /**
     * Create a new Docker API client
     *
     * @param options Docker API options
     */
    constructor(options?: DockerApiOptions);
    /**
     * Run a Docker CLI command
     *
     * @param args Command arguments to pass to Docker CLI
     * @returns Result of the command
     */
    exec(args: string[], remainingAttempts?: number): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Check if Docker daemon is running
     *
     * @returns True if Docker daemon is running
     */
    isRunning(): Promise<boolean>;
    /**
     * Pull Docker image
     *
     * @param image Image name and tag
     * @returns Result of the pull command
     */
    pullImage(image: string): Promise<{
        stdout: string;
        stderr: string;
    }>;
    tagImage(source: string, target: string): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * Build Docker image
     *
     * @param path Path to Dockerfile directory
     * @param tag Tag for the image
     * @param buildArgs Build arguments
     * @returns Result of the build command
     */
    buildImage(path: string, tag: string, buildArgs?: Record<string, string>): Promise<{
        stdout: string;
        stderr: string;
    }>;
    /**
     * List Docker images
     *
     * @returns JSON string containing image list
     */
    listImages(): Promise<string>;
    /**
     * Create Docker container
     *
     * @param image Image name
     * @param name Container name
     * @param options Container options
     * @returns Container ID
     */
    createContainer(image: string, name: string, options?: {
        ports?: Record<string, string>;
        env?: Record<string, string>;
        volumes?: Record<string, string>;
        cmd?: string[];
        healthcheck?: HealthcheckConfig;
    }): Promise<string>;
    /**
     * Start Docker container
     *
     * @param containerId Container ID or name
     */
    startContainer(containerId: string): Promise<void>;
    /**
     * Stop Docker container
     *
     * @param containerId Container ID or name
     */
    stopContainer(containerId: string): Promise<void>;
    /**
     * Remove Docker container
     *
     * @param containerId Container ID or name
     * @param force Force removal
     */
    removeContainer(containerId: string, force?: boolean): Promise<void>;
    /**
     * Get container logs
     *
     * @param containerId Container ID or name
     * @returns Container logs
     */
    getContainerLogs(containerId: string): Promise<string>;
    /**
     * Get Docker container information
     *
     * @param containerId Container ID or name
     * @returns Container details in JSON format
     */
    inspectContainer(containerId: string): Promise<ContainerInfo[]>;
    /**
     * Check if a container exists
     *
     * @param containerId Container ID or name
     * @returns True if container exists
     */
    containerExists(containerId: string): Promise<boolean>;
    /**
     * Create Docker network
     *
     * @param name Network name
     * @param driver Network driver
     * @returns Network ID
     */
    createNetwork(name: string, driver?: string): Promise<string>;
    /**
     * Remove Docker network
     *
     * @param networkId Network ID or name
     */
    removeNetwork(networkId: string): Promise<void>;
    /**
     * Connect container to network
     *
     * @param containerId Container ID or name
     * @param networkId Network ID or name
     */
    connectNetwork(containerId: string, networkId: string, options?: {
        aliases?: string[];
    }): Promise<void>;
    /**
     * Disconnect container from network
     *
     * @param containerId Container ID or name
     * @param networkId Network ID or name
     */
    disconnectNetwork(containerId: string, networkId: string): Promise<void>;
    /**
     * Create Docker volume
     *
     * @param name Volume name
     * @param driver Volume driver
     * @param driverOpts Driver options
     * @param labels Volume labels
     * @returns Volume name
     */
    createVolume(name: string, driver?: string, driverOpts?: Record<string, string>, labels?: Record<string, string>): Promise<string>;
    /**
     * Remove Docker volume
     *
     * @param volumeName Volume name
     * @param force Force removal of the volume
     */
    removeVolume(volumeName: string, force?: boolean): Promise<void>;
    /**
     * Get Docker volume information
     *
     * @param volumeName Volume name
     * @returns Volume details in JSON format
     */
    inspectVolume(volumeName: string): Promise<VolumeInfo[]>;
    /**
     * Check if a volume exists
     *
     * @param volumeName Volume name
     * @returns True if volume exists
     */
    volumeExists(volumeName: string): Promise<boolean>;
    /**
     * Login to a Docker registry
     *
     * @param registry Registry URL
     * @param username Username for authentication
     * @param password Password for authentication
     * @returns Promise that resolves when login is successful
     */
    login(registry: string, username: string, password: string): Promise<void>;
    /**
     * Logout from a Docker registry
     *
     * @param registry Registry URL
     */
    logout(registry: string): Promise<void>;
}
export {};
//# sourceMappingURL=api.d.ts.map