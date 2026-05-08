import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { createHetznerApi, type HetznerApiOptions } from "./api.ts";
import { isServer, type Server } from "./server.ts";

export interface VolumeProps extends HetznerApiOptions {
  /**
   * Volume name. Defaults to a physical name derived from the resource id.
   */
  name?: string;

  /**
   * Size in GB. Can only be increased, never decreased.
   */
  size: number;

  /**
   * Location (e.g. "fsn1"). Required when not attaching to a server at create time.
   */
  location?: string;

  /**
   * Server to attach the volume to. Accepts a server ID string or a Server resource output.
   */
  server?: string | Server;

  /**
   * Filesystem format to initialise on create.
   */
  format?: "xfs" | "ext4";

  /**
   * Labels to attach to the volume.
   */
  labels?: Record<string, string>;

  /**
   * Adopt an existing volume by name instead of creating a new one.
   */
  adopt?: boolean;

  /**
   * Whether to delete the volume on destroy.
   * @default true
   */
  delete?: boolean;
}

export type Volume = Omit<VolumeProps, "adopt"> & {
  /** Hetzner numeric volume ID */
  id: number;
  name: string;
  status: "creating" | "available";
  /** Linux device path, e.g. "/dev/disk/by-id/scsi-..." */
  linuxDevice: string;
  created: string;
};

// ---------------------------------------------------------------------------
// Internal API response shapes
// ---------------------------------------------------------------------------

interface HetznerVolume {
  id: number;
  name: string;
  status: "creating" | "available";
  size: number;
  server: number | null;
  location: { name: string };
  linux_device: string;
  format: string | null;
  labels: Record<string, string>;
  created: string;
}

interface VolumeResponse {
  volume: HetznerVolume;
}

interface VolumeListResponse {
  volumes: HetznerVolume[];
}

interface ActionResponse {
  action: { id: number; status: string };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveServerId(
  server: string | Server | undefined,
): number | undefined {
  if (server === undefined) return undefined;
  if (isServer(server)) return server.id;
  const parsed = parseInt(server, 10);
  if (isNaN(parsed)) throw new Error(`Invalid server reference: ${server}`);
  return parsed;
}

function mapVolume(
  raw: HetznerVolume,
  props: Omit<VolumeProps, "adopt">,
): Volume {
  return {
    ...props,
    id: raw.id,
    name: raw.name,
    status: raw.status,
    size: raw.size,
    location: raw.location.name,
    linuxDevice: raw.linux_device,
    format: (raw.format ?? undefined) as "xfs" | "ext4" | undefined,
    labels: raw.labels,
    created: raw.created,
  };
}

async function waitForAvailable(
  api: ReturnType<typeof createHetznerApi>,
  volumeId: number,
  timeoutMs = 120_000,
): Promise<HetznerVolume> {
  const deadline = Date.now() + timeoutMs;
  let delay = 1_000;
  while (Date.now() < deadline) {
    const { volume } = await api.get<VolumeResponse>(`/volumes/${volumeId}`);
    if (volume.status === "available") return volume;
    await new Promise((r) => setTimeout(r, delay));
    delay = Math.min(delay * 2, 5_000);
  }
  throw new Error(
    `Hetzner volume ${volumeId} did not become available within ${timeoutMs}ms`,
  );
}

// ---------------------------------------------------------------------------
// Resource
// ---------------------------------------------------------------------------

/**
 * Hetzner Cloud Volume resource.
 *
 * Creates and manages a block storage volume. Volumes can be attached to servers
 * and resized (only upward). Detach / re-attach is handled automatically when
 * the `server` prop changes.
 *
 * @example
 * // Create a 20 GB volume in the Falkenstein location
 * const vol = await Volume("data", {
 *   size: 20,
 *   location: "fsn1",
 *   format: "ext4",
 * });
 *
 * @example
 * // Create and immediately attach to a server
 * const vol = await Volume("data", {
 *   size: 50,
 *   server: myServer,
 *   format: "xfs",
 * });
 *
 * @example
 * // Adopt an existing volume (by name) without creating a new one
 * const vol = await Volume("existing", {
 *   name: "my-existing-volume",
 *   size: 20,
 *   adopt: true,
 * });
 */
export const Volume = Resource(
  "hetzner::Volume",
  async function (
    this: Context<Volume>,
    id: string,
    props: VolumeProps,
  ): Promise<Volume> {
    // ------------------------------------------------------------------
    // Local mode — return a mock without calling the API
    // ------------------------------------------------------------------
    if (this.scope.local) {
      if (this.phase === "delete") return this.destroy();
      return {
        ...props,
        id: 0,
        name: props.name ?? id,
        status: "available",
        linuxDevice: "/dev/disk/by-id/scsi-local",
        created: new Date().toISOString(),
      };
    }

    const api = createHetznerApi(props);

    // ------------------------------------------------------------------
    // Delete
    // ------------------------------------------------------------------
    if (this.phase === "delete") {
      if (this.output?.id && props.delete !== false) {
        // Detach first if the volume is attached
        if (this.output.server !== undefined) {
          const { action } = await api.post<ActionResponse>(
            `/volumes/${this.output.id}/actions/detach`,
          );
          await api.waitForAction(action.id);
        }
        await api.delete(`/volumes/${this.output.id}`);
      }
      return this.destroy();
    }

    // ------------------------------------------------------------------
    // Update
    // ------------------------------------------------------------------
    if (this.phase === "update") {
      const current = this.output;

      // Size can only increase
      if (props.size < current.size) {
        throw new Error(
          `Hetzner volumes cannot be shrunk (current: ${current.size} GB, requested: ${props.size} GB).`,
        );
      }

      // Resize if size has grown
      if (props.size > current.size) {
        const { action } = await api.post<ActionResponse>(
          `/volumes/${current.id}/actions/resize`,
          { size: props.size },
        );
        await api.waitForAction(action.id);
      }

      // Update name / labels
      const needsMetaUpdate =
        (props.name !== undefined && props.name !== current.name) ||
        JSON.stringify(props.labels ?? {}) !==
          JSON.stringify(current.labels ?? {});

      if (needsMetaUpdate) {
        await api.put<VolumeResponse>(`/volumes/${current.id}`, {
          name: props.name ?? current.name,
          labels: props.labels ?? {},
        });
      }

      // Handle server attachment changes
      const newServerId = resolveServerId(props.server);
      const currentServerId = resolveServerId(current.server);

      if (newServerId !== currentServerId) {
        if (currentServerId !== undefined) {
          const { action } = await api.post<ActionResponse>(
            `/volumes/${current.id}/actions/detach`,
          );
          await api.waitForAction(action.id);
        }
        if (newServerId !== undefined) {
          const { action } = await api.post<ActionResponse>(
            `/volumes/${current.id}/actions/attach`,
            { server: newServerId },
          );
          await api.waitForAction(action.id);
        }
      }

      const { volume: updated } = await api.get<VolumeResponse>(
        `/volumes/${current.id}`,
      );
      return mapVolume(updated, props);
    }

    // ------------------------------------------------------------------
    // Create (or adopt)
    // ------------------------------------------------------------------
    const volumeName = props.name ?? this.scope.createPhysicalName(id);

    if (props.adopt) {
      // Find an existing volume by name
      const { volumes } = await api.get<VolumeListResponse>(
        `/volumes?name=${encodeURIComponent(volumeName)}`,
      );
      if (!volumes.length) {
        throw new Error(
          `No Hetzner volume named "${volumeName}" found to adopt.`,
        );
      }
      return mapVolume(volumes[0], props);
    }

    const serverId = resolveServerId(props.server);
    const body: Record<string, unknown> = {
      name: volumeName,
      size: props.size,
      labels: props.labels ?? {},
    };
    if (props.location) body.location = props.location;
    if (serverId !== undefined) body.server = serverId;
    if (props.format) body.format = props.format;

    const { volume: created } = await api.post<VolumeResponse>(
      "/volumes",
      body,
    );

    const ready = await waitForAvailable(api, created.id);
    return mapVolume(ready, props);
  },
);
