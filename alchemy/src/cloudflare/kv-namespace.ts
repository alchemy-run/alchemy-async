import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { Scope } from "../scope.ts";
import { withExponentialBackoff } from "../util/retry.ts";
import { CloudflareApiError, handleApiError } from "./api-error.ts";
import {
  extractCloudflareResult,
  type CloudflareApiErrorPayload,
} from "./api-response.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { deleteMiniflareBinding } from "./miniflare/delete.ts";
import * as mf from "miniflare";
import { getDefaultPersistPath } from "./miniflare/paths.ts";

/**
 * Properties for creating or updating a KV Namespace
 */
export interface KVNamespaceProps extends CloudflareApiOptions {
  /**
   * Title of the namespace
   *
   * @default ${app}-${stage}-${id}
   */
  title?: string;

  /**
   * KV pairs to store in the namespace
   * Only used for initial setup or updates
   */
  values?: KVPair[];

  /**
   * Whether to adopt an existing namespace with the same title if it exists
   * If true and a namespace with the same title exists, it will be adopted rather than creating a new one
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

  /**
   * Whether to emulate the KV namespace locally when Alchemy is running in watch mode.
   */
  dev?: {
    /**
     * Whether to run the KV namespace remotely instead of locally
     * @default false
     */
    remote?: boolean;

    /**
     * Whether to force the KV namespace to be created or updated
     * @default false
     */
    force?: boolean;
  };
}

/**
 * Key-value pair to store in a KV Namespace
 */
export interface KVPair {
  /**
   * Key name
   */
  key: string;

  /**
   * Value to store (string or JSON object)
   */
  value: string | object;

  /**
   * Optional expiration in seconds from now
   */
  expiration?: number;

  /**
   * Optional expiration timestamp in seconds since epoch
   */
  expirationTtl?: number;

  /**
   * Optional metadata for the key
   */
  metadata?: any;
}

export function isKVNamespace(resource: any): resource is KVNamespace {
  return resource?.[ResourceKind] === "cloudflare::KVNamespace";
}

/**
 * Output returned after KV Namespace creation/update
 */
export type KVNamespace = Omit<KVNamespaceProps, "delete" | "dev"> & {
  type: "kv_namespace";
  /**
   * The ID of the namespace
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

  /**
   * Development mode properties
   * @internal
   */
  dev: {
    /**
     * The ID of the KV namespace in development mode
     */
    id: string;

    /**
     * Whether the KV namespace is running remotely
     */
    remote: boolean;
  };
};

/**
 * A Cloudflare KV Namespace is a key-value store that can be used to store data for your application.
 *
 * @see https://developers.cloudflare.com/kv/concepts/kv-namespaces/
 *
 * @example
 * // Create a basic KV namespace for storing user data
 * const users = await KVNamespace("users", {
 *   title: "user-data"
 * });
 *
 * @example
 * // Create a KV namespace with initial values and TTL
 * const sessions = await KVNamespace("sessions", {
 *   title: "user-sessions",
 *   values: [{
 *     key: "session_123",
 *     value: { userId: "user_456", role: "admin" },
 *     expirationTtl: 3600 // Expires in 1 hour
 *   }]
 * });
 *
 * @example
 * // Create a KV namespace with metadata for caching
 * const assets = await KVNamespace("assets", {
 *   title: "static-assets",
 *   values: [{
 *     key: "main.js",
 *     value: "content...",
 *     metadata: {
 *       contentType: "application/javascript",
 *       etag: "abc123"
 *     }
 *   }]
 * });
 *
 * @example
 * // Adopt an existing namespace if it already exists instead of failing
 * const existingNamespace = await KVNamespace("existing-ns", {
 *   title: "existing-namespace",
 *   adopt: true,
 *   values: [{
 *     key: "config",
 *     value: { setting: "updated-value" }
 *   }]
 * });
 *
 * @example
 * // When removing from Alchemy state, keep the namespace in Cloudflare
 * const preservedNamespace = await KVNamespace("preserve-ns", {
 *   title: "preserved-namespace",
 *   delete: false
 * });
 */
export async function KVNamespace(
  id: string,
  props: KVNamespaceProps = {},
): Promise<KVNamespace> {
  return await _KVNamespace(id, {
    ...props,
    dev: {
      ...(props.dev ?? {}),
      force: Scope.current.local,
    },
  });
}

const _KVNamespace = Resource(
  "cloudflare::KVNamespace",
  async function (
    this: Context<KVNamespace>,
    id: string,
    props: KVNamespaceProps,
  ): Promise<KVNamespace> {
    const title =
      props.title ?? this.output?.title ?? this.scope.createPhysicalName(id);

    const local = this.scope.local && !props.dev?.remote;
    const dev = {
      id: this.output?.dev?.id ?? this.output?.namespaceId ?? id,
      remote: props.dev?.remote ?? false,
    };

    if (local) {
      if (props.values) {
        await insertLocalKVRecords({
          namespaceId: dev.id,
          values: props.values,
          rootDir: this.scope.rootDir,
        });
      }
      return {
        type: "kv_namespace",
        namespaceId: this.output?.namespaceId ?? "",
        title,
        values: props.values,
        dev,
        createdAt: this.output?.createdAt ?? Date.now(),
        modifiedAt: Date.now(),
      };
    }

    const api = await createCloudflareApi(props);

    if (this.phase === "update" && this.output?.title !== title) {
      await renameKVNamespace(api, this.output.namespaceId, title);
    }

    if (this.phase === "delete") {
      if (this.output.dev?.id) {
        await deleteMiniflareBinding(this.scope, "kv", this.output.dev.id);
      }
      if (this.output.namespaceId && props.delete !== false) {
        await deleteKVNamespace(api, this.output.namespaceId);
      }
      return this.destroy();
    }

    let result: { namespaceId: string; createdAt: number };
    if (this.phase === "create" || !this.output.namespaceId) {
      result = await createKVNamespace(api, {
        ...props,
        title,
      });
    } else {
      result = this.output;
    }

    await insertKVRecords(api, result.namespaceId, props);

    return {
      type: "kv_namespace",
      namespaceId: result.namespaceId,
      title,
      values: props.values,
      dev,
      createdAt: result.createdAt,
      modifiedAt: Date.now(),
    };
  },
);

export async function createKVNamespace(
  api: CloudflareApi,
  props: KVNamespaceProps & {
    title: string;
  },
): Promise<{ namespaceId: string; createdAt: number }> {
  try {
    const { id } = await extractCloudflareResult<{
      id: string;
      title: string;
      beta?: boolean;
      supports_url_encoding?: boolean;
    }>(
      `create kv namespace "${props.title}"`,
      api.post(`/accounts/${api.accountId}/storage/kv/namespaces`, {
        title: props.title,
      }),
    );
    return { namespaceId: id, createdAt: Date.now() };
  } catch (error) {
    if (
      error instanceof CloudflareApiError &&
      (error.errorData as CloudflareApiErrorPayload[]).some(
        (e) => e.code === 10014,
      ) &&
      (props.adopt ?? Scope.current.adopt)
    ) {
      const existingNamespace = await findKVNamespaceByTitle(api, props.title);

      if (!existingNamespace) {
        throw new Error(
          `Failed to find existing namespace '${props.title}' for adoption`,
        );
      }

      return {
        namespaceId: existingNamespace.id,
        createdAt: existingNamespace.createdAt ?? Date.now(),
      };
    } else {
      throw error;
    }
  }
}

export async function deleteKVNamespace(
  api: CloudflareApi,
  namespaceId: string,
) {
  // Delete KV namespace
  const deleteResponse = await api.delete(
    `/accounts/${api.accountId}/storage/kv/namespaces/${namespaceId}`,
  );

  if (!deleteResponse.ok && deleteResponse.status !== 404) {
    await handleApiError(deleteResponse, "delete", "kv_namespace", namespaceId);
  }
}

export async function insertKVRecords(
  api: CloudflareApi,
  namespaceId: string,
  props: KVNamespaceProps,
) {
  if (props.values && props.values.length > 0) {
    // Process KV pairs in batches of 10000 (API limit)
    const BATCH_SIZE = 10000;

    for (let i = 0; i < props.values.length; i += BATCH_SIZE) {
      const bulkPayload = props.values
        .slice(i, i + BATCH_SIZE)
        .map((entry) => ({
          key: entry.key,
          value:
            typeof entry.value === "string"
              ? entry.value
              : JSON.stringify(entry.value),
          expiration: entry.expiration,
          expiration_ttl: entry.expirationTtl,
          metadata: entry.metadata,
        }));

      await withExponentialBackoff(
        async () => {
          const bulkResponse = await api.put(
            `/accounts/${api.accountId}/storage/kv/namespaces/${namespaceId}/bulk`,
            bulkPayload,
          );

          if (!bulkResponse.ok) {
            const errorData: any = await bulkResponse.json().catch(() => ({
              errors: [{ message: bulkResponse.statusText }],
            }));
            const errorMessage =
              errorData.errors?.[0]?.message || bulkResponse.statusText;

            // Throw error to trigger retry
            throw new Error(`Error writing KV batch: ${errorMessage}`);
          }

          return bulkResponse;
        },
        (error) => {
          // Retry on "namespace not found" errors as they're likely propagation delays
          return error.message?.includes("not found");
        },
        5, // 5 retry attempts
        1000, // Start with 1 second delay
      );
    }
  }
}

export async function insertLocalKVRecords(input: {
  namespaceId: string;
  values: KVPair[];
  rootDir: string;
}) {
  const miniflare = new mf.Miniflare({
    script: "",
    modules: true,
    defaultPersistRoot: getDefaultPersistPath(input.rootDir),
    kvNamespaces: { KV: input.namespaceId },
    kvPersist: true,
    log: process.env.DEBUG ? new mf.Log(mf.LogLevel.DEBUG) : undefined,
  });
  try {
    await miniflare.ready;
    const kv = await miniflare.getKVNamespace("KV");
    await Promise.all(
      input.values.map((record) =>
        kv.put(
          record.key,
          typeof record.value === "string"
            ? record.value
            : JSON.stringify(record.value),
          {
            expiration: record.expiration,
            expirationTtl: record.expirationTtl,
            metadata: record.metadata,
          },
        ),
      ),
    );
  } finally {
    await miniflare.dispose();
  }
}

/**
 * Interface representing a KV namespace as returned by Cloudflare API
 */
interface CloudflareKVNamespace {
  id: string;
  title: string;
  supports_url_encoding?: boolean;
  created_on?: string;
}

/**
 * Find a KV namespace by title with pagination support
 */
export async function findKVNamespaceByTitle(
  api: CloudflareApi,
  title: string,
): Promise<{ id: string; createdAt?: number } | null> {
  let page = 1;
  const perPage = 100; // Maximum allowed by API
  let hasMorePages = true;

  while (hasMorePages) {
    const response = await api.get(
      `/accounts/${api.accountId}/storage/kv/namespaces?page=${page}&per_page=${perPage}`,
    );

    if (!response.ok) {
      await handleApiError(response, "list", "kv_namespace", "all");
    }

    const data = (await response.json()) as {
      result: CloudflareKVNamespace[];
      result_info: {
        count: number;
        page: number;
        per_page: number;
        total_count: number;
      };
      success: boolean;
      errors: any[];
    };

    const namespaces = data.result;
    const resultInfo = data.result_info;

    // Look for a namespace with matching title
    const match = namespaces.find((ns) => ns.title === title);
    if (match) {
      return {
        id: match.id,
        // Convert ISO string to timestamp if available, otherwise use current time
        createdAt: match.created_on
          ? new Date(match.created_on).getTime()
          : undefined,
      };
    }

    // Check if we've seen all pages
    hasMorePages =
      resultInfo.page * resultInfo.per_page < resultInfo.total_count;
    page++;
  }

  // No matching namespace found
  return null;
}

export async function renameKVNamespace(
  api: CloudflareApi,
  namespaceId: string,
  title: string,
) {
  const response = await api.put(
    `/accounts/${api.accountId}/storage/kv/namespaces/${namespaceId}`,
    { title },
  );

  if (!response.ok) {
    await handleApiError(response, "update", "kv_namespace", namespaceId);
  }
}
