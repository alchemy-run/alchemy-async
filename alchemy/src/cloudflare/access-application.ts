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
 * CORS configuration for Access Applications
 */
export interface AccessApplicationCorsConfig {
	/**
	 * Allowed origins for CORS requests
	 */
	allowedOrigins?: string[];

	/**
	 * Allowed HTTP methods for CORS requests
	 */
	allowedMethods?: (
		| "GET"
		| "POST"
		| "PUT"
		| "DELETE"
		| "PATCH"
		| "HEAD"
		| "OPTIONS"
	)[];

	/**
	 * Allowed headers for CORS requests
	 */
	allowedHeaders?: string[];

	/**
	 * Whether credentials are allowed in CORS requests
	 */
	allowCredentials?: boolean;

	/**
	 * Maximum age for CORS preflight cache (in seconds)
	 */
	maxAge?: number;
}

/**
 * Properties for creating or updating an Access Application
 */
export interface AccessApplicationProps extends CloudflareApiOptions {
	/**
	 * The name of the Access Application
	 */
	name: string;

	/**
	 * The domain to protect with Cloudflare Access
	 */
	domain: string;

	/**
	 * The type of Access Application
	 * - self_hosted: A self-hosted web application
	 * - saas: A SaaS application
	 * - ssh: SSH access
	 * - vnc: VNC access
	 * - bookmark: A bookmark application
	 */
	type: "self_hosted" | "saas" | "ssh" | "vnc" | "bookmark";

	/**
	 * Session duration for the application
	 * Format: "24h", "12h", "8h", "1h", etc.
	 * @default "24h"
	 */
	sessionDuration?: string;

	/**
	 * Whether to automatically redirect users to the identity provider
	 * @default false
	 */
	autoRedirectToIdentity?: boolean;

	/**
	 * Whether the application is visible in the App Launcher
	 * @default true
	 */
	appLauncherVisible?: boolean;

	/**
	 * List of identity provider IDs allowed for this application
	 */
	allowedIdps?: string[];

	/**
	 * CORS configuration for the application
	 */
	corsHeaders?: AccessApplicationCorsConfig;

	/**
	 * SameSite attribute for the session cookie
	 * @default "lax"
	 */
	sameSiteCookieAttribute?: "strict" | "lax" | "none";

	/**
	 * Whether the session cookie should be HttpOnly
	 * @default true
	 */
	httpOnlyCookieAttribute?: boolean;

	/**
	 * URL of the application logo
	 */
	logoUrl?: string;

	/**
	 * Whether to skip the interstitial page before redirecting to the application
	 * @default false
	 */
	skipInterstitial?: boolean;

	/**
	 * Whether to adopt an existing Access Application with the same domain
	 * @default false
	 */
	adopt?: boolean;

	/**
	 * Whether to delete the Access Application on resource destruction
	 * @default true
	 */
	delete?: boolean;
}

/**
 * Cloudflare Access Application response from API
 */
interface CloudflareAccessApplication {
	id: string;
	uid: string;
	name: string;
	domain: string;
	type: "self_hosted" | "saas" | "ssh" | "vnc" | "bookmark";
	session_duration: string;
	auto_redirect_to_identity: boolean;
	app_launcher_visible: boolean;
	allowed_idps?: string[];
	cors_headers?: {
		allowed_origins?: string[];
		allowed_methods?: string[];
		allowed_headers?: string[];
		allow_credentials?: boolean;
		max_age?: number;
	};
	same_site_cookie_attribute?: string;
	http_only_cookie_attribute?: boolean;
	logo_url?: string;
	skip_interstitial?: boolean;
	created_at: string;
	updated_at: string;
	aud: string;
}

/**
 * Output returned after Access Application creation/update
 */
export interface AccessApplication extends AccessApplicationProps {
	/**
	 * The unique identifier for the Access Application
	 */
	id: string;

	/**
	 * The unique audience tag for the Access Application
	 * Used to verify JWTs from Cloudflare Access
	 */
	aud: string;

	/**
	 * Time at which the Access Application was created
	 */
	createdAt: string;

	/**
	 * Time at which the Access Application was last updated
	 */
	updatedAt: string;
}

/**
 * Creates and manages a Cloudflare Access Application.
 *
 * Access Applications protect your web applications, SSH servers, or other
 * resources behind Cloudflare Access authentication.
 *
 * @example
 * // Create a basic self-hosted Access Application
 * const app = await AccessApplication("internal-api", {
 *   name: "Internal API",
 *   domain: "internal.example.com",
 *   type: "self_hosted",
 *   sessionDuration: "24h",
 * });
 *
 * @example
 * // Create an Access Application with automatic identity redirect
 * const app = await AccessApplication("dashboard", {
 *   name: "Internal Dashboard",
 *   domain: "dashboard.example.com",
 *   type: "self_hosted",
 *   autoRedirectToIdentity: true,
 *   sessionDuration: "8h",
 * });
 *
 * @example
 * // Create an Access Application with CORS configuration
 * const app = await AccessApplication("api", {
 *   name: "API Server",
 *   domain: "api.example.com",
 *   type: "self_hosted",
 *   corsHeaders: {
 *     allowedOrigins: ["https://app.example.com"],
 *     allowedMethods: ["GET", "POST", "PUT", "DELETE"],
 *     allowCredentials: true,
 *   },
 * });
 *
 * @example
 * // Create an SSH Access Application
 * const sshApp = await AccessApplication("ssh-server", {
 *   name: "SSH Server",
 *   domain: "ssh.example.com",
 *   type: "ssh",
 *   sessionDuration: "1h",
 * });
 *
 * @see https://developers.cloudflare.com/cloudflare-one/applications/
 * @see https://developers.cloudflare.com/api/resources/zero_trust/subresources/access/subresources/applications/
 */
export const AccessApplication = Resource(
	"cloudflare::AccessApplication",
	async function (
		this: Context<AccessApplication>,
		_id: string,
		props: AccessApplicationProps,
	): Promise<AccessApplication> {
		const api = await createCloudflareApi(props);
		const adopt = props.adopt ?? this.scope.adopt;

		if (this.phase === "delete") {
			if (props.delete !== false && this.output?.id) {
				await deleteAccessApplication(api, this.output.id);
			}
			return this.destroy();
		}

		let appData: CloudflareAccessApplication;

		if (this.phase === "update" && this.output?.id) {
			// Update existing application
			appData = await updateAccessApplication(api, this.output.id, props);
		} else {
			// Create new application
			try {
				appData = await createAccessApplication(api, props);
			} catch (error) {
				// Check if this is a "domain already exists" error and adopt is enabled
				if (
					adopt &&
					error instanceof Error &&
					(error.message.includes("already exists") ||
						error.message.includes("duplicate"))
				) {
					// Find existing application by domain
					const existingApp = await findAccessApplicationByDomain(
						api,
						props.domain,
					);

					if (!existingApp) {
						throw new Error(
							`Failed to find existing Access Application for domain '${props.domain}' for adoption`,
						);
					}

					// Update the existing application with our props
					appData = await updateAccessApplication(api, existingApp.id, props);
				} else {
					throw error;
				}
			}
		}

		return {
			...props,
			id: appData.id,
			aud: appData.aud,
			createdAt: appData.created_at,
			updatedAt: appData.updated_at,
		};
	},
);

/**
 * Create a new Access Application
 */
async function createAccessApplication(
	api: CloudflareApi,
	props: AccessApplicationProps,
): Promise<CloudflareAccessApplication> {
	const payload = buildAccessApplicationPayload(props);

	const response = await api.post(
		`/accounts/${api.accountId}/access/apps`,
		payload,
	);

	if (!response.ok) {
		await handleApiError(
			response,
			"creating",
			"Access Application",
			props.name,
		);
	}

	const data =
		(await response.json()) as CloudflareApiResponse<CloudflareAccessApplication>;

	if (!data.success || !data.result) {
		throw new Error(
			`Failed to create Access Application: ${JSON.stringify(data)}`,
		);
	}

	return data.result;
}

/**
 * Update an existing Access Application
 */
async function updateAccessApplication(
	api: CloudflareApi,
	appId: string,
	props: AccessApplicationProps,
): Promise<CloudflareAccessApplication> {
	const payload = buildAccessApplicationPayload(props);

	const response = await api.put(
		`/accounts/${api.accountId}/access/apps/${appId}`,
		payload,
	);

	if (!response.ok) {
		await handleApiError(
			response,
			"updating",
			"Access Application",
			props.name,
		);
	}

	const data =
		(await response.json()) as CloudflareApiResponse<CloudflareAccessApplication>;

	if (!data.success || !data.result) {
		throw new Error(
			`Failed to update Access Application: ${JSON.stringify(data)}`,
		);
	}

	return data.result;
}

/**
 * Delete an Access Application
 */
async function deleteAccessApplication(
	api: CloudflareApi,
	appId: string,
): Promise<void> {
	const response = await api.delete(
		`/accounts/${api.accountId}/access/apps/${appId}`,
	);

	// 404 is acceptable during deletion for idempotency
	if (!response.ok && response.status !== 404) {
		await handleApiError(response, "deleting", "Access Application", appId);
	}
}

/**
 * Find an Access Application by domain
 */
async function findAccessApplicationByDomain(
	api: CloudflareApi,
	domain: string,
): Promise<CloudflareAccessApplication | null> {
	const response = await api.get(`/accounts/${api.accountId}/access/apps`);

	if (!response.ok) {
		await handleApiError(response, "listing", "Access Applications", domain);
	}

	const data = (await response.json()) as CloudflareApiResponse<
		CloudflareAccessApplication[]
	>;

	if (!data.success || !data.result) {
		return null;
	}

	return data.result.find((app) => app.domain === domain) ?? null;
}

/**
 * Build the API payload for Access Application create/update
 */
function buildAccessApplicationPayload(
	props: AccessApplicationProps,
): Record<string, unknown> {
	const payload: Record<string, unknown> = {
		name: props.name,
		domain: props.domain,
		type: props.type,
	};

	if (props.sessionDuration !== undefined) {
		payload.session_duration = props.sessionDuration;
	}

	if (props.autoRedirectToIdentity !== undefined) {
		payload.auto_redirect_to_identity = props.autoRedirectToIdentity;
	}

	if (props.appLauncherVisible !== undefined) {
		payload.app_launcher_visible = props.appLauncherVisible;
	}

	if (props.allowedIdps !== undefined) {
		payload.allowed_idps = props.allowedIdps;
	}

	if (props.corsHeaders !== undefined) {
		payload.cors_headers = {
			allowed_origins: props.corsHeaders.allowedOrigins,
			allowed_methods: props.corsHeaders.allowedMethods,
			allowed_headers: props.corsHeaders.allowedHeaders,
			allow_credentials: props.corsHeaders.allowCredentials,
			max_age: props.corsHeaders.maxAge,
		};
	}

	if (props.sameSiteCookieAttribute !== undefined) {
		payload.same_site_cookie_attribute = props.sameSiteCookieAttribute;
	}

	if (props.httpOnlyCookieAttribute !== undefined) {
		payload.http_only_cookie_attribute = props.httpOnlyCookieAttribute;
	}

	if (props.logoUrl !== undefined) {
		payload.logo_url = props.logoUrl;
	}

	if (props.skipInterstitial !== undefined) {
		payload.skip_interstitial = props.skipInterstitial;
	}

	return payload;
}
