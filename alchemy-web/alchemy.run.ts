import alchemy from "alchemy";
import { Astro, Worker, Zone } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";

//* this is not a secret, its public
const POSTHOG_PROJECT_ID =
  process.env.POSTHOG_PROJECT_ID ??
  "phc_1ZjunjRSQE5ij2xv0ir2tATiewyR6hLssSIiKrGQlBi";
const ZONE = process.env.ZONE ?? "alchemy.run";
const POSTHOG_PROXY_HOST = `ph.${ZONE}`;

const stage = process.env.STAGE ?? process.env.PULL_REQUEST ?? "dev";

const app = await alchemy("alchemy:website", {
  stateStore: (scope) => new CloudflareStateStore(scope),
  stage,
});

// The v1 docs moved to `v1.alchemy.run`; the apex `alchemy.run` is now
// served by the alchemy-effect (v2) website. This deploy must run before
// the v2 prod deploy — it detaches `alchemy.run` from the router Worker so
// the v2 Worker can claim it.
const domain =
  stage === "prod" ? `v1.${ZONE}` : stage === "dev" ? `dev.${ZONE}` : undefined;

if (stage === "prod") {
  await Zone("alchemy-run", {
    name: "alchemy.run",
  });
}

export const website = await Astro("website", {
  name: "alchemy-website",
  adopt: true,
  version: stage === "prod" ? undefined : stage,
  env: {
    POSTHOG_CLIENT_API_HOST: `https://${POSTHOG_PROXY_HOST}`,
    POSTHOG_PROJECT_ID: POSTHOG_PROJECT_ID,
    ENABLE_POSTHOG: stage === "prod" ? "true" : "false",
  },
  assets: {
    _headers: [
      "/advanced*",
      "/blog*",
      "/concepts*",
      "/guides*",
      "/providers*",
      "/telemetry*",
      "/getting-started*",
      "/what-is-alchemy*",
    ]
      .flatMap((route) => [route, "  Vary: accept"])
      .join("\n"),
  },
});

export const router = await Worker("router", {
  name: "alchemy-website-router",
  adopt: true,
  entrypoint: "src/router.ts",
  version: stage === "prod" ? undefined : stage,
  domains: domain ? [domain] : undefined,
  bindings: {
    WEBSITE: website,
  },
});

const url =
  stage !== "prod" ? website.url : domain ? `https://${domain}` : router.url;

console.log(url);

if (process.env.PULL_REQUEST) {
  await GitHubComment("comment", {
    owner: "alchemy-run",
    repository: "alchemy-async",
    issueNumber: Number(process.env.PULL_REQUEST),
    body: `
## 🚀 Website Preview Deployed

Your website preview is ready!

**Preview URL:** ${url}

This preview was built from commit ${process.env.GITHUB_SHA}

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>`,
  });
}

await app.finalize();
