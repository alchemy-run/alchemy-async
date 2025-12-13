import { Credentials } from "../auth.ts";
import { OAuthClient } from "../util/oauth-client.ts";
export declare namespace CloudflareAuth {
    const client: OAuthClient;
    type Metadata = {
        id: string;
        name: string;
    };
    const ALL_SCOPES: {
        readonly "access:read": "See Cloudflare Access data such as zones, applications, certificates, device postures, groups, identity providers, login counts, organizations, policies, service tokens, and users";
        readonly "access:write": "See and change Cloudflare Access data such as zones, applications, certificates, device postures, groups, identity providers, login counts, organizations, policies, service tokens, and users";
        readonly "account:read": "See your account info such as account details, analytics, and memberships";
        readonly "agw:read": "Grants read level access to Agents Gateway";
        readonly "agw:run": "Grants run level access to Agents Gateway";
        readonly "agw:write": "Grants read and write level access to Agents Gateway";
        readonly "ai:read": "Grants read level access to Workers AI";
        readonly "ai:write": "Grants write level access to Workers AI";
        readonly "aiaudit:read": "Grants read level access to AI Audit";
        readonly "aiaudit:write": "Grants write level access to AI Audit";
        readonly "aig:read": "Grants read level access to AI Gateway";
        readonly "aig:write": "Grants write level access to AI Gateway";
        readonly "auditlogs:read": "View Cloudflare Account Audit Logs";
        readonly "browser:read": "Grants read level access to Browser Rendering";
        readonly "browser:write": "Grants write level access to Browser Rendering";
        readonly "cfone:read": "Grants read level access to Cloudforce One data";
        readonly "cfone:write": "Grants write level access to Cloudforce One data";
        readonly "cloudchamber:write": "See and make changes to Cloudchamber";
        readonly "connectivity:admin": "See, change, and bind to Connectivity Directory services, including creating services targeting Cloudflare Tunnel";
        readonly "connectivity:bind": "read, list, and bind to Connectivity Directory services, as well as read and list Cloudflare Tunnels";
        readonly "connectivity:read": "See Connectivity Directory services and Cloudflare Tunnels";
        readonly "constellation:write": "Grants write access to Constellation configuration and models";
        readonly "containers:write": "See and make changes to Workers Containers";
        readonly "d1:write": "See and make changes to D1";
        readonly "dex:read": "Grants read level access to Cloudflare DEX";
        readonly "dex:write": "Grants write level access to Cloudflare DEX";
        readonly "dns_analytics:read": "Grants read level access to Cloudflare DNS Analytics";
        readonly "dns_records:edit": "Grants edit level access to dns records";
        readonly "dns_records:read": "Grants read level access to dns records";
        readonly "dns_settings:read": "Grants read level access to Cloudflare DNS Settings";
        readonly "firstpartytags:write": "Can see, edit and publish Google tag gateway configuration.";
        readonly "lb:edit": "Grants edit level access to lb and lb pools";
        readonly "lb:read": "Grants read level access to lb and lb pools";
        readonly "logpush:read": "See Cloudflare Logpush data";
        readonly "logpush:write": "See and change Cloudflare Logpush data";
        readonly "notification:read": "View Cloudflare Notifications";
        readonly "notification:write": "View and Modify Cloudflare Notifications";
        readonly "pages:read": "See Cloudflare Pages projects, settings and deployments";
        readonly "pages:write": "See and change Cloudflare Pages projects, settings and deployments";
        readonly "pipelines:read": "Grants read level access to Cloudflare Pipelines";
        readonly "pipelines:setup": "Grants permission to generate R2 tokens for Workers Pipelines";
        readonly "pipelines:write": "Grants write level access to Cloudflare Pipelines";
        readonly "query_cache:write": "See and make changes to Hyperdrive";
        readonly "queues:write": "See and change Cloudflare Queues settings and data";
        readonly "r2_catalog:write": "Grants write level access to R2 Data Catalog";
        readonly "radar:read": "Grants access to read Cloudflare Radar data";
        readonly "rag:read": "Grants read level access to Auto Rag";
        readonly "rag:write": "Grants write level access to Auto Rag";
        readonly "secrets_store:read": "Grants read level access to Secrets Store";
        readonly "secrets_store:write": "Grants write level access to Secrets Store";
        readonly "ssl_certs:write": "Grants read and write access to SSL MTLS certificates or Certificate Store";
        readonly "sso-connector:read": "See Cloudflare SSO connectors";
        readonly "sso-connector:write": "See Cloudflare SSO connectors to toggle activation and deactivation of SSO";
        readonly "teams:pii": "See personally identifiable Cloudflare Teams data";
        readonly "teams:read": "See Cloudflare Teams data such as zones, gateway, and argo tunnel details";
        readonly "teams:secure_location": "See all DNS Location data but can only change secure DNS Locations";
        readonly "teams:write": "See and change Cloudflare Teams data such as zones, gateway, and argo tunnel details";
        readonly "url_scanner:read": "Grants read level access to URL Scanner";
        readonly "url_scanner:write": "Grants write level access to URL Scanner";
        readonly "user:read": "See your user info such as name, email address, and account memberships";
        readonly "vectorize:write": "See and make changes to Vectorize";
        readonly "workers:read": "See Cloudflare Workers data such as zones, KV storage, R2 storage, scripts, and routes";
        readonly "workers:write": "See and change Cloudflare Workers data such as zones, KV storage, R2 storage, scripts, and routes";
        readonly "workers_builds:read": "See Cloudflare Workers Builds data such as builds, build configuration, and build logs";
        readonly "workers_builds:write": "See and change Cloudflare Workers Builds data such as builds, build configuration, and build logs";
        readonly "workers_kv:write": "See and change Cloudflare Workers KV Storage data such as keys and namespaces";
        readonly "workers_observability:read": "Grants read access to Cloudflare Workers Observability";
        readonly "workers_observability_telemetry:write": "Grants write access to Cloudflare Workers Observability Telemetry API";
        readonly "workers_routes:write": "See and change Cloudflare Workers data such as filters and routes";
        readonly "workers_scripts:write": "See and change Cloudflare Workers scripts, durable objects, subdomains, triggers, and tail data";
        readonly "workers_tail:read": "See Cloudflare Workers tail and script data";
        readonly "zone:read": "Grants read level access to account zone";
    };
    type Scope = keyof typeof ALL_SCOPES;
    const DEFAULT_SCOPES: string[];
    /**
     * Format Cloudflare credentials as headers, refreshing OAuth credentials if expired.
     * If the credentials are OAuth, the `profile` is required so we can read and write the updated credentials.
     */
    const formatHeadersWithRefresh: (input: {
        profile: string | undefined;
        credentials: Credentials;
    }) => Promise<Record<string, string>>;
    /**
     * Format Cloudflare credentials as headers.
     */
    const formatHeaders: (credentials: Credentials) => Record<string, string>;
}
//# sourceMappingURL=auth.d.ts.map