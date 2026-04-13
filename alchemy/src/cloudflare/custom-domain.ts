import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { logger } from "../util/logger.ts";
import { handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import { inferZoneIdFromPattern } from "./route.ts";

/**
 * Properties for creating or updating a CustomDomain
 */
export interface CustomDomainProps extends CloudflareApiOptions {
  /**
   * The domain name to bind to the worker
   */
  name: string;

  /**
   * Cloudflare Zone ID for the domain
   *
   * @default - inferred from the domain name
   */
  zoneId?: string;

  /**
   * Name of the worker to bind to the domain
   */
  workerName: string;

  /**
   * Worker environment (defaults to production)
   * @default "production"
   */
  environment?: string;

  /**
   * If true, adopt an existing custom domain binding during creation.
   * If false and the domain already exists, creation will fail.
   * This only applies during the create phase.
   * @default false
   */
  adopt?: boolean;

  /**
   * If true, forcibly transfer the hostname when it is currently bound to a
   * different Worker service. Without this flag, Cloudflare rejects the
   * upsert with HTTP 409 / error code 100116 "Hostname '<host>' already in
   * use by other custom domain".
   *
   * This is destructive to the previously bound Worker (its traffic on this
   * hostname stops immediately), so it is opt-in. Only relevant when the
   * existing binding points at a different `workerName` or `environment`.
   *
   * @see https://developers.cloudflare.com/api/resources/workers/subresources/domains/methods/update/
   * @default false
   */
  overrideExistingOrigin?: boolean;

  /**
   * Whether to delete the custom domain when removed from Alchemy.
   * If set to false, the custom domain will remain but the resource will be removed from state.
   *
   * @default true
   */
  delete?: boolean;

  /**
   * If true, the custom domain will not be created, but will be retained if it already exists.
   * This is used for local development.
   *
   * @default `Scope.local`
   * @internal
   */
  dev?: boolean;
}

/**
 * Cloudflare Domain object structure from API
 */
interface CloudflareDomain {
  id: string;
  zone_id: string;
  zone_name: string;
  hostname: string;
  service: string;
  environment: string;
}

/**
 * Output returned after CustomDomain creation/update
 */
export interface CustomDomain extends CustomDomainProps {
  /**
   * The unique identifier for the Cloudflare domain binding.
   */
  id: string;

  /**
   * Time at which the domain binding was created (approximated if not returned by API)
   */
  createdAt: number;

  /**
   * Time at which the domain binding was last updated
   */
  updatedAt: number;
}

/**
 * Configure custom domain for a Cloudflare Worker using the Cloudflare Custom Domains API
 * This attaches a worker to a specific hostname within a zone.
 *
 * @example
 * // Bind a domain to a standard Cloudflare Worker
 * const apiWorker = await Worker("api", {
 *   name: "my-api-worker",
 *   entrypoint: "./src/api-worker.ts"
 * });
 *
 * const apiDomain = await CustomDomain("api-domain-binding", {
 *   name: "api.example.com",
 *   zoneId: "YOUR_ZONE_ID", // Replace with actual Zone ID
 *   workerName: apiWorker.name // Use the name from the Worker resource
 * });
 *
 * @example
 * // Adopt an existing domain binding during creation
 * const existingDomain = await CustomDomain("api-domain", {
 *   name: "api.example.com",
 *   zoneId: "YOUR_ZONE_ID",
 *   workerName: "my-api-worker",
 *   adopt: true  // If domain already exists, adopt it instead of failing
 * });
 *
 * @see https://developers.cloudflare.com/api/resources/workers/subresources/domains/
 */
export const CustomDomain = Resource(
  "cloudflare::CustomDomain",
  async function (
    this: Context<CustomDomain>,
    logicalId: string, // Changed param name from id to logicalId for clarity
    props: CustomDomainProps,
  ): Promise<CustomDomain> {
    if (this.scope.local && props.dev) {
      const now = Date.now();
      return {
        ...props,
        id: this.output?.id ?? "noop-domain",
        zoneId: props.zoneId ?? "noop-zone",
        environment: props.environment ?? "production",
        createdAt: this.output?.createdAt ?? now,
        updatedAt: now,
      };
    }

    // Create Cloudflare API client with automatic account discovery
    const api = await createCloudflareApi(props);

    if (this.phase === "delete") {
      if (props.delete !== false) {
        await deleteCustomDomain(this, api, logicalId, props);
      }
      return this.destroy();
    }

    // Create or Update phase
    return await ensureCustomDomain(this, api, logicalId, {
      ...props,
      zoneId: props.zoneId ?? (await inferZoneIdFromPattern(api, props.name)),
    });
  },
);

// Helper function to delete the custom domain binding
async function deleteCustomDomain(
  context: Context<CustomDomain>,
  api: CloudflareApi,
  logicalId: string,
  props: CustomDomainProps,
): Promise<void> {
  const domainHostname = props.name;
  const domainIdToDelete = context.output?.id;

  if (!domainIdToDelete) {
    logger.warn(
      `Cannot delete CustomDomain ${logicalId} (${domainHostname}): Missing domain ID in state. Assuming already deleted.`,
    );
    return; // Exit early if no ID
  }

  const response = await api.delete(
    `/accounts/${api.accountId}/workers/domains/${domainIdToDelete}`,
  );

  // 404 is acceptable during deletion for idempotency
  if (!response.ok && response.status !== 404) {
    await handleApiError(
      response,
      "deleting",
      "custom domain binding",
      domainIdToDelete,
    );
    // Throw after handling to ensure failure is reported
    throw new Error(
      `Failed to delete custom domain binding ${domainIdToDelete}: ${response.statusText}`,
    );
  }
}

// Helper function to create or update the custom domain binding
async function ensureCustomDomain(
  context: Context<CustomDomain>,
  api: CloudflareApi,
  _logicalId: string,
  props: CustomDomainProps & {
    zoneId: string;
  },
): Promise<CustomDomain> {
  const environment = props.environment || "production";
  const domainHostname = props.name;
  const adopt = props.adopt ?? context.scope.adopt;
  // Check if domain binding already exists for this account
  const listResponse = await api.get(
    `/accounts/${api.accountId}/workers/domains`,
  );

  if (!listResponse.ok) {
    // Fix: Added the 4th argument (resource identifier/context)
    await handleApiError(
      listResponse,
      "listing",
      "worker domains",
      `Account ${api.accountId}`,
    );
    // If listing fails, we cannot proceed reliably
    throw new Error(
      `Failed to list worker domains for account ${api.accountId}: ${listResponse.statusText}`,
    );
  }

  const listData = (await listResponse.json()) as {
    result?: CloudflareDomain[];
    success: boolean;
  };

  if (!listData.success || !listData.result) {
    throw new Error(
      `Failed to parse list worker domains response: ${JSON.stringify(listData)}`,
    );
  }

  // Find the specific binding by hostname AND zoneId
  const existingBinding = listData.result.find(
    (b) => b.hostname === domainHostname && b.zone_id === props.zoneId,
  );

  let currentDomainId = existingBinding?.id;
  const bindingExists = !!existingBinding;

  // Handle the case where domain already exists during create phase
  if (context.phase === "create" && bindingExists) {
    if (!adopt) {
      throw new Error(
        `CustomDomain for ${domainHostname} already exists in zone ${props.zoneId}. ` +
          "Set adopt: true to take control of the existing domain binding.",
      );
    }
  }

  // Determine if we need to update (binding exists but has different service or environment)
  const needsUpdate =
    bindingExists &&
    (existingBinding.service !== props.workerName ||
      existingBinding.environment !== environment);

  let operationPerformed: "create" | "update" | "none" = "none";
  let resultantBinding: CloudflareDomain | undefined = existingBinding;

  // Create or Update the binding using PUT
  // Cloudflare's PUT /accounts/{account_id}/workers/domains acts as an upsert
  if (!bindingExists || needsUpdate) {
    operationPerformed = bindingExists ? "update" : "create";

    const putPayload: {
      zone_id: string;
      hostname: string;
      service: string;
      environment: string;
      override_existing_origin?: boolean;
    } = {
      zone_id: props.zoneId,
      hostname: domainHostname,
      service: props.workerName,
      environment: environment,
    };
    if (props.overrideExistingOrigin !== undefined) {
      putPayload.override_existing_origin = props.overrideExistingOrigin;
    }

    const putResponse = await api.put(
      `/accounts/${api.accountId}/workers/domains`,
      putPayload,
    );

    if (!putResponse.ok) {
      await handleApiError(
        putResponse,
        operationPerformed === "update" ? "updating" : "creating",
        "custom domain binding",
        domainHostname,
      );
      // Throw after handling to prevent inconsistent state
      throw new Error(
        `Failed to ${operationPerformed} custom domain binding: ${putResponse.statusText}`,
      );
    }

    const putResult = (await putResponse.json()) as {
      result?: CloudflareDomain;
      success: boolean;
    };

    if (!putResult.success || !putResult.result) {
      throw new Error(
        `Failed to parse ${operationPerformed} domain binding response: ${JSON.stringify(putResult)}`,
      );
    }

    resultantBinding = putResult.result;
    currentDomainId = resultantBinding.id; // Update ID from the PUT response
  }

  // Ensure we have the final binding details
  if (!resultantBinding || !currentDomainId) {
    // This case should ideally not happen if API calls succeed
    logger.error("Error: Could not determine final domain binding state.", {
      existingBinding,
      resultantBinding,
      currentDomainId,
    });
    throw new Error(
      `Failed to get final state for custom domain ${domainHostname}`,
    );
  }

  const now = Date.now();

  // Construct the output state
  return context({
    ...props, // Include all input props
    id: currentDomainId, // Use the definitive ID
    environment: resultantBinding.environment, // Use actual environment from CF
    createdAt: context.output?.createdAt || now, // Preserve create time or set new
    updatedAt:
      operationPerformed !== "none" ? now : context.output?.updatedAt || now, // Update time only if changed
  });
}
