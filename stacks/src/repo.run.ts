// ensure providers are registered (for deletion purposes)
import "alchemy/aws";
import "alchemy/aws/oidc";
import "alchemy/cloudflare";
import "alchemy/os";

import alchemy from "alchemy";
import { AccountId, Role, SSMParameter } from "alchemy/aws";
import { GitHubOIDCProvider } from "alchemy/aws/oidc";
import { AccountApiToken, R2Bucket } from "alchemy/cloudflare";
import { GitHubSecret, RepositoryEnvironment } from "alchemy/github";
import env, {
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_EMAIL,
  NEON_API_KEY,
  OPENAI_API_KEY,
  STRIPE_API_KEY,
  UPSTASH_API_KEY,
} from "./env.ts";

const app = await alchemy("alchemy:repo", env);

const awsAccountId = await AccountId();

const githubRole = await Role("github-oidc-role", {
  roleName: "alchemy-github-oidc-role",
  assumeRolePolicy: {
    Version: "2012-10-17",
    Statement: [
      {
        Sid: "GitHubOIDC",
        Effect: "Allow",
        Principal: {
          Federated: `arn:aws:iam::${awsAccountId}:oidc-provider/token.actions.githubusercontent.com`,
        },
        Action: "sts:AssumeRoleWithWebIdentity",
        Condition: {
          StringEquals: {
            "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
          },
          StringLike: {
            "token.actions.githubusercontent.com:sub":
              "repo:alchemy-run/alchemy-async:*",
          },
        },
      },
    ],
  },
  // TODO: probably scope this down
  managedPolicyArns: ["arn:aws:iam::aws:policy/AdministratorAccess"],
});

const stateStore = await R2Bucket("state-store", {
  name: "alchemy-state-store",
  adopt: true,
});

const testEnvironment = await RepositoryEnvironment("test environment", {
  owner: "alchemy-run",
  repository: "alchemy-async",
  name: "test",
  reviewers: {
    users: ["alchemy-run"],
  },
});

const accountAccessToken = await AccountApiToken("account-access-token", {
  name: "alchemy-account-access-token",
  policies: [
    {
      effect: "allow",
      permissionGroups: ["Workers R2 Storage Write"],
      resources: {
        "com.cloudflare.api.account": "*",
      },
    },
  ],
});

const secrets = {
  AWS_ROLE_ARN: githubRole.arn,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_KEY,
  CLOUDFLARE_EMAIL,
  STRIPE_API_KEY,
  OPENAI_API_KEY,
  NEON_API_KEY,
  CLOUDFLARE_BUCKET_NAME: stateStore.name,
  R2_ACCESS_KEY_ID: accountAccessToken.accessKeyId,
  R2_SECRET_ACCESS_KEY: accountAccessToken.secretAccessKey,
  SECRET_PASSPHRASE: alchemy.secret(process.env.SECRET_PASSPHRASE!),
  UPSTASH_API_KEY,
  UPSTASH_EMAIL: "sam@alchemy.run",
  SENTRY_AUTH_TOKEN: alchemy.secret.env.SENTRY_AUTH_TOKEN,
  SENTRY_ORG: alchemy.secret.env.SENTRY_ORG,
  VERCEL_ACCESS_TOKEN: alchemy.secret.env.VERCEL_ACCESS_TOKEN,
  ALCHEMY_PASSWORD: alchemy.secret.env.ALCHEMY_PASSWORD,
  NPM_TOKEN: alchemy.secret.env.NPM_TOKEN,
  ALCHEMY_STATE_TOKEN: alchemy.secret.env.ALCHEMY_STATE_TOKEN,
  ANTHROPIC_API_KEY: alchemy.secret.env.ANTHROPIC_API_KEY,
  PLANETSCALE_ORG_ID: alchemy.secret.env.PLANETSCALE_ORG_ID,
  PLANETSCALE_API_TOKEN: alchemy.secret.env.PLANETSCALE_API_TOKEN,
  SENTRY_DSN: alchemy.secret.env.SENTRY_DSN,
};

await Promise.all([
  GitHubOIDCProvider("github-oidc", {
    owner: "alchemy-run",
    repository: "alchemy-async",
    roleArn: githubRole.arn,
  }),
  SSMParameter("github-ci-secrets", {
    name: "/alchemy/github-ci-secrets",
    type: "SecureString",
    value: alchemy.secret(
      JSON.stringify(
        Object.fromEntries(
          Object.entries(secrets).map(([name, value]) => [
            name,
            typeof value === "string" ? value : value.unencrypted,
          ]),
        ),
      ),
    ),
  }),
  ...Object.entries(secrets).flatMap(async ([name, value]) => {
    const props = {
      owner: "alchemy-run",
      repository: "alchemy-async",
      name,
      value: typeof value === "string" ? alchemy.secret(value) : value!,
    };
    return [
      GitHubSecret(`github-secret-${name}`, {
        ...props,
        environment: testEnvironment.name,
      }),
      GitHubSecret(`github-repo-secret-${name}`, props),
    ];
  }),
]);

await app.finalize();
