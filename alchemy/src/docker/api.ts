import { execa } from "execa";
import { Buffer } from "node:buffer";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "pathe";
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
export function normalizeDuration(duration: Duration): string {
  if (typeof duration === "number") {
    return `${duration}s`;
  }

  // Validate string format: must be a number followed by unit (ms|s|m|h)
  const match = duration.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
  if (!match) {
    throw new Error(
      `Invalid duration format: "${duration}". Expected format: number followed by unit (ms|s|m|h), e.g., "30s", "1m", "500ms"`,
    );
  }

  return duration;
}

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

/**
 * Docker API client that wraps Docker CLI commands
 */
export class DockerApi {
  /** Path to Docker CLI */
  readonly dockerPath: string;
  /** Directory to use for Docker CLI config */
  readonly configDir?: string;

  /**
   * Create a new Docker API client
   *
   * @param options Docker API options
   */
  constructor(options: DockerApiOptions = {}) {
    this.dockerPath = options.dockerPath || "docker";
    this.configDir = options.configDir;
  }

  /**
   * Run a Docker CLI command
   *
   * @param args Command arguments to pass to Docker CLI
   * @returns Result of the command
   */
  async exec(
    args: string[],
    remainingAttempts = 3,
  ): Promise<{ stdout: string; stderr: string }> {
    // If a custom config directory is provided, ensure all commands use it by
    // setting the DOCKER_CONFIG env variable for the spawned process.
    const env = this.configDir
      ? { ...process.env, DOCKER_CONFIG: this.configDir }
      : process.env;

    // Buffers to capture output
    let stdout = "";
    let stderr = "";

    // Create the subprocess
    const subprocess = execa(this.dockerPath, args, {
      env: env,
      // Don't buffer - we'll handle streams manually
      buffer: false,
      encoding: "utf8",
    });

    // Stream stdout in real-time
    subprocess.stdout?.on("data", (chunk: string) => {
      process.stdout.write(chunk);
      stdout += chunk;
    });

    // Stream stderr in real-time
    subprocess.stderr?.on("data", (chunk: string) => {
      process.stderr.write(chunk);
      stderr += chunk;
    });

    // Wait for the process to complete
    try {
      await subprocess;
    } catch (error: any) {
      const message = stderr || error.message || "Command failed";
      if (
        message.includes("unexpected status from HEAD request") &&
        remainingAttempts > 0
      ) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return this.exec(args, remainingAttempts - 1);
      }
      // Process failed, but we still have the output
      throw new Error(message);
    }

    return { stdout, stderr };
  }

  /**
   * Check if Docker daemon is running
   *
   * @returns True if Docker daemon is running
   */
  async isRunning(): Promise<boolean> {
    try {
      // Use a quick, lightweight command to test if Docker is running
      await this.exec(["version", "--format", "{{.Server.Version}}"]);
      return true;
    } catch (error) {
      console.log(
        `Docker daemon not running: ${error instanceof Error ? error.message : String(error)}`,
      );
      return false;
    }
  }

  /**
   * Pull Docker image
   *
   * @param image Image name and tag
   * @returns Result of the pull command
   */
  async pullImage(image: string): Promise<{ stdout: string; stderr: string }> {
    return this.exec(["pull", image]);
  }

  /**
   * Build Docker image
   *
   * @param path Path to Dockerfile directory
   * @param tag Tag for the image
   * @param buildArgs Build arguments
   * @returns Result of the build command
   */
  async buildImage(
    path: string,
    tag: string,
    buildArgs: Record<string, string> = {},
  ): Promise<{ stdout: string; stderr: string }> {
    const args = ["build", "-t", tag, path];

    for (const [key, value] of Object.entries(buildArgs)) {
      args.push("--build-arg", `${key}=${value}`);
    }

    return this.exec(args);
  }

  /**
   * List Docker images
   *
   * @returns JSON string containing image list
   */
  async listImages(): Promise<string> {
    const { stdout } = await this.exec(["images", "--format", "{{json .}}"]);
    return stdout;
  }

  /**
   * Create Docker container
   *
   * @param image Image name
   * @param name Container name
   * @param options Container options
   * @returns Container ID
   */
  async createContainer(
    image: string,
    name: string,
    options: {
      ports?: Record<string, string>;
      env?: Record<string, string>;
      volumes?: Record<string, string>;
      cmd?: string[];
      healthcheck?: HealthcheckConfig;
    } = {},
  ): Promise<string> {
    const args = ["create", "--name", name];

    // Add port mappings
    if (options.ports) {
      for (const [hostPort, containerPort] of Object.entries(options.ports)) {
        args.push("-p", `${hostPort}:${containerPort}`);
      }
    }

    // Add environment variables
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        args.push("-e", `${key}=${value}`);
      }
    }

    // Add volume mappings
    if (options.volumes) {
      for (const [hostPath, containerPath] of Object.entries(options.volumes)) {
        args.push("-v", `${hostPath}:${containerPath}`);
      }
    }

    // Add healthcheck configuration
    if (options.healthcheck) {
      const hc = options.healthcheck;

      // Format the cmd
      const cmdStr = Array.isArray(hc.cmd) ? hc.cmd.join(" ") : hc.cmd;
      args.push("--health-cmd", cmdStr);

      // Add interval
      if (hc.interval !== undefined) {
        args.push("--health-interval", normalizeDuration(hc.interval));
      }

      // Add timeout
      if (hc.timeout !== undefined) {
        args.push("--health-timeout", normalizeDuration(hc.timeout));
      }

      // Add retries
      if (hc.retries !== undefined) {
        args.push("--health-retries", String(hc.retries));
      }

      // Add start period
      if (hc.startPeriod !== undefined) {
        args.push("--health-start-period", normalizeDuration(hc.startPeriod));
      }

      // Add start interval (API 1.44+)
      if (hc.startInterval !== undefined) {
        args.push(
          "--health-start-interval",
          normalizeDuration(hc.startInterval),
        );
      }
    }

    args.push(image);

    // Add command if specified
    if (options.cmd && options.cmd.length > 0) {
      args.push(...options.cmd);
    }

    const { stdout } = await this.exec(args);
    return stdout.trim();
  }

  /**
   * Start Docker container
   *
   * @param containerId Container ID or name
   */
  async startContainer(containerId: string): Promise<void> {
    await this.exec(["start", containerId]);
  }

  /**
   * Stop Docker container
   *
   * @param containerId Container ID or name
   */
  async stopContainer(containerId: string): Promise<void> {
    await this.exec(["stop", containerId]);
  }

  /**
   * Remove Docker container
   *
   * @param containerId Container ID or name
   * @param force Force removal
   */
  async removeContainer(containerId: string, force = false): Promise<void> {
    const args = ["rm"];
    if (force) {
      args.push("-f");
    }
    args.push(containerId);
    await this.exec(args);
  }

  /**
   * Get container logs
   *
   * @param containerId Container ID or name
   * @returns Container logs
   */
  async getContainerLogs(containerId: string): Promise<string> {
    const { stdout } = await this.exec(["logs", containerId]);
    return stdout;
  }

  /**
   * Check if a container exists
   *
   * @param containerId Container ID or name
   * @returns True if container exists
   */
  async containerExists(containerId: string): Promise<boolean> {
    try {
      await this.exec(["inspect", containerId]);
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Create Docker network
   *
   * @param name Network name
   * @param driver Network driver
   * @returns Network ID
   */
  async createNetwork(name: string, driver = "bridge"): Promise<string> {
    const { stdout } = await this.exec([
      "network",
      "create",
      "--driver",
      driver,
      name,
    ]);
    return stdout.trim();
  }

  /**
   * Remove Docker network
   *
   * @param networkId Network ID or name
   */
  async removeNetwork(networkId: string): Promise<void> {
    await this.exec(["network", "rm", networkId]);
  }

  /**
   * Connect container to network
   *
   * @param containerId Container ID or name
   * @param networkId Network ID or name
   */
  async connectNetwork(
    containerId: string,
    networkId: string,
    options: {
      aliases?: string[];
    } = {},
  ): Promise<void> {
    const args = ["network", "connect"];
    if (options.aliases) {
      for (const alias of options.aliases) {
        args.push("--alias", alias);
      }
    }
    args.push(networkId, containerId);
    await this.exec(args);
  }

  /**
   * Disconnect container from network
   *
   * @param containerId Container ID or name
   * @param networkId Network ID or name
   */
  async disconnectNetwork(
    containerId: string,
    networkId: string,
  ): Promise<void> {
    await this.exec(["network", "disconnect", networkId, containerId]);
  }

  /**
   * Create Docker volume
   *
   * @param name Volume name
   * @param driver Volume driver
   * @param driverOpts Driver options
   * @param labels Volume labels
   * @returns Volume name
   */
  async createVolume(
    name: string,
    driver = "local",
    driverOpts: Record<string, string> = {},
    labels: Record<string, string> = {},
  ): Promise<string> {
    const args = ["volume", "create", "--name", name, "--driver", driver];

    // Add driver options
    for (const [key, value] of Object.entries(driverOpts)) {
      args.push("--opt", `${key}=${value}`);
    }

    // Add labels
    for (const [key, value] of Object.entries(labels)) {
      args.push("--label", `${key}=${value}`);
    }

    const { stdout } = await this.exec(args);
    return stdout.trim();
  }

  /**
   * Remove Docker volume
   *
   * @param volumeName Volume name
   * @param force Force removal of the volume
   */
  async removeVolume(volumeName: string, force = false): Promise<void> {
    const args = ["volume", "rm"];
    if (force) {
      args.push("--force");
    }
    args.push(volumeName);
    await this.exec(args);
  }

  /**
   * Get Docker volume information
   *
   * @param volumeName Volume name
   * @returns Volume details in JSON format
   */
  async inspectVolume(volumeName: string): Promise<VolumeInfo[]> {
    const { stdout } = await this.exec(["volume", "inspect", volumeName]);
    try {
      return JSON.parse(stdout.trim()) as VolumeInfo[];
    } catch (_error) {
      return [];
    }
  }

  /**
   * Check if a volume exists
   *
   * @param volumeName Volume name
   * @returns True if volume exists
   */
  async volumeExists(volumeName: string): Promise<boolean> {
    try {
      await this.inspectVolume(volumeName);
      return true;
    } catch (_error) {
      return false;
    }
  }

  /**
   * Login to a Docker registry
   *
   * @param registry Registry URL
   * @param username Username for authentication
   * @param password Password for authentication
   * @returns Promise that resolves when login is successful
   */
  async login(
    registry: string,
    username: string,
    password: string,
  ): Promise<void> {
    // If we have a custom config directory, write credentials directly to
    // config.json to avoid race conditions with the global credential store
    if (this.configDir) {
      const authConfigPath = path.join(this.configDir, "config.json");
      const authToken = Buffer.from(`${username}:${password}`).toString(
        "base64",
      );

      const configJson = {
        auths: {
          [registry]: {
            auth: authToken,
          },
        },
      };

      await fs.writeFile(authConfigPath, JSON.stringify(configJson));
      return;
    }

    // Fallback to original docker login behavior for backwards compatibility
    return new Promise((resolve, reject) => {
      const args = [
        "login",
        registry,
        "--username",
        username,
        "--password-stdin",
      ];

      const child = spawn(this.dockerPath, args, {
        stdio: ["pipe", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      child.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(
              `Docker login failed with exit code ${code}: ${stderr || stdout}`,
            ),
          );
        }
      });

      child.on("error", (err) => {
        reject(new Error(`Docker login failed: ${err.message}`));
      });

      // Write password to stdin and close the stream
      child.stdin.write(password);
      child.stdin.end();
    });
  }

  /**
   * Logout from a Docker registry
   *
   * @param registry Registry URL
   */
  async logout(registry: string): Promise<void> {
    // If we have a custom config directory, we can just remove the auth entry
    // or delete the config file entirely since it's isolated
    if (this.configDir) {
      try {
        const authConfigPath = path.join(this.configDir, "config.json");
        await fs.unlink(authConfigPath);
      } catch {
        // Ignore errors - file might not exist or already be deleted
      }
      return;
    }

    // Fallback to original docker logout behavior
    try {
      await this.exec(["logout", registry]);
    } catch (error) {
      // Ignore logout errors as they're not critical
      console.warn(`Docker logout failed: ${error}`);
    }
  }
}
