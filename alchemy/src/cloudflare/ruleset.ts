import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import { handleApiError } from "./api-error.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { Kind, Rule, RulePhase } from "./rule.ts";
import { findZoneForHostname, type Zone } from "./zone.ts";

/**
 * Properties for creating or updating a Ruleset
 */
export interface RulesetProps<
  Phase extends RulePhase,
> extends Partial<CloudflareApiOptions> {
  /**
   * The zone to apply the ruleset to
   */
  zone: string | Zone;

  /**
   * The phase of the ruleset
   * @default "http_ratelimit"
   */
  phase: Phase;

  /**
   * Rules to apply to the ruleset
   */
  rules: Array<Rule>;

  /**
   * Human-readable name for the ruleset
   *
   * @default ${app}-${stage}-${id}
   */
  name?: string;

  /**
   * Description of the ruleset
   */
  description?: string;
}

/**
 * Output returned after Ruleset creation/update
 */
export interface Ruleset<Phase extends RulePhase> {
  /**
   * The ID of the ruleset
   */
  id: string;

  /**
   * The zone ID
   */
  zoneId: string;

  /**
   * The phase of the ruleset
   */
  phase: Phase;

  /**
   * Human-readable name of the ruleset
   */
  name: string;

  /**
   * Description of the ruleset
   */
  description?: string;

  /**
   * The rules in the ruleset
   */
  rules: Array<Rule>;

  /**
   * ISO datetime the ruleset was last updated
   */
  lastUpdated: string;

  /**
   * Version string of the ruleset
   */
  version: string;
}

/**
 * Cloudflare Ruleset manages rules within a specific phase's entrypoint ruleset.
 * This resource allows you to configure rules for various phases like rate limiting,
 * firewall, transforms, and more.
 *
 * @example
 * // Create a rate limiting ruleset
 * const rateLimits = await Ruleset("api-rate-limits", {
 *   zone: "example.com",
 *   phase: "http_ratelimit",
 *   rules: [
 *     {
 *       description: "API rate limit",
 *       expression: "(http.request.uri.path wildcard r\"/api/*\")",
 *       action: "block",
 *       ratelimit: {
 *         characteristics: ["ip.src"],
 *         period: 60,
 *         requests_per_period: 100,
 *         mitigation_timeout: 600
 *       }
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a custom firewall ruleset
 * const firewall = await Ruleset("custom-firewall", {
 *   zone: myZone,
 *   phase: "http_request_firewall_custom",
 *   rules: [
 *     {
 *       description: "Block bad IPs",
 *       expression: "ip.src in {1.2.3.4 1.2.3.5}",
 *       action: "block"
 *     },
 *     {
 *       description: "Challenge suspicious requests",
 *       expression: "cf.threat_score > 50",
 *       action: "challenge"
 *     }
 *   ]
 * });
 *
 * @example
 * // Create a transform ruleset for request headers
 * const transforms = await Ruleset("header-transforms", {
 *   zone: "example.com",
 *   phase: "http_request_transform",
 *   rules: [
 *     {
 *       description: "Add custom header",
 *       expression: "true",
 *       action: "rewrite",
 *       action_parameters: {
 *         headers: {
 *           "X-Custom-Header": { value: "my-value" }
 *         }
 *       }
 *     }
 *   ]
 * });
 */
export const Ruleset = Resource("cloudflare::Ruleset", async function <
  Phase extends RulePhase,
>(this: Context<Ruleset<Phase>>, id: string, props: RulesetProps<Phase>): Promise<
  Ruleset<Phase>
> {
  const api = await createCloudflareApi(props);

  // Default phase to http_ratelimit if not specified
  const phase = props.phase || "http_ratelimit";

  // Get zone ID from zone name
  const zoneId =
    typeof props.zone === "string"
      ? (await findZoneForHostname(api, props.zone)).zoneId
      : props.zone.id;

  if (this.phase === "delete") {
    // Overwrite entire entrypoint with empty rules
    await updateRuleset(api, zoneId, phase, { rules: [] });
    return this.destroy();
  }

  const rulesetName =
    props.name ?? this.output?.name ?? this.scope.createPhysicalName(id);

  // Overwrite entire entrypoint with only the provided rules
  const result = await updateRuleset(api, zoneId, phase, {
    rules: props.rules,
    name: rulesetName,
    ...(props.description && { description: props.description }),
  });

  // Transform response back to our format
  return {
    id: result.id,
    zoneId,
    phase: props.phase,
    name: result.name || props.name || `${phase} ruleset`,
    description: result.description || props.description,
    rules: (result.rules as Array<Rule> | undefined) ?? [],
    lastUpdated: result.last_updated,
    version: result.version,
  };
});

interface CloudflareApiRuleset {
  /** Unique ID of the ruleset (versioned under the hood). */
  id: string;
  /** ISO datetime last updated. */
  last_updated: string; // date-time
  /** Version string of the ruleset. */
  version: string;
  /** Kind of ruleset. */
  kind: Kind;
  /** Human-readable name. */
  name: string; // minLength: 1
  /** Phase this ruleset runs in. */
  phase: RulePhase;
  /** Optional description. */
  description?: string;
  /** The list of rules in the ruleset. */
  rules?: Rule[]; // or (RulesetRule[]) if you prefer loose typing
}

/**
 * Update a ruleset for a specific zone and phase
 * Ensures consistent error handling on non-2xx responses
 */
export async function updateRuleset(
  api: CloudflareApi,
  zoneId: string,
  /** Phase of the ruleset */
  phase: RulePhase,
  body: {
    /** Human-readable name of the ruleset */
    name?: string; // minLength: 1
    /** Informative description of the ruleset */
    description?: string;
    /** Kind of the ruleset (managed, custom, root, etc.) */
    kind?: Kind;
    /** The list of rules in the ruleset */
    rules: Array<Rule>;
  },
): Promise<CloudflareApiRuleset> {
  const response = await api.put(
    `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`,
    body,
  );

  if (!response.ok) {
    await handleApiError(response, "updating", "ruleset", `${zoneId}/${phase}`);
  }

  const data = (await response.json()) as { result: CloudflareApiRuleset };
  return data.result;
}

export async function getRuleset(
  api: CloudflareApi,
  zoneId: string,
  phase: RulePhase,
): Promise<CloudflareApiRuleset> {
  const response = await api.get(
    `/zones/${zoneId}/rulesets/phases/${phase}/entrypoint`,
  );
  const data = (await response.json()) as { result: CloudflareApiRuleset };
  return data.result;
}
