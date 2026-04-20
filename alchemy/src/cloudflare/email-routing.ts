import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { handleApiError } from "./api-error.ts";
import { type CloudflareApiOptions, createCloudflareApi } from "./api.ts";
import { resolveEmailZoneId } from "./email-common.ts";
import type { CloudflareResponse } from "./response.ts";
import type { Zone } from "./zone.ts";

/**
 * Cloudflare Email Routing response format
 */
interface CloudflareEmailRouting {
  enabled: boolean;
  name: string;
  created: string;
  modified: string;
  tag: string;
}

/**
 * Properties for configuring email routing on a zone
 */
export interface EmailRoutingProps extends CloudflareApiOptions {
  /**
   * Zone ID or Zone resource where email routing will be configured
   */
  zone: string | Zone;

  /**
   * Whether email routing should be enabled
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Skip the DNS setup wizard when enabling email routing
   *
   * @default false
   */
  skipWizard?: boolean;
}

/**
 * Email routing configuration for a Cloudflare zone
 */
export interface EmailRouting {
  /**
   * Zone ID where email routing is configured
   */
  zoneId: string;

  /**
   * Whether email routing is enabled
   */
  enabled: boolean;

  /**
   * Zone name
   */
  name: string;

  /**
   * When email routing was created
   */
  created: string;

  /**
   * When email routing was last modified
   */
  modified: string;

  /**
   * Zone tag
   */
  tag: string;
}

export function isEmailRouting(resource: any): resource is EmailRouting {
  return resource?.[ResourceKind] === "cloudflare::EmailRouting";
}

/**
 * Configures email routing for a Cloudflare zone, allowing emails sent to the zone's domain
 * to be routed according to defined rules.
 *
 * @example
 * ## Enable email routing for a zone
 *
 * Enable email routing for your domain to start receiving and routing emails.
 *
 * ```ts
 * const emailRouting = await EmailRouting("example.com-routing", {
 *   zone: "example.com",
 *   enabled: true
 * });
 * ```
 *
 * @example
 * ## Use with existing Zone resource
 *
 * Configure email routing using an existing Zone resource reference.
 *
 * ```ts
 * const zone = await Zone("my-zone", {
 *   name: "example.com"
 * });
 *
 * const emailRouting = await EmailRouting("example.com-routing", {
 *   zone: zone,
 *   enabled: true,
 *   skipWizard: true
 * });
 * ```
 */
export const EmailRouting = Resource(
  "cloudflare::EmailRouting",
  async function (
    this: Context<EmailRouting>,
    _id: string,
    props: EmailRoutingProps,
  ): Promise<EmailRouting> {
    const api = await createCloudflareApi(props);
    const zoneId = await resolveEmailZoneId(api, props.zone);

    if (this.phase === "delete") {
      // Disable email routing DNS
      const response = await api.delete(`/zones/${zoneId}/email/routing/dns`);
      if (!response.ok && response.status !== 404) {
        await handleApiError(response, "disabling", "email routing DNS");
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output) {
      // Check if we need to update the enabled state
      const currentEnabled = this.output.enabled;
      const desiredEnabled = props.enabled ?? true;

      if (currentEnabled !== desiredEnabled) {
        if (desiredEnabled) {
          // Enable email routing DNS
          const enablePayload = {
            enabled: true,
            ...(props.skipWizard && { skip_wizard: props.skipWizard }),
          };
          const response = await api.post(
            `/zones/${zoneId}/email/routing/dns`,
            enablePayload,
          );
          if (!response.ok) {
            await handleApiError(response, "enabling", "email routing DNS");
          }
        } else {
          // Disable email routing DNS
          const response = await api.delete(
            `/zones/${zoneId}/email/routing/dns`,
          );
          if (!response.ok) {
            await handleApiError(response, "disabling", "email routing DNS");
          }
        }
      }

      // Get current state
      const getResponse = await api.get(`/zones/${zoneId}/email/routing/dns`);
      if (!getResponse.ok) {
        if (getResponse.status === 404) {
          throw new Error("Email routing DNS is not configured for this zone");
        }
        await handleApiError(
          getResponse,
          "getting",
          "email routing DNS settings",
        );
      }

      const result =
        (await getResponse.json()) as CloudflareResponse<CloudflareEmailRouting>;

      return {
        zoneId,
        enabled: result.result.enabled,
        name: result.result.name,
        created: result.result.created,
        modified: result.result.modified,
        tag: result.result.tag,
      };
    }

    // Create/Enable email routing
    const enabled = props.enabled ?? true;

    if (enabled) {
      const enablePayload = {
        enabled: true,
        ...(props.skipWizard && { skip_wizard: props.skipWizard }),
      };
      const response = await api.post(
        `/zones/${zoneId}/email/routing/dns`,
        enablePayload,
      );
      if (!response.ok) {
        await handleApiError(response, "enabling", "email routing DNS");
      }
    }

    // Get the current state
    const getResponse = await api.get(`/zones/${zoneId}/email/routing/dns`);
    if (!getResponse.ok) {
      if (getResponse.status === 404) {
        throw new Error(
          "Email routing DNS is not configured. Set enabled: true to configure it.",
        );
      }
      await handleApiError(
        getResponse,
        "getting",
        "email routing DNS settings",
      );
    }

    const result =
      (await getResponse.json()) as CloudflareResponse<CloudflareEmailRouting>;

    return {
      zoneId,
      enabled: result.result.enabled,
      name: result.result.name,
      created: result.result.created,
      modified: result.result.modified,
      tag: result.result.tag,
    };
  },
);
