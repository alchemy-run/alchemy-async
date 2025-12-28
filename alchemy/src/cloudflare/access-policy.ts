import type { Context } from "../context.ts";
import { Resource } from "../resource.ts";
import {
	type CloudflareApi,
	type CloudflareApiOptions,
	createCloudflareApi,
} from "./api.ts";
import { handleApiError } from "./api-error.ts";
import type { CloudflareApiResponse } from "./api-response.ts";

/**
 * Access rule for "everyone" - allows all users
 */
export interface AccessRuleEveryone {
	everyone: true;
}

/**
 * Access rule for specific email addresses
 */
export interface AccessRuleEmail {
	email: { email: string }[];
}

/**
 * Access rule for an email domain
 */
export interface AccessRuleEmailDomain {
	emailDomain: { domain: string };
}

/**
 * Access rule for GitHub organization/team
 */
export interface AccessRuleGitHub {
	github: {
		name: string;
		identityProviderId: string;
		teams?: string[];
	};
}

/**
 * Access rule for Google Workspace (GSuite)
 */
export interface AccessRuleGSuite {
	gsuite: {
		identityProviderId: string;
		email?: string;
	};
}

/**
 * Access rule for Azure AD groups
 */
export interface AccessRuleAzureAD {
	azureAd: {
		identityProviderId: string;
		id: string;
	};
}

/**
 * Access rule for Okta groups
 */
export interface AccessRuleOkta {
	okta: {
		identityProviderId: string;
		name?: string;
	};
}

/**
 * Access rule for SAML attributes
 */
export interface AccessRuleSAML {
	saml: {
		identityProviderId: string;
		attributeName: string;
		attributeValue: string;
	};
}

/**
 * Access rule for IP addresses or CIDR ranges
 */
export interface AccessRuleIP {
	ip: { ip: string }[];
}

/**
 * Access rule for an IP list
 */
export interface AccessRuleIPList {
	ipList: { id: string };
}

/**
 * Access rule for countries (ISO 3166-1 alpha-2 codes)
 */
export interface AccessRuleCountry {
	country: { code: string }[];
}

/**
 * Access rule requiring a valid client certificate
 */
export interface AccessRuleCertificate {
	certificate: true;
}

/**
 * Access rule for certificate common name
 */
export interface AccessRuleCommonName {
	commonName: { commonName: string };
}

/**
 * Access rule for specific service tokens
 */
export interface AccessRuleServiceToken {
	serviceToken: { tokenId: string }[];
}

/**
 * Access rule allowing any valid service token
 */
export interface AccessRuleAnyValidServiceToken {
	anyValidServiceToken: true;
}

/**
 * Access rule for Access groups
 */
export interface AccessRuleGroup {
	group: { id: string };
}

/**
 * Access rule for device posture checks
 */
export interface AccessRuleDevicePosture {
	devicePosture: { integrationUid: string };
}

/**
 * Union type for all access rules
 */
export type AccessRule =
	| AccessRuleEveryone
	| AccessRuleEmail
	| AccessRuleEmailDomain
	| AccessRuleGitHub
	| AccessRuleGSuite
	| AccessRuleAzureAD
	| AccessRuleOkta
	| AccessRuleSAML
	| AccessRuleIP
	| AccessRuleIPList
	| AccessRuleCountry
	| AccessRuleCertificate
	| AccessRuleCommonName
	| AccessRuleServiceToken
	| AccessRuleAnyValidServiceToken
	| AccessRuleGroup
	| AccessRuleDevicePosture;

/**
 * Properties for creating or updating an Access Policy
 */
export interface AccessPolicyProps extends CloudflareApiOptions {
	/**
	 * The ID of the Access Application this policy belongs to
	 */
	applicationId: string;

	/**
	 * The name of the Access Policy
	 */
	name: string;

	/**
	 * The decision for this policy
	 * - allow: Allow access if conditions are met
	 * - deny: Deny access if conditions are met
	 * - non_identity: Allow non-identity traffic (e.g., service tokens)
	 * - bypass: Bypass authentication entirely
	 */
	decision: "allow" | "deny" | "non_identity" | "bypass";

	/**
	 * The order of precedence for this policy (lower = higher priority)
	 */
	precedence: number;

	/**
	 * Rules that must match for the policy to apply (OR logic)
	 */
	include: AccessRule[];

	/**
	 * Rules that will exclude users from the policy (OR logic)
	 */
	exclude?: AccessRule[];

	/**
	 * Rules that must all match for the policy to apply (AND logic)
	 */
	require?: AccessRule[];

	/**
	 * Session duration override for this policy
	 * Format: "24h", "12h", "8h", "1h", etc.
	 */
	sessionDuration?: string;

	/**
	 * Whether to delete the Access Policy on resource destruction
	 * @default true
	 */
	delete?: boolean;
}

/**
 * Cloudflare Access Policy response from API
 */
interface CloudflareAccessPolicy {
	id: string;
	uid: string;
	name: string;
	decision: "allow" | "deny" | "non_identity" | "bypass";
	precedence: number;
	include: Record<string, unknown>[];
	exclude: Record<string, unknown>[];
	require: Record<string, unknown>[];
	session_duration?: string;
	created_at: string;
	updated_at: string;
}

/**
 * Output returned after Access Policy creation/update
 */
export interface AccessPolicy extends AccessPolicyProps {
	/**
	 * The unique identifier for the Access Policy
	 */
	id: string;

	/**
	 * Time at which the Access Policy was created
	 */
	createdAt: string;

	/**
	 * Time at which the Access Policy was last updated
	 */
	updatedAt: string;
}

/**
 * Creates and manages a Cloudflare Access Policy.
 *
 * Access Policies define who can access an Access Application based on
 * various identity and context rules.
 *
 * @example
 * // Create a policy allowing users with a specific email domain
 * const policy = await AccessPolicy("allow-company", {
 *   applicationId: app.id,
 *   name: "Allow company employees",
 *   decision: "allow",
 *   precedence: 1,
 *   include: [
 *     { emailDomain: { domain: "example.com" } },
 *   ],
 * });
 *
 * @example
 * // Create a policy allowing specific email addresses
 * const policy = await AccessPolicy("allow-admins", {
 *   applicationId: app.id,
 *   name: "Allow admins",
 *   decision: "allow",
 *   precedence: 1,
 *   include: [
 *     { email: [{ email: "admin@example.com" }, { email: "ops@example.com" }] },
 *   ],
 * });
 *
 * @example
 * // Create a policy for GitHub organization members
 * const policy = await AccessPolicy("github-org", {
 *   applicationId: app.id,
 *   name: "Allow GitHub org members",
 *   decision: "allow",
 *   precedence: 1,
 *   include: [
 *     {
 *       github: {
 *         name: "my-org",
 *         identityProviderId: "github-idp-id",
 *         teams: ["engineering"],
 *       },
 *     },
 *   ],
 * });
 *
 * @example
 * // Create a bypass policy for service tokens
 * const servicePolicy = await AccessPolicy("service-access", {
 *   applicationId: app.id,
 *   name: "Service token access",
 *   decision: "non_identity",
 *   precedence: 0,
 *   include: [
 *     { anyValidServiceToken: true },
 *   ],
 * });
 *
 * @example
 * // Create a policy with exclusions
 * const policy = await AccessPolicy("allow-with-exclusions", {
 *   applicationId: app.id,
 *   name: "Allow most users",
 *   decision: "allow",
 *   precedence: 1,
 *   include: [
 *     { emailDomain: { domain: "example.com" } },
 *   ],
 *   exclude: [
 *     { email: [{ email: "contractor@example.com" }] },
 *   ],
 * });
 *
 * @see https://developers.cloudflare.com/cloudflare-one/policies/access/
 * @see https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/subresources/policies/
 */
export const AccessPolicy = Resource(
	"cloudflare::AccessPolicy",
	async function (
		this: Context<AccessPolicy>,
		_id: string,
		props: AccessPolicyProps,
	): Promise<AccessPolicy> {
		const api = await createCloudflareApi(props);

		if (this.phase === "delete") {
			if (props.delete !== false && this.output?.id) {
				await deleteAccessPolicy(api, props.applicationId, this.output.id);
			}
			return this.destroy();
		}

		let policyData: CloudflareAccessPolicy;

		if (this.phase === "update" && this.output?.id) {
			// Update existing policy
			policyData = await updateAccessPolicy(
				api,
				props.applicationId,
				this.output.id,
				props,
			);
		} else {
			// Create new policy
			policyData = await createAccessPolicy(api, props.applicationId, props);
		}

		return {
			...props,
			id: policyData.id,
			createdAt: policyData.created_at,
			updatedAt: policyData.updated_at,
		};
	},
);

/**
 * Create a new Access Policy
 */
async function createAccessPolicy(
	api: CloudflareApi,
	applicationId: string,
	props: AccessPolicyProps,
): Promise<CloudflareAccessPolicy> {
	const payload = buildAccessPolicyPayload(props);

	const response = await api.post(
		`/accounts/${api.accountId}/access/apps/${applicationId}/policies`,
		payload,
	);

	if (!response.ok) {
		await handleApiError(response, "creating", "Access Policy", props.name);
	}

	const data =
		(await response.json()) as CloudflareApiResponse<CloudflareAccessPolicy>;

	if (!data.success || !data.result) {
		throw new Error(`Failed to create Access Policy: ${JSON.stringify(data)}`);
	}

	return data.result;
}

/**
 * Update an existing Access Policy
 */
async function updateAccessPolicy(
	api: CloudflareApi,
	applicationId: string,
	policyId: string,
	props: AccessPolicyProps,
): Promise<CloudflareAccessPolicy> {
	const payload = buildAccessPolicyPayload(props);

	const response = await api.put(
		`/accounts/${api.accountId}/access/apps/${applicationId}/policies/${policyId}`,
		payload,
	);

	if (!response.ok) {
		await handleApiError(response, "updating", "Access Policy", props.name);
	}

	const data =
		(await response.json()) as CloudflareApiResponse<CloudflareAccessPolicy>;

	if (!data.success || !data.result) {
		throw new Error(`Failed to update Access Policy: ${JSON.stringify(data)}`);
	}

	return data.result;
}

/**
 * Delete an Access Policy
 */
async function deleteAccessPolicy(
	api: CloudflareApi,
	applicationId: string,
	policyId: string,
): Promise<void> {
	const response = await api.delete(
		`/accounts/${api.accountId}/access/apps/${applicationId}/policies/${policyId}`,
	);

	// 404 is acceptable during deletion for idempotency
	if (!response.ok && response.status !== 404) {
		await handleApiError(response, "deleting", "Access Policy", policyId);
	}
}

/**
 * Build the API payload for Access Policy create/update
 */
function buildAccessPolicyPayload(
	props: AccessPolicyProps,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		name: props.name,
		decision: props.decision,
		precedence: props.precedence,
		include: props.include.map(convertAccessRuleToApi),
		exclude: props.exclude?.map(convertAccessRuleToApi) ?? [],
		require: props.require?.map(convertAccessRuleToApi) ?? [],
	};

	if (props.sessionDuration !== undefined) {
		payload.session_duration = props.sessionDuration;
	}

	return payload;
}

/**
 * Convert an AccessRule to the Cloudflare API format
 */
function convertAccessRuleToApi(rule: AccessRule): Record<string, unknown> {
	if ("everyone" in rule) {
		return { everyone: {} };
	}

	if ("email" in rule) {
		return { email: rule.email };
	}

	if ("emailDomain" in rule) {
		return { email_domain: rule.emailDomain };
	}

	if ("github" in rule) {
		const github: Record<string, unknown> = {
			name: rule.github.name,
			identity_provider_id: rule.github.identityProviderId,
		};
		if (rule.github.teams) {
			github.teams = rule.github.teams;
		}
		return { github: github };
	}

	if ("gsuite" in rule) {
		const gsuite: Record<string, unknown> = {
			identity_provider_id: rule.gsuite.identityProviderId,
		};
		if (rule.gsuite.email) {
			gsuite.email = rule.gsuite.email;
		}
		return { gsuite: gsuite };
	}

	if ("azureAd" in rule) {
		return {
			azure_ad: {
				id: rule.azureAd.id,
				identity_provider_id: rule.azureAd.identityProviderId,
			},
		};
	}

	if ("okta" in rule) {
		const okta: Record<string, unknown> = {
			identity_provider_id: rule.okta.identityProviderId,
		};
		if (rule.okta.name) {
			okta.name = rule.okta.name;
		}
		return { okta: okta };
	}

	if ("saml" in rule) {
		return {
			saml: {
				identity_provider_id: rule.saml.identityProviderId,
				attribute_name: rule.saml.attributeName,
				attribute_value: rule.saml.attributeValue,
			},
		};
	}

	if ("ip" in rule) {
		return { ip: rule.ip };
	}

	if ("ipList" in rule) {
		return { ip_list: rule.ipList };
	}

	if ("country" in rule) {
		return { geo: rule.country };
	}

	if ("certificate" in rule) {
		return { certificate: {} };
	}

	if ("commonName" in rule) {
		return { common_name: rule.commonName };
	}

	if ("serviceToken" in rule) {
		return { service_token: rule.serviceToken };
	}

	if ("anyValidServiceToken" in rule) {
		return { any_valid_service_token: {} };
	}

	if ("group" in rule) {
		return { group: rule.group };
	}

	if ("devicePosture" in rule) {
		return { device_posture: rule.devicePosture };
	}

	throw new Error(`Unknown access rule type: ${JSON.stringify(rule)}`);
}
