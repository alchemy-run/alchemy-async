import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { Secret } from "../secret.ts";
import {
  DockerApi,
  normalizeDuration,
  type ContainerInfo,
  type ContainerRuntimeInfo,
} from "./api.ts";
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
  environment?: Record<string, string | Secret>;

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
  state: "created" | "running" | "paused" | "stopped" | "exited";

  /**
   * Time when the container was created
   */
  createdAt: number;

  /**
   * Inspect the container to get detailed information
   */
  inspect(): Promise<ContainerRuntimeInfo>;
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
  { alwaysUpdate: true },
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

    let containerState: Container["state"] = "created";

    // Check if container already exists
    const containerExists = await api.containerExists(containerName);

    if (containerExists) {
      // Create phase - check for adoption
      if (this.phase === "create" && !props.adopt) {
        throw new Error(
          `Container "${containerName}" already exists. Use adopt: true to adopt it.`,
        );
      }

      const [containerInfo] = await api.inspectContainer(containerName);

      // Compute what changes are needed
      if (shouldReplace(imageRef, props, containerInfo)) {
        // Need to recreate - remove existing container
        if (this.phase === "update") {
          // In update phase, we can replace the resource
          // Force because we need to delete the old one first if the name is the same
          return this.replace(true);
        } else {
          // In create phase, we cannot replace the resource, so manually delete instead
          await api.removeContainer(containerName, true);
        }
      } else {
        // Apply incremental changes without recreating the container

        const { toConnect, toDisconnect } = getNetworkChanges(
          props,
          containerInfo,
        );

        // Apply network disconnections
        for (const network of toDisconnect) {
          await api.disconnectNetwork(containerInfo.Id, network);
        }

        // Apply network connections
        for (const network of toConnect) {
          await api.connectNetwork(containerInfo.Id, network.name, {
            aliases: network.aliases,
          });
        }

        // Optionally start the container if requested
        if (props.start && containerInfo.State.Status !== "running") {
          await api.startContainer(containerInfo.Id);
          containerState = "running";
        }

        return {
          ...props,
          id: containerInfo.Id,
          name: containerName,
          state: containerState,
          createdAt: new Date(containerInfo.Created).getTime(),
          inspect: async () => {
            const [info] = await api.inspectContainer(containerName);
            if (!info) {
              throw new Error(`Container ${containerName} not found`);
            }
            return toRuntimeInfo(info);
          },
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
      env: normalizeEnvironment(props.environment),
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
      inspect: async () => {
        const [info] = await api.inspectContainer(containerName);
        if (!info) {
          throw new Error(`Container ${containerName} not found`);
        }
        return toRuntimeInfo(info);
      },
    };
  },
);

function toRuntimeInfo(info: ContainerInfo): ContainerRuntimeInfo {
  const ports: Record<string, number> = {};
  const networkSettings = info.NetworkSettings;

  if (networkSettings?.Ports) {
    for (const [internal, bindings] of Object.entries(networkSettings.Ports)) {
      if (bindings && bindings.length > 0) {
        ports[internal] = parseInt(bindings[0].HostPort, 10);
      }
    }
  }

  // Also check HostConfig.PortBindings as a fallback or additional source
  // though NetworkSettings.Ports is usually the source of truth for running containers
  if (info.HostConfig.PortBindings) {
    for (const [internal, bindings] of Object.entries(
      info.HostConfig.PortBindings,
    )) {
      if (bindings && bindings.length > 0 && !(internal in ports)) {
        ports[internal] = parseInt(bindings[0].HostPort, 10);
      }
    }
  }

  return {
    ports,
  };
}

function getNetworkChanges(
  props: ContainerProps,
  containerInfo: ContainerInfo,
): { toConnect: NetworkMapping[]; toDisconnect: string[] } {
  const currentNetworks = new Set(
    Object.keys(containerInfo.NetworkSettings.Networks || {}),
  );
  const desiredNetworks = new Map(
    (props.networks || []).map((n) => [n.name, n]),
  );
  const toConnect: NetworkMapping[] = [];
  const toDisconnect: string[] = [];
  for (const network of currentNetworks) {
    if (!desiredNetworks.has(network) && network !== "bridge") {
      toDisconnect.push(network);
    }
  }
  for (const [name, config] of desiredNetworks) {
    if (!currentNetworks.has(name)) {
      toConnect.push(config);
    }
  }
  return { toConnect, toDisconnect };
}

function shouldReplace(
  imageRef: string,
  props: ContainerProps,
  containerInfo: ContainerInfo,
): boolean {
  // Check immutable properties that require recreation

  // Image change - compare the image ID/digest if available
  // The container stores the resolved image ID, so we compare against imageRef
  if (containerInfo.Config.Image !== imageRef) {
    return true;
  }

  // Command change
  const containerCmd = containerInfo.Config.Cmd || [];
  if (
    props.command && // only compare if command is set; otherwise we'd be comparing against the image's default command
    (props.command.length !== containerCmd.length ||
      !props.command.every((c, i) => c === containerCmd[i]))
  ) {
    return true;
  }

  // Environment variables
  if (
    !compareEnv(
      normalizeEnvironment(props.environment),
      containerInfo.Config.Env,
    )
  ) {
    return true;
  }

  // Port bindings
  if (!comparePorts(props.ports, containerInfo.HostConfig.PortBindings)) {
    return true;
  }

  // Volume bindings
  if (!compareVolumes(props.volumes, containerInfo.HostConfig.Binds)) {
    return true;
  }

  // Healthcheck
  if (
    !compareHealthcheck(props.healthcheck, containerInfo.Config.Healthcheck)
  ) {
    return true;
  }

  // Restart policy
  if (
    !compareRestartPolicy(props.restart, containerInfo.HostConfig.RestartPolicy)
  ) {
    return true;
  }

  // AutoRemove (removeOnExit)
  if ((props.removeOnExit || false) !== containerInfo.HostConfig.AutoRemove) {
    return true;
  }

  return false;
}

/**
 * Unwrap secrets in given environment variables
 * @internal
 */
function normalizeEnvironment(
  environment: Record<string, string | Secret> | undefined,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(environment ?? {}).map(([key, value]) => [
      key,
      Secret.unwrap(value),
    ]),
  );
}

/**
 * Normalize port mappings to a comparable format
 * @internal
 */
function normalizePortMappings(
  ports: PortMapping[] | undefined,
): Map<string, string> {
  const map = new Map<string, string>();
  if (!ports) return map;
  for (const port of ports) {
    const protocol = port.protocol || "tcp";
    map.set(`${port.external}`, `${port.internal}/${protocol}`);
  }
  return map;
}

/**
 * Normalize volume mappings to a comparable format
 * @internal
 */
function normalizeVolumeMappings(
  volumes: VolumeMapping[] | undefined,
): Set<string> {
  const set = new Set<string>();
  if (!volumes) return set;
  for (const volume of volumes) {
    const readOnlyFlag = volume.readOnly ? ":ro" : "";
    set.add(`${volume.hostPath}:${volume.containerPath}${readOnlyFlag}`);
  }
  return set;
}

/**
 * Compare environment variables
 * @internal
 */
function compareEnv(
  propsEnv: Record<string, string> | undefined,
  containerEnv: string[] | null,
): boolean {
  const propsEntries = Object.entries(propsEnv || {}).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  const containerEntries = (containerEnv || [])
    .map((e) => {
      const idx = e.indexOf("=");
      return idx >= 0 ? ([e.slice(0, idx), e.slice(idx + 1)] as const) : null;
    })
    .filter((e): e is [string, string] => e !== null)
    // Filter out PATH and other system env vars that Docker adds
    .filter(([key]) => propsEnv && key in propsEnv)
    .sort(([a], [b]) => a.localeCompare(b));

  if (propsEntries.length !== containerEntries.length) return false;
  for (let i = 0; i < propsEntries.length; i++) {
    if (
      propsEntries[i][0] !== containerEntries[i][0] ||
      propsEntries[i][1] !== containerEntries[i][1]
    ) {
      return false;
    }
  }
  return true;
}

/**
 * Compare port bindings
 * @internal
 */
function comparePorts(
  propsPorts: PortMapping[] | undefined,
  containerPorts: Record<
    string,
    Array<{ HostIp: string; HostPort: string }> | null
  > | null,
): boolean {
  const propsMap = normalizePortMappings(propsPorts);

  // Extract container port mappings
  const containerMap = new Map<string, string>();
  if (containerPorts) {
    for (const [containerPort, bindings] of Object.entries(containerPorts)) {
      if (bindings && bindings.length > 0) {
        containerMap.set(bindings[0].HostPort, containerPort);
      }
    }
  }

  if (propsMap.size !== containerMap.size) return false;
  for (const [hostPort, containerPort] of propsMap) {
    if (containerMap.get(hostPort) !== containerPort) return false;
  }
  return true;
}

/**
 * Compare volume bindings
 * @internal
 */
function compareVolumes(
  propsVolumes: VolumeMapping[] | undefined,
  containerBinds: string[] | null,
): boolean {
  const propsSet = normalizeVolumeMappings(propsVolumes);
  const containerSet = new Set(containerBinds || []);

  if (propsSet.size !== containerSet.size) return false;
  for (const bind of propsSet) {
    if (!containerSet.has(bind)) return false;
  }
  return true;
}

/**
 * Compare healthcheck configuration
 * @internal
 */
function compareHealthcheck(
  propsHc: HealthcheckConfig | undefined,
  containerHc:
    | {
        Test: string[] | null;
        Interval?: number;
        Timeout?: number;
        Retries?: number;
        StartPeriod?: number;
        StartInterval?: number;
      }
    | null
    | undefined,
): boolean {
  // Both undefined/null
  if (!propsHc && !containerHc) return true;
  // One defined, one not
  if (!propsHc || !containerHc) return false;

  // Compare command
  const propsCmd = Array.isArray(propsHc.cmd)
    ? propsHc.cmd.join(" ")
    : propsHc.cmd;
  const containerCmd = containerHc.Test
    ? containerHc.Test.slice(1).join(" ")
    : "";
  if (propsCmd !== containerCmd) return false;

  // Helper to convert Duration to nanoseconds for comparison
  const toNanos = (d: Duration | undefined): number => {
    if (d === undefined) return 0;
    const str = normalizeDuration(d);
    const match = str.match(/^(\d+(?:\.\d+)?)(ms|s|m|h)$/);
    if (!match) return 0;
    const value = parseFloat(match[1]);
    const unit = match[2];
    switch (unit) {
      case "ms":
        return value * 1_000_000;
      case "s":
        return value * 1_000_000_000;
      case "m":
        return value * 60 * 1_000_000_000;
      case "h":
        return value * 3600 * 1_000_000_000;
      default:
        return 0;
    }
  };

  if (toNanos(propsHc.interval) !== (containerHc.Interval || 0)) return false;
  if (toNanos(propsHc.timeout) !== (containerHc.Timeout || 0)) return false;
  if ((propsHc.retries || 0) !== (containerHc.Retries || 0)) return false;
  if (toNanos(propsHc.startPeriod) !== (containerHc.StartPeriod || 0))
    return false;
  if (toNanos(propsHc.startInterval) !== (containerHc.StartInterval || 0))
    return false;

  return true;
}

/**
 * Compare restart policy
 * @internal
 */
function compareRestartPolicy(
  propsRestart: ContainerProps["restart"] | undefined,
  containerRestart: { Name: string; MaximumRetryCount: number },
): boolean {
  const propsPolicy = propsRestart || "no";
  return propsPolicy === containerRestart.Name;
}
