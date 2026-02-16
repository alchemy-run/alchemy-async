import assert from "node:assert";
import { Credentials } from "../auth.ts";
import { OAuthClient } from "../util/oauth-client.ts";

export namespace CloudflareAuth {
  export const client = new OAuthClient({
    clientId: "6d8c2255-0773-45f6-b376-2914632e6f91",
    redirectUri: "http://localhost:9976/auth/callback",
    endpoints: {
      authorize: "https://dash.cloudflare.com/oauth2/authorize",
      token: "https://dash.cloudflare.com/oauth2/token",
      revoke: "https://dash.cloudflare.com/oauth2/revoke",
    },
  });

  export type Metadata = {
    id: string;
    name: string;
  };
  export const ALL_SCOPES = {
    "access:read":
      "See Cloudflare Access data such as zones, applications, certificates, device postures, groups, identity providers, login counts, organizations, policies, service tokens, and users",
    "access:write":
      "See and change Cloudflare Access data such as zones, applications, certificates, device postures, groups, identity providers, login counts, organizations, policies, service tokens, and users",
    "account:read":
      "See your account info such as account details, analytics, and memberships",
    "agw:read": "Grants read level access to Agents Gateway",
    "agw:run": "Grants run level access to Agents Gateway",
    "agw:write": "Grants read and write level access to Agents Gateway",
    "ai:read": "Grants read level access to Workers AI",
    "ai:write": "Grants write level access to Workers AI",
    "aiaudit:read": "Grants read level access to AI Audit",
    "aiaudit:write": "Grants write level access to AI Audit",
    "aig:read": "Grants read level access to AI Gateway",
    "aig:write": "Grants write level access to AI Gateway",
    "auditlogs:read": "View Cloudflare Account Audit Logs",
    "browser:read": "Grants read level access to Browser Rendering",
    "browser:write": "Grants write level access to Browser Rendering",
    "cfone:read": "Grants read level access to Cloudforce One data",
    "cfone:write": "Grants write level access to Cloudforce One data",
    "cloudchamber:write": "See and make changes to Cloudchamber",
    "connectivity:admin":
      "See, change, and bind to Connectivity Directory services, including creating services targeting Cloudflare Tunnel",
    "connectivity:bind":
      "read, list, and bind to Connectivity Directory services, as well as read and list Cloudflare Tunnels",
    "connectivity:read":
      "See Connectivity Directory services and Cloudflare Tunnels",
    "constellation:write":
      "Grants write access to Constellation configuration and models",
    "containers:write": "See and make changes to Workers Containers",
    "d1:write": "See and make changes to D1",
    "dex:read": "Grants read level access to Cloudflare DEX",
    "dex:write": "Grants write level access to Cloudflare DEX",
    "dns_analytics:read":
      "Grants read level access to Cloudflare DNS Analytics",
    "dns_records:edit": "Grants edit level access to dns records",
    "dns_records:read": "Grants read level access to dns records",
    "dns_settings:read": "Grants read level access to Cloudflare DNS Settings",
    "firstpartytags:write":
      "Can see, edit and publish Google tag gateway configuration.",
    "lb:edit": "Grants edit level access to lb and lb pools",
    "lb:read": "Grants read level access to lb and lb pools",
    "logpush:read": "See Cloudflare Logpush data",
    "logpush:write": "See and change Cloudflare Logpush data",
    "notification:read": "View Cloudflare Notifications",
    "notification:write": "View and Modify Cloudflare Notifications",
    "pages:read": "See Cloudflare Pages projects, settings and deployments",
    "pages:write":
      "See and change Cloudflare Pages projects, settings and deployments",
    "pipelines:read": "Grants read level access to Cloudflare Pipelines",
    "pipelines:setup":
      "Grants permission to generate R2 tokens for Workers Pipelines",
    "pipelines:write": "Grants write level access to Cloudflare Pipelines",
    "query_cache:write": "See and make changes to Hyperdrive",
    "queues:write": "See and change Cloudflare Queues settings and data",
    "r2_catalog:write": "Grants write level access to R2 Data Catalog",
    "radar:read": "Grants access to read Cloudflare Radar data",
    "rag:read": "Grants read level access to Auto Rag",
    "rag:write": "Grants write level access to Auto Rag",
    "secrets_store:read": "Grants read level access to Secrets Store",
    "secrets_store:write": "Grants write level access to Secrets Store",
    "ssl_certs:write":
      "Grants read and write access to SSL MTLS certificates or Certificate Store",
    "sso-connector:read": "See Cloudflare SSO connectors",
    "sso-connector:write":
      "See Cloudflare SSO connectors to toggle activation and deactivation of SSO",
    "teams:pii": "See personally identifiable Cloudflare Teams data",
    "teams:read":
      "See Cloudflare Teams data such as zones, gateway, and argo tunnel details",
    "teams:secure_location":
      "See all DNS Location data but can only change secure DNS Locations",
    "teams:write":
      "See and change Cloudflare Teams data such as zones, gateway, and argo tunnel details",
    "url_scanner:read": "Grants read level access to URL Scanner",
    "url_scanner:write": "Grants write level access to URL Scanner",
    "user:read":
      "See your user info such as name, email address, and account memberships",
    "vectorize:write": "See and make changes to Vectorize",
    "workers:read":
      "See Cloudflare Workers data such as zones, KV storage, R2 storage, scripts, and routes",
    "workers:write":
      "See and change Cloudflare Workers data such as zones, KV storage, R2 storage, scripts, and routes",
    "workers_builds:read":
      "See Cloudflare Workers Builds data such as builds, build configuration, and build logs",
    "workers_builds:write":
      "See and change Cloudflare Workers Builds data such as builds, build configuration, and build logs",
    "workers_kv:write":
      "See and change Cloudflare Workers KV Storage data such as keys and namespaces",
    "workers_observability:read":
      "Grants read access to Cloudflare Workers Observability",
    "workers_observability_telemetry:write":
      "Grants write access to Cloudflare Workers Observability Telemetry API",
    "workers_routes:write":
      "See and change Cloudflare Workers data such as filters and routes",
    "workers_scripts:write":
      "See and change Cloudflare Workers scripts, durable objects, subdomains, triggers, and tail data",
    "workers_tail:read": "See Cloudflare Workers tail and script data",
    "zone:read": "Grants read level access to account zone",
  } as const;
  export type Scope = keyof typeof ALL_SCOPES;
  export const DEFAULT_SCOPES = [
    "account:read",
    "user:read",
    "workers:write",
    "workers_kv:write",
    "workers_routes:write",
    "workers_scripts:write",
    "workers_tail:read",
    "d1:write",
    "pages:write",
    "zone:read",
    "ssl_certs:write",
    "ai:write",
    "queues:write",
    "pipelines:write",
    "secrets_store:write",
    "containers:write",
    "cloudchamber:write",
    "vectorize:write",
    "connectivity:admin",
  ];

  /**
   * Format Cloudflare credentials as headers, refreshing OAuth credentials if expired.
   * If the credentials are OAuth, the `profile` is required so we can read and write the updated credentials.
   */
  export const formatHeadersWithRefresh = async (input: {
    profile: string | undefined;
    credentials: Credentials;
  }) => {
    // if the credentials are not expired, return them as is
    if (!Credentials.isOAuthExpired(input.credentials)) {
      return formatHeaders(input.credentials);
    }
    assert(input.profile, "Profile is required for OAuth credentials");
    const credentials = await Credentials.getRefreshed(
      {
        provider: "cloudflare",
        profile: input.profile,
      },
      async (credentials) => {
        return await client.refresh(credentials);
      },
    );
    return formatHeaders(credentials);
  };

  /**
   * Format Cloudflare credentials as headers.
   */
  export const formatHeaders = (
    credentials: Credentials,
  ): Record<string, string> => {
    switch (credentials.type) {
      case "api-key":
        return {
          "X-Auth-Key": credentials.apiKey,
          "X-Auth-Email": credentials.email,
        };
      case "api-token":
        return { Authorization: `Bearer ${credentials.apiToken}` };
      case "oauth":
        return { Authorization: `Bearer ${credentials.access}` };
    }
  };
}
