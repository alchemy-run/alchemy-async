import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import {
  createRailwayApi,
  type RailwayApiOptions,
  RailwayError,
} from "./api.ts";
import { isEnvironment, type Environment } from "./environment.ts";
import { isProject, type Project } from "./project.ts";
import { isService, type Service } from "./service.ts";

/**
 * Properties for creating a Railway volume
 */
export interface VolumeProps extends RailwayApiOptions {
  /**
   * The project to create the volume in
   */
  project: string | Project;

  /**
   * The service to attach the volume to
   */
  service: string | Service;

  /**
   * The environment to create the volume in
   */
  environment: string | Environment;

  /**
   * Name of the volume
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Mount path inside the container
   */
  mountPath: string;

  /**
   * Whether to delete the volume when the resource is destroyed.
   * Note: Deleting a volume will permanently delete all data.
   * @default true
   */
  delete?: boolean;
}

/**
 * Output returned after Railway volume creation
 */
export interface Volume {
  /**
   * The ID of the volume
   */
  id: string;

  /**
   * Name of the volume
   */
  name: string;

  /**
   * Mount path inside the container
   */
  mountPath: string;

  /**
   * The project ID this volume belongs to
   */
  projectId: string;

  /**
   * The service ID this volume is attached to
   */
  serviceId: string;

  /**
   * The environment ID this volume belongs to
   */
  environmentId: string;

  /**
   * Time at which the volume was created
   */
  createdAt: string;
}

/**
 * GraphQL response types
 * @internal
 */
interface VolumeCreateResponse {
  volumeCreate: {
    id: string;
    name: string;
    mountPath: string;
    projectId: string;
    createdAt: string;
  };
}

interface VolumeUpdateResponse {
  volumeUpdate: {
    id: string;
    name: string;
    mountPath: string;
    projectId: string;
    createdAt: string;
  };
}

const VOLUME_FIELDS = `
  id
  name
  mountPath
  projectId
  createdAt
`;

/**
 * Type guard for Railway Volume
 */
export function isVolume(resource: any): resource is Volume {
  return resource?.[ResourceKind] === "railway::Volume";
}

/**
 * Get the project ID from a project reference
 */
function getProjectId(project: string | Project): string {
  if (isProject(project)) {
    return project.id;
  }
  return project;
}

/**
 * Get the service ID from a service reference
 */
function getServiceId(service: string | Service): string {
  if (isService(service)) {
    return service.id;
  }
  return service;
}

/**
 * Get the environment ID from an environment reference
 */
function getEnvironmentId(environment: string | Environment): string {
  if (isEnvironment(environment)) {
    return environment.id;
  }
  return environment;
}

/**
 * Creates a Railway volume for persistent storage.
 *
 * @example
 * // Create a volume for database storage:
 * const dataVolume = await Volume("data", {
 *   project: project,
 *   service: dbService,
 *   environment: production,
 *   name: "postgres-data",
 *   mountPath: "/var/lib/postgresql/data"
 * });
 *
 * @example
 * // Create a volume for file uploads:
 * const uploadsVolume = await Volume("uploads", {
 *   project: project,
 *   service: apiService,
 *   environment: production,
 *   mountPath: "/app/uploads"
 * });
 */
export const Volume = Resource(
  "railway::Volume",
  async function (
    this: Context<Volume>,
    id: string,
    props: VolumeProps,
  ): Promise<Volume> {
    const api = createRailwayApi(props);
    const projectId = getProjectId(props.project);
    const serviceId = getServiceId(props.service);
    const environmentId = getEnvironmentId(props.environment);
    const name =
      props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

    if (this.phase === "delete") {
      if (props.delete !== false && this.output?.id) {
        try {
          await api.request(
            `
            mutation volumeDelete($id: String!) {
              volumeDelete(id: $id)
            }
          `,
            { id: this.output.id },
          );
        } catch (error) {
          // Ignore 404 errors (volume already deleted)
          if (error instanceof RailwayError && error.code === "NOT_FOUND") {
            // Already deleted, that's fine
          } else {
            throw error;
          }
        }
      }
      return this.destroy();
    }

    // Update existing volume
    if (this.phase === "update" && this.output?.id) {
      // Mount path change requires replacement
      if (this.output.mountPath !== props.mountPath) {
        return this.replace();
      }

      // Update name if changed
      if (this.output.name !== name) {
        const data = await api.request<VolumeUpdateResponse>(
          `
          mutation volumeUpdate($id: String!, $input: VolumeUpdateInput!) {
            volumeUpdate(id: $id, input: $input) {
              ${VOLUME_FIELDS}
            }
          }
        `,
          {
            id: this.output.id,
            input: { name },
          },
        );

        return {
          id: data.volumeUpdate.id,
          name: data.volumeUpdate.name,
          mountPath: data.volumeUpdate.mountPath,
          projectId: data.volumeUpdate.projectId,
          serviceId,
          environmentId,
          createdAt: data.volumeUpdate.createdAt,
        };
      }

      return this.output;
    }

    // Create new volume
    const data = await api.request<VolumeCreateResponse>(
      `
      mutation volumeCreate($input: VolumeCreateInput!) {
        volumeCreate(input: $input) {
          ${VOLUME_FIELDS}
        }
      }
    `,
      {
        input: {
          projectId,
          serviceId,
          environmentId,
          mountPath: props.mountPath,
        },
      },
    );

    // Update volume name if different from default
    if (name !== data.volumeCreate.name) {
      const updateData = await api.request<VolumeUpdateResponse>(
        `
        mutation volumeUpdate($id: String!, $input: VolumeUpdateInput!) {
          volumeUpdate(id: $id, input: $input) {
            ${VOLUME_FIELDS}
          }
        }
      `,
        {
          id: data.volumeCreate.id,
          input: { name },
        },
      );

      return {
        id: updateData.volumeUpdate.id,
        name: updateData.volumeUpdate.name,
        mountPath: updateData.volumeUpdate.mountPath,
        projectId: updateData.volumeUpdate.projectId,
        serviceId,
        environmentId,
        createdAt: updateData.volumeUpdate.createdAt,
      };
    }

    return {
      id: data.volumeCreate.id,
      name: data.volumeCreate.name,
      mountPath: data.volumeCreate.mountPath,
      projectId: data.volumeCreate.projectId,
      serviceId,
      environmentId,
      createdAt: data.volumeCreate.createdAt,
    };
  },
);
