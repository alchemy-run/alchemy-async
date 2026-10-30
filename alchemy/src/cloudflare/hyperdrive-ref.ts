import { alchemy } from "../alchemy.ts";
import type { Secret } from "../secret.ts";
import { handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";

export interface HyperdriveRefProps extends CloudflareApiOptions {
  name?: string;
  id?: string;
  dev?: {
    origin: string | Secret;
  };
}

export type HyperdriveRef = {
  type: "hyperdrive";
  name: string;
  hyperdriveId: string;
  dev?: {
    origin: Secret;
  };
};

export async function HyperdriveRef(
  props: HyperdriveRefProps,
): Promise<HyperdriveRef> {
  const api = await createCloudflareApi(props);

  let hyperdriveId = props.id;
  let hyperdriveName = props.name;

  if (!hyperdriveId && hyperdriveName) {
    // Find hyperdrive by name
    hyperdriveId = await findHyperdriveIdByName(api, hyperdriveName);
    if (!hyperdriveId) {
      throw new Error(
        `Hyperdrive config with name "${hyperdriveName}" not found`,
      );
    }
  } else if (!hyperdriveName && hyperdriveId) {
    throw new Error("HyperdriveRef requires either name or both name and id");
  } else if (!hyperdriveName && !hyperdriveId) {
    throw new Error("HyperdriveRef requires at least a name");
  }

  return {
    type: "hyperdrive",
    name: hyperdriveName!,
    hyperdriveId: hyperdriveId!,
    dev: props.dev
      ? {
          origin:
            typeof props.dev.origin === "string"
              ? alchemy.secret(props.dev.origin)
              : props.dev.origin,
        }
      : undefined,
  };
}

/**
 * Find a Hyperdrive configuration by name
 */
export async function findHyperdriveIdByName(
  api: CloudflareApi,
  name: string,
  page = 1,
): Promise<string | undefined> {
  const response = await api.get(
    // 100 is the documented maximum; the default of 20 costs one API call per 20 configs.
    `/accounts/${api.accountId}/hyperdrive/configs?page=${page}&per_page=100`,
  );

  if (!response.ok) {
    await handleApiError(response, "list", "hyperdrive", "all");
  }

  const data: {
    result: Array<{
      id: string;
      name: string;
    }>;
    result_info?: { total_pages?: number };
  } = await response.json();

  const found = data.result.find((config) => config.name === name);
  if (found) {
    return found.id;
  }

  if (data.result_info?.total_pages && page < data.result_info.total_pages) {
    return await findHyperdriveIdByName(api, name, page + 1);
  }

  return undefined;
}
