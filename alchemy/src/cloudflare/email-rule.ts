import type { Context } from "../context.ts";
import { Resource, ResourceKind } from "../resource.ts";
import { handleApiError } from "./api-error.ts";
import { type CloudflareApiOptions, createCloudflareApi } from "./api.ts";
import { resolveEmailZoneId } from "./email-common.ts";
import type { CloudflareResponse } from "./response.ts";
import type { Zone } from "./zone.ts";

/**
 * Email routing matcher - defines what emails to match
 */
export interface EmailMatcher {
  /**
   * Type of matcher
   * - "literal": Exact string match
   * - "all": Matches all emails
   */
  type: "literal" | "all";

  /**
   * Field to match against (required for literal matchers)
   */
  field?: "to";

  /**
   * Value to match (required for literal matchers)
   */
  value?: string;
}

/**
 * Email routing action - defines what to do with matched emails
 */
export interface EmailAction {
  /**
   * Type of action to take
   * - "forward": Forward email to destination addresses
   * - "worker": Process email with a Cloudflare Worker
   * - "drop": Drop/reject the email
   */
  type: "forward" | "worker" | "drop";

  /**
   * Action configuration
   * - For "forward": Array of destination email addresses
   * - For "worker": Worker script name
   * - For "drop": Not used
   */
  value?: string[];
}

/**
 * Cloudflare Email Rule response format
 */
interface CloudflareEmailRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  matchers: EmailMatcher[];
  actions: EmailAction[];
  tag: string;
}

/**
 * Properties for creating an email routing rule
 */
export interface EmailRuleProps extends CloudflareApiOptions {
  /**
   * Zone ID or Zone resource where the rule will be created
   */
  zone: string | Zone;

  /**
   * Name for the email routing rule
   */
  name?: string;

  /**
   * Whether the rule is enabled
   *
   * @default true
   */
  enabled?: boolean;

  /**
   * Rule priority - lower numbers have higher priority
   * Rules are evaluated in priority order
   *
   * @default 0
   */
  priority?: number;

  /**
   * Array of matchers that define which emails this rule applies to
   */
  matchers: EmailMatcher[];

  /**
   * Array of actions to take when emails match this rule
   */
  actions: EmailAction[];
}

/**
 * An email routing rule for a Cloudflare zone
 */
export interface EmailRule {
  /**
   * Zone ID where the rule is created
   */
  zoneId: string;

  /**
   * Rule ID
   */
  ruleId: string;

  /**
   * Rule name
   */
  name: string;

  /**
   * Whether the rule is enabled
   */
  enabled: boolean;

  /**
   * Rule priority
   */
  priority: number;

  /**
   * Matchers for this rule
   */
  matchers: EmailMatcher[];

  /**
   * Actions for this rule
   */
  actions: EmailAction[];

  /**
   * Deprecated rule tag returned by the Cloudflare API.
   */
  tag?: string;
}

export function isEmailRule(resource: any): resource is EmailRule {
  return resource?.[ResourceKind] === "cloudflare::EmailRule";
}

function validateMatchers(matchers: EmailMatcher[]) {
  for (const matcher of matchers) {
    if (matcher.type === "all") {
      continue;
    }
    if (matcher.field !== "to") {
      throw new Error(
        'EmailRule literal matchers currently only support field: "to".',
      );
    }
    if (!matcher.value) {
      throw new Error("EmailRule literal matchers require a value.");
    }
  }
}

function validateActions(actions: EmailAction[]) {
  for (const action of actions) {
    if (action.type === "drop") {
      continue;
    }
    if (!action.value?.length) {
      throw new Error(
        `EmailRule action "${action.type}" requires at least one value.`,
      );
    }
  }
}

/**
 * Creates email routing rules that define how emails sent to your domain are processed.
 * Rules are evaluated in priority order (lower number = higher priority).
 *
 * @example
 * ## Forward emails to a specific address
 *
 * Forward all emails sent to info@example.com to a destination address.
 *
 * ```ts
 * const infoRule = await EmailRule("info-forwarding", {
 *   zone: "example.com",
 *   name: "Forward info emails",
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "info@example.com"
 *     }
 *   ],
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
 * ## Process emails with a Worker
 *
 * Route emails to a Cloudflare Worker for custom processing.
 *
 * ```ts
 * const workerRule = await EmailRule("worker-processing", {
 *   zone: "example.com",
 *   name: "Process with Worker",
 *   priority: 1,
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "webhook@example.com"
 *     }
 *   ],
 *   actions: [
 *     {
 *       type: "worker",
 *       value: ["email-processor"]
 *     }
 *   ]
 * });
 * ```
 *
 * @example
 * ## Multiple matchers and actions
 *
 * Create a rule with multiple conditions and actions.
 *
 * ```ts
 * const complexRule = await EmailRule("support-routing", {
 *   zone: "example.com",
 *   name: "Support email routing",
 *   priority: 2,
 *   matchers: [
 *     {
 *       type: "literal",
 *       field: "to",
 *       value: "support@example.com"
 *     }
 *   ],
 *   actions: [
 *     {
 *       type: "forward",
 *       value: ["support@company.com", "backup@company.com"]
 *     }
 *   ]
 * });
 * ```
 */
export const EmailRule = Resource(
  "cloudflare::EmailRule",
  async function (
    this: Context<EmailRule>,
    _id: string,
    props: EmailRuleProps,
  ): Promise<EmailRule> {
    const api = await createCloudflareApi(props);
    const zoneId = await resolveEmailZoneId(api, props.zone);
    validateMatchers(props.matchers);
    validateActions(props.actions);

    if (this.phase === "delete") {
      if (this.output?.ruleId) {
        const response = await api.delete(
          `/zones/${zoneId}/email/routing/rules/${this.output.ruleId}`,
        );
        if (!response.ok && response.status !== 404) {
          await handleApiError(response, "delete", "email rule");
        }
      }
      return this.destroy();
    }

    if (this.phase === "update" && this.output) {
      // Update the existing rule
      const updatePayload = {
        name: props.name || this.output.name,
        enabled: props.enabled ?? true,
        priority: props.priority ?? 0,
        matchers: props.matchers,
        actions: props.actions,
      };

      const response = await api.put(
        `/zones/${zoneId}/email/routing/rules/${this.output.ruleId}`,
        updatePayload,
      );

      if (!response.ok) {
        if (response.status === 404) {
          // Rule was deleted externally, create a new one
        } else {
          await handleApiError(response, "update", "email rule");
        }
      } else {
        const result =
          (await response.json()) as CloudflareResponse<CloudflareEmailRule>;

        return {
          zoneId,
          ruleId: result.result.id,
          name: result.result.name,
          enabled: result.result.enabled,
          priority: result.result.priority,
          matchers: result.result.matchers,
          actions: result.result.actions,
          tag: result.result.tag || undefined,
        };
      }
    }

    // Create new rule
    const createPayload = {
      name: props.name || "Email routing rule",
      enabled: props.enabled ?? true,
      priority: props.priority ?? 0,
      matchers: props.matchers,
      actions: props.actions,
    };

    const createResponse = await api.post(
      `/zones/${zoneId}/email/routing/rules`,
      createPayload,
    );

    if (!createResponse.ok) {
      await handleApiError(createResponse, "create", "email rule");
    }

    const result =
      (await createResponse.json()) as CloudflareResponse<CloudflareEmailRule>;

    return {
      zoneId,
      ruleId: result.result.id,
      name: result.result.name,
      enabled: result.result.enabled,
      priority: result.result.priority,
      matchers: result.result.matchers,
      actions: result.result.actions,
      tag: result.result.tag || undefined,
    };
  },
);
