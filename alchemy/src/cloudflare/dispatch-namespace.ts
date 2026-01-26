import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";

/**
 * Properties for creating or updating a Dispatch Namespace
 */
export interface DispatchNamespaceProps extends CloudflareApiOptions {
  /**
   * Name of the namespace
   *
   * @default ${app}-${stage}-${id}
   */
  namespace?: string;

  /**
   * Whether to adopt an existing namespace with the same name if it exists
   * If true and a namespace with the same name exists, it will be adopted rather than creating a new one
   *
   * @default false
   */
  adopt?: boolean;

  /**
   * Whether to delete the namespace.
   * If set to false, the namespace will remain but the resource will be removed from state
   *
   * @default true
   */
  delete?: boolean;
}

export function isDispatchNamespace(
  resource: any,
): resource is DispatchNamespace {
  return resource?.[ResourceKind] === "cloudflare::DispatchNamespace";
}

/**
 * Output returned after Dispatch Namespace creation/update
 */
export interface DispatchNamespace extends Omit<
  DispatchNamespaceProps,
  "delete"
> {
  type: "dispatch_namespace";
  /**
   * The name of the namespace
   */
  namespace: string;

  /**
   * The namespace name from Cloudflare API
   */
  namespaceName: string;

  /**
   * The namespace ID from Cloudflare API
   */
  namespaceId: string;

  /**
   * Time at which the namespace was created
   */
  createdAt: number;

  /**
   * Time at which the namespace was last modified
   */
  modifiedAt: number;
}

/**
 * A Cloudflare Dispatch Namespace enables routing worker requests to different scripts based on patterns.
 *
 * @see https://developers.cloudflare.com/workers/configuration/routing/dispatch-namespace/
 *
 * @example
 * // Create a basic dispatch namespace
 * const myNamespace = await DispatchNamespace("my-namespace", {
 *   namespace: "my-namespace"
 * });
 *
 * @example
 * // Create dispatch namespace with default name from id
 * const dispatchNS = await DispatchNamespace("api-dispatch");
 *
 * @example
 * // Adopt an existing namespace if it already exists instead of failing
 * const existingNamespace = await DispatchNamespace("existing-ns", {
 *   namespace: "existing-namespace",
 *   adopt: true
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the namespace in Cloudflare
 * const preservedNamespace = await DispatchNamespace("preserve-ns", {
 *   namespace: "preserved-namespace",
 *   delete: false
 * });
 */
export const DispatchNamespace = Resource(
  "cloudflare::DispatchNamespace",
  async function (
    this: Context<DispatchNamespace>,
    id: string,
    props: DispatchNamespaceProps = {},
  ): Promise<DispatchNamespace> {
    // Create Cloudflare API client with automatic account discovery
    const api = await createCloudflareApi(props);

    const namespace =
      props.namespace ??
      this.output?.namespace ??
      this.scope.createPhysicalName(id);
    const adopt = props.adopt ?? this.scope.adopt;

    if (this.phase === "delete") {
      // For delete operations, we need to check if the namespace exists in the output
      const namespaceName = this.output?.namespace;
      if (namespaceName && props.delete !== false) {
        await deleteDispatchNamespace(api, namespaceName);
      }

      // Return minimal output for deleted state
      return this.destroy();
    }

    // For create or update operations
    let createdAt =
      this.phase === "update"
        ? this.output?.createdAt || Date.now()
        : Date.now();

    if (this.phase === "update") {
      if (this.output.namespace !== namespace) {
        this.replace();
      }
      // For updates, just refresh metadata
    } else {
      try {
        // Try to create the dispatch namespace
        await createDispatchNamespace(api, {
          ...props,
          namespace,
        });
        createdAt = Date.now();
      } catch (error) {
        // Check if this is a "namespace already exists" error and adopt is enabled
        if (
          adopt &&
          error instanceof CloudflareApiError &&
          error.status === 400 &&
          (error.message.includes("already exists") ||
            error.message.includes("Ensure it does not already exist"))
        ) {
          logger.log(
            `Dispatch namespace '${namespace}' already exists, adopting it`,
          );
          // Get the namespace to retrieve ID and validate it exists
          const existingNamespace = await getDispatchNamespace(api, namespace);
          if (!existingNamespace) {
            throw new Error(
              `Failed to find existing dispatch namespace '${namespace}'`,
            );
          }
        } else {
          // Re-throw the error if adopt is false or it's not a "namespace already exists" error
          throw error;
        }
      }
    }

    // Get the namespace information after creation/adoption
    const namespaceInfo = await getDispatchNamespace(api, namespace);
    if (!namespaceInfo) {
      throw new Error(`Failed to get namespace information for '${namespace}'`);
    }

    return {
      type: "dispatch_namespace",
      namespace,
      namespaceName: namespaceInfo.namespaceName,
      namespaceId: namespaceInfo.namespaceId,
      createdAt: createdAt,
      modifiedAt: Date.now(),
    };
  },
);

export async function createDispatchNamespace(
  api: CloudflareApi,
  props: DispatchNamespaceProps & {
    namespace: string;
  },
): Promise<void> {
  const createResponse = await api.post(
    `/accounts/${api.accountId}/workers/dispatch/namespaces`,
    {
      name: props.namespace,
    },
  );

  if (!createResponse.ok) {
    await handleApiError(
      createResponse,
      "create",
      "dispatch_namespace",
      props.namespace,
    );
  }
}

export async function getDispatchNamespace(
  api: CloudflareApi,
  namespace: string,
): Promise<{ namespaceName: string; namespaceId: string } | undefined> {
  const getResponse = await api.get(
    `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}`,
  );

  if (getResponse.status === 404) {
    return undefined;
  }

  if (!getResponse.ok) {
    await handleApiError(getResponse, "get", "dispatch_namespace", namespace);
  }

  const result = (await getResponse.json()) as {
    result: {
      namespace_name: string;
      namespace_id: string;
    };
  };

  return {
    namespaceName: result.result.namespace_name,
    namespaceId: result.result.namespace_id,
  };
}

export async function deleteDispatchNamespace(
  api: CloudflareApi,
  namespace: string,
) {
  // Delete dispatch namespace
  const deleteResponse = await api.delete(
    `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    await handleApiError(
      deleteResponse,
      "delete",
      "dispatch_namespace",
      namespace,
    );
  }
}

export async function listWorkersInNamespace(
  api: CloudflareApi,
  namespace: string,
): Promise<Array<{ id: string; created_on: string; modified_on: string }>> {
  const response = await api.get(
    `/accounts/${api.accountId}/workers/dispatch/namespaces/${namespace}/scripts`,
  );

  if (!response.ok) {
    await handleApiError(
      response,
      "list workers in",
      "dispatch_namespace",
      namespace,
    );
  }

  const data = (await response.json()) as {
    result: Array<{
      id: string;
      created_on: string;
      modified_on: string;
    }>;
  };

  return data.result || [];
}
