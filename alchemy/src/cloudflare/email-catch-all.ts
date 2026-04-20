import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { type CloudflareApiOptions, createCloudflareApi } from "./api.ts";
import { resolveEmailZoneId } from "./email-common.ts";
import type { EmailAction } from "./email-rule.ts";
import type { CloudflareResponse } from "./response.ts";
import type { Zone } from "./zone.ts";

export interface EmailCatchAllMatcher {
  type: "all";
}

/**
 * Cloudflare Email Catch All response format
 */
interface CloudflareEmailCatchAll {
  id: string;
  enabled: boolean;
  name: string;
  matchers: EmailCatchAllMatcher[];
  actions: EmailAction[];
  tag: string;
}

/**
 * Properties for configuring the catch-all email rule
 */
export interface EmailCatchAllProps extends CloudflareApiOptions {
  /**
   * Zone ID or Zone resource where the catch-all rule will be configured
   */
  zone: string | Zone;

  /**
   * Whether the catch-all rule is enabled
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Name for the catch-all rule
   *
   * @default "Catch All"
   */
  name?: string;

  /**
   * Matchers for the catch-all rule (typically matches all emails)
   * If not provided, defaults to matching all emails
   */
  matchers?: EmailCatchAllMatcher[];

  /**
   * Actions to take for emails that don't match other rules
   */
  actions: EmailAction[];
}

/**
 * A catch-all email routing rule for a Cloudflare zone
 */
export interface EmailCatchAll {
  /**
   * Zone ID where the catch-all rule is configured
   */
  zoneId: string;

  /**
   * Routing rule identifier.
   */
  ruleId: string;

  /**
   * Whether the catch-all rule is enabled
   */
  enabled: boolean;

  /**
   * Rule name
   */
  name: string;

  /**
   * Matchers for the catch-all rule
   */
  matchers: EmailCatchAllMatcher[];

  /**
   * Actions for the catch-all rule
   */
  actions: EmailAction[];

  /**
   * Deprecated rule tag returned by the Cloudflare API.
   */
  tag?: string;
}

export function isEmailCatchAll(resource: any): resource is EmailCatchAll {
  return resource?.[ResourceKind] === "cloudflare::EmailCatchAll";
}

function validateCatchAllActions(actions: EmailAction[]) {
  for (const action of actions) {
    if (action.type === "drop") {
      continue;
    }
    if (!action.value?.length) {
      throw new Error(
        `EmailCatchAll action "${action.type}" requires at least one value.`,
      );
    }
  }
}

/**
 * Configures a catch-all email routing rule that handles emails not matched by other rules.
 * This rule is processed last and typically matches all emails that haven't been handled.
 *
 * @example
 * ## Forward all unmatched emails
 *
 * Set up a catch-all rule to forward any unmatched emails to an admin address.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("default-catchall", {
 *   zone: "example.com",
 *   enabled: true,
 *   actions: [
 *     {
 *       type: "forward",
 *       value: ["admin@company.com"]
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Drop unmatched emails
 *
 * Configure catch-all to drop any emails that don't match specific rules.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("drop-catchall", {
 *   zone: "example.com",
 *   enabled: true,
 *   actions: [
 *     {
 *       type: "drop"
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Process with Worker
 *
 * Use a Worker to handle all unmatched emails for custom processing.
 *
 * ```ts
 * const catchAll = await EmailCatchAll("worker-catchall", {
 *   zone: "example.com",
 *   enabled: true,
 *   actions: [
 *     {
 *       type: "worker",
 *       value: ["email-processor"]
 *     }
 *   ]
 * });
 * ```
 */
export const EmailCatchAll = Resource(
  "cloudflare::EmailCatchAll",
  async function (
    this: Context<EmailCatchAll>,
    _id: string,
    props: EmailCatchAllProps,
  ): Promise<EmailCatchAll> {
    const api = await createCloudflareApi(props);
    const zoneId = await resolveEmailZoneId(api, props.zone);
    validateCatchAllActions(props.actions);

    if (this.phase === "delete") {
      // Disable the catch-all rule by setting enabled to false
      const disablePayload = {
        enabled: false,
        name: "Catch All",
        matchers: [{ type: "all" as const }],
        actions: [{ type: "drop" as const }],
      };

      const response = await api.put(
        `/zones/${zoneId}/email/routing/rules/catch_all`,
        disablePayload,
      );
      if (!response.ok && response.status !== 404) {
        throw new Error(
          `Failed to disable catch-all rule: ${response.statusText}`,
        );
      }
      return this.destroy();
    }

    // Get current catch-all rule state
    const _getResponse = await api.get(
      `/zones/${zoneId}/email/routing/rules/catch_all`,
    );

    if (this.phase === "update" && this.output) {
      // Update the catch-all rule
      const updatePayload = {
        enabled: props.enabled ?? true,
        name: props.name || "Catch All",
        matchers: props.matchers || [{ type: "all" as const }],
        actions: props.actions,
      };

      const response = await api.put(
        `/zones/${zoneId}/email/routing/rules/catch_all`,
        updatePayload,
      );

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Failed to update catch-all rule: ${response.statusText}\nResponse: ${errorBody}`,
        );
      }

      const result =
        (await response.json()) as CloudflareResponse<CloudflareEmailCatchAll>;

      return {
        zoneId,
        ruleId: result.result.id,
        enabled: result.result.enabled,
        name: result.result.name,
        matchers: result.result.matchers,
        actions: result.result.actions,
        tag: result.result.tag || undefined,
      };
    }

    // Create or update catch-all rule
    const catchAllPayload = {
      enabled: props.enabled ?? true,
      name: props.name || "Catch All",
      matchers: props.matchers || [{ type: "all" as const }],
      actions: props.actions,
    };

    const response = await api.put(
      `/zones/${zoneId}/email/routing/rules/catch_all`,
      catchAllPayload,
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to configure catch-all rule: ${response.statusText}\nResponse: ${errorBody}`,
      );
    }

    const result =
      (await response.json()) as CloudflareResponse<CloudflareEmailCatchAll>;

    return {
      zoneId,
      ruleId: result.result.id,
      enabled: result.result.enabled,
      name: result.result.name,
      matchers: result.result.matchers,
      actions: result.result.actions,
      tag: result.result.tag || undefined,
    };
  },
);
