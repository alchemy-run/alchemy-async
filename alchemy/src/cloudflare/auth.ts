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
    // TODO: Verify descriptions marked with `//*`
    "access:read": "Read Cloudflare Access", //*
    "access:write": "Write Cloudflare Access", //*
    "account:read":
      "See your account info such as account details, analytics, and memberships.",
    "agw:read": "Read API Gateway", //*
    "agw:run": "Run API Gateway", //*
    "ai:read": "Read access to Workers AI catalog and assets",
    "ai:write": "See and change Workers AI catalog and assets",
    "aiaudit:read": "Read AI Audit", //*
    "aiaudit:write": "Write AI Audit", //*
    "aig:read": "Read AI Gateway", //*
    "aig:write": "Write AI Gateway", //*
    "auditlogs:read": "Read audit logs", //*
    "browser:read": "Read Browser", //*
    "browser:write": "Write Browser", //*
    "cfone:read": "Read Cloudflare One", //*
    "cfone:write": "Write Cloudflare One", //*
    "cloudchamber:write": "Manage Cloudchamber",
    "constellation:write": "Write Constellation", //*
    "containers:write": "Manage Workers Containers",
    "d1:write": "See and change D1 Databases.",
    "dex:read": "Read DEX", //*
    "dex:write": "Write DEX", //*
    "dns_analytics:read": "Read DNS analytics",
    "dns_records:edit": "Edit DNS records",
    "dns_records:read": "Read DNS records",
    "dns_settings:read": "Read DNS settings",
    "firstpartytags:write": "Write First Party Tags", //*
    "lb:edit": "Edit Load Balancer", //*
    "lb:read": "Read Load Balancer", //*
    "logpush:read": "Read Logpush", //*
    "logpush:write": "Write Logpush", //*
    "notification:read": "Read Notifications", //*
    "notification:write": "Write Notifications", //*
    "pages:read": "Read access to Pages projects, settings, and deployments.",
    "pages:write": "See and change Pages projects, settings, and deployments.",
    "pipelines:read": "Read access to Pipelines configurations and data",
    "pipelines:setup": "Setup access to Pipelines configurations and data",
    "pipelines:write": "See and change Pipelines configurations and data",
    "query_cache:write": "Write Query Cache", //*
    "queues:write": "See and change Queues settings and data",
    "r2_catalog:write": "Write R2 Catalog", //*
    "radar:read": "Read Radar", //*
    "rag:read": "Read RAG", //*
    "rag:write": "Write RAG", //*
    "secrets_store:read":
      "Read access to secrets + stores within the Secrets Store",
    "secrets_store:write":
      "See and change secrets + stores within the Secrets Store",
    "sso-connector:read": "Read SSO Connector", //*
    "sso-connector:write": "Write SSO Connector", //*
    "ssl_certs:write": "See and manage mTLS certificates for your account",
    "teams:pii": "Read Teams PII", //*
    "teams:read": "Read Teams", //*
    "teams:secure_location": "Read Secure Location", //*
    "teams:write": "Write Teams", //*
    "url_scanner:read": "Read URL Scanner", //*
    "url_scanner:write": "Write URL Scanner", //*
    "user:read":
      "See your user info such as name, email address, and account memberships.",
    "vectorize:write": "Write Vectorize", //*
    "workers:write":
      "See and change Cloudflare Workers data such as zones, KV storage, namespaces, scripts, and routes.",
    "workers_builds:read": "Read Workers Builds", //*
    "workers_builds:write": "Write Workers Builds", //*
    "workers_kv:write":
      "See and change Cloudflare Workers KV Storage data such as keys and namespaces.",
    "workers_observability:read": "Read Workers Observability", //*
    "workers_observability:write": "Write Workers Observability", //*
    "workers_observability_telemetry:write":
      "Write Workers Observability Telemetry", //*
    "workers_routes:write":
      "See and change Cloudflare Workers data such as filters and routes.",
    "workers_scripts:write":
      "See and change Cloudflare Workers scripts, durable objects, subdomains, triggers, and tail data.",
    "workers_tail:read": "See Cloudflare Workers tail and script data.",
    "zone:read": "Grants read level access to account zone.",
    // Not granted yet
    // "connectivity:admin":
    //   "See, change, and bind to Connectivity Directory services, including creating services targeting Cloudflare Tunnel.",
  };
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
