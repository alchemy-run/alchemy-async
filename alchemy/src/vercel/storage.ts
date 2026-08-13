import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import type { Secret } from "../secret.ts";
import { createVercelApi } from "./api";
import type { StorageProject, StorageProjectMetadata, StorageType } from "./storage.types.ts";
import { createProjectsConnection, createStorage, deleteProjectsConnection, deleteStorage, projectPropsChanged, readStorage } from './storage.utils.ts';
import type { VercelRegions, VercelTeam } from "./vercel.types.ts";


export interface StorageProps {
  /**
   * The name of the storage
   */
  name?: string;

  /**
   * The region of the storage
   */
  region: VercelRegions;

  /**
   * The team of the storage
   */
  team: string | VercelTeam;

  /**
   * The type of the storage
   */
  type: StorageType;

  /**
   * The projects that the storage belongs to
   */
  projects?: StorageProject[];
}

export interface Storage extends Resource<"vercel::Storage">, StorageProps {
  /**
   * The billing state of the storage
   */
  billingState: string;

  /**
   * The number of connections to the storage
   */
  count: number;

  /**
   * The creation time of the storage
   */
  createdAt: number;

  /**
   * The ID of the storage
   */
  id: string;

  /**
   * The name of the storage
   */
  name: string;

  /**
   * The owner ID of the storage
   */
  ownerId: string;

  /**
   * The projects metadata of the storage
   */
  projectsMetadata: StorageProjectMetadata[];

  /**
   * The region of the storage
   */
  region: VercelRegions;

  /**
   * The size of the storage
   */
  size: number;

  /**
   * The status of the storage
   */
  status: string;

  /**
   * The type of the storage
   */
  type: StorageType;

  /**
   * The update time of the storage
   */
  updatedAt: number;

  /**
   * Whether the usage quota has been exceeded
   */
  usageQuotaExceeded: boolean;
}

/**
 * Create and manage Vercel storage resources.
 * Blob Storage support only for now.
 *
 * @example
 * // With accessToken
 * const storage = await Storage("my-storage", {
 *   accessToken: alchemy.secret(process.env.VERCEL_ACCESS_TOKEN),
 *   name: "my-storage",
 *   region: "iad1",
 *   team: "my-team",
 *   type: "blob"
 * });
 *
 * @example
 * // Connect Projects to the Storage
 * const storage = await Storage("my-storage", {
 *   name: "my-storage",
 *   projects: [
 *     {
 *       projectId: "project_123",
 *       envVarEnvironments: ["production"],
 *       envVarPrefix: "MY_STORAGE_",
 *     },
 *   ],
 *   region: "cdg1",
 *   team: "my-team",
 *   type: "blob"
 * });
 */
export const Storage = Resource(
  "vercel::Storage",
  async function (
    this: Context<Storage>,
    id: string,
    { accessToken, ...props }: StorageProps & { accessToken?: Secret },
  ): Promise<Storage> {
    const api = await createVercelApi({
      baseUrl: "https://api.vercel.com/v1",
      accessToken,
    });
    switch (this.phase) {
      case "create": {
        const storage = await createStorage(api, props);

        let output = { ...props, ...storage.store };

        if (!output.name) {
          output.name = id;
        }

        if (props.projects && props.projects.length > 0) {
          await createProjectsConnection(api, output, props.projects);
          const updatedStorage = await readStorage(api, output);
          output = { ...props, ...updatedStorage.store };
        }

        return this(output);
      }

      case "update": {
        if (
          props.name !== this.output.name
          || props.region !== this.output.region
          || props.team !== this.output.team
          || props.type !== this.output.type
        ) {
          // if the storage is being replaced, we need to delete the old storage
          // name can be a conflict and we can't change the remaining properties
          return this.replace(true)
        }

        const newProjects = props.projects ?? [];
        const newProjectsMap = new Map(newProjects.map((p) => [p.projectId, p]));

        const currentProjects = this.output.projects ?? [];
        const currentProjectsMap = new Map(currentProjects.map((p) => [p.projectId, p]));

        const projectsMetadata = this.output.projectsMetadata ?? [];

        // determine which projects to create and which to delete
        const toCreate: typeof newProjects = [];
        const toDelete: typeof currentProjects = [];

        // find new or changed projects to create or re-create
        for (const newProject of newProjects) {
          const existing = currentProjectsMap.get(newProject.projectId);
          if (!existing) {
            toCreate.push(newProject);
          } else if (projectPropsChanged(newProject, existing)) {
            toDelete.push(existing);
            toCreate.push(newProject);
          }
        }

        // find removed projects to delete
        for (const currentProject of currentProjects) {
          if (!newProjectsMap.has(currentProject.projectId)) {
            toDelete.push(currentProject);
          }
        }

        const toDeleteMetadata: typeof projectsMetadata = [];
        for (const delProject of toDelete) {
          const metas = projectsMetadata.filter(meta => meta.projectId === delProject.projectId);
          toDeleteMetadata.push(...metas);
        }

        if (toDelete.length > 0) {
          await deleteProjectsConnection(api, this.output, toDeleteMetadata);
        }

        if (toCreate.length > 0) {
          await createProjectsConnection(api, this.output, toCreate);
        }

        if (toDelete.length > 0 || toCreate.length > 0) {
          const updatedStorage = await readStorage(api, this.output);
          this.output = updatedStorage.store;
        }

        return this({ ...this.output, ...props });
      }

      case "delete": {
        await deleteStorage(api, this.output);
        return this.destroy();
      }
    }
  },
);
