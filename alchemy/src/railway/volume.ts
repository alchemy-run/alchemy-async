import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { RailwayApi, type RailwayApiOptions } from "./api.ts";
import { runRailwayDeleteMutation } from "./delete-retry.ts";
import type { Environment } from "./environment.ts";
import type { Project } from "./project.ts";
import type { Service } from "./service.ts";

/**
 * Properties for creating or updating a Railway Volume
 */
export interface VolumeProps extends RailwayApiOptions {
  /**
   * The project this volume belongs to
   */
  project: string | Project;

  /**
   * The service to attach the volume to
   */
  service: string | Service;

  /**
   * The environment for the volume
   */
  environment: string | Environment;

  /**
   * Mount path inside the container
   */
  mountPath: string;

  /**
   * Name of the volume
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Whether to delete the volume when removed from Alchemy
   * @default true
   */
  delete?: boolean;
}

/**
 * Output type for a Railway Volume
 */
export type Volume = Omit<
  VolumeProps,
  "delete" | "project" | "service" | "environment"
> & {
  /**
   * The Railway volume ID
   */
  volumeId: string;

  /**
   * The project ID
   */
  projectId: string;

  /**
   * The service ID
   */
  serviceId: string;

  /**
   * The environment ID
   */
  environmentId: string;

  /**
   * Name of the volume
   */
  name: string;

  /**
   * Mount path of the volume
   */
  mountPath: string;
};

/**
 * Type guard for Railway Volume
 */
export function isVolume(resource: any): resource is Volume {
  return resource?.[ResourceKind] === "railway::Volume";
}

/**
 * Creates and manages a Railway persistent volume attached to a service.
 *
 * @example
 * ## Create a volume for data persistence
 *
 * Attach a persistent volume to a service.
 *
 * ```ts
 * const volume = await Volume("data", {
 *   project,
 *   service,
 *   environment: project.defaultEnvironmentId,
 *   mountPath: "/data",
 *   name: "app-data",
 * });
 * ```
 *
 * @example
 * ## Create a volume with delete protection
 *
 * Keep the volume even when removed from Alchemy.
 *
 * ```ts
 * const volume = await Volume("db-data", {
 *   project: "project-id",
 *   service: "service-id",
 *   environment: "env-id",
 *   mountPath: "/var/lib/postgresql/data",
 *   delete: false,
 * });
 * ```
 */
export const Volume = Resource(
  "railway::Volume",
  async function (
    this: Context<Volume>,
    id: string,
    props: VolumeProps,
  ): Promise<Volume> {
    const projectId =
      typeof props.project === "string"
        ? props.project
        : props.project.projectId;
    const serviceId =
      typeof props.service === "string"
        ? props.service
        : props.service.serviceId;
    const environmentId =
      typeof props.environment === "string"
        ? props.environment
        : props.environment.environmentId;
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.scope.local) {
      if (this.phase === "delete") {
        return this.destroy();
      }
      return {
        volumeId: this.output?.volumeId ?? "",
        projectId,
        serviceId,
        environmentId,
        name,
        mountPath: props.mountPath,
      };
    }

    const api = new RailwayApi(props);

    if (this.phase === "delete") {
      const volumeId = this.output?.volumeId;
      if (props.delete !== false && volumeId) {
        await runRailwayDeleteMutation(() =>
          api.query(
            `mutation volumeDelete($volumeId: String!) {
              volumeDelete(volumeId: $volumeId)
            }`,
            { volumeId },
          ),
        );
      }
      return this.destroy();
    }

    // mountPath is immutable — replace if changed
    if (this.phase === "update" && this.output?.mountPath !== props.mountPath) {
      return this.replace();
    }

    const volumeId = this.output?.volumeId;

    if (volumeId && this.output) {
      // No update needed — mountPath and name are immutable
      return this.output;
    }

    // Create
    const data = await api.query<{
      volumeCreate: {
        id: string;
        name: string;
      };
    }>(
      `mutation volumeCreate($input: VolumeCreateInput!) {
        volumeCreate(input: $input) {
          id
          name
        }
      }`,
      {
        input: {
          projectId,
          serviceId,
          environmentId,
          mountPath: props.mountPath,
        },
      },
    );

    return {
      volumeId: data.volumeCreate.id,
      projectId,
      serviceId,
      environmentId,
      name: data.volumeCreate.name || name,
      mountPath: props.mountPath,
    };
  },
);
