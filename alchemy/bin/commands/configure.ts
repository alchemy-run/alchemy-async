import {
  confirm,
  group,
  intro,
  isCancel,
  log,
  multiselect,
  outro,
  password,
  select,
  text,
} from "@clack/prompts";
import pc from "picocolors";
import z from "zod";
import { Credentials, Profile, Provider } from "../../src/auth.ts";
import { CloudflareAuth } from "../../src/cloudflare/auth.ts";
import { listCloudflareAccounts } from "../../src/cloudflare/user.ts";
import { authProcedure, CancelSignal } from "../trpc.ts";
import { cloudflareLogin } from "./login.ts";

export const configure = authProcedure
  .meta({
    description: "configure a profile",
  })
  .input(
    z.object({
      profile: z
        .string()
        .optional()
        .meta({ alias: "p" })
        .describe("the profile to configure"),
    }),
  )
  .mutation(async ({ input }) => {
    intro(pc.cyan("🧪 Configure Profile"));
    const name = await promptForProfileName(input);
    const profile = await Profile.get(name);
    if (profile) {
      log.info(`Profile: ${pc.bold(name)}`);
      for (const [provider, providerProfile] of Object.entries(profile)) {
        const description = [
          `- ${pc.bold(provider)}: ${providerProfile.metadata.name} (${pc.dim(providerProfile.metadata.id)})`,
          `  - Method: ${pc.dim(providerProfile.method)}`,
          ...(providerProfile.scopes?.length
            ? [`  - Scopes: ${pc.dim(providerProfile.scopes.join(", "))}`]
            : []),
        ];
        log.info(description.join("\n"));
      }
      if (
        (await confirm({
          message: `Update profile ${pc.bold(name)}?`,
          initialValue: false,
        })) !== true
      ) {
        throw new CancelSignal();
      }
    }
    const method = await select({
      message: `Select a login method for ${pc.bold("Cloudflare")}`,
      options: [
        { label: "OAuth", value: "oauth", hint: "Recommended" },
        { label: "API Token", value: "api-token" },
        { label: "Global API Key", value: "api-key", hint: "Legacy" },
      ],
      initialValue: "oauth" as const,
    });
    if (isCancel(method)) {
      throw new CancelSignal();
    }
    const credentials = await promptForCredentials(method);
    await Credentials.set(
      { profile: name, provider: "cloudflare" },
      credentials,
    );
    const account = await promptForCloudflareAccount(credentials);
    await Provider.set(
      { profile: name, provider: "cloudflare" },
      {
        method,
        metadata: account,
        scopes: "scopes" in credentials ? credentials.scopes : undefined,
      },
    );
    outro(pc.green(`✅ Configured profile ${pc.bold(name)}`));
  });

/**
 * Prompts the user to enter a profile name.
 */
export const promptForProfileName = async (input: { profile?: string }) => {
  input.profile = input.profile?.trim();
  if (input.profile) {
    return input.profile;
  }
  const name = await text({
    message: "Enter profile name",
    defaultValue: "default",
    placeholder: "default",
  });
  if (isCancel(name)) {
    throw new CancelSignal();
  }
  return name.trim() || "default";
};

/**
 * Prompts the user to enter credentials for a given method.
 */
const promptForCredentials = async (
  method: "oauth" | "api-token" | "api-key",
): Promise<Credentials> => {
  switch (method) {
    case "oauth": {
      const customizeScopes = await confirm({
        message: "Customize scopes?",
        initialValue: false,
      });
      let scopes: string[];
      if (customizeScopes) {
        const selection = await multiselect({
          message: "Select scopes",
          options: Object.entries(CloudflareAuth.ALL_SCOPES).map(
            ([scope, hint]) => ({
              label: pc.bold(scope),
              value: scope,
              hint,
            }),
          ),
          initialValues: CloudflareAuth.DEFAULT_SCOPES,
        });
        if (isCancel(selection)) {
          throw new CancelSignal();
        }
        scopes = selection;
      } else {
        scopes = CloudflareAuth.DEFAULT_SCOPES;
      }
      return await cloudflareLogin(scopes);
    }
    case "api-token": {
      const apiToken = await password({
        message: "Enter API token",
      });
      if (isCancel(apiToken)) {
        throw new CancelSignal();
      }
      return {
        type: "api-token",
        apiToken,
      };
    }
    case "api-key": {
      const { apiKey, email } = await group(
        {
          apiKey: () =>
            password({
              message: "Enter API key",
            }),
          email: () =>
            text({
              message: "Enter API email",
            }),
        },
        {
          onCancel: () => {
            throw new CancelSignal();
          },
        },
      );
      return {
        type: "api-key",
        apiKey,
        email,
      };
    }
  }
};

/**
 * Lists Cloudflare accounts and prompts the user to select one.
 */
export const promptForCloudflareAccount = async (credentials: Credentials) => {
  const accounts = await listCloudflareAccounts(credentials);
  const account = await select({
    message: "Select an account",
    options: accounts.map((account) => ({
      label: account.name,
      value: { id: account.id, name: account.name },
      hint: account.id,
    })),
  });
  if (isCancel(account)) {
    throw new CancelSignal();
  }
  return account;
};
