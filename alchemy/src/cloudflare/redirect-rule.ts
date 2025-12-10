import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import {
  createCloudflareApi,
  type CloudflareApi,
  type CloudflareApiOptions,
} from "./api.ts";
import type { CloudflareResponse } from "./response.ts";
import { getZoneByDomain, type Zone } from "./zone.ts";

/**
 * Properties for creating or updating a RedirectRule
 */
export interface RedirectRuleProps extends CloudflareApiOptions {
  /**
   * The zone where the redirect rule will be applied
   * Can be a zone ID string or a Zone resource
   */
  zone: string | Zone;

  /**
   * For wildcard redirects: the URL pattern to match
   * Example: "https://*.example.com/files/*"
   * This is mutually exclusive with `expression`
   */
  requestUrl?: string;

  /**
   * For dynamic redirects: a Cloudflare Rules expression
   * Example: 'http.request.uri.path matches "/autodiscover\\.(xml|src)$"'
   * This is mutually exclusive with `requestUrl`
   * @see https://developers.cloudflare.com/ruleset-engine/rules-language/expressions/
   */
  expression?: string;

  /**
   * The target URL for the redirect
   * Can include placeholders like ${1}, ${2} for wildcard matches
   * Example: "https://example.com/${1}/files/${2}"
   */
  targetUrl: string;

  /**
   * HTTP status code for the redirect
   * @default 301
   */
  statusCode?: 301 | 302 | 303 | 307 | 308;

  /**
   * Whether to preserve query string parameters
   * @default true
   */
  preserveQueryString?: boolean;
}

/**
 * Cloudflare Ruleset response format
 */
interface CloudflareRuleset {
  id: string;
  name: string;
  description?: string;
  kind: string;
  version: string;
  rules: CloudflareRule[];
  last_updated: string;
  phase: string;
}

/**
 * Cloudflare Rule response format
 */
interface CloudflareRule {
  id: string;
  version: string;
  action: string;
  expression: string;
  description?: string;
  last_updated: string;
  ref: string;
  enabled: boolean;
  action_parameters?: {
    from_value?: {
      status_code?: number;
      target_url?: {
        value?: string;
        expression?: string;
      };
      preserve_query_string?: boolean;
    };
  };
}

/**
 * Output returned after RedirectRule creation/update
 */
export interface RedirectRule {
  /**
   * The ID of the redirect rule
   */
  ruleId: string;

  /**
   * The ID of the ruleset containing this rule
   */
  rulesetId: string;

  /**
   * The zone ID where the rule is applied
   */
  zoneId: string;

  /**
   * The request URL pattern (for wildcard redirects)
   */
  requestUrl?: string;

  /**
   * The expression (for dynamic redirects)
   */
  expression?: string;

  /**
   * The target URL for the redirect
   */
  targetUrl: string;

  /**
   * HTTP status code for the redirect
   */
  statusCode: number;

  /**
   * Whether query string parameters are preserved
   */
  preserveQueryString: boolean;

  /**
   * Whether the rule is enabled
   */
  enabled: boolean;

  /**
   * Time when the rule was last updated
   */
  lastUpdated: string;
}

/**
 * A Cloudflare Redirect Rule enables URL redirects and rewrites using Cloudflare's Rules engine.
 * Supports wildcard redirects, static redirects, and dynamic redirects with expressions.
 *
 * @example
 * ## Wildcard Redirect
 *
 * Redirect from a wildcard pattern to a target URL with placeholders.
 *
 * ```ts
 * const wildcardRedirect = await RedirectRule("my-wildcard-redirect", {
 *   zone: "example.com",
 *   requestUrl: "https://*.example.com/files/*",
 *   targetUrl: "https://example.com/${1}/files/${2}",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @example
 * ## Static Redirect
 *
 * Simple redirect from any request to a static target URL.
 *
 * ```ts
 * const staticRedirect = await RedirectRule("my-static-redirect", {
 *   zone: "example.com",
 *   targetUrl: "https://example.com/",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @example
 * ## Dynamic Redirect with Expression
 *
 * Complex redirect using Cloudflare's Rules language for advanced matching.
 *
 * ```ts
 * const dynamicRedirect = await RedirectRule("my-dynamic-redirect", {
 *   zone: "example.com",
 *   expression: 'http.request.uri.path matches "/autodiscover\\.(xml|src)$"',
 *   targetUrl: "https://example.com/not-found",
 *   statusCode: 301,
 *   preserveQueryString: true
 * });
 * ```
 *
 * @see https://developers.cloudflare.com/rules/url-forwarding/single-redirects/
 */
export const RedirectRule = Resource(
  "cloudflare::RedirectRule",
  async function (
    this: Context<RedirectRule>,
    _id: string,
    props: RedirectRuleProps,
  ): Promise<RedirectRule> {
    // Create Cloudflare API client
    const api = await createCloudflareApi(props);

    // Get zone ID
    const zoneId =
      typeof props.zone === "string"
        ? (await getZoneByDomain(api, props.zone))?.id
        : props.zone.id;
    if (!zoneId) {
      throw new Error(`Zone ${props.zone} not found`);
    }

    if (this.phase === "delete") {
      if (this.output?.ruleId && this.output?.rulesetId) {
        // Let delete errors propagate instead of swallowing them
        await deleteRedirectRule(
          api,
          zoneId,
          this.output.rulesetId,
          this.output.ruleId,
        );
      }
      return this.destroy();
    }

    // Validate props
    if (props.requestUrl && props.expression) {
      throw new Error(
        "Cannot specify both requestUrl and expression. Use requestUrl for wildcard redirects or expression for dynamic redirects.",
      );
    }

    const statusCode = props.statusCode ?? 301;
    const preserveQueryString = props.preserveQueryString ?? true;

    // Build the rule expression
    let ruleExpression: string;
    if (props.requestUrl) {
      // Convert wildcard URL to Cloudflare expression
      ruleExpression = convertWildcardUrlToExpression(props.requestUrl);
    } else if (props.expression) {
      ruleExpression = props.expression;
    } else {
      // Static redirect - match all requests
      ruleExpression = "true";
    }

    if (
      this.phase === "update" &&
      this.output?.ruleId &&
      this.output?.rulesetId
    ) {
      // Update existing rule
      const updatedRule = await updateRedirectRule(
        api,
        zoneId,
        this.output.rulesetId,
        this.output.ruleId,
        {
          expression: ruleExpression,
          targetUrl: props.targetUrl,
          statusCode,
          preserveQueryString,
        },
      );

      return {
        ruleId: updatedRule.id,
        rulesetId: this.output.rulesetId,
        zoneId,
        requestUrl: props.requestUrl,
        expression: props.expression,
        targetUrl: props.targetUrl,
        statusCode,
        preserveQueryString,
        enabled: updatedRule.enabled ?? true,
        lastUpdated: updatedRule.last_updated,
      };
    }

    // Get or create the redirect ruleset for this zone
    const rulesetId = await getOrCreateRedirectRuleset(api, zoneId);

    // Create the rule
    const createdRule = await createRedirectRule(api, zoneId, rulesetId, {
      expression: ruleExpression,
      targetUrl: props.targetUrl,
      statusCode,
      preserveQueryString,
    });

    return {
      ruleId: createdRule.id,
      rulesetId,
      zoneId,
      requestUrl: props.requestUrl,
      expression: props.expression,
      targetUrl: props.targetUrl,
      statusCode,
      preserveQueryString,
      enabled: createdRule.enabled ?? true,
      lastUpdated: createdRule.last_updated,
    };
  },
);

/**
 * Get existing redirect ruleset for a zone
 */
async function getRedirectRuleset(
  api: CloudflareApi,
  zoneId: string,
): Promise<string | null> {
  const response = await api.get(`/zones/${zoneId}/rulesets`);

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as CloudflareResponse<
    CloudflareRuleset[]
  >;
  const redirectRuleset = result.result.find(
    (ruleset) => ruleset.phase === "http_request_dynamic_redirect",
  );

  return redirectRuleset?.id || null;
}

/**
 * Create a new redirect ruleset for a zone
 */
async function createRedirectRuleset(
  api: CloudflareApi,
  zoneId: string,
): Promise<string> {
  const response = await api.post(`/zones/${zoneId}/rulesets`, {
    name: "Zone-level redirect ruleset",
    description: "Redirect rules for the zone",
    kind: "zone",
    phase: "http_request_dynamic_redirect",
  });

  if (!response.ok) {
    throw new Error(
      `Failed to create redirect ruleset: ${response.statusText}`,
    );
  }

  const result =
    (await response.json()) as CloudflareResponse<CloudflareRuleset>;
  return result.result.id;
}

/**
 * Get or create the redirect ruleset for a zone
 */
async function getOrCreateRedirectRuleset(
  api: CloudflareApi,
  zoneId: string,
): Promise<string> {
  const existingRulesetId = await getRedirectRuleset(api, zoneId);
  if (existingRulesetId) {
    return existingRulesetId;
  }

  return await createRedirectRuleset(api, zoneId);
}

/**
 * Create a new redirect rule by updating the ruleset
 */
async function createRedirectRule(
  api: CloudflareApi,
  zoneId: string,
  rulesetId: string,
  ruleData: {
    expression: string;
    targetUrl: string;
    statusCode: number;
    preserveQueryString: boolean;
  },
): Promise<CloudflareRule> {
  // Get current ruleset
  const ruleset = await getRuleset(api, zoneId, rulesetId);
  if (!ruleset) {
    throw new Error(`Ruleset ${rulesetId} not found`);
  }

  // Create new rule object
  const newRule = {
    action: "redirect" as const,
    expression: ruleData.expression,
    action_parameters: {
      from_value: {
        status_code: ruleData.statusCode,
        target_url: {
          value: ruleData.targetUrl,
        },
        preserve_query_string: ruleData.preserveQueryString,
      },
    },
    enabled: true,
  };

  // Update ruleset with new rule
  const response = await api.put(`/zones/${zoneId}/rulesets/${rulesetId}`, {
    name: ruleset.name,
    description: ruleset.description,
    kind: ruleset.kind,
    phase: ruleset.phase,
    rules: [...(ruleset.rules ?? []), newRule],
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to create redirect rule: ${response.statusText}\nResponse: ${errorBody}`,
    );
  }

  const result =
    (await response.json()) as CloudflareResponse<CloudflareRuleset>;
  // Return the last rule (the one we just added)
  const createdRule = result.result.rules[result.result.rules.length - 1];
  return createdRule;
}

/**
 * Update an existing redirect rule by updating the ruleset
 */
async function updateRedirectRule(
  api: CloudflareApi,
  zoneId: string,
  rulesetId: string,
  ruleId: string,
  ruleData: {
    expression: string;
    targetUrl: string;
    statusCode: number;
    preserveQueryString: boolean;
  },
): Promise<CloudflareRule> {
  // Get current ruleset
  const ruleset = await getRuleset(api, zoneId, rulesetId);
  if (!ruleset) {
    throw new Error(`Ruleset ${rulesetId} not found`);
  }

  // Find and update the rule
  const updatedRules = ruleset.rules.map((rule) => {
    if (rule.id === ruleId) {
      return {
        ...rule,
        action: "redirect" as const,
        expression: ruleData.expression,
        action_parameters: {
          from_value: {
            status_code: ruleData.statusCode,
            target_url: {
              value: ruleData.targetUrl,
            },
            preserve_query_string: ruleData.preserveQueryString,
          },
        },
        enabled: true,
      };
    }
    return rule;
  });

  // Update ruleset with modified rules
  const response = await api.put(`/zones/${zoneId}/rulesets/${rulesetId}`, {
    name: ruleset.name,
    description: ruleset.description,
    kind: ruleset.kind,
    phase: ruleset.phase,
    rules: updatedRules,
  });

  if (!response.ok) {
    throw new Error(`Failed to update redirect rule: ${response.statusText}`);
  }

  const result =
    (await response.json()) as CloudflareResponse<CloudflareRuleset>;
  // Find and return the updated rule
  const updatedRule = result.result.rules.find((rule) => rule.id === ruleId);
  if (!updatedRule) {
    throw new Error(`Updated rule ${ruleId} not found in response`);
  }
  return updatedRule;
}

/**
 * Get a ruleset with its rules
 */
async function getRuleset(
  api: CloudflareApi,
  zoneId: string,
  rulesetId: string,
): Promise<CloudflareRuleset | null> {
  const response = await api.get(`/zones/${zoneId}/rulesets/${rulesetId}`);

  if (!response.ok) {
    return null;
  }

  const result =
    (await response.json()) as CloudflareResponse<CloudflareRuleset>;
  return result.result;
}

/**
 * Find a specific rule in a ruleset
 */
export async function findRuleInRuleset(
  api: CloudflareApi,
  zoneId: string,
  rulesetId: string,
  ruleId: string,
): Promise<CloudflareRule | null> {
  const response = await api.get(`/zones/${zoneId}/rulesets/${rulesetId}`);

  if (!response.ok) {
    throw new Error(
      `Failed to get ruleset: ${response.status} ${response.statusText}`,
    );
  }

  const rulesetData =
    (await response.json()) as CloudflareResponse<CloudflareRuleset>;
  const rule = rulesetData.result.rules.find((r) => r.id === ruleId);

  return rule || null;
}

/**
 * Delete a redirect rule by updating the ruleset to exclude it
 */
async function deleteRedirectRule(
  api: CloudflareApi,
  zoneId: string,
  rulesetId: string,
  ruleId: string,
): Promise<void> {
  const ruleset = await getRuleset(api, zoneId, rulesetId);

  if (!ruleset) {
    throw new Error(`Ruleset ${rulesetId} not found for deletion`);
  }

  // Filter out the rule to delete
  const updatedRules = ruleset.rules.filter((rule) => rule.id !== ruleId);

  // Update the ruleset with the filtered rules
  const response = await api.put(`/zones/${zoneId}/rulesets/${rulesetId}`, {
    name: ruleset.name,
    description: ruleset.description,
    kind: ruleset.kind,
    phase: ruleset.phase,
    rules: updatedRules,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete redirect rule: ${response.statusText}`);
  }
}

/**
 * Convert a wildcard URL pattern to a Cloudflare Rules expression
 * Uses operators available on Free plans (no regex matching)
 */
function convertWildcardUrlToExpression(wildcardUrl: string): string {
  // Parse the URL to extract components
  const url = new URL(wildcardUrl);
  const hostname = url.hostname;
  const pathname = url.pathname;

  let expression = "";

  // Handle hostname wildcards
  if (hostname.includes("*")) {
    // For simple wildcard patterns, use contains or ends_with operators
    if (hostname.startsWith("*")) {
      // *.example.com -> http.host ends_with ".example.com"
      const suffix = hostname.substring(1); // Remove the *
      expression += `http.host ends_with "${suffix}"`;
    } else if (hostname.endsWith("*")) {
      // subdomain.* -> http.host starts_with "subdomain."
      const prefix = hostname.substring(0, hostname.length - 1); // Remove the *
      expression += `http.host starts_with "${prefix}"`;
    } else {
      // More complex wildcards - fallback to a broader match
      const parts = hostname.split("*");
      if (parts.length === 2) {
        expression += `http.host starts_with "${parts[0]}" and http.host ends_with "${parts[1]}"`;
      } else {
        // Fallback to domain contains for complex patterns
        const baseDomain = hostname.replace(/^\*\./, "").replace(/\.\*$/, "");
        expression += `http.host contains "${baseDomain}"`;
      }
    }
  } else {
    expression += `http.host == "${hostname}"`;
  }

  // Handle pathname wildcards
  if (pathname.includes("*")) {
    if (pathname.endsWith("*")) {
      // /files/* -> starts_with "/files/"
      const prefix = pathname.substring(0, pathname.length - 1); // Remove the *
      expression += ` and http.request.uri.path starts_with "${prefix}"`;
    } else if (pathname.startsWith("*")) {
      // *.html -> ends_with ".html"
      const suffix = pathname.substring(1); // Remove the *
      expression += ` and http.request.uri.path ends_with "${suffix}"`;
    } else {
      // More complex wildcards - use contains
      const parts = pathname.split("*");
      if (parts.length === 2 && parts[0] && parts[1]) {
        expression += ` and http.request.uri.path starts_with "${parts[0]}" and http.request.uri.path ends_with "${parts[1]}"`;
      } else {
        // Fallback to contains for the non-wildcard part
        const nonWildcardPart = parts.find((part) => part.length > 0) || "";
        if (nonWildcardPart) {
          expression += ` and http.request.uri.path contains "${nonWildcardPart}"`;
        }
      }
    }
  } else if (pathname !== "/") {
    expression += ` and http.request.uri.path == "${pathname}"`;
  }

  // Handle protocol
  if (url.protocol === "https:") {
    expression += " and ssl";
  } else if (url.protocol === "http:") {
    expression += " and not ssl";
  }

  return expression;
}
