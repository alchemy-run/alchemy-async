import {
  confirm,
  intro,
  isCancel,
  log,
  outro,
  password,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import z from "zod";
import { Profile, Provider } from "../../src/auth.ts";
import { extractCloudflareResult } from "../../src/cloudflare/api-response.ts";
import type { CloudflareAuth } from "../../src/cloudflare/auth.ts";
import { PERMISSION_GROUPS } from "../../src/cloudflare/permission-groups.ts";
import { CancelSignal, loggedProcedure, t } from "../trpc.ts";
import { promptForProfileName } from "./configure.ts";

const createCloudflareToken = loggedProcedure
  .meta({
    description: "Create a Cloudflare god token with API key and account IDs",
  })
  .input(
    z.object({
      profile: z
        .string()
        .optional()
        .meta({ alias: "p" })
        .describe("the profile to use to generate a token"),
      godToken: z
        .boolean()
        .optional()
        .describe("if a god token should be created"),
    }),
  )
  .mutation(async ({ input }) => {
    if (input.godToken) {
      await createCloudflareGodToken();
    } else {
      await createCloudflareProfileToken(input);
    }
  });

export const util = t.router({
  "create-cloudflare-token": createCloudflareToken,
});

function formatTokenPolicies(
  accountIds: string[],
  predicate: (group: PermissionGroup) => boolean = () => true,
): TokenPolicy[] {
  const policies: Record<PermissionGroup["scopes"][number], TokenPolicy> = {
    "com.cloudflare.api.account": {
      effect: "allow",
      permission_groups: [],
      resources: Object.fromEntries(
        accountIds.map((id) => [`com.cloudflare.api.account.${id}`, "*"]),
      ),
    },
    "com.cloudflare.api.account.zone": {
      effect: "allow",
      permission_groups: [],
      resources: {
        "com.cloudflare.api.account.zone.*": "*",
      },
    },
    "com.cloudflare.edge.r2.bucket": {
      effect: "allow",
      permission_groups: [],
      resources: {
        "com.cloudflare.edge.r2.bucket.*": "*",
      },
    },
  };
  for (const group of PERMISSION_GROUPS) {
    if (!predicate(group)) continue;
    policies[group.scopes[0]].permission_groups.push({
      id: group.id,
    });
  }
  return Object.values(policies).filter(
    (policy) => policy.permission_groups.length > 0,
  );
}

interface TokenPolicy {
  id?: string;
  effect: "allow" | "deny";
  permission_groups: {
    id: string;
    meta?: { key: string; value: string };
    name?: string;
  }[];
  resources: Record<string, string> | Record<string, Record<string, string>>;
}

async function createToken(
  name: string,
  policies: TokenPolicy[],
  credentials: { apiKey: string; accountEmail: string },
) {
  const apiToken = await extractCloudflareResult<{ value: string }>(
    "create cloudflare token",
    fetch("https://api.cloudflare.com/client/v4/user/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Key": credentials.apiKey,
        "X-Auth-Email": credentials.accountEmail,
      },
      body: JSON.stringify({
        name: `Alchemy Token - ${name}`,
        status: "active",
        policies,
      }),
    }),
  );
  return apiToken.value;
}

async function createCloudflareGodToken() {
  intro(pc.cyan("🧪 Create Cloudflare God Token"));

  const apiKey = await password({
    message:
      "Enter Cloudflare Global API Key. It can be found in the cloudflare dashboard: https://dash.cloudflare.com/profile/api-tokens",
  });
  if (isCancel(apiKey)) {
    throw new CancelSignal();
  }

  const accountEmail = await text({
    message: "Enter account email",
    placeholder: "user@example.com",
  });
  if (isCancel(accountEmail)) {
    throw new CancelSignal();
  }

  const accountIds: string[] = [];
  log.info(
    pc.dim("Enter account IDs (press enter with empty value to finish)"),
  );

  while (true) {
    const accountId = await text({
      message: `Enter account ID ${
        accountIds.length > 0 ? "(or press enter to finish)" : ""
      }`,
      placeholder: accountIds.length === 0 ? "account-id" : "",
      defaultValue: "",
      validate: (value) => {
        if (!value?.trim() && accountIds.length === 0) {
          return "Please enter at least one account ID";
        }
      },
    });

    if (isCancel(accountId)) {
      throw new CancelSignal();
    }

    const trimmedId = (accountId || "").trim();

    if (!trimmedId && accountIds.length > 0) {
      log.info(pc.dim("Finishing input..."));
      break;
    }

    if (trimmedId) {
      accountIds.push(trimmedId);
      log.info(pc.dim(`Added account ID: ${trimmedId}`));
    }
  }

  log.error(
    pc.red(
      "⚠️ This token has full access to your cloudflare account, make sure you keep it secure!",
    ),
  );

  const confirmCreate = await confirm({
    message: "Do you understand the risks and want to proceed?",
    initialValue: false,
  });

  if (isCancel(confirmCreate) || !confirmCreate) {
    log.info(pc.dim("Token creation cancelled"));
    throw new CancelSignal();
  }

  const apiToken = await createToken(
    "GOD-TOKEN",
    formatTokenPolicies(accountIds),
    {
      apiKey,
      accountEmail,
    },
  );

  outro(`Cloudflare god token created: ${pc.magenta(apiToken)}`);
}

async function createCloudflareProfileToken(input: { profile?: string }) {
  const name = await promptForProfileName(input);
  intro(pc.cyan(`🧪 Create Cloudflare Token for ${pc.bold(name)}`));

  const profile = await Profile.get(name);
  if (profile == null) {
    throw new Error(`Profile ${pc.bold(name)} not found`);
  }
  const { provider } = await Provider.getWithCredentials({
    profile: name,
    provider: "cloudflare",
  });

  if (provider.method !== "oauth") {
    throw new Error(
      `Profile ${pc.bold(name)} is not configured to use Cloudflare via OAuth`,
    );
  }

  if (provider.scopes == null) {
    throw new Error(
      `Profile ${pc.bold(name)} is not configured with any Cloudflare scopes`,
    );
  }

  const groupNames = new Set(
    provider.scopes.flatMap(
      (scope) => CLOUDFLARE_OAUTH_SCOPES_TO_PERMISSION_GROUP_NAMES[scope] ?? [],
    ),
  );
  const policies = formatTokenPolicies([provider.metadata.id], (group) =>
    groupNames.has(group.name),
  );

  const apiKey = await password({
    message:
      "Enter Cloudflare Global API Key. It can be found in the cloudflare dashboard: https://dash.cloudflare.com/profile/api-tokens",
  });
  if (isCancel(apiKey)) {
    throw new CancelSignal();
  }

  const accountEmail = await text({
    message: "Enter account email",
    placeholder: "user@example.com",
  });
  if (isCancel(accountEmail)) {
    throw new CancelSignal();
  }

  const apiToken = await createToken(name, policies, { apiKey, accountEmail });

  outro(
    `Cloudflare token created for profile ${pc.bold(name)}: ${pc.magenta(apiToken)}`,
  );
}

type PermissionGroup = (typeof PERMISSION_GROUPS)[number];

export const CLOUDFLARE_OAUTH_SCOPES_TO_PERMISSION_GROUP_NAMES: Record<
  CloudflareAuth.Scope,
  Array<PermissionGroup["name"]>
> = {
  "access:read": [
    "Access: Apps and Policies Read",
    "Access: Custom Pages Read",
    "Access: Device Posture Read",
    "Access: Mutual TLS Certificates Read",
    "Access: Organizations, Identity Providers, and Groups Read",
    "Access: Policy Test Read",
    "Access: Population Read",
    "Access: Service Tokens Read",
    "Access: SSH Auditing Read",
    "Access: SCIM logs read",
  ],
  "access:write": [
    "Access: Service Tokens Write",
    "Access: SSH Auditing Write",
    "Access: Population Write",
    "Access: Policy Test Write",
    "Access: Organizations, Identity Providers, and Groups Write",
    "Access: Organizations, Identity Providers, and Groups Revoke",
    "Access: Mutual TLS Certificates Write",
    "Access: Device Posture Write",
    "Access: Custom Pages Write",
    "Access: Apps and Policies Write",
    "Access: Apps and Policies Revoke",
    "Access: Apps and Policies Read",
    "Access: Custom Pages Read",
    "Access: Device Posture Read",
    "Access: Mutual TLS Certificates Read",
    "Access: Organizations, Identity Providers, and Groups Read",
    "Access: Policy Test Read",
    "Access: Population Read",
    "Access: Service Tokens Read",
    "Access: SSH Auditing Read",
    "Access: SCIM logs read",
  ],
  "account:read": ["Account Settings Read"],
  "agw:read": ["Account API Gateway Read"],
  "agw:run": ["Account API Gateway Read", "Account API Gateway"],
  "ai:read": ["Workers AI Read"],
  "ai:write": ["Workers AI Read", "Workers AI Write"],
  "aiaudit:read": ["AI Audit Read"],
  "aiaudit:write": ["AI Audit Read", "AI Audit Write"],
  "aig:read": ["AI Gateway Read"],
  "aig:write": ["AI Gateway Read", "AI Gateway Run", "AI Gateway Write"],
  "auditlogs:read": ["Access: Audit Logs Read"],
  "browser:read": ["Browser Rendering Read"],
  "browser:write": ["Browser Rendering Read", "Browser Rendering Write"],
  "cfone:read": [
    "Cloudflare One Connector: WARP Read",
    "Cloudflare One Connector: cloudflared Read",
    "Cloudflare One Connectors Read",
  ],
  "cfone:write": [
    "Cloudflare One Connector: WARP Write",
    "Cloudflare One Connector: cloudflared Write",
    "Cloudflare One Connectors Write",
    "Cloudflare One Connector: WARP Read",
    "Cloudflare One Connector: cloudflared Read",
    "Cloudflare One Connectors Read",
  ],
  "cloudchamber:write": ["Cloudchamber Read", "Cloudchamber Write"],
  "constellation:write": ["Constellation Read", "Constellation Write"],
  "containers:write": ["Workers Containers Read", "Workers Containers Write"],
  "d1:write": ["D1 Read", "D1 Write"],
  "dex:read": ["Cloudflare DEX Read"],
  "dex:write": [
    "Cloudflare DEX",
    "Cloudflare DEX Read",
    "Cloudflare DEX Write",
  ],
  "dns_analytics:read": [],
  "dns_records:edit": [
    "DNS Read",
    "DNS View Read",
    "DNS View Write",
    "DNS Write",
  ],
  "dns_records:read": ["DNS Read", "DNS View Read"],
  "dns_settings:read": ["Account DNS Settings Read"],
  "firstpartytags:write": ["Zaraz Edit"],
  "lb:edit": [
    "Load Balancers Account Read",
    "Load Balancers Account Write",
    "Load Balancers Write",
    "Load Balancing: Monitors and Pools Read",
    "Load Balancing: Monitors and Pools Write",
  ],
  "lb:read": [
    "Load Balancers Account Read",
    "Load Balancing: Monitors and Pools Read",
    "Load Balancers Read",
  ],
  "logpush:read": ["Logs Read"],
  "logpush:write": ["Logs Read", "Logs Write"],
  "notification:read": ["Notifications Read"],
  "notification:write": ["Notifications Read", "Notifications Write"],
  "pages:read": ["Pages Read"],
  "pages:write": ["Pages Read", "Pages Write"],
  "pipelines:read": ["Pipelines Read"],
  "pipelines:setup": ["Pipelines Send"],
  "pipelines:write": ["Pipelines Read", "Pipelines Send", "Pipelines Write"],
  "query_cache:write": [],
  "queues:write": ["Queues Read", "Queues Write"],
  "r2_catalog:write": [
    "Workers R2 Data Catalog Read",
    "Workers R2 Data Catalog Write",
    "Workers R2 SQL Read",
  ],
  "radar:read": ["Radar Read"],
  "rag:read": ["Auto Rag Read"],
  "rag:write": ["Auto Rag Read", "Auto Rag Write", "Auto Rag Write Run Engine"],
  "secrets_store:read": ["Secrets Store Read"],
  "secrets_store:write": ["Secrets Store Read", "Secrets Store Write"],
  "sso-connector:read": ["SSO Connector Read"],
  "sso-connector:write": ["SSO Connector Read", "SSO Connector Write"],
  "ssl_certs:write": [
    "Account: SSL and Certificates Read",
    "Account: SSL and Certificates Write",
    "SSL and Certificates Read",
    "SSL and Certificates Write",
  ],
  "teams:pii": [],
  "teams:read": [],
  "teams:secure_location": [],
  "teams:write": [],
  "url_scanner:read": ["URL Scanner Read"],
  "url_scanner:write": ["URL Scanner Read", "URL Scanner Write"],
  "user:read": [],
  "vectorize:write": ["Vectorize Read", "Vectorize Write"],
  "workers:write": [
    "Workers Routes Read",
    "Workers Routes Write",
    "Workers Scripts Read",
    "Workers Scripts Write",
    "Workers KV Storage Read",
    "Workers KV Storage Write",
    "Workers R2 Storage Write",
    "Workers R2 Storage Read",
    "Hyperdrive Write",
  ],
  "workers_builds:read": ["Workers CI Read"],
  "workers_builds:write": ["Workers CI Write"],
  "workers_kv:write": ["Workers KV Storage Read", "Workers KV Storage Write"],
  "workers_observability:read": ["Workers Observability Read"],
  "workers_observability_telemetry:write": [
    "Workers Observability Telemetry Write",
  ],
  "workers_routes:write": ["Workers Routes Write"],
  "workers_scripts:write": ["Workers Scripts Write"],
  "workers_tail:read": ["Workers Tail Read"],
  "zone:read": [
    "Zone Read",
    "Zone Settings Read",
    "Zone Transform Rules Read",
    "Zone Versioning Read",
    "Zone WAF Read",
  ],
  "agw:write": ["AI Gateway Read", "AI Gateway Run", "AI Gateway Write"],
  "connectivity:admin": ["Connectivity Directory Admin"],
  "connectivity:bind": ["Connectivity Directory Bind"],
  "connectivity:read": ["Connectivity Directory Read"],
  "workers:read": [
    "Workers Scripts Read",
    "Workers KV Storage Read",
    "Workers R2 Storage Read",
    "Workers Routes Read",
    "Hyperdrive Read",
  ],
};
